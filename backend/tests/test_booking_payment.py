import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.trip_service import get_trip_service
from app.models.schemas import PayAndBookRequest, PassengerInfo
from app.tools.booking_links import generate_airline_booking_links, generate_hotel_booking_links, build_site_booking_links

client = TestClient(app)

def test_site_booking_links_generation():
    flight_links = generate_airline_booking_links(
        airline="IndiGo 6E-201",
        flight_id="FL-101",
        origin="Chennai",
        destination="Bengaluru",
        departure_date="2026-11-10",
        return_date="2026-11-12",
        passengers=2
    )
    assert "goindigo.in" in flight_links["flight_direct_url"]
    assert "google.com/travel/flights" in flight_links["flight_google_url"]
    assert "IndiGo" in flight_links["flight_provider_name"]

    hotel_links = generate_hotel_booking_links(
        hotel_name="Central Residency",
        city="Bengaluru",
        check_in_date="2026-11-10",
        check_out_date="2026-11-12",
        rooms=1,
        passengers=2
    )
    assert "booking.com" in hotel_links["hotel_direct_url"]
    assert "agoda.com" in hotel_links["hotel_agoda_url"]
    assert "google.com/travel/hotels" in hotel_links["hotel_google_url"]

def test_full_pay_and_book_flow():
    # 1. Plan a trip
    plan_res = client.post("/api/trips/plan", json={
        "user_request": "Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people, budget 20000 INR."
    })
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    session_id = plan_data["session_id"]
    assert plan_data["status"] == "VERIFIED_RECOMMENDATION"
    itin = plan_data["recommended_itinerary"]
    assert itin is not None

    # Check site booking links in itinerary
    links = itin.get("site_booking_links")
    assert links is not None
    assert "flight_direct_url" in links
    assert "hotel_direct_url" in links
    assert "agent_free_notice" in links

    # 2. Pay and book tickets
    book_payload = {
        "passenger_details": [
            {"full_name": "Aarav Sharma", "age": 30, "gender": "Male"},
            {"full_name": "Priya Sharma", "age": 28, "gender": "Female"}
        ],
        "contact_email": "aarav.sharma@example.com",
        "contact_phone": "+91 9876543210",
        "payment_method": "INSTANT_SANDBOX"
    }

    book_res = client.post(f"/api/trips/{session_id}/pay-and-book", json=book_payload)
    assert book_res.status_code == 200
    book_data = book_res.json()
    assert book_data["success"] is True

    booking = book_data["booking"]
    assert booking["session_id"] == session_id
    assert booking["status"] == "CONFIRMED"

    # Verify Flight Ticket
    ticket = booking["flight_ticket"]
    assert ticket["status"] == "CONFIRMED"
    assert ticket["pnr"] != ""
    assert "ETKT-" in ticket["eticket_number"]
    assert len(ticket["seat_assignments"]) == 2
    assert "Aarav Sharma" in ticket["passengers"]

    # Verify Hotel Voucher
    voucher = booking["hotel_voucher"]
    assert voucher["status"] == "CONFIRMED"
    assert "HTL-CONF-" in voucher["confirmation_code"]
    assert voucher["hotel_name"] != ""

    # Verify Payment Receipt
    receipt = booking["payment_receipt"]
    assert receipt["payment_status"] == "SUCCESS"
    assert "TXN-2026-" in receipt["transaction_id"]
    assert receipt["amount_paid"] == itin["total_cost"]
    assert receipt["convenience_fee"] == 0.0

    # 3. Retrieve confirmed booking via GET
    get_book_res = client.get(f"/api/trips/{session_id}/booking")
    assert get_book_res.status_code == 200
    retrieved = get_book_res.json()
    assert retrieved["booking_id"] == booking["booking_id"]
    assert retrieved["flight_ticket"]["pnr"] == ticket["pnr"]

    # 4. Check trip status updated
    get_trip_res = client.get(f"/api/trips/{session_id}")
    assert get_trip_res.status_code == 200
    trip_data = get_trip_res.json()
    assert trip_data["status"] == "BOOKED_AND_CONFIRMED"
    assert trip_data["user_approval_status"] == "APPROVED"
    assert trip_data["booking_confirmation"] is not None

    # 5. Check trace includes Agent 6
    trace_res = client.get(f"/api/trips/{session_id}/trace")
    assert trace_res.status_code == 200
    traces = trace_res.json()
    agent_names = [t["agent_name"] for t in traces]
    assert any("Agent 6: Booking & Payment Execution Agent" in a for a in agent_names)

def test_booking_unverified_trip_rejected():
    # If trip does not exist
    book_res = client.post("/api/trips/non-existent-session/pay-and-book", json={
        "payment_method": "INSTANT_SANDBOX"
    })
    assert book_res.status_code == 400

def test_trip_options_and_customization():
    # 1. Plan a trip
    plan_res = client.post("/api/trips/plan", json={
        "user_request": "Plan a trip from Chennai to Bengaluru from 2026-11-10 to 2026-11-12 for 2 people, budget 20000 INR."
    })
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    session_id = plan_data["session_id"]
    current_hotel = plan_data["recommended_itinerary"]["hotel"]["hotel_id"]

    # 2. Query available options (flights & hotels with site links and logos)
    opt_res = client.get(f"/api/trips/{session_id}/options")
    assert opt_res.status_code == 200
    options = opt_res.json()
    assert len(options["flights"]) >= 2
    assert len(options["hotels"]) >= 2
    assert options["hotels"][0]["direct_booking_url"] != ""
    assert options["flights"][0]["direct_booking_url"] != ""

    # 3. Customize trip by choosing another accommodation (HT-203 Bloom Hub is well within 20k budget)
    cust_res = client.post(f"/api/trips/{session_id}/customize", json={
        "hotel_id": "HT-203"
    })
    assert cust_res.status_code == 200
    cust_data = cust_res.json()
    assert cust_data["success"] is True
    assert cust_data["updated_itinerary"]["hotel"]["hotel_id"] == "HT-203"
    assert cust_data["verification_report"]["status"] == "VERIFIED"

