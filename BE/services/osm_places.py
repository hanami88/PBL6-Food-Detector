import logging
import time
from threading import Lock
from typing import Any
from urllib.parse import quote

import requests

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 900
_CACHE_MAX_ITEMS = 256
_PLACE_CACHE: dict[str, tuple[float, dict[str, Any] | None]] = {}
_SEARCH_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_CACHE_LOCK = Lock()


class OSMPlacesError(Exception):
    pass


def _format_address(properties: dict[str, Any]) -> str:
    street = " ".join(
        part
        for part in (properties.get("housenumber"), properties.get("street"))
        if part
    )
    parts = [
        street,
        properties.get("locality"),
        properties.get("district"),
        properties.get("city"),
        properties.get("state"),
        properties.get("country"),
    ]
    return ", ".join(dict.fromkeys(part for part in parts if part))


def _normalize_feature(feature: dict[str, Any]) -> dict[str, Any]:
    properties = feature.get("properties") or {}
    geometry = feature.get("geometry") or {}
    coordinates = geometry.get("coordinates") or []
    osm_type = {
        "N": "node",
        "W": "way",
        "R": "relation",
    }.get(properties.get("osm_type"))
    osm_id = properties.get("osm_id")
    place_id = f"{osm_type}/{osm_id}" if osm_type and osm_id else None
    name = properties.get("name")
    address = _format_address(properties)
    extra = properties.get("extra") or {}

    return {
        "place_id": place_id,
        "name": name,
        "address": address,
        "phone": extra.get("phone") or extra.get("contact:phone"),
        "website_url": extra.get("website") or extra.get("contact:website"),
        "maps_url": (
            f"https://www.openstreetmap.org/{place_id}"
            if place_id
            else f"https://www.openstreetmap.org/search?query={quote(name or address or 'Đà Nẵng')}"
        ),
        "latitude": coordinates[1] if len(coordinates) >= 2 else None,
        "longitude": coordinates[0] if len(coordinates) >= 2 else None,
        "rating": None,
        "user_rating_count": 0,
        "opening_hours": extra.get("opening_hours"),
    }


def _cached(
    cache: dict[str, tuple[float, Any]],
    key: str,
) -> tuple[bool, Any]:
    with _CACHE_LOCK:
        cached = cache.get(key)
        if cached and cached[0] > time.monotonic():
            return True, cached[1]
    return False, None


def _store_cache(
    cache: dict[str, tuple[float, Any]],
    key: str,
    value: Any,
) -> None:
    with _CACHE_LOCK:
        if len(cache) >= _CACHE_MAX_ITEMS:
            cache.pop(next(iter(cache)))
        cache[key] = (time.monotonic() + _CACHE_TTL_SECONDS, value)


def search_osm_places(
    query: str,
    max_results: int = 6,
    latitude: float | None = None,
    longitude: float | None = None,
    restaurant_only: bool = False,
) -> list[dict[str, Any]]:
    cache_key = (
        f"{query.casefold()}|{max_results}|{latitude}|{longitude}|{restaurant_only}"
    )
    cached, places = _cached(_SEARCH_CACHE, cache_key)
    if cached:
        return places

    params: dict[str, Any] = {
        "q": query,
        "limit": max_results,
        "countrycode": "VN",
    }
    if latitude is not None and longitude is not None:
        params.update(lat=latitude, lon=longitude, location_bias_scale=0.1)
    if restaurant_only:
        params["osm_tag"] = [
            "amenity:restaurant",
            "amenity:cafe",
            "amenity:fast_food",
        ]

    try:
        response = requests.get(
            "https://photon.komoot.io/api/",
            params=params,
            headers={
                "Accept-Language": "vi",
                "User-Agent": "PBL6-Food-Detector/1.0 (OpenStreetMap place search)",
            },
            timeout=8,
        )
        response.raise_for_status()
        features = response.json().get("features", [])
        if not isinstance(features, list):
            raise ValueError("Photon returned an invalid feature list.")
        places = [
            _normalize_feature(feature)
            for feature in features
            if isinstance(feature, dict)
        ]
    except (requests.RequestException, ValueError, AttributeError) as error:
        logger.warning("OpenStreetMap place search failed for %r: %s", query, error)
        raise OSMPlacesError(
            "Không thể tải dữ liệu địa điểm từ OpenStreetMap."
        ) from error

    _store_cache(_SEARCH_CACHE, cache_key, places)
    return places


def find_osm_place(name: str, address: str) -> dict[str, Any] | None:
    query = f"{name}, {address}, Đà Nẵng, Việt Nam"
    cache_key = query.casefold()
    cached, place = _cached(_PLACE_CACHE, cache_key)
    if cached:
        return place

    try:
        response = requests.get(
            "https://photon.komoot.io/api/",
            params={
                "q": query,
                "limit": 1,
                "countrycode": "VN",
            },
            headers={
                "Accept-Language": "vi",
                "User-Agent": "PBL6-Food-Detector/1.0 (OpenStreetMap place search)",
            },
            timeout=4,
        )
        response.raise_for_status()
        features = response.json().get("features", [])
        if not isinstance(features, list):
            raise ValueError("Photon returned an invalid feature list.")
        place = (
            _normalize_feature(features[0])
            if features and isinstance(features[0], dict)
            else None
        )
    except (requests.RequestException, ValueError, AttributeError, IndexError) as error:
        logger.warning("OpenStreetMap place lookup failed for %r: %s", query, error)
        place = None

    _store_cache(_PLACE_CACHE, cache_key, place)
    return place
