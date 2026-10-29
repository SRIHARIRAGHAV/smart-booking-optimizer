from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Path
from app.models.schemas import (
    TripPlanRequest,
    TripPlanResponse,
    ClarificationSubmitRequest,
    ApprovalSubmitRequest,
    PayAndBookRequest,
    BookingConfirmation,
    CustomizeTripRequest,
    TripOptionsResponse,
    TraceStep
)
from app.services.trip_service import get_trip_service

router = APIRouter(prefix="/api", tags=["Trips"])

@router.get("/health")
def health_check() -> Dict[str, Any]:
    svc = get_trip_service()
    return svc.get_health_status()

@router.post("/trips/plan", response_model=TripPlanResponse)
def plan_trip(request: TripPlanRequest) -> TripPlanResponse:
    if not request.user_request and not request.structured_requirements:
        raise HTTPException(
            status_code=400,
            detail="Either 'user_request' (natural language) or 'structured_requirements' must be provided."
        )

    svc = get_trip_service()
    struct_dict = request.structured_requirements.model_dump() if request.structured_requirements else None
    state = svc.plan_trip(
        user_request=request.user_request,
        structured_requirements=struct_dict
    )

    return TripPlanResponse(
        session_id=state["session_id"],
        status=state.get("final_status", "PLANNING"),
        structured_requirements=state.get("structured_requirements"),
        clarification_required=state.get("clarification_required", False),
        clarification_questions=state.get("clarification_questions", []),
        recommended_itinerary=state.get("current_itinerary"),
        verification_report=state.get("verification_report"),
        alternative_itineraries=state.get("nearest_alternatives", []),
        rejected_combinations_count=len(state.get("rejected_combinations", [])),
        retry_count=state.get("retry_count", 0),
        execution_step_count=state.get("execution_step_count", 0),
        user_approval_status=state.get("user_approval_status", "PENDING"),
        failure_explanation=state.get("failure_explanation"),
        nearest_alternatives=state.get("nearest_alternatives", []),
        booking_confirmation=None
    )

@router.get("/trips/{trip_id}", response_model=TripPlanResponse)
def get_trip(trip_id: str = Path(..., description="The trip session ID")) -> TripPlanResponse:
    svc = get_trip_service()
    trip = svc.get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip with ID {trip_id} was not found.")

    return TripPlanResponse(
        session_id=trip["session_id"],
        status=trip.get("status", "PLANNING"),
        structured_requirements=trip.get("structured_requirements"),
        clarification_required=len(trip.get("clarification_questions", [])) > 0,
        clarification_questions=trip.get("clarification_questions", []),
        recommended_itinerary=trip.get("recommended_itinerary"),
        verification_report=trip.get("verification_report"),
        alternative_itineraries=trip.get("nearest_alternatives", []),
        retry_count=trip.get("retry_count", 0),
        execution_step_count=trip.get("execution_step_count", 0),
        user_approval_status=trip.get("user_approval_status", "PENDING"),
        failure_explanation=trip.get("failure_explanation"),
        nearest_alternatives=trip.get("nearest_alternatives", []),
        booking_confirmation=trip.get("booking_confirmation")
    )

@router.get("/trips/{trip_id}/trace", response_model=List[TraceStep])
def get_trip_trace(trip_id: str = Path(..., description="The trip session ID")) -> List[TraceStep]:
    svc = get_trip_service()
    traces = svc.get_trace(trip_id)
    if not traces:
        # Check if trip exists
        trip = svc.get_trip(trip_id)
        if not trip:
            raise HTTPException(status_code=404, detail=f"Trip with ID {trip_id} was not found.")
        return []
    return [TraceStep(**t) for t in traces]

@router.post("/trips/{trip_id}/clarification", response_model=TripPlanResponse)
def submit_clarification(
    trip_id: str,
    req: ClarificationSubmitRequest
) -> TripPlanResponse:
    svc = get_trip_service()
    updated_state = svc.submit_clarification(trip_id, req.clarification_answers)
    if not updated_state:
        raise HTTPException(status_code=404, detail=f"Trip with ID {trip_id} was not found.")

    return TripPlanResponse(
        session_id=updated_state["session_id"],
        status=updated_state.get("final_status", "PLANNING"),
        structured_requirements=updated_state.get("structured_requirements"),
        clarification_required=updated_state.get("clarification_required", False),
        clarification_questions=updated_state.get("clarification_questions", []),
        recommended_itinerary=updated_state.get("current_itinerary"),
        verification_report=updated_state.get("verification_report"),
        alternative_itineraries=updated_state.get("nearest_alternatives", []),
        rejected_combinations_count=len(updated_state.get("rejected_combinations", [])),
        retry_count=updated_state.get("retry_count", 0),
        execution_step_count=updated_state.get("execution_step_count", 0),
        user_approval_status=updated_state.get("user_approval_status", "PENDING"),
        failure_explanation=updated_state.get("failure_explanation"),
        nearest_alternatives=updated_state.get("nearest_alternatives", []),
        booking_confirmation=None
    )

@router.post("/trips/{trip_id}/approval")
def submit_approval(
    trip_id: str,
    req: ApprovalSubmitRequest
) -> Dict[str, Any]:
    svc = get_trip_service()
    result = svc.submit_approval(trip_id, req.approved, req.user_notes)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Approval failed."))
    return result

@router.post("/trips/{trip_id}/pay-and-book")
def pay_and_book(
    trip_id: str,
    req: PayAndBookRequest
) -> Dict[str, Any]:
    """
    Process payment and execute ticket booking (Agent 6).
    Produces authentic flight PNR, E-Ticket, hotel confirmation, and payment receipt.
    """
    svc = get_trip_service()
    result = svc.pay_and_book_trip(trip_id, req)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Booking failed."))
    return result

@router.get("/trips/{trip_id}/booking")
def get_booking(trip_id: str) -> Dict[str, Any]:
    """
    Retrieve confirmed booking confirmation, e-tickets, and voucher.
    """
    svc = get_trip_service()
    booking = svc.get_booking(trip_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"No confirmed booking found for trip {trip_id}.")
    return booking

@router.get("/trips/{trip_id}/options", response_model=TripOptionsResponse)
def get_trip_options(trip_id: str) -> TripOptionsResponse:
    """
    Retrieve all alternative flight and accommodation options for the trip route
    with direct site booking links and logos so the user can easily swap choices.
    """
    svc = get_trip_service()
    options = svc.get_trip_options(trip_id)
    if not options:
        raise HTTPException(status_code=404, detail=f"No options found for trip {trip_id}.")
    return options

@router.post("/trips/{trip_id}/customize")
def customize_trip(
    trip_id: str,
    req: CustomizeTripRequest
) -> Dict[str, Any]:
    """
    Swap a flight or hotel in the itinerary; recalculates costs, verifies budget constraints,
    updates site booking links, and saves the new plan.
    """
    svc = get_trip_service()
    result = svc.customize_trip(
        session_id=trip_id,
        flight_id=req.flight_id,
        hotel_id=req.hotel_id,
        notes=req.notes
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Customization failed."))
    return result
