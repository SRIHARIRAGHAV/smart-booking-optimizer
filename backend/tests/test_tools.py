import pytest
from app.models.schemas import StructuredRequirements
from app.tools.flight_tools import search_flights, check_flight_availability
from app.tools.hotel_tools import search_hotels, check_hotel_availability
from app.tools.optimization_tools import (
    calculate_itinerary_cost,
    evaluate_constraints,
    score_preferences,
    generate_candidate_combinations,
    rank_itineraries,
)
from app.tools.verification_tools import verify_itinerary

def test_flight_search_and_availability():
    flights, rejected = search_flights("Chennai", "Bengaluru", "2026-11-10", "2026-11-12", 2)
    assert len(flights) >= 2
    # Verify passenger multiplication
    for f in flights:
        assert f.total_price == f.price_per_passenger * 2

    ok, msg = check_flight_availability("FL-101", 2)
    assert ok is True

    # Test sold out flight
    ok_sold, msg_sold = check_flight_availability("FL-105", 1)
    assert ok_sold is False

def test_hotel_search_and_availability():
    hotels, rejected = search_hotels("Bengaluru", 2, 1)
    assert len(hotels) >= 2
    for h in hotels:
        expected_base = h.price_per_night * 2 * 1
        expected_tax = round(expected_base * h.tax_rate, 2)
        assert h.taxes_and_fees == expected_tax
        assert h.total_price == round(expected_base + expected_tax, 2)

    ok, msg = check_hotel_availability("HT-201", 1)
    assert ok is True

def test_deterministic_cost_and_constraints():
    reqs = StructuredRequirements(
        origin="Chennai",
        destination="Bengaluru",
        departure_date="2026-11-10",
        return_date="2026-11-12",
        passengers=2,
        hotel_rooms=1,
        max_budget=20000.0,
        currency="INR",
        mandatory_constraints=["return_trip", "hotel_accommodation", "stay_within_budget"],
        preferences=["direct_flight", "city_centre_hotel"]
    )
    flights, _ = search_flights("Chennai", "Bengaluru", "2026-11-10", "2026-11-12", 2)
    hotels, _ = search_hotels("Bengaluru", 2, 1)

    combinations = generate_candidate_combinations(flights, hotels, reqs)
    assert len(combinations) > 0

    ranked = rank_itineraries(combinations)
    feasible = [c for c in ranked if c.is_feasible]
    assert len(feasible) > 0
    # Best candidate must be within budget
    best = feasible[0]
    assert best.total_cost <= 20000.0
    assert best.preference_score > 0

def test_independent_verification():
    reqs = StructuredRequirements(
        origin="Chennai",
        destination="Bengaluru",
        departure_date="2026-11-10",
        return_date="2026-11-12",
        passengers=2,
        hotel_rooms=1,
        max_budget=20000.0,
        mandatory_constraints=["return_trip", "hotel_accommodation", "stay_within_budget"],
        preferences=["direct_flight", "city_centre_hotel"]
    )
    flights, _ = search_flights("Chennai", "Bengaluru", "2026-11-10", "2026-11-12", 2)
    hotels, _ = search_hotels("Bengaluru", 2, 1)
    combinations = generate_candidate_combinations(flights, hotels, reqs)
    best = next(c for c in combinations if c.is_feasible)

    report = verify_itinerary(best, reqs)
    assert report.status == "VERIFIED"
    assert report.cost_discrepancy == 0.0
    assert len(report.checks_failed) == 0

def test_independent_verification_rejects_violation():
    reqs = StructuredRequirements(
        origin="Chennai",
        destination="Bengaluru",
        departure_date="2026-11-10",
        return_date="2026-11-12",
        passengers=2,
        hotel_rooms=1,
        max_budget=10000.0,  # lower budget to force violation
        mandatory_constraints=["return_trip", "hotel_accommodation", "stay_within_budget"]
    )
    flights, _ = search_flights("Chennai", "Bengaluru", "2026-11-10", "2026-11-12", 2)
    hotels, _ = search_hotels("Bengaluru", 2, 1)
    combinations = generate_candidate_combinations(flights, hotels, reqs)
    expensive = next(c for c in combinations if c.total_cost > 10000.0)

    report = verify_itinerary(expensive, reqs)
    assert report.status == "REJECTED"
    assert any("exceeds budget" in check for check in report.checks_failed)

