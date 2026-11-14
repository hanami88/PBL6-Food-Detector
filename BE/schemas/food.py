from datetime import datetime

from pydantic import BaseModel, Field


class OSMPlaceInfo(BaseModel):
    place_id: str | None
    name: str | None
    address: str | None
    phone: str | None
    website_url: str | None
    maps_url: str | None
    latitude: float | None
    longitude: float | None
    rating: float | None
    user_rating_count: int | None
    opening_hours: str | None


class FoodRestaurantResult(BaseModel):
    id: int
    name: str
    address: str
    image_url: str | None
    price: float | None
    osm_place: OSMPlaceInfo | None = None


class FoodSearchItem(BaseModel):
    id: int
    name: str
    description: str | None
    category: str | None
    image_url: str | None
    average_price: float | None
    average_rating: float | None
    review_count: int
    restaurants: list[FoodRestaurantResult]


class FoodSearchResponse(BaseModel):
    items: list[FoodSearchItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class HomeCategory(BaseModel):
    name: str
    slug: str
    image_url: str | None
    food_count: int


class HomeRestaurant(BaseModel):
    id: int
    slug: str
    name: str
    address: str
    district: str | None
    image_url: str | None
    latitude: float | None
    longitude: float | None
    average_rating: float | None
    review_count: int
    min_price: float | None
    distance_km: float | None
    maps_url: str | None = None


class HomeReview(BaseModel):
    id: int
    author: str
    food_name: str
    rating: int
    comment: str
    created_at: datetime | None


class HomepageResponse(BaseModel):
    categories: list[HomeCategory]
    featured_foods: list[FoodSearchItem]
    popular_foods: list[FoodSearchItem]
    nearby_restaurants: list[HomeRestaurant]
    recent_reviews: list[HomeReview]
    restaurant_count: int
    district: str | None


class RestaurantMenuItem(BaseModel):
    food_id: int
    name: str
    description: str | None
    image_url: str | None
    price: float | None
    category: str | None


class RestaurantReviewItem(BaseModel):
    id: int
    author: str
    rating: int
    comment: str
    food_name: str
    created_at: datetime | None


class RestaurantReviewPage(BaseModel):
    items: list[RestaurantReviewItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class RestaurantDetailResponse(BaseModel):
    id: int
    name: str
    slug: str
    address: str
    district: str | None
    phone: str | None
    opening_hours: str | None
    description: str | None
    image_url: str | None
    latitude: float | None
    longitude: float | None
    verified: bool
    verified_at: datetime | None
    price_min: float | None
    price_max: float | None
    average_rating: float
    review_count: int
    gallery: list[str]
    menu: list[RestaurantMenuItem]
    reviews: RestaurantReviewPage
    similar_restaurants: list[HomeRestaurant]


class SavedRestaurantItem(BaseModel):
    id: int
    name: str
    slug: str
    address: str
    district: str | None
    phone: str | None
    opening_hours: str | None
    image_url: str | None
    average_rating: float
    review_count: int
    min_price: float | None
    max_price: float | None


class ItineraryLocation(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    label: str | None = None


class ItineraryRequest(BaseModel):
    search_history: list[str] | None = None
    current_location: ItineraryLocation | None = None
    city: str = "Đà Nẵng"
    max_stops: int = Field(default=4, ge=1, le=6)


class ItineraryMetric(BaseModel):
    title: str
    icon: str
    iconClass: str
    value: str
    unit: str = ""
    subText: str = ""
    subIcon: str | None = None
    bgClass: str = "bg-surface-container"
    headerClass: str = "text-on-surface-variant"


class ItineraryMicroTag(BaseModel):
    text: str
    cssClass: str


class ItineraryTimelineStep(BaseModel):
    type: str
    stepNum: str | None = None
    tag: str | None = None
    tagClass: str | None = None
    time: str | None = None
    title: str | None = None
    address: str | None = None
    smartPillIcon: str | None = None
    smartPillText: str | None = None
    smartPillSub: str | None = None
    smartPillClass: str | None = None
    image: str | None = None
    imageBadgeIcon: str | None = None
    imageBadgeText: str | None = None
    imageBadgeClass: str | None = None
    priceRange: str | None = None
    description: str | None = None
    microTags: list[ItineraryMicroTag] | None = None
    primaryAction: str | None = None
    transitIcon: str | None = None
    distanceText: str | None = None
    routeDesc: str | None = None
    suggestIcon: str | None = None
    suggestText: str | None = None
    suggestClass: str | None = None


class ItineraryAiNotice(BaseModel):
    icon: str
    iconClass: str
    title: str
    titleClass: str
    desc: str
    bgClass: str = "bg-surface-container"
    badgeText: str | None = None
    actionText: str | None = None


class ItineraryData(BaseModel):
    metrics: list[ItineraryMetric]
    timeline: list[ItineraryTimelineStep]
    aiNotices: list[ItineraryAiNotice]


class RestaurantReviewCreate(BaseModel):
    food_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=3000)