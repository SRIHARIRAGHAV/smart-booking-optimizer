from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class StructuredRequirements(BaseModel):
    origin: str = Field(..., description="Departure city or airport code")
    destination: str = Field(..., description="Destination city or airport code")
    departure_date: str = Field(..., description="Departure date (YYYY-MM-DD)")
    return_date: str = Field(..., description="Return date (YYYY-MM-DD)")
    passengers: int = Field(default=1, ge=1, description="Number of passengers")
    hotel_rooms: int = Field(default=1, ge=1, description="Number of hotel rooms")
    max_budget: float = Field(..., gt=0, description="Maximum total budget")
    currency: str = Field(default="INR", description="Currency symbol/code")
    mandatory_constraints: List[str] = Field(
        default_factory=lambda: ["return_trip", "hotel_accommodation", "stay_within_budget"],
        description="Non-negotiable constraints"
    )
    preferences: List[str] = Field(
        default_factory=list,
        description="Flexible user preferences (e.g. direct_flight, city_centre_hotel)"
    )

class FlightCandidate(BaseModel):
    flight_id: str
    airline: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    return_flight_id: Optional[str] = None
    return_departure_time: Optional[str] = None
    return_arrival_time: Optional[str] = None
    price_per_passenger: float
    total_price: float
    stops: int = 0
    duration_minutes: int
    is_direct: bool = True
    available_seats: int
    availability_status: str = "AVAILABLE"  # AVAILABLE, SOLD_OUT
    data_source: str = "MOCK_INVENTORY"
    last_updated: str = "2026-10-29T10:00:00Z"
    tier: str = "standard"  # budget, standard, premium
    inclusion_reason: Optional[str] = None

class HotelCandidate(BaseModel):
    hotel_id: str
    name: str
    city: str
    neighbourhood: str
    is_city_centre: bool = True
    price_per_night: float
    nights: int
    room_count: int
    tax_rate: float = 0.12
    taxes_and_fees: float
    total_price: float
    available_rooms: int
    availability_status: str = "AVAILABLE"  # AVAILABLE, SOLD_OUT
    rating: float = 4.0
    amenities: List[str] = Field(default_factory=list)
    data_source: str = "MOCK_HOTEL_GDS"
    last_updated: str = "2026-10-29T10:00:00Z"
    tier: str = "standard"  # budget, standard, premium
    inclusion_reason: Optional[str] = None

class SiteBookingLinks(BaseModel):
    flight_provider_name: str
    flight_direct_url: str
    flight_search_url: str
    flight_google_url: str
    flight_manage_booking_url: str
    hotel_provider_name: str
    hotel_direct_url: str
    hotel_search_url: str
    hotel_agoda_url: str
    hotel_mmt_url: str
    hotel_google_url: str
    agent_free_notice: str = "Agent-Free Booking: You can book directly with the airline and hotel on their official websites with zero platform or intermediary commissions."

class ItineraryCandidate(BaseModel):
    itinerary_id: str
    flight: FlightCandidate
    hotel: HotelCandidate
    flight_cost: float
    hotel_cost: float
    taxes_and_fees: float
    total_cost: float
    budget_remaining: float
    is_feasible: bool = True
    violated_constraints: List[str] = Field(default_factory=list)
    satisfied_preferences: List[str] = Field(default_factory=list)
    preference_score: float = 0.0
    rank: Optional[int] = None
    selection_reason: Optional[str] = None
    site_booking_links: Optional[SiteBookingLinks] = None

class VerificationReport(BaseModel):
    itinerary_id: str
    status: str = "VERIFIED"  # VERIFIED, REJECTED, NEEDS_RESEARCH
    checks_passed: List[str] = Field(default_factory=list)
    checks_failed: List[str] = Field(default_factory=list)
    recalculated_total_cost: float
    cost_discrepancy: float = 0.0
    data_freshness_verified: bool = True
    explanation: str

class TraceStep(BaseModel):
    step_number: int
    timestamp: str
    agent_name: str
    tool_invoked: Optional[str] = None
    input_summary: str
    decision: str
    output_summary: str
    execution_type: str = "DETERMINISTIC_TOOL"  # LLM, DETERMINISTIC_FALLBACK, DETERMINISTIC_TOOL, RETRIEVAL
    success: bool = True
    evidence_sources: List[str] = Field(default_factory=list)

class PassengerInfo(BaseModel):
    full_name: str
    age: Optional[int] = 28
    gender: Optional[str] = "Adult"

