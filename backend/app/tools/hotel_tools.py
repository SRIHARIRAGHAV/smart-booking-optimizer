import json
import os
from typing import List, Optional, Tuple
from app.models.schemas import HotelCandidate

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
HOTELS_FILE = os.path.join(DATA_DIR, "hotels.json")

def _load_hotels_raw() -> List[dict]:
    if not os.path.exists(HOTELS_FILE):
        return []
    with open(HOTELS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def search_hotels(
    city: str,
    nights: int,
    rooms: int,
    max_hotel_budget: Optional[float] = None,
    tier: Optional[str] = None,
    require_city_centre: bool = False,
    include_all_for_ranking: bool = False
) -> Tuple[List[HotelCandidate], List[dict]]:
    """
    Deterministically retrieve hotel candidates matching city, nights, and rooms.
    Returns:
      (accepted_candidates, rejected_candidates_with_reasons)
    """
    raw_hotels = _load_hotels_raw()
    accepted: List[HotelCandidate] = []
    rejected: List[dict] = []

    for raw in raw_hotels:
        hotel_id = raw["hotel_id"]
        # Basic matching on city
        if raw["city"].strip().lower() != city.strip().lower():
            continue

        # Check availability
        if raw.get("availability_status") != "AVAILABLE" or raw.get("available_rooms", 0) < rooms:
            rejected.append({
                "hotel_id": hotel_id,
                "reason": f"Insufficient available rooms ({raw.get('available_rooms', 0)} < {rooms})"
            })
            continue

        # Check pricing corruption
        if raw.get("price_per_night", 0) <= 0:
            rejected.append({
                "hotel_id": hotel_id,
                "reason": "Corrupted or non-positive price per night"
            })
            continue

        # Check city centre if mandatory constraint
        if require_city_centre and not raw.get("is_city_centre", True):
            rejected.append({
                "hotel_id": hotel_id,
                "reason": "Non-city-centre accommodation rejected by city-centre constraint"
            })
            continue

        # Calculate total price with deterministic taxes
        price_per_night = float(raw["price_per_night"])
        base_price = price_per_night * nights * rooms
        tax_rate = float(raw.get("tax_rate", 0.12))
        taxes_and_fees = round(base_price * tax_rate, 2)
        total_price = round(base_price + taxes_and_fees, 2)

        # Check budget filter if requested
        if max_hotel_budget and total_price > max_hotel_budget and not include_all_for_ranking:
            rejected.append({
                "hotel_id": hotel_id,
                "reason": f"Hotel total {total_price} exceeds hotel budget limit {max_hotel_budget}"
            })
            continue

        # Check tier filter if specified
        if tier and raw.get("tier") != tier and not include_all_for_ranking:
            continue

        candidate = HotelCandidate(
            hotel_id=hotel_id,
            name=raw["name"],
            city=raw["city"],
            neighbourhood=raw.get("neighbourhood", "Central"),
            is_city_centre=raw.get("is_city_centre", True),
            price_per_night=price_per_night,
            nights=nights,
            room_count=rooms,
            tax_rate=tax_rate,
            taxes_and_fees=taxes_and_fees,
            total_price=total_price,
            available_rooms=raw.get("available_rooms", 1),
            availability_status=raw.get("availability_status", "AVAILABLE"),
            rating=raw.get("rating", 4.0),
            amenities=raw.get("amenities", []),
            data_source=raw.get("data_source", "MOCK_HOTEL_GDS"),
            last_updated=raw.get("last_updated", "2026-10-29T10:00:00Z"),
            tier=raw.get("tier", "standard"),
            inclusion_reason=f"Matched city {city} with {rooms} rooms for {nights} nights"
        )
        accepted.append(candidate)

    return accepted, rejected

def get_hotel_details(hotel_id: str) -> Optional[dict]:
    raw_hotels = _load_hotels_raw()
    for raw in raw_hotels:
        if raw["hotel_id"] == hotel_id:
            return raw
    return None

def check_hotel_availability(hotel_id: str, rooms: int) -> Tuple[bool, str]:
    hotel = get_hotel_details(hotel_id)
    if not hotel:
        return False, f"Hotel {hotel_id} not found."
    if hotel.get("availability_status") != "AVAILABLE":
        return False, f"Hotel {hotel_id} is {hotel.get('availability_status')}."
    if hotel.get("available_rooms", 0) < rooms:
        return False, f"Hotel {hotel_id} only has {hotel.get('available_rooms')} rooms for {rooms} requested."
    return True, "Hotel available."

