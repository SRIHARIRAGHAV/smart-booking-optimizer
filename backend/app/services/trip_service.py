import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.graph.workflow import travel_app
from app.repositories.trip_repository import get_trip_repository, TripRepository
from app.services.llm_service import is_llm_configured
from app.services.retrieval_service import get_retrieval_service
from app.models.schemas import (
    StructuredRequirements,
    ItineraryCandidate,
    FlightCandidate,
    HotelCandidate,
    SiteBookingLinks,
    PayAndBookRequest,
    BookingConfirmation,
    AvailableFlightOption,
    AvailableHotelOption,
    TripOptionsResponse
)
from app.agents.booking_execution_agent import execute_booking_and_payment
from app.tools.flight_tools import search_flights, get_flight_details
from app.tools.hotel_tools import search_hotels, get_hotel_details
from app.tools.optimization_tools import calculate_itinerary_cost, evaluate_constraints, score_preferences
from app.tools.verification_tools import verify_itinerary
from app.tools.booking_links import build_site_booking_links, generate_airline_booking_links, generate_hotel_booking_links

class TripService:
    def __init__(self, repository: Optional[TripRepository] = None):
        self.repo = repository or get_trip_repository()

    def plan_trip(
        self,
        user_request: Optional[str] = None,
        structured_requirements: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        sid = session_id or f"trip-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()

        initial_state = {
            "session_id": sid,
            "created_at": now,
            "updated_at": now,
            "user_request": user_request or "",
            "structured_requirements": structured_requirements,
            "clarification_required": False,
            "clarification_questions": [],
            "flight_candidates": [],
            "hotel_candidates": [],
            "rejected_combinations": [],
            "current_itinerary": None,
            "candidate_total_cost": None,
            "constraint_results": [],
            "optimization_attempts": 0,
            "retry_count": 0,
            "max_retries": 3,
            "execution_step_count": 0,
            "search_strategy": None,
            "verification_report": None,
            "execution_trace": [],
            "error_records": [],
            "final_status": "PLANNING",
            "user_approval_status": "PENDING",
            "failure_explanation": None,
            "nearest_alternatives": []
        }

        config = {"configurable": {"thread_id": sid}}
        final_state = travel_app.invoke(initial_state, config=config)
        final_state["updated_at"] = datetime.now(timezone.utc).isoformat()
        final_state["created_at"] = now

        # Persist to SQLite
        self.repo.save_trip_state(final_state)
        return final_state

    def submit_clarification(
        self,
        session_id: str,
        clarification_answers: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        trip = self.repo.get_trip(session_id)
        if not trip:
            return None

        # Merge answers into new request text or structured requirements
        existing_req = trip.get("user_request", "")
        answers_str = " ".join(f"{k}: {v}." for k, v in clarification_answers.items())
        combined_request = f"{existing_req} {answers_str}".strip()

        # Re-run workflow with combined context
        return self.plan_trip(user_request=combined_request, session_id=session_id)

    def submit_approval(
        self,
        session_id: str,
        approved: bool,
        user_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        trip = self.repo.get_trip(session_id)
        if not trip:
            return {"success": False, "message": f"Trip {session_id} not found"}

        # Independent verification check before approval is allowed
        verif = trip.get("verification_report")
        if not verif or verif.get("status") != "VERIFIED":
            return {
                "success": False,
                "message": "Cannot approve an unverified or rejected itinerary. Verification is mandatory."
            }

        success = self.repo.update_approval(session_id, approved, user_notes)
        return {
            "success": success,
            "session_id": session_id,
            "user_approval_status": "APPROVED" if approved else "REJECTED_BY_USER",
            "message": "Itinerary approval recorded. (Simulated booking approval; proceed to payment to confirm live ticket)."
        }

    def pay_and_book_trip(
        self,
        session_id: str,
        pay_req: PayAndBookRequest
    ) -> Dict[str, Any]:
        """
        Process payment and execute ticket booking via Agent 6.
        """
        trip = self.repo.get_trip(session_id)
        if not trip:
            return {"success": False, "message": f"Trip session {session_id} not found"}

        # Check existing booking
        existing_booking = self.repo.get_booking(session_id)
        if existing_booking:
            return {
                "success": True,
                "already_booked": True,
                "booking": existing_booking,
                "message": "Trip is already confirmed and booked."
            }

        verif = trip.get("verification_report")
        if not verif or verif.get("status") != "VERIFIED":
            return {
                "success": False,
                "message": "Cannot execute booking for an unverified or rejected itinerary. Strict verification is required."
            }

        raw_itin = trip.get("recommended_itinerary")
        if not raw_itin:
            return {"success": False, "message": "No recommended itinerary found to book."}

        raw_reqs = trip.get("structured_requirements")
        if not raw_reqs:
            return {"success": False, "message": "Trip structured requirements missing."}

        itinerary = ItineraryCandidate(**raw_itin)
        reqs = StructuredRequirements(**raw_reqs)

        traces = self.repo.get_traces(session_id)
        step_num = len(traces) + 1

        confirmation, trace_step = execute_booking_and_payment(
            session_id=session_id,
            itinerary=itinerary,
            reqs=reqs,
            pay_req=pay_req,
            step_num=step_num
        )

        conf_dict = confirmation.model_dump()
        trace_dict = trace_step.model_dump()

        self.repo.save_booking(conf_dict, trace_dict)

        return {
            "success": True,
            "session_id": session_id,
            "booking": conf_dict,
            "message": f"Payment successfully processed and booking confirmed (PNR: {confirmation.flight_ticket.pnr})."
        }

    def get_trip_options(self, session_id: str) -> Optional[TripOptionsResponse]:
        """
        Retrieve available flights and accommodations for the destination with logos and direct links
        so the user can easily choose another hotel or flight.
        """
        trip = self.repo.get_trip(session_id)
        if not trip:
            return None

        raw_reqs = trip.get("structured_requirements")
        if not raw_reqs:
            return None

        reqs = StructuredRequirements(**raw_reqs)
        current_itin = trip.get("recommended_itinerary") or {}
        cur_flight = current_itin.get("flight") or {}
        cur_hotel = current_itin.get("hotel") or {}
        cur_flight_id = cur_flight.get("flight_id")
        cur_hotel_id = cur_hotel.get("hotel_id")
        cur_flight_cost = float(cur_flight.get("total_price", 0.0))
        cur_hotel_cost = float(cur_hotel.get("total_price", 0.0))

        # 1. Search all flights for route
        flights, _ = search_flights(
            origin=reqs.origin,
            destination=reqs.destination,
            departure_date=reqs.departure_date,
            return_date=reqs.return_date,
            passengers=reqs.passengers,
            include_all_for_ranking=True
        )

        # 2. Search all hotels for city
        try:
            d1 = datetime.strptime(reqs.departure_date, "%Y-%m-%d")
            d2 = datetime.strptime(reqs.return_date, "%Y-%m-%d")
            nights = max(1, (d2 - d1).days)
        except Exception:
            nights = 2

        hotels, _ = search_hotels(
            city=reqs.destination,
            nights=nights,
            rooms=reqs.hotel_rooms,
            include_all_for_ranking=True
        )

        flight_options: List[AvailableFlightOption] = []
        for f in flights:
            links = generate_airline_booking_links(
                airline=f.airline,
                flight_id=f.flight_id,
                origin=f.origin,
                destination=f.destination,
                departure_date=reqs.departure_date,
                return_date=reqs.return_date,
                passengers=reqs.passengers
            )
            airline_lower = f.airline.lower()
            logo_key = "indigo" if "indigo" in airline_lower else "airindia" if "air india" in airline_lower else "akasa" if "akasa" in airline_lower else "spicejet" if "spicejet" in airline_lower else "airline"
            diff = round(f.total_price - cur_flight_cost, 2)
            flight_options.append(AvailableFlightOption(
                flight=f,
                airline_logo_key=logo_key,
                direct_booking_url=links["flight_search_url"],
                google_flights_url=links["flight_google_url"],
                price_difference_vs_current=diff
            ))

        hotel_options: List[AvailableHotelOption] = []
        for h in hotels:
            h_links = generate_hotel_booking_links(
                hotel_name=h.name,
                city=h.city,
                check_in_date=reqs.departure_date,
                check_out_date=reqs.return_date,
                rooms=reqs.hotel_rooms,
                passengers=reqs.passengers
            )
            diff_h = round(h.total_price - cur_hotel_cost, 2)
            hotel_options.append(AvailableHotelOption(
                hotel=h,
                hotel_logo_key="booking",
                direct_booking_url=h_links["hotel_direct_url"],
                google_hotels_url=h_links["hotel_google_url"],
                agoda_url=h_links["hotel_agoda_url"],
                price_difference_vs_current=diff_h
            ))

        return TripOptionsResponse(
            session_id=session_id,
            current_flight_id=cur_flight_id,
            current_hotel_id=cur_hotel_id,
            flights=flight_options,
            hotels=hotel_options
        )

    def customize_trip(
        self,
        session_id: str,
        flight_id: Optional[str] = None,
        hotel_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        User chooses another accommodation or flight ticket;
        recalculates costs, verifies budget constraints, and updates the itinerary.
        """
        trip = self.repo.get_trip(session_id)
        if not trip:
            return {"success": False, "message": f"Trip {session_id} not found"}

        raw_reqs = trip.get("structured_requirements")
        raw_itin = trip.get("recommended_itinerary")
        if not raw_reqs or not raw_itin:
            return {"success": False, "message": "Cannot customize trip without active itinerary and requirements."}

        reqs = StructuredRequirements(**raw_reqs)
        cur_flight = FlightCandidate(**raw_itin["flight"])
        cur_hotel = HotelCandidate(**raw_itin["hotel"])

        # If flight changed
        if flight_id and flight_id != cur_flight.flight_id:
            new_f_raw = get_flight_details(flight_id)
            if not new_f_raw:
                return {"success": False, "message": f"Flight {flight_id} not found."}
            pax_price = float(new_f_raw["price_per_passenger"])
            cur_flight = FlightCandidate(
                flight_id=new_f_raw["flight_id"],
                airline=new_f_raw["airline"],
                origin=new_f_raw["origin"],
                destination=new_f_raw["destination"],
                departure_time=new_f_raw["departure_time"],
                arrival_time=new_f_raw["arrival_time"],
                return_flight_id=new_f_raw.get("return_flight_id"),
                return_departure_time=new_f_raw.get("return_departure_time"),
                return_arrival_time=new_f_raw.get("return_arrival_time"),
                price_per_passenger=pax_price,
                total_price=round(pax_price * reqs.passengers, 2),
                stops=new_f_raw.get("stops", 0),
                duration_minutes=new_f_raw.get("duration_minutes", 60),
                is_direct=new_f_raw.get("is_direct", True),
                available_seats=new_f_raw.get("available_seats", 10),
                availability_status=new_f_raw.get("availability_status", "AVAILABLE"),
                data_source=new_f_raw.get("data_source", "MOCK_INVENTORY"),
                tier=new_f_raw.get("tier", "standard")
            )

        # If hotel changed
        if hotel_id and hotel_id != cur_hotel.hotel_id:
            new_h_raw = get_hotel_details(hotel_id)
            if not new_h_raw:
                return {"success": False, "message": f"Hotel {hotel_id} not found."}
            try:
                d1 = datetime.strptime(reqs.departure_date, "%Y-%m-%d")
                d2 = datetime.strptime(reqs.return_date, "%Y-%m-%d")
                nights = max(1, (d2 - d1).days)
            except Exception:
                nights = 2

            price_night = float(new_h_raw["price_per_night"])
            base_h = price_night * nights * reqs.hotel_rooms
            tax_rate = float(new_h_raw.get("tax_rate", 0.12))
            tax_h = round(base_h * tax_rate, 2)
            total_h = round(base_h + tax_h, 2)

            cur_hotel = HotelCandidate(
                hotel_id=new_h_raw["hotel_id"],
                name=new_h_raw["name"],
                city=new_h_raw["city"],
                neighbourhood=new_h_raw.get("neighbourhood", "Central"),
                is_city_centre=new_h_raw.get("is_city_centre", True),
                price_per_night=price_night,
                nights=nights,
                room_count=reqs.hotel_rooms,
                tax_rate=tax_rate,
                taxes_and_fees=tax_h,
                total_price=total_h,
                available_rooms=new_h_raw.get("available_rooms", 5),
                availability_status=new_h_raw.get("availability_status", "AVAILABLE"),
                rating=new_h_raw.get("rating", 4.0),
                amenities=new_h_raw.get("amenities", []),
                data_source=new_h_raw.get("data_source", "MOCK_HOTEL_GDS"),
                tier=new_h_raw.get("tier", "standard")
            )

        # Recalculate deterministic costs
        costs = calculate_itinerary_cost(cur_flight, cur_hotel)
        is_feas, viols = evaluate_constraints(cur_flight, cur_hotel, reqs)
        score, sat_prefs = score_preferences(cur_flight, cur_hotel, reqs)
        links = build_site_booking_links(cur_flight, cur_hotel, reqs)

        new_itin = ItineraryCandidate(
            itinerary_id=raw_itin.get("itinerary_id", "ITIN-CUSTOM"),
            flight=cur_flight,
            hotel=cur_hotel,
            flight_cost=costs["flight_cost"],
            hotel_cost=costs["hotel_cost"],
            taxes_and_fees=costs["taxes_and_fees"],
            total_cost=costs["total_cost"],
            budget_remaining=round(reqs.max_budget - costs["total_cost"], 2),
            is_feasible=is_feas,
            violated_constraints=viols,
            satisfied_preferences=sat_prefs,
            preference_score=score,
            selection_reason=f"User selection: {cur_flight.airline} + {cur_hotel.name}",
            site_booking_links=SiteBookingLinks(**links)
        )

        verif_report = verify_itinerary(new_itin, reqs)

        # Update trip in repository
        updated_state = {
            **trip,
            "current_itinerary": new_itin.model_dump(),
            "recommended_itinerary": new_itin.model_dump(),
            "verification_report": verif_report.model_dump(),
            "final_status": "VERIFIED_RECOMMENDATION" if verif_report.status == "VERIFIED" else "VERIFICATION_FAILED",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        self.repo.save_trip_state(updated_state)

        return {
            "success": True,
            "session_id": session_id,
            "updated_itinerary": new_itin.model_dump(),
            "verification_report": verif_report.model_dump(),
            "message": f"Successfully updated your trip to {cur_flight.airline} and {cur_hotel.name}."
        }

    def get_booking(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.repo.get_booking(session_id)

    def get_trip(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.repo.get_trip(session_id)

    def get_trace(self, session_id: str) -> List[Dict[str, Any]]:
        return self.repo.get_traces(session_id)

    def get_health_status(self) -> Dict[str, Any]:
        retrieval_svc = get_retrieval_service()
        retrieval_ok = retrieval_svc.initialize()
        llm_ready = is_llm_configured()

        return {
            "status": "healthy",
            "backend": "FastAPI",
            "orchestrator": "LangGraph (StateGraph)",
            "database": "SQLite (travel_planner.db)",
            "knowledge_retrieval": {
                "engine": "LlamaIndex",
                "ready": retrieval_ok,
                "documents": ["travel_policies.txt", "hotel_guidelines.txt", "cancellation_rules.txt", "ranking_guidelines.txt"]
            },
            "llm_service": {
                "llm_configured": llm_ready,
                "active_engine": "LLM" if llm_ready else "Deterministic Fallback",
                "demo_mode": not llm_ready
            },
            "agents_registered": [
                "Agent 1: Request Planner",
                "Agent 2: Flight Searcher",
                "Agent 3: Hotel Searcher",
                "Agent 4: Budget Optimizer",
                "Agent 5: Booking Verifier",
                "Agent 6: Booking & Payment Execution Agent"
            ]
        }

_trip_service: Optional[TripService] = None

def get_trip_service() -> TripService:
    global _trip_service
    if _trip_service is None:
        _trip_service = TripService()
    return _trip_service