class PaymentReceipt(BaseModel):
    transaction_id: str
    session_id: str
    amount_paid: float
    currency: str = "INR"
    payment_method: str  # CARD, UPI, NET_BANKING, INSTANT_SANDBOX
    payment_status: str = "SUCCESS"  # SUCCESS, FAILED
    payment_timestamp: str
    invoice_number: str
    flight_amount: float
    hotel_amount: float
    taxes_and_fees: float
    convenience_fee: float = 0.0  # ₹0 for Agents-Free booking

class FlightTicket(BaseModel):
    pnr: str
    eticket_number: str
    airline: str
    flight_number: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    return_pnr: Optional[str] = None
    return_flight_number: Optional[str] = None
    return_departure_time: Optional[str] = None
    return_arrival_time: Optional[str] = None
    passengers: List[str]
    seat_assignments: List[str]
    terminal: str = "Terminal 1"
    gate: str = "Gate 4B"
    baggage_allowance: str = "15 kg Check-in, 7 kg Cabin per passenger"
    status: str = "CONFIRMED"
    airline_manage_booking_url: str

class HotelVoucher(BaseModel):
    confirmation_code: str
    hotel_name: str
    city: str
    neighbourhood: str
    check_in_date: str
    check_out_date: str
    check_in_time: str = "14:00 (2:00 PM)"
    check_out_time: str = "11:00 (11:00 AM)"
    room_type: str = "Deluxe Room (City View)"
    rooms_count: int = 1
    guest_names: List[str]
    hotel_address: str
    amenities: List[str] = Field(default_factory=list)
    status: str = "CONFIRMED"
    hotel_portal_url: str

class BookingConfirmation(BaseModel):
    booking_id: str
    session_id: str
    status: str = "CONFIRMED"
    created_at: str
    passenger_names: List[str]
    contact_email: str
    contact_phone: str
    payment_receipt: PaymentReceipt
    flight_ticket: FlightTicket
    hotel_voucher: HotelVoucher
    itinerary: ItineraryCandidate
    site_booking_links: SiteBookingLinks

class PayAndBookRequest(BaseModel):
    passenger_details: List[PassengerInfo] = Field(
        default_factory=lambda: [PassengerInfo(full_name="Primary Passenger")]
    )
    contact_email: str = "traveler@example.com"
    contact_phone: str = "+91 9876543210"
    payment_method: str = "INSTANT_SANDBOX"  # CARD, UPI, NET_BANKING, INSTANT_SANDBOX
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvv: Optional[str] = None
    cardholder_name: Optional[str] = None
    upi_id: Optional[str] = None
    bank_name: Optional[str] = None
    user_notes: Optional[str] = None

class TripPlanRequest(BaseModel):
    user_request: Optional[str] = None
    structured_requirements: Optional[StructuredRequirements] = None

class ClarificationSubmitRequest(BaseModel):
    clarification_answers: Dict[str, Any]

class ApprovalSubmitRequest(BaseModel):
    approved: bool = True
    user_notes: Optional[str] = None

class CustomizeTripRequest(BaseModel):
    flight_id: Optional[str] = None
    hotel_id: Optional[str] = None
    notes: Optional[str] = None

class AvailableFlightOption(BaseModel):
    flight: FlightCandidate
    airline_logo_key: str
    direct_booking_url: str
    google_flights_url: str
    price_difference_vs_current: float = 0.0

class AvailableHotelOption(BaseModel):
    hotel: HotelCandidate
    hotel_logo_key: str
    direct_booking_url: str
    google_hotels_url: str
    agoda_url: str
    price_difference_vs_current: float = 0.0

class TripOptionsResponse(BaseModel):
    session_id: str
    current_flight_id: Optional[str] = None
    current_hotel_id: Optional[str] = None
    flights: List[AvailableFlightOption]
    hotels: List[AvailableHotelOption]

class TripPlanResponse(BaseModel):
    session_id: str
    status: str  # PLANNING, CLARIFICATION_REQUIRED, FEASIBLE_FOUND, VERIFIED_RECOMMENDATION, FAILED_RETRY_EXHAUSTED, FAILED_INFEASIBLE, APPROVED, BOOKED_AND_CONFIRMED
    structured_requirements: Optional[StructuredRequirements] = None
    clarification_required: bool = False
    clarification_questions: List[str] = Field(default_factory=list)
    recommended_itinerary: Optional[ItineraryCandidate] = None
    verification_report: Optional[VerificationReport] = None
    alternative_itineraries: List[ItineraryCandidate] = Field(default_factory=list)
    rejected_combinations_count: int = 0
    retry_count: int = 0
    execution_step_count: int = 0
    user_approval_status: str = "PENDING"  # PENDING, APPROVED, REJECTED
    failure_explanation: Optional[str] = None
    nearest_alternatives: List[Dict[str, Any]] = Field(default_factory=list)
    booking_confirmation: Optional[BookingConfirmation] = None
