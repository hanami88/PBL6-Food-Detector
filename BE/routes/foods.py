from concurrent.futures import ThreadPoolExecutor
import json
import logging
import os
import random
from math import ceil, radians, sin, cos, asin, sqrt

import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database.database import get_db
from models import Category, Food, Restaurant, Review, SearchHistory, User
from models.admin import AdminRestaurantState
from models.associations import food_restaurants
from schemas.food import (
    FoodRestaurantResult,
    FoodSearchItem,
    FoodSearchResponse,
    OSMPlaceInfo,
    HomeCategory,
    HomepageResponse,
    HomeRestaurant,
    ItineraryAiNotice,
    ItineraryData,
    ItineraryMetric,
    ItineraryMicroTag,
    ItineraryRequest,
    ItineraryTimelineStep,
)
from services.osm_places import (
    OSMPlacesError,
    find_osm_place,
    search_osm_places,
)
from routes.user_dependencies import get_optional_active_user, require_active_user

router = APIRouter(prefix="/api/foods", tags=["Foods"])
logger = logging.getLogger(__name__)
_DANANG_BOUNDS = (15.95, 16.15, 108.12, 108.32)


def _food_items(
    db: Session,
    rows: list[tuple],
    include_osm_places: bool = False,
) -> list[FoodSearchItem]:
    food_ids = [food.id for food, _, _, _ in rows]
    restaurant_rows = []
    if food_ids:
        restaurant_rows = db.execute(
            select(
                food_restaurants.c.food_id,
                Restaurant.id,
                Restaurant.name,
                Restaurant.address,
                Restaurant.image_url,
                food_restaurants.c.price,
            )
            .select_from(food_restaurants)
            .join(Restaurant, Restaurant.id == food_restaurants.c.restaurant_id)
            .outerjoin(
                AdminRestaurantState,
                AdminRestaurantState.restaurant_id == Restaurant.id,
            )
            .where(
                food_restaurants.c.food_id.in_(food_ids),
                func.coalesce(AdminRestaurantState.status, "verified") == "verified",
            )
            .order_by(Restaurant.name)
        ).all()
    restaurants_by_food: dict[int, list[FoodRestaurantResult]] = {
        food_id: [] for food_id in food_ids
    }
    osm_places_by_restaurant: dict[int, OSMPlaceInfo | None] = {}
    if include_osm_places:
        unique_restaurants = {
            restaurant_id: (name, address)
            for _, restaurant_id, name, address, _, _ in restaurant_rows
        }
        with ThreadPoolExecutor(max_workers=8) as executor:
            lookup_results = executor.map(
                lambda restaurant: find_osm_place(*restaurant),
                unique_restaurants.values(),
            )
            osm_places_by_restaurant = {
                restaurant_id: (
                    OSMPlaceInfo(**place_data) if place_data else None
                )
                for restaurant_id, place_data in zip(
                    unique_restaurants,
                    lookup_results,
                )
            }
    for food_id, restaurant_id, name, address, image_url, price in restaurant_rows:
        restaurants_by_food[food_id].append(
            FoodRestaurantResult(
                id=restaurant_id,
                name=name,
                address=address,
                image_url=image_url,
                price=float(price) if price is not None else None,
                osm_place=osm_places_by_restaurant.get(restaurant_id),
            )
        )
    return [
        FoodSearchItem(
            id=food.id,
            name=food.name,
            description=food.short_description or food.description,
            category=category_name,
            image_url=food.main_image_url,
            average_price=float(food.average_price) if food.average_price is not None else None,
            average_rating=round(float(average_rating or 0), 1),
            review_count=int(reviews or 0),
            restaurants=restaurants_by_food[food.id],
        )
        for food, category_name, average_rating, reviews in rows
    ]


def _distance_km(latitude: float, longitude: float, target_lat: float, target_lon: float) -> float:
    lat1, lat2 = radians(latitude), radians(target_lat)
    delta_lat = lat2 - lat1
    delta_lon = radians(target_lon - longitude)
    value = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
    value = min(1.0, max(0.0, value))
    return 6371 * 2 * asin(sqrt(value))


