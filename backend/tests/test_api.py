import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "agents_registered" in data
    assert len(data["agents_registered"]) >= 5

def test_api_plan_and_trace():
    payload = {
        "user_request": "Plan a three-day trip from Chennai to Bengaluru for two people. Travel from 10 November to 12 November 2026. Keep the total budget below ₹20,000, including return flights and two hotel nights. Prefer direct flights and hotels near the city centre."
    }
    res = client.post("/api/trips/plan", json=payload)
    assert res.status_code == 200
    data = res.json()
    session_id = data["session_id"]
    assert data["status"] == "VERIFIED_RECOMMENDATION"
    assert data["recommended_itinerary"] is not None

    # Retrieve trip status
    get_res = client.get(f"/api/trips/{session_id}")
    assert get_res.status_code == 200
    assert get_res.json()["session_id"] == session_id

    # Retrieve execution trace
    trace_res = client.get(f"/api/trips/{session_id}/trace")
    assert trace_res.status_code == 200
    traces = trace_res.json()
    assert len(traces) >= 5

def test_api_clarification_flow():
    payload = {
        "user_request": "Plan a trip to Bengaluru."
    }
    res = client.post("/api/trips/plan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "CLARIFICATION_REQUIRED"
    assert data["clarification_required"] is True
    session_id = data["session_id"]

    # Submit clarification
    clarif_res = client.post(
        f"/api/trips/{session_id}/clarification",
        json={"clarification_answers": {"dates": "from 2026-11-10 to 2026-11-12", "budget": "20000 INR", "origin": "Chennai", "passengers": 2}}
    )
    assert clarif_res.status_code == 200
    updated_data = clarif_res.json()
    assert updated_data["status"] == "VERIFIED_RECOMMENDATION"

def test_api_approval_boundary():
    payload = {
        "user_request": "Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 passengers, budget 20000."
    }
    res = client.post("/api/trips/plan", json=payload)
    assert res.status_code == 200
    data = res.json()
    session_id = data["session_id"]
    assert data["user_approval_status"] == "PENDING"

    # User explicitly approves recommendation
    appr_res = client.post(f"/api/trips/{session_id}/approval", json={"approved": True})
    assert appr_res.status_code == 200
    assert appr_res.json()["user_approval_status"] == "APPROVED"

