from concurrent.futures import ThreadPoolExecutor
import logging
from math import ceil, radians, sin, cos, asin, sqrt
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from database.database import get_db
from models import Category, Food, Restaurant, Review, User
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
)
from services.osm_places import (
    OSMPlacesError,
    find_osm_place,
    search_osm_places,
)

router = APIRouter(prefix="/api/foods", tags=["Foods"])
logger = logging.getLogger(__name__)


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
            return search_osm_places(
                query,
                latitude=latitude,
                longitude=longitude,
                restaurant_only=True,
            )
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
    category: str | None = Query(default=None, max_length=100),
    sort: Literal["recommended", "rating", "price_asc", "price_desc"] = "recommended",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    rating = (
        select(func.coalesce(func.avg(Review.rating), 0))
        .where(Review.food_id == Food.id)
        .correlate(Food)
        .scalar_subquery()
    )
    review_count = (
        select(func.count(Review.id))
        .where(Review.food_id == Food.id)
        .correlate(Food)
        .scalar_subquery()
    )

    statement = (
        select(Food, Category.name, rating, review_count)
        .outerjoin(Category, Category.id == Food.category_id)
        .where(Food.status == "PUBLISHED")
    )

    terms = [term.strip() for term in q.split(",") if term.strip()]
    if terms:
        statement = statement.where(
            or_(
                *[
                    or_(
                        Food.name.ilike(f"%{term}%"),
                        Food.short_description.ilike(f"%{term}%"),
                        Food.description.ilike(f"%{term}%"),
                        Food.origin.ilike(f"%{term}%"),
                        Category.name.ilike(f"%{term}%"),
                        Food.restaurants.any(Restaurant.name.ilike(f"%{term}%")),
                    )
                    for term in terms
                ]
            )
        )

    if category:
        statement = statement.where(Category.name == category)

    count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
    total = db.scalar(count_statement) or 0

    if sort == "rating":
        statement = statement.order_by(rating.desc(), review_count.desc())
    elif sort == "price_asc":
        statement = statement.order_by(
            Food.average_price.is_(None).asc(),
            Food.average_price.asc(),
        )
    elif sort == "price_desc":
        statement = statement.order_by(
            Food.average_price.is_(None).asc(),
            Food.average_price.desc(),
        )
    else:
        statement = statement.order_by(Food.is_featured.desc(), rating.desc())

    rows = db.execute(
        statement.offset((page - 1) * page_size).limit(page_size)
    ).all()
    items = _food_items(db, rows, include_osm_places=True)

    return FoodSearchResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size),
    )