@router.get("/homepage", response_model=HomepageResponse)
def get_homepage(
    district: str | None = Query(default=None, max_length=100),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
):
    if (latitude is None) != (longitude is None):
        raise HTTPException(
            status_code=422,
            detail="Cần cung cấp đồng thời latitude và longitude.",
        )
    use_location = (
        latitude is not None
        and longitude is not None
        and _DANANG_BOUNDS[0] <= latitude <= _DANANG_BOUNDS[1]
        and _DANANG_BOUNDS[2] <= longitude <= _DANANG_BOUNDS[3]
    )
    if not use_location:
        latitude = longitude = None

    food_searches = [
        ("Mì Quảng", "Đặc sản"),
        ("Bún chả cá", "Món nước"),
        ("Bánh tráng cuốn thịt heo", "Đặc sản"),
        ("Bánh xèo", "Ăn vặt"),
        ("Hải sản", "Hải sản"),
        ("Ốc hút", "Ăn vặt"),
    ]
    area = f" {district.strip()}" if district and district.strip() else ""
    search_queries = [
        f"{name}{area}, Đà Nẵng, Việt Nam"
        for name, _ in food_searches
    ]
    restaurant_query = f"restaurant{area}, Đà Nẵng, Việt Nam"

    def search_places(query: str) -> list[dict]:
        try:
            places = search_osm_places(
                query,
                max_results=6 if use_location else 30,
                latitude=latitude,
                longitude=longitude,
                restaurant_only=True,
            )
            if not use_location:
                return random.sample(places, min(len(places), 6))
            return places
        except OSMPlacesError as error:
            logger.warning(
                "Skipping OpenStreetMap results for %r after upstream failure: %s",
                query,
                error,
            )
            return []

    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(search_places, [restaurant_query, *search_queries]))

    restaurant_places, *food_places = results

    def place_data(place: dict, index: int) -> dict:
        return {
            "id": index + 1,
            "name": place.get("name") or "Quán ăn",
            "address": place.get("address") or "Đà Nẵng",
            "place_id": place.get("place_id") or f"osm-place-{index + 1}",
            "maps_url": place.get("maps_url"),
            "latitude": place.get("latitude"),
            "longitude": place.get("longitude"),
            "rating": place.get("rating"),
            "review_count": int(place.get("user_rating_count") or 0),
        }

    nearby_places = [place_data(place, index) for index, place in enumerate(restaurant_places)]
    if latitude is not None and longitude is not None:
        nearby_places.sort(
            key=lambda place: (
                _distance_km(
                    latitude,
                    longitude,
                    float(place["latitude"]),
                    float(place["longitude"]),
                )
                if place["latitude"] is not None and place["longitude"] is not None
                else float("inf")
            )
        )

    nearby_restaurants = [
        HomeRestaurant(
            id=index,
            slug=place["place_id"],
            name=place["name"],
            address=place["address"],
            district=None,
            image_url=None,
            latitude=place["latitude"],
            longitude=place["longitude"],
            average_rating=(
                round(place["rating"], 1) if place["rating"] is not None else None
            ),
            review_count=place["review_count"],
            min_price=None,
            distance_km=(
                round(
                    _distance_km(
                        latitude,
                        longitude,
                        float(place["latitude"]),
                        float(place["longitude"]),
                    ),
                    1,
                )
                if latitude is not None
                and longitude is not None
                and place["latitude"] is not None
                and place["longitude"] is not None
                else None
            ),
            maps_url=place["maps_url"],
        )
        for index, place in enumerate(nearby_places)
    ]

    featured_foods = []
    foods_by_category: dict[str, int] = {}
    for index, ((name, category), places) in enumerate(zip(food_searches, food_places)):
        matched_places = [place_data(place, place_index) for place_index, place in enumerate(places)]
        ratings = [place["rating"] for place in matched_places if place["rating"]]
        foods_by_category[category] = foods_by_category.get(category, 0) + 1
        featured_foods.append(
            FoodSearchItem(
                id=index + 1,
                name=name,
                description=f"Các địa điểm OpenStreetMap phù hợp với từ khóa {name} tại Đà Nẵng.",
                category=category,
                image_url=None,
                average_price=None,
                average_rating=round(sum(ratings) / len(ratings), 1) if ratings else None,
                review_count=sum(place["review_count"] for place in matched_places),
                restaurants=[
                    FoodRestaurantResult(
                        id=place["id"],
                        name=place["name"],
                        address=place["address"],
                        image_url=None,
                        price=None,
                    )
                    for place in matched_places
                ],
            )
        )
    categories = [
        HomeCategory(
            name=category,
            slug=f"osm-category-{index + 1}",
            image_url=None,
            food_count=food_count,
        )
        for index, (category, food_count) in enumerate(foods_by_category.items())
    ]

    return HomepageResponse(
        categories=categories,
        featured_foods=featured_foods,
        popular_foods=featured_foods,
        nearby_restaurants=nearby_restaurants,
        recent_reviews=[],
        restaurant_count=len(nearby_restaurants),
        district=district,
    )


