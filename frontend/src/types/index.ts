export interface StructuredRequirements {
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  passengers: number;
  hotel_rooms: number;
  max_budget: number;
  currency: string;
  mandatory_constraints: string[];
  preferences: string[];
}

export interface FlightCandidate {
  flight_id: string;
  airline: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  return_flight_id?: string;
  return_departure_time?: string;
  return_arrival_time?: string;
  price_per_passenger: number;
  total_price: number;
  stops: number;
  duration_minutes: number;
  is_direct: boolean;
  available_seats: number;
  availability_status: string;
  data_source: string;
  last_updated: string;
  tier: string;
  inclusion_reason?: string;
}

export interface HotelCandidate {
  hotel_id: string;
  name: string;
  city: string;
  neighbourhood: string;
  is_city_centre: boolean;
  price_per_night: number;
  nights: number;
  room_count: number;
  tax_rate: number;
  taxes_and_fees: number;
  total_price: number;
  available_rooms: number;
  availability_status: string;
  rating: number;
  amenities: string[];
  data_source: string;
  last_updated: string;
  tier: string;
  inclusion_reason?: string;
}

export interface SiteBookingLinks {
  flight_provider_name: string;
  flight_direct_url: string;
  flight_search_url: string;
  flight_google_url: string;
  flight_manage_booking_url: string;
  hotel_provider_name: string;
  hotel_direct_url: string;
  hotel_search_url: string;
  hotel_agoda_url: string;
  hotel_mmt_url: string;
  hotel_google_url: string;
  agent_free_notice: string;
}

export interface ItineraryCandidate {
  itinerary_id: string;
  flight: FlightCandidate;
  hotel: HotelCandidate;
  flight_cost: number;
  hotel_cost: number;
  taxes_and_fees: number;
  total_cost: number;
  budget_remaining: number;
  is_feasible: boolean;
  violated_constraints: string[];
  satisfied_preferences: string[];
  preference_score: number;
  rank?: number;
  selection_reason?: string;
  site_booking_links?: SiteBookingLinks;
}

export interface VerificationReport {
  itinerary_id: string;
  status: 'VERIFIED' | 'REJECTED' | 'NEEDS_RESEARCH';
  checks_passed: string[];
  checks_failed: string[];
  recalculated_total_cost: number;
  cost_discrepancy: number;
  data_freshness_verified: boolean;
  explanation: string;
}

export interface TraceStep {
  step_number: number;
  timestamp: string;
  agent_name: string;
  tool_invoked?: string;
  input_summary: string;
  decision: string;
  output_summary: string;
  execution_type: 'LLM' | 'DETERMINISTIC_FALLBACK' | 'DETERMINISTIC_TOOL' | 'RETRIEVAL';
  success: boolean;
  evidence_sources: string[];
}

export interface PassengerInfo {
  full_name: string;
  age?: number;
  gender?: string;
}

export interface PaymentReceipt {
  transaction_id: string;
  session_id: string;
  amount_paid: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  payment_timestamp: string;
  invoice_number: string;
  flight_amount: number;
  hotel_amount: number;
  taxes_and_fees: number;
  convenience_fee: number;
}

export interface FlightTicket {
  pnr: string;
  eticket_number: string;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  return_pnr?: string;
  return_flight_number?: string;
  return_departure_time?: string;
  return_arrival_time?: string;
  passengers: string[];
  seat_assignments: string[];
  terminal: string;
  gate: string;
  baggage_allowance: string;
  status: string;
  airline_manage_booking_url: string;
}

export interface HotelVoucher {
  confirmation_code: string;
  hotel_name: string;
  city: string;
  neighbourhood: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  room_type: string;
  rooms_count: number;
  guest_names: string[];
  hotel_address: string;
  amenities: string[];
  status: string;
  hotel_portal_url: string;
}

export interface BookingConfirmation {
  booking_id: string;
  session_id: string;
  status: string;
  created_at: string;
  passenger_names: string[];
  contact_email: string;
  contact_phone: string;
  payment_receipt: PaymentReceipt;
  flight_ticket: FlightTicket;
  hotel_voucher: HotelVoucher;
  itinerary: ItineraryCandidate;
  site_booking_links: SiteBookingLinks;
}

export interface AvailableFlightOption {
  flight: FlightCandidate;
  airline_logo_key: string;
  direct_booking_url: string;
  google_flights_url: string;
  price_difference_vs_current: number;
}

export interface AvailableHotelOption {
  hotel: HotelCandidate;
  hotel_logo_key: string;
  direct_booking_url: string;
  google_hotels_url: string;
  agoda_url: string;
  price_difference_vs_current: number;
}

export interface TripOptionsResponse {
  session_id: string;
  current_flight_id?: string;
  current_hotel_id?: string;
  flights: AvailableFlightOption[];
  hotels: AvailableHotelOption[];
}

export interface CustomizeTripRequest {
  flight_id?: string;
  hotel_id?: string;
  notes?: string;
}

export interface PayAndBookRequest {
  passenger_details: PassengerInfo[];
  contact_email: string;
  contact_phone: string;
  payment_method: 'CARD' | 'UPI' | 'NET_BANKING' | 'INSTANT_SANDBOX';
  card_number?: string;
  card_expiry?: string;
  card_cvv?: string;
  cardholder_name?: string;
  upi_id?: string;
  bank_name?: string;
  user_notes?: string;
}

export interface TripPlanResponse {
  session_id: string;
  status: string;
  structured_requirements?: StructuredRequirements;
  clarification_required: boolean;
  clarification_questions: string[];
  recommended_itinerary?: ItineraryCandidate;
  verification_report?: VerificationReport;
  alternative_itineraries: ItineraryCandidate[];
  rejected_combinations_count: number;
  retry_count: number;
  execution_step_count: number;
  user_approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  failure_explanation?: string;
  nearest_alternatives: any[];
  booking_confirmation?: BookingConfirmation;
}
