from typing import List
from datetime import datetime
from app.models.schemas import (
    StructuredRequirements,
    FlightCandidate,
    HotelCandidate,
    ItineraryCandidate,
    VerificationReport
)

def verify_flight_details(flight: FlightCandidate, reqs: StructuredRequirements) -> List[str]:
    errors = []
    if flight.origin.strip().lower() != reqs.origin.strip().lower():
        errors.append(f"Flight origin mismatch: expected {reqs.origin}, found {flight.origin}")
    if flight.destination.strip().lower() != reqs.destination.strip().lower():
        errors.append(f"Flight destination mismatch: expected {reqs.destination}, found {flight.destination}")
    if flight.available_seats < reqs.passengers:
        errors.append(f"Flight available seats ({flight.available_seats}) < requested passengers ({reqs.passengers})")
    if "return_trip" in reqs.mandatory_constraints and not flight.return_flight_id:
        errors.append("Return flight missing while return_trip is mandatory")
    if flight.price_per_passenger <= 0:
        errors.append("Corrupted non-positive flight ticket price")
    return errors

def verify_hotel_details(hotel: HotelCandidate, reqs: StructuredRequirements) -> List[str]:
    errors = []
    if hotel.city.strip().lower() != reqs.destination.strip().lower():
        errors.append(f"Hotel city mismatch: expected {reqs.destination}, found {hotel.city}")
    if hotel.available_rooms < reqs.hotel_rooms:
        errors.append(f"Hotel available rooms ({hotel.available_rooms}) < requested rooms ({reqs.hotel_rooms})")
    if hotel.room_count < reqs.hotel_rooms:
        errors.append(f"Hotel booked room count ({hotel.room_count}) < requested rooms ({reqs.hotel_rooms})")
    if hotel.price_per_night <= 0:
        errors.append("Corrupted non-positive hotel room rate")
    return errors

def verify_budget(recalculated_cost: float, max_budget: float) -> List[str]:
    errors = []
    if recalculated_cost > max_budget:
        errors.append(f"Recalculated cost ₹{recalculated_cost:,.2f} exceeds budget limit ₹{max_budget:,.2f}")
    return errors

def verify_candidate_freshness(flight: FlightCandidate, hotel: HotelCandidate) -> List[str]:
    errors = []
    # Reject unverified or corrupted sources
    if "UNVERIFIED" in flight.data_source or "UNVERIFIED" in hotel.data_source:
        errors.append(f"Unverified provenance in data source: flight={flight.data_source}, hotel={hotel.data_source}")

    # Check timestamps: must not be stale (older than 30 days relative to 2026-10-29)
    ref_date = datetime(2026, 10, 29)
    for name, item in [("flight", flight), ("hotel", hotel)]:
        try:
            ts = item.last_updated.replace("Z", "+00:00")
            dt = datetime.fromisoformat(ts).replace(tzinfo=None)
            days_old = (ref_date - dt).days
            if days_old > 30:
                errors.append(f"Stale inventory record for {name} ({days_old} days old)")
        except Exception:
            pass
    return errors

def verify_itinerary(
    itinerary: ItineraryCandidate,
    reqs: StructuredRequirements
) -> VerificationReport:
    """
    Independently validate the proposed itinerary.
    Does NOT trust the optimizer's is_feasible flag without verification.
    """
    checks_passed = []
    checks_failed = []

    # 1. Independent cost recalculation
    recalculated_flight = round(itinerary.flight.price_per_passenger * reqs.passengers, 2)
    # calculate nights
    try:
        d1 = datetime.strptime(reqs.departure_date, "%Y-%m-%d")
        d2 = datetime.strptime(reqs.return_date, "%Y-%m-%d")
        nights = max(1, (d2 - d1).days)
    except Exception:
        nights = itinerary.hotel.nights

    hotel_base = round(itinerary.hotel.price_per_night * nights * reqs.hotel_rooms, 2)
    hotel_tax = round(hotel_base * itinerary.hotel.tax_rate, 2)
    recalculated_hotel = round(hotel_base + hotel_tax, 2)
    recalculated_total = round(recalculated_flight + recalculated_hotel, 2)

    cost_discrepancy = round(abs(recalculated_total - itinerary.total_cost), 2)
    if cost_discrepancy > 0.01:
        checks_failed.append(
            f"Arithmetic discrepancy detected: optimizer reported ₹{itinerary.total_cost:,.2f}, verifier computed ₹{recalculated_total:,.2f}"
        )
    else:
        checks_passed.append("Independent price recalculation verified")

    # 2. Budget verification
    budget_errors = verify_budget(recalculated_total, reqs.max_budget)
    if budget_errors:
        checks_failed.extend(budget_errors)
    else:
        checks_passed.append(f"Budget verified: ₹{recalculated_total:,.2f} <= ₹{reqs.max_budget:,.2f}")

    # 3. Flight details check
    flight_errors = verify_flight_details(itinerary.flight, reqs)
    if flight_errors:
        checks_failed.extend(flight_errors)
    else:
        checks_passed.append(f"Flight route and capacity verified ({itinerary.flight.airline})")

    # 4. Hotel details check
    hotel_errors = verify_hotel_details(itinerary.hotel, reqs)
    if hotel_errors:
        checks_failed.extend(hotel_errors)
    else:
        checks_passed.append(f"Hotel location and capacity verified ({itinerary.hotel.name})")

    # 5. Provenance and freshness check
    freshness_errors = verify_candidate_freshness(itinerary.flight, itinerary.hotel)
    if freshness_errors:
        checks_failed.extend(freshness_errors)
    else:
        checks_passed.append("Inventory freshness and provenance verified")

    # 6. Final status determination
    if len(checks_failed) == 0:
        status = "VERIFIED"
        explanation = (
            f"All independent validation checks PASSED. Itinerary {itinerary.itinerary_id} satisfies "
            f"all mandatory constraints ({', '.join(reqs.mandatory_constraints)}) with verified total "
            f"cost ₹{recalculated_total:,.2f} against maximum budget ₹{reqs.max_budget:,.2f}."
        )
    else:
        status = "REJECTED"
        explanation = (
            f"Verification REJECTED itinerary {itinerary.itinerary_id}. "
            f"Failed checks: {'; '.join(checks_failed)}."
        )

    return VerificationReport(
        itinerary_id=itinerary.itinerary_id,
        status=status,
        checks_passed=checks_passed,
        checks_failed=checks_failed,
        recalculated_total_cost=recalculated_total,
        cost_discrepancy=cost_discrepancy,
        data_freshness_verified=(len(freshness_errors) == 0),
        explanation=explanation
    )