def _normalize_history_terms(search_history: list[str] | None) -> list[str]:
    if not search_history:
        return ["Mì Quảng", "Bún chả cá", "Bánh tráng cuốn thịt heo", "Hải sản"]

    terms: list[str] = []
    for item in search_history:
        text = str(item).strip()
        if not text:
            continue
        parts = [part.strip() for part in text.replace("/", ",").split(",")]
        for part in parts:
            if part and part not in terms:
                terms.append(part)
    return terms[:6] if terms else ["Mì Quảng", "Bún chả cá", "Bánh tráng cuốn thịt heo"]


def _build_itinerary_payload(search_terms: list[str], city: str, current_location: dict | None) -> ItineraryData:
    terms = search_terms[:4]
    seeded_stops = [
        {
            "title": "Mì Quảng Bà Mụa",
            "tag": "BỮA SÁNG ĐẶC SẢN",
            "time": "07:30 – 08:30",
            "address": "42 Trưng Nữ Vương, Hải Châu, Đà Nẵng",
            "priceRange": "35.000đ – 45.000đ",
            "description": "Mì Quảng với nước lèo đậm đà, bánh tráng giòn và rau sống tươi, phù hợp cho điểm khởi hành sớm.",
            "image": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
            "smartPillText": "Giờ vàng: 07:30",
            "smartPillSub": "Tránh đông sau 08:15",
        },
        {
            "title": "Bánh Tráng Cuốn Thịt Heo Bà Mụa",
            "tag": "BỮA TRƯA ĐẬM ĐÀ",
            "time": "11:45 – 12:45",
            "address": "93 Nguyễn Chí Thanh, Hải Châu, Đà Nẵng",
            "priceRange": "65.000đ – 85.000đ",
            "description": "Thịt heo chín vừa, bánh tráng dẻo, mắm nêm cay thơm rất hợp với gu người Đà Nẵng.",
            "image": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
            "smartPillText": "Phòng lạnh 24°C",
            "smartPillSub": "Tránh nóng giữa trưa",
        },
        {
            "title": "Chè Sầu Liên & Bánh Ép Nóng",
            "tag": "ĂN VẶT & GIẢI NHIỆT",
            "time": "15:30 – 16:30",
            "address": "189 Hoàng Diệu, Sơn Trà, Đà Nẵng",
            "priceRange": "25.000đ – 35.000đ",
            "description": "Món ngọt giải nhiệt, phù hợp sau khi di chuyển hoặc ngắm cảnh tại Sơn Trà.",
            "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
            "smartPillText": "Chuẩn nhịp bản địa",
            "smartPillSub": "Khung giờ ăn xế vàng",
        },
        {
            "title": "Gió Biển Quán - Hải Sản",
            "tag": "ĐẠI TIỆC HẢI SẢN TỐI",
            "time": "18:30 – 20:30",
            "address": "Lô 14 Hoàng Sa, Sơn Trà, Đà Nẵng",
            "priceRange": "90.000đ – 130.000đ",
            "description": "Gợi ý ăn tối ven biển, tối ưu cảm giác mát nhạt và hải sản tươi theo nhịp chiều tối.",
            "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80",
            "smartPillText": "Kịp xem hoàng hôn",
            "smartPillSub": "Lúc 18:30 – 20:30",
        },
    ]

    selected = []
    for index, term in enumerate(terms):
        if index >= len(seeded_stops):
            break
        stop = seeded_stops[index].copy()
        if term.lower() not in stop["title"].lower():
            stop["title"] = f"{term} • {stop['title']}"
        selected.append(stop)
    if not selected:
        selected = seeded_stops[:4]

    current_label = "Khởi hành từ trung tâm Đà Nẵng"
    if current_location and current_location.get("latitude") is not None and current_location.get("longitude") is not None:
        current_label = current_location.get("label") or "Vị trí hiện tại"

    metrics = [
        ItineraryMetric(
            title="Tổng cự ly",
            icon="fa-route",
            iconClass="text-primary",
            value=f"{(len(selected) * 1.7):.1f}",
            unit="km",
            subText=f"Tối ưu theo {', '.join(terms[:2]) or 'món ăn yêu thích'}",
            subIcon="fa-bolt",
            bgClass="bg-surface-container",
            headerClass="text-on-surface-variant",
        ),
        ItineraryMetric(
            title="Dự trù chi phí",
            icon="fa-money-bill-wave",
            iconClass="text-tertiary",
            value=f"{(len(selected) * 55 + 55):.0f}k - {(len(selected) * 75 + 80):.0f}k",
            unit="/ người",
            subText="Bao gồm đồ uống, phụ kiện và VAT",
            bgClass="bg-surface-container",
            headerClass="text-on-surface-variant",
        ),
        ItineraryMetric(
            title="Nhịp trải nghiệm",
            icon="fa-utensils",
            iconClass="text-primary-container",
            value=f"{len(selected)} Điểm dừng",
            unit="",
            subText="Sáng • Trưa • Xế chiều • Tối",
            bgClass="bg-surface-container",
            headerClass="text-on-surface-variant",
        ),
        ItineraryMetric(
            title="Điểm Gu Khẩu Vị",
            icon="fa-circle-check",
            iconClass="text-secondary",
            value="96%",
            unit="phù hợp",
            subText=f"Ưu tiên {terms[0] if terms else 'món đặc trưng'}",
            bgClass="bg-secondary-container/40",
            headerClass="text-on-secondary-container font-bold",
        ),
    ]

    timeline: list[ItineraryTimelineStep] = []
    for index, stop in enumerate(selected, start=1):
        timeline.append(
            ItineraryTimelineStep(
                type="stage",
                stepNum=f"{index:02d}",
                tag=stop["tag"],
                tagClass="bg-primary-fixed text-on-primary-fixed",
                time=stop["time"],
                title=stop["title"],
                address=stop["address"],
                smartPillIcon="fa-clock",
                smartPillText=stop["smartPillText"],
                smartPillSub=stop["smartPillSub"],
                smartPillClass="text-secondary",
                image=stop["image"],
                imageBadgeText="Khớp gu AI",
                imageBadgeClass="text-primary",
                priceRange=stop["priceRange"],
                description=stop["description"],
                microTags=[
                    ItineraryMicroTag(text=f"Mở cửa: {stop['time']}", cssClass="bg-surface-container text-on-surface-variant"),
                    ItineraryMicroTag(text=f"Đúng tiêu chí: {terms[index - 1] if index - 1 < len(terms) else 'đặc sản Đà Nẵng'}", cssClass="bg-secondary-container/60 text-on-secondary-container font-semibold"),
                    ItineraryMicroTag(text=f"Khởi hành từ {current_label}", cssClass="bg-surface-container text-on-surface-variant"),
                ],
                primaryAction="Xem thực đơn chi tiết",
            )
        )
        if index < len(selected):
            timeline.append(
                ItineraryTimelineStep(
                    type="transition",
                    transitIcon="fa-motorcycle" if index % 2 else "fa-car",
                    distanceText=f"Di chuyển {(index * 1.4):.1f} km (~{(index * 3) + 4} phút)",
                    routeDesc=f"{city} • {current_label}",
                    suggestIcon="fa-mug-hot",
                    suggestText="Gợi ý: giữ nhịp đi lại ngắn để ăn kịp giờ vàng",
                    suggestClass="text-secondary",
                )
            )

    ai_notices = [
        ItineraryAiNotice(
            icon="fa-sun",
            iconClass="text-tertiary",
            title=f"Thời tiết lý tưởng ({'29°C' if city == 'Đà Nẵng' else 'mát mẻ'})",
            titleClass="text-on-surface",
            desc=f"{city} có điều kiện thuận lợi để đi bộ và di chuyển ngắn giữa các điểm dừng, ưu tiên đặt chỗ sớm nếu bạn đi cuối tuần.",
            bgClass="bg-surface-container",
        ),
        ItineraryAiNotice(
            icon="fa-code-branch",
            iconClass="text-secondary",
            title="Tối ưu lưu lượng di chuyển",
            titleClass="text-on-secondary-container",
            desc="Các chặng được xếp theo hướng ngắn, giảm quay đầu và giữ nhịp ăn uống theo khung giờ tốt nhất.",
            bgClass="bg-secondary-container/30",
        ),
        ItineraryAiNotice(
            icon="fa-arrows-rotate",
            iconClass="text-primary",
            title="Đổi quán thông minh (dự phòng)",
            titleClass="text-on-primary-fixed",
            badgeText="+0m cự ly",
            actionText="Áp dụng quán dự phòng này ngay →",
            desc="Nếu điểm dừng đầu tiên hết chỗ, hệ thống có thể thay bằng quán lân cận cùng nhóm món để không làm lệch lịch trình.",
            bgClass="bg-primary-fixed/40",
        ),
    ]
    return ItineraryData(metrics=metrics, timeline=timeline, aiNotices=ai_notices)


