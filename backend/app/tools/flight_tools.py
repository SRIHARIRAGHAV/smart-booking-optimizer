import json
import os
from typing import List, Optional, Tuple
from app.models.schemas import FlightCandidate

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
FLIGHTS_FILE = os.path.join(DATA_DIR, "flights.json")

def _load_flights_raw() -> List[dict]:
    if not os.path.exists(FLIGHTS_FILE):
        return []
    with open(FLIGHTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str,
    passengers: int,
    max_flight_budget: Optional[float] = None,
    tier: Optional[str] = None,
    require_direct: bool = False,
    include_all_for_ranking: bool = False
) -> Tuple[List[FlightCandidate], List[dict]]:
    """
    Deterministically retrieve flight candidates matching origin and destination.
    Returns:
      (accepted_candidates, rejected_candidates_with_reasons)
    """
    raw_flights = _load_flights_raw()
    accepted: List[FlightCandidate] = []
    rejected: List[dict] = []

    for raw in raw_flights:
        flight_id = raw["flight_id"]
        # Basic matching on origin & destination
        if raw["origin"].strip().lower() != origin.strip().lower() or \
           raw["destination"].strip().lower() != destination.strip().lower():
            continue

        # Check availability
        if raw.get("availability_status") != "AVAILABLE" or raw.get("available_seats", 0) < passengers:
            rejected.append({
                "flight_id": flight_id,
                "reason": f"Insufficient available seats ({raw.get('available_seats', 0)} < {passengers})"
            })
            continue

        # Check negative/corrupt price
        if raw.get("price_per_passenger", 0) <= 0:
            rejected.append({
                "flight_id": flight_id,
                "reason": "Corrupted or non-positive price record"
            })
            continue

        # Check direct requirement if hard constraint
        if require_direct and not raw.get("is_direct", True):
            rejected.append({
                "flight_id": flight_id,
                "reason": "Non-direct flight rejected by direct-flight constraint"
            })
            continue

        # Calculate total price for passengers
        price_per_pax = float(raw["price_per_passenger"])
        total_price = round(price_per_pax * passengers, 2)

        # Check budget filter if requested
        if max_flight_budget and total_price > max_flight_budget and not include_all_for_ranking:
            rejected.append({
                "flight_id": flight_id,
                "reason": f"Flight total {total_price} exceeds flight budget limit {max_flight_budget}"
            })
            continue

        # Check tier filter if specified
        if tier and raw.get("tier") != tier and not include_all_for_ranking:
            # We skip if explicitly asking for tier
            continue

        candidate = FlightCandidate(
            flight_id=flight_id,
            airline=raw["airline"],
            origin=raw["origin"],
            destination=raw["destination"],
            departure_time=raw["departure_time"],
            arrival_time=raw["arrival_time"],
            return_flight_id=raw.get("return_flight_id"),
            return_departure_time=raw.get("return_departure_time"),
            return_arrival_time=raw.get("return_arrival_time"),
            price_per_passenger=price_per_pax,
            total_price=total_price,
            stops=raw.get("stops", 0),
            duration_minutes=raw.get("duration_minutes", 60),
            is_direct=raw.get("is_direct", True),
            available_seats=raw.get("available_seats", 0),
            availability_status=raw.get("availability_status", "AVAILABLE"),
            data_source=raw.get("data_source", "MOCK_INVENTORY"),
            last_updated=raw.get("last_updated", "2026-10-29T10:00:00Z"),
            tier=raw.get("tier", "standard"),
            inclusion_reason=f"Matched route {origin}->{destination} with {passengers} seats available"
        )
        accepted.append(candidate)

    return accepted, rejected

def get_flight_details(flight_id: str) -> Optional[dict]:
    raw_flights = _load_flights_raw()
    for raw in raw_flights:
        if raw["flight_id"] == flight_id:
            return raw
    return None

def check_flight_availability(flight_id: str, passengers: int) -> Tuple[bool, str]:
    flight = get_flight_details(flight_id)
    if not flight:
        return False, f"Flight {flight_id} not found."
    if flight.get("availability_status") != "AVAILABLE":
        return False, f"Flight {flight_id} is {flight.get('availability_status')}."
    if flight.get("available_seats", 0) < passengers:
        return False, f"Flight {flight_id} only has {flight.get('available_seats')} seats for {passengers} requested."
    return True, "Flight available."

