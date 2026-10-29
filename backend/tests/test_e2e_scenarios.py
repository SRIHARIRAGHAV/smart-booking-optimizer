import uuid
import pytest
from app.graph.workflow import travel_app
from app.services.trip_service import get_trip_service
from app.tools.verification_tools import verify_itinerary
from app.models.schemas import (
    StructuredRequirements,
    FlightCandidate,
    HotelCandidate,
    ItineraryCandidate
)

def test_scenario_a_feasible_first_attempt():
    """
    TEST A: Feasible on the first attempt
    A valid flight and hotel combination satisfies all mandatory constraints.
    Expected: The itinerary is verified and presented.
    """
    svc = get_trip_service()
    req_text = "Plan a three-day trip from Chennai to Bengaluru for two people. Travel from 10 November to 12 November 2026. Keep the total budget below ₹20,000, including return flights and two hotel nights. Prefer direct flights and hotels near the city centre."
    result = svc.plan_trip(user_request=req_text)

    assert result["final_status"] == "VERIFIED_RECOMMENDATION"
    assert result["current_itinerary"] is not None
    itin = result["current_itinerary"]
    assert itin["total_cost"] <= 20000.0
    assert result["verification_report"]["status"] == "VERIFIED"

def test_scenario_b_budget_recovery():
    """
    TEST B: Budget recovery
    The initial standard candidate exceeds the tighter budget (₹11,500), but alternative
    budget searches produce a feasible combination (FL-103 Akasa Air ₹6,400 + HT-204 Suburban ₹4,032 = ₹10,432).
    Expected: The optimizer initiates another search, evaluates budget options, and finds a valid itinerary.
    """
    svc = get_trip_service()
    req_text = "Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people with a strict budget of ₹11,500."
    result = svc.plan_trip(user_request=req_text)

    assert result["final_status"] == "VERIFIED_RECOMMENDATION"
    itin = result["current_itinerary"]
    assert itin["total_cost"] <= 11500.0
    assert result["verification_report"]["status"] == "VERIFIED"
    # Verification of recovery execution
    trace = result["execution_trace"]
    recovery_steps = [s for s in trace if "recovery" in s["agent_name"].lower() or "recovery" in s["decision"].lower()]
    assert len(recovery_steps) >= 1

def test_scenario_c_no_feasible_itinerary():
    """
    TEST C: No feasible itinerary
    All available candidates violate at least one mandatory constraint (budget = ₹3,000).
    Expected: The workflow terminates with a clear failure report. It must not invent a solution.
    """
    svc = get_trip_service()
    req_text = "Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people with maximum budget of ₹3000."
    result = svc.plan_trip(user_request=req_text)

    assert result["final_status"] == "FAILED_RETRY_EXHAUSTED"
    assert result["current_itinerary"] is None
    assert result["failure_explanation"] is not None
    assert "no itinerary satisfies all mandatory constraints" in result["failure_explanation"].lower()
    assert len(result["nearest_alternatives"]) > 0

def test_scenario_d_verification_rejection():
    """
    TEST D: Verification rejection
    The proposed candidate contains a corrupted unverified source or cost mismatch.
    Expected: The verifier rejects it and flags specific failure reasons.
    """
    reqs = StructuredRequirements(
        origin="Chennai",
        destination="Bengaluru",
        departure_date="2026-11-10",
        return_date="2026-11-12",
        passengers=2,
        hotel_rooms=1,
        max_budget=20000.0,
        mandatory_constraints=["return_trip", "hotel_accommodation", "stay_within_budget"]
    )
    # Corrupted flight
    flight = FlightCandidate(
        flight_id="FL-106-CORRUPT",
        airline="Phantom Air",
        origin="Chennai",
        destination="Bengaluru",
        departure_time="2026-11-10T09:00:00",
        arrival_time="2026-11-10T10:00:00",
        return_flight_id="FL-106R",
        price_per_passenger=-500.0,
        total_price=-1000.0,
        duration_minutes=60,
        is_direct=True,
        available_seats=4,
        availability_status="AVAILABLE",
        data_source="MOCK_INVENTORY_PROVIDER_UNVERIFIED",
        last_updated="2025-01-01T00:00:00Z"
    )
    hotel = HotelCandidate(
        hotel_id="HT-201",
        name="Central Residency",
        city="Bengaluru",
        neighbourhood="MG Road",
        is_city_centre=True,
        price_per_night=3500.0,
        nights=2,
        room_count=1,
        taxes_and_fees=840.0,
        total_price=7840.0,
        available_rooms=4,
        availability_status="AVAILABLE",
        rating=4.3,
        data_source="MOCK_HOTEL_GDS",
        last_updated="2026-10-29T10:00:00Z"
    )
    itin = ItineraryCandidate(
        itinerary_id="ITIN-CORRUPT",
        flight=flight,
        hotel=hotel,
        flight_cost=-1000.0,
        hotel_cost=7840.0,
        taxes_and_fees=840.0,
        total_cost=6840.0,
        budget_remaining=13160.0,
        is_feasible=True
    )

    report = verify_itinerary(itin, reqs)
    assert report.status == "REJECTED"
    assert len(report.checks_failed) > 0
    assert any("price" in f.lower() or "provenance" in f.lower() for f in report.checks_failed)

def test_scenario_e_retry_exhaustion():
    """
    TEST E: Retry exhaustion
    Repeated attempts fail to find a valid itinerary.
    Expected: Workflow terminates within the configured retry and step limits.
    """
    session_id = f"test-exhaust-{uuid.uuid4().hex[:8]}"
    initial_state = {
        "session_id": session_id,
        "user_request": "Trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12, budget 2000 INR.",
        "max_retries": 2,
        "execution_step_count": 0,
        "retry_count": 0,
        "execution_trace": [],
        "flight_candidates": [],
        "hotel_candidates": [],
        "rejected_combinations": [],
        "error_records": []
    }
    config = {"configurable": {"thread_id": session_id}}
    res = travel_app.invoke(initial_state, config=config)

    assert res["final_status"] == "FAILED_RETRY_EXHAUSTED"
    assert res["retry_count"] <= 3

def test_scenario_f_missing_input():
    """
    TEST F: Missing input
    The user omits essential fields.
    Expected: The system requests clarification instead of inventing missing information.
    """
    svc = get_trip_service()
    result = svc.plan_trip(user_request="I want to go to Bengaluru with a friend.")
    assert result["clarification_required"] is True
    assert len(result["clarification_questions"]) >= 1

def test_scenario_g_llm_unavailable_deterministic_fallback():
    """
    TEST G: LLM unavailable / Demo mode
    Expected: Deterministic fallback remains fully operational and clearly labeled.
    """
    svc = get_trip_service()
    result = svc.plan_trip(user_request="Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people, budget 20000 INR.")
    trace = result["execution_trace"]
    # Check that deterministic execution type is accurately logged
    engines = [t["execution_type"] for t in trace]
    assert any("DETERMINISTIC" in e for e in engines)

def test_scenario_h_approval_boundary():
    """
    TEST H: Approval boundary
    A recommendation is presented without user approval.
    Expected: No booking confirmation occurs without explicit approval, and unverified plans cannot be approved.
    """
    svc = get_trip_service()
    result = svc.plan_trip(user_request="Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people, budget 20000 INR.")
    session_id = result["session_id"]
    assert result["user_approval_status"] == "PENDING"

    # User explicitly approves
    appr_result = svc.submit_approval(session_id, approved=True)
    assert appr_result["success"] is True
    assert appr_result["user_approval_status"] == "APPROVED"
    assert "simulated" in appr_result["message"].lower()