def _parse_ai_itinerary_response(response_text: str) -> ItineraryData | None:
    try:
        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`\n ")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return ItineraryData.model_validate(data)
    except (TypeError, ValueError, json.JSONDecodeError):
        logger.warning("AI itinerary response is not valid JSON: %s", response_text[:500])
    return None


def _call_ai_itinerary(search_terms: list[str], city: str, current_location: dict | None) -> ItineraryData | None:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    prompt = (
        "Bạn là AI chuyên gia gợi ý lộ trình ẩm thực. "
        "Hãy trả về JSON thuần, bắt buộc có 3 keys: metrics, timeline, aiNotices. "
        "Dữ liệu phải phù hợp với frontend Angular đang render, dùng các field: "
        "metrics: [{title, icon, iconClass, value, unit, subText, subIcon, bgClass, headerClass}], "
        "timeline: [{type, stepNum, tag, tagClass, time, title, address, smartPillIcon, smartPillText, smartPillSub, smartPillClass, image, imageBadgeIcon, imageBadgeText, imageBadgeClass, priceRange, description, microTags:[{text, cssClass}], primaryAction}] hoặc transition với [transitIcon, distanceText, routeDesc, suggestIcon, suggestText, suggestClass], "
        "aiNotices: [{icon, iconClass, title, titleClass, desc, bgClass, badgeText, actionText}]. "
        f"City={city}. Search terms={search_terms}. Current location={current_location}. "
        "Chỉ trả JSON, không giải thích thêm."
    )

    headers = {"Content-Type": "application/json"}

    if os.getenv("OPENAI_API_KEY"):
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={**headers, "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                },
                timeout=30,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return _parse_ai_itinerary_response(content)
        except Exception as exc:
            logger.warning("OpenAI itinerary call failed: %s", exc)

    google_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if google_api_key:
        try:
            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={google_api_key}",
                headers=headers,
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.7},
                },
                timeout=30,
            )
            response.raise_for_status()
            content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            return _parse_ai_itinerary_response(content)
        except Exception as exc:
            logger.warning("Google Gemini itinerary call failed: %s", exc)

    return None


@router.post("/itinerary/recommend", response_model=ItineraryData)
def recommend_itinerary(
    payload: ItineraryRequest,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_active_user),
):
    search_terms = _normalize_history_terms(payload.search_history)
    if payload.search_history and user is not None:
        for keyword in payload.search_history[:5]:
            cleaned = str(keyword).strip()
            if cleaned:
                db.add(
                    SearchHistory(
                        user_id=user.id,
                        keyword=cleaned[:255],
                        search_type="ALL",
                        result_count=len(payload.search_history),
                    )
                )
        try:
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            logger.exception("Failed to save itinerary search history.")

    itinerary = _call_ai_itinerary(
        search_terms,
        payload.city,
        payload.current_location.model_dump() if payload.current_location else None,
    )
    if itinerary is None:
        itinerary = _build_itinerary_payload(search_terms, payload.city, payload.current_location.model_dump() if payload.current_location else None)

    if payload.current_location and payload.current_location.latitude is not None and payload.current_location.longitude is not None:
        try:
            nearby_places = search_osm_places(
                "quán ăn Đà Nẵng",
                max_results=6,
                latitude=payload.current_location.latitude,
                longitude=payload.current_location.longitude,
                restaurant_only=True,
            )
            if nearby_places and itinerary.timeline:
                first_place = nearby_places[0]
                itinerary.timeline[0].address = first_place.get("address") or itinerary.timeline[0].address
                if itinerary.timeline[0].title:
                    itinerary.timeline[0].title = f"{itinerary.timeline[0].title.split('•')[0].strip()} • {first_place.get('name') or 'Quán lân cận'}"
        except OSMPlacesError as error:
            logger.warning("Failed to fetch nearby places for itinerary recommendation: %s", error)

    return itinerary


@router.get("/categories", response_model=list[str])
def list_food_categories(db: Session = Depends(get_db)):
    statement = (
        select(Category.name)
        .join(Food, Food.category_id == Category.id)
        .where(Food.status == "PUBLISHED")
        .distinct()
        .order_by(Category.name)
    )
    return db.scalars(statement).all()


@router.get("/search", response_model=FoodSearchResponse)
def search_foods(
    q: str = Query(default="", max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_active_user),
):
    terms = [term.strip() for term in q.split(",") if term.strip()]
    if not terms:
        terms = ["quán ăn Đà Nẵng"]

    def search_term(term: str) -> tuple[str, list[dict]]:
        try:
            places = search_osm_places(
                f"{term}, Đà Nẵng, Việt Nam",
                max_results=6,
                restaurant_only=True,
            )
        except OSMPlacesError as error:
            raise HTTPException(status_code=502, detail=str(error)) from error
        return term, places

    with ThreadPoolExecutor(max_workers=min(6, len(terms))) as executor:
        search_results = list(executor.map(search_term, terms))

    items = []
    for term, places in search_results:
        restaurants = [
            FoodRestaurantResult(
                id=index,
                name=place.get("name") or "Quán ăn",
                address=place.get("address") or "Đà Nẵng",
                image_url=None,
                price=None,
                osm_place=OSMPlaceInfo(**place),
            )
            for index, place in enumerate(places, start=1)
        ]
        if not restaurants:
            continue
        items.append(
            FoodSearchItem(
                id=len(items) + 1,
                name=term,
                description="Địa điểm khớp từ khóa trên OpenStreetMap; vui lòng xác nhận quán có phục vụ món này.",
                category="OpenStreetMap",
                image_url=None,
                average_price=None,
                average_rating=None,
                review_count=0,
                restaurants=restaurants,
            )
        )

    result_count = sum(len(item.restaurants) for item in items)
    total = len(items)
    items = items[(page - 1) * page_size : page * page_size]

    if q.strip() and page == 1:
        db.add(
            SearchHistory(
                user_id=user.id if user else None,
                keyword=q.strip()[:255],
                search_type="ALL",
                result_count=result_count,
            )
        )
        try:
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            logger.exception("Failed to save food search history.")
            raise HTTPException(
                status_code=500,
                detail="Không thể lưu lịch sử tìm kiếm.",
            ) from None

    response = FoodSearchResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size),
    )
    logger.info("External food search response:\n%s", response.model_dump_json(indent=2))
    return response


@router.get("/search-history")
def get_user_search_history(
    limit: int = Query(default=10, ge=1, le=20),
    db: Session = Depends(get_db),
    user: User = Depends(require_active_user),
):
    rows = (
        db.execute(
            select(SearchHistory.keyword, SearchHistory.searched_at)
            .where(SearchHistory.user_id == user.id)
            .order_by(SearchHistory.searched_at.desc(), SearchHistory.id.desc())
            .limit(limit)
        )
        .all()
    )

    history = []
    seen = set()
    for keyword, _ in rows:
        key = str(keyword).strip()
        if not key or key.lower() in seen:
            continue
        seen.add(key.lower())
        history.append(key)

    return {
        "items": history,
        "total": len(history),
    }


@router.get("/search-history/for-itinerary")
def get_itinerary_history(
    limit: int = Query(default=6, ge=1, le=20),
    db: Session = Depends(get_db),
    user: User = Depends(require_active_user),
):
    rows = (
        db.execute(
            select(SearchHistory.keyword)
            .where(SearchHistory.user_id == user.id)
            .order_by(SearchHistory.searched_at.desc(), SearchHistory.id.desc())
            .limit(limit)
        )
        .all()
    )

    history = []
    seen = set()
    for (keyword,) in rows:
        key = str(keyword).strip()
        if not key or key.lower() in seen:
            continue
        seen.add(key.lower())
        history.append(key)

    return {"search_history": history or ["Mì Quảng", "Bún chả cá", "Hải sản"]}
