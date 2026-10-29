import uuid
import pytest
from app.graph.workflow import travel_app

def test_workflow_feasible_scenario_a():
    session_id = f"test-session-{uuid.uuid4().hex[:8]}"
    initial_state = {
        "session_id": session_id,
        "user_request": "Plan a three-day trip from Chennai to Bengaluru for two people. Travel from 10 November to 12 November 2026. Keep the total budget below ₹20,000, including return flights and two hotel nights. Prefer direct flights and hotels near the city centre.",
        "max_retries": 3,
        "execution_step_count": 0,
        "retry_count": 0,
        "execution_trace": [],
        "flight_candidates": [],
        "hotel_candidates": [],
        "rejected_combinations": [],
        "error_records": []
    }

    config = {"configurable": {"thread_id": session_id}}
    final_state = travel_app.invoke(initial_state, config=config)

    assert final_state["final_status"] == "VERIFIED_RECOMMENDATION"
    assert final_state["clarification_required"] is False
    assert final_state["current_itinerary"] is not None

    itin = final_state["current_itinerary"]
    assert itin["total_cost"] <= 20000.0
    assert itin["flight"]["is_direct"] is True
    assert itin["hotel"]["is_city_centre"] is True

    # Verification report must be present and verified
    verif = final_state["verification_report"]
    assert verif["status"] == "VERIFIED"
    assert verif["cost_discrepancy"] == 0.0

    # Trace check
    trace = final_state["execution_trace"]
    assert len(trace) >= 5
    agents_involved = {step["agent_name"] for step in trace}
    assert any("Request Planner" in a for a in agents_involved)
    assert any("Flight Searcher" in a for a in agents_involved)
    assert any("Hotel Searcher" in a for a in agents_involved)
    assert any("Budget Optimizer" in a for a in agents_involved)
    assert any("Booking Verifier" in a for a in agents_involved)

def test_workflow_clarification_scenario_f():
    session_id = f"test-clarif-{uuid.uuid4().hex[:8]}"
    initial_state = {
        "session_id": session_id,
        "user_request": "Plan a trip to Bengaluru for 2 people.",
        "max_retries": 3,
        "execution_step_count": 0,
        "retry_count": 0,
        "execution_trace": [],
        "flight_candidates": [],
        "hotel_candidates": [],
        "rejected_combinations": [],
        "error_records": []
    }

    config = {"configurable": {"thread_id": session_id}}
    final_state = travel_app.invoke(initial_state, config=config)

    assert final_state["clarification_required"] is True
    assert final_state["final_status"] == "CLARIFICATION_REQUIRED"
    assert len(final_state["clarification_questions"]) > 0

def test_workflow_infeasible_budget_scenario_c():
    session_id = f"test-infeasible-{uuid.uuid4().hex[:8]}"
    initial_state = {
        "session_id": session_id,
        "user_request": "Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people with maximum budget of ₹5000.",
        "max_retries": 3,
        "execution_step_count": 0,
        "retry_count": 0,
        "execution_trace": [],
        "flight_candidates": [],
        "hotel_candidates": [],
        "rejected_combinations": [],
        "error_records": []
    }

    config = {"configurable": {"thread_id": session_id}}
    final_state = travel_app.invoke(initial_state, config=config)

    # Must terminate without silently violating budget
    assert final_state["final_status"] == "FAILED_RETRY_EXHAUSTED"
    assert final_state["current_itinerary"] is None
    assert final_state["failure_explanation"] is not None
    assert "budget" in final_state["failure_explanation"].lower()
    assert len(final_state["nearest_alternatives"]) > 0
    # Retries were attempted
    assert final_state["retry_count"] >= 3

