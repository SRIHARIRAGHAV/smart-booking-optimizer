import os
import re
from datetime import datetime
from typing import Tuple, List, Optional, Dict, Any
from app.models.schemas import StructuredRequirements, ItineraryCandidate, VerificationReport
from app.prompts.prompts import (
    REQUEST_PLANNER_SYSTEM_PROMPT,
    TRADE_OFF_EXPLANATION_PROMPT,
    VERIFIED_RECOMMENDATION_SUMMARY_PROMPT
)

def is_llm_configured() -> bool:
    return bool(
        os.getenv("GEMINI_API_KEY") or
        os.getenv("GOOGLE_API_KEY") or
        os.getenv("OPENAI_API_KEY")
    )

def _parse_month_to_num(m_str: str) -> str:
    months = {
        "jan": "01", "january": "01",
        "feb": "02", "february": "02",
        "mar": "03", "march": "03",
        "apr": "04", "april": "04",
        "may": "05",
        "jun": "06", "june": "06",
        "jul": "07", "july": "07",
        "aug": "08", "august": "08",
        "sep": "09", "september": "09",
        "oct": "10", "october": "10",
        "nov": "11", "november": "11",
        "dec": "12", "december": "12"
    }
    return months.get(m_str.lower()[:3], "11")

def _word_to_num(w: str) -> int:
    num_map = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
    }
    return num_map.get(w.lower(), 1)

def extract_requirements_deterministic(text: str) -> Tuple[Optional[StructuredRequirements], bool, List[str]]:
    text_lower = text.lower()
    clarification_questions = []

    # 1. Origin
    origin = None
    orig_key_match = re.search(r'(?:origin|from)\s*[:=]?\s*([A-Za-z]+)', text, re.IGNORECASE)
    if orig_key_match and orig_key_match.group(1).lower() not in ["a", "the", "dates", "trip"]:
        origin = orig_key_match.group(1).strip().capitalize()
    
    # 2. Destination
    destination = None
    dest_key_match = re.search(r'(?:destination|dest|to)\s*[:=]?\s*([A-Za-z]+)', text, re.IGNORECASE)
    if dest_key_match and dest_key_match.group(1).lower() not in ["a", "the", "dates", "trip"] or dest_key_match:
        for city in ["Bengaluru", "Chennai", "Delhi", "Mumbai", "Goa", "Hyderabad", "Kolkata"]:
            if city.lower() in text_lower:
                if not origin or origin.lower() != city.lower():
                    destination = city
                    break

    if not origin or not destination:
        route_match = re.search(r'(?:from\s+)?([A-Za-z]+)\s+to\s+([A-Za-z]+)', text, re.IGNORECASE)
        if route_match:
            cand_orig = route_match.group(1).strip().capitalize()
            cand_dest = route_match.group(2).strip().capitalize()
            if cand_orig.lower() not in ["trip", "plan"]:
                origin = origin or cand_orig
                destination = destination or cand_dest

    if not origin:
        clarification_questions.append("What is your departure origin city?")
    if not destination:
        clarification_questions.append("What is your travel destination city?")

    # 3. Dates
    dep_date = None
    ret_date = None

    date_range_match = re.search(
        r'(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?\s+(?:to|until|-)\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})',
        text,
        re.IGNORECASE
    )
    iso_date_match = re.search(
        r'(\d{4}-\d{2}-\d{2})\s+(?:to|until|-)\s+(\d{4}-\d{2}-\d{2})',
        text
    )

    if iso_date_match:
        dep_date = iso_date_match.group(1)
        ret_date = iso_date_match.group(2)
    elif date_range_match:
        d1, m1, y1, d2, m2, y2 = date_range_match.groups()
        year = y2 or y1 or "2026"
        month1 = _parse_month_to_num(m1)
        month2 = _parse_month_to_num(m2)
        dep_date = f"{year}-{month1}-{int(d1):02d}"
        ret_date = f"{year}-{month2}-{int(d2):02d}"
    else:
        single_isos = re.findall(r'\d{4}-\d{2}-\d{2}', text)
        if len(single_isos) >= 2:
            dep_date = single_isos[0]
            ret_date = single_isos[1]
        else:
            clarification_questions.append("Please specify your departure and return travel dates (e.g. YYYY-MM-DD or '10 November to 12 November 2026').")

    # 4. Passenger count
    pax = 1
    pax_match = re.search(r'(?:passengers|pax|people|persons|adults)\s*[:=]?\s*(\d+|one|two|three|four|five|six)', text, re.IGNORECASE)
    if not pax_match:
        pax_match = re.search(r'(\d+|one|two|three|four|five|six)\s+(?:people|passengers|pax|persons|adults)', text, re.IGNORECASE)
    if pax_match:
        val = pax_match.group(1)
        pax = int(val) if val.isdigit() else _word_to_num(val)

    # 5. Rooms count
    rooms = 1
    room_match = re.search(r'(?:rooms|room)\s*[:=]?\s*(\d+|one|two|three)', text, re.IGNORECASE)
    if not room_match:
        room_match = re.search(r'(\d+|one|two|three)\s+(?:hotel\s+)?rooms?', text, re.IGNORECASE)
    if room_match:
        val = room_match.group(1)
        rooms = int(val) if val.isdigit() else _word_to_num(val)

    # 6. Budget
    budget = None
    # 6a. Match "budget: 20000" or "budget of 20000" or "budget below 20000" or "budget 20000"
    b_match = re.search(r'(?:budget|maximum budget|total budget|budget limit)\s*(?:of|is|below|under|:)?\s*(?:[₹\?]|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)', text, re.IGNORECASE)
    if b_match:
        try:
            budget = float(b_match.group(1).replace(",", ""))
        except ValueError:
            budget = None

    # 6b. Match "₹20,000" or "?20,000" (if terminal encoding) or "20000 INR" or "Rs. 20000"
    if not budget:
        sym_match = re.search(r'(?:[₹\?]|rs\.?)\s*(\d[\d,]*(?:\.\d+)?)', text, re.IGNORECASE)
        if sym_match:
            try:
                budget = float(sym_match.group(1).replace(",", ""))
            except ValueError:
                budget = None

    if not budget:
        inr_suffix_match = re.search(r'(\d[\d,]*(?:\.\d+)?)\s*(?:inr|rs\.?|rupees)', text, re.IGNORECASE)
        if inr_suffix_match:
            try:
                budget = float(inr_suffix_match.group(1).replace(",", ""))
            except ValueError:
                budget = None

    if not budget:
        num_match = re.search(r'(?:below|under|maximum)\s*(?:[₹\?]|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)', text, re.IGNORECASE)
        if num_match:
            try:
                budget = float(num_match.group(1).replace(",", ""))
            except ValueError:
                budget = None

    if not budget or budget <= 0:
        clarification_questions.append("What is your maximum total budget for this trip?")

    # 7. Constraints and Preferences
    mandatory = ["return_trip", "hotel_accommodation", "stay_within_budget"]
    preferences = []

    if "direct flight" in text_lower or "non-stop" in text_lower or "prefer direct" in text_lower:
        if "must be direct" in text_lower or "only direct" in text_lower or "strictly direct" in text_lower:
            mandatory.append("direct_flight_only")
        else:
            preferences.append("direct_flight")

    if "city centre" in text_lower or "city center" in text_lower or "central hotel" in text_lower or "near the city centre" in text_lower:
        preferences.append("city_centre_hotel")

    if "high rating" in text_lower or "good hotel" in text_lower or "4 star" in text_lower or "top rated" in text_lower:
        preferences.append("rating_above_4")

    if "morning" in text_lower:
        preferences.append("morning_departure")

    if clarification_questions:
        return None, True, clarification_questions

    # Validate date ordering
    try:
        dt1 = datetime.strptime(dep_date, "%Y-%m-%d")
        dt2 = datetime.strptime(ret_date, "%Y-%m-%d")
        if dt2 <= dt1:
            return None, True, ["Return date must be strictly after departure date."]
    except Exception:
        return None, True, ["Invalid date format encountered."]

    reqs = StructuredRequirements(
        origin=origin,
        destination=destination,
        departure_date=dep_date,
        return_date=ret_date,
        passengers=pax,
        hotel_rooms=rooms,
        max_budget=budget,
        currency="INR",
        mandatory_constraints=mandatory,
        preferences=preferences
    )
    return reqs, False, []

class LLMService:
    def __init__(self):
        self.is_configured = is_llm_configured()

    def parse_travel_request(
        self,
        user_request: str
    ) -> Tuple[Optional[StructuredRequirements], bool, List[str], str]:
        reqs, clarification_required, questions = extract_requirements_deterministic(user_request)
        return reqs, clarification_required, questions, "DETERMINISTIC_FALLBACK"

    def explain_tradeoffs(
        self,
        itinerary: ItineraryCandidate,
        reqs: StructuredRequirements
    ) -> Tuple[str, str]:
        lines = []
        lines.append(f"Selected {itinerary.flight.airline} ({itinerary.flight.flight_id}) and {itinerary.hotel.name} ({itinerary.hotel.hotel_id}).")
        lines.append(f"Total calculated cost is ₹{itinerary.total_cost:,.2f}, leaving ₹{itinerary.budget_remaining:,.2f} surplus under the ₹{reqs.max_budget:,.2f} budget ceiling.")
        
        if itinerary.satisfied_preferences:
            lines.append("Satisfied user preferences: " + ", ".join(itinerary.satisfied_preferences) + ".")

        unmet = [p for p in reqs.preferences if not any(p in sp.lower() for sp in itinerary.satisfied_preferences)]
        if unmet:
            lines.append("Unmet preferences: " + ", ".join(unmet) + ".")
        else:
            lines.append("All requested preferences were successfully satisfied.")

        explanation = " ".join(lines)
        return explanation, "DETERMINISTIC_FALLBACK"

    def summarize_verified_itinerary(
        self,
        itinerary: ItineraryCandidate,
        report: VerificationReport,
        reqs: StructuredRequirements
    ) -> Tuple[str, str]:
        summary = (
            f"RECOMMENDED ITINERARY ({itinerary.itinerary_id}): Verified feasible return trip from {reqs.origin} to {reqs.destination} "
            f"({reqs.departure_date} to {reqs.return_date}) for {reqs.passengers} passenger(s) and {reqs.hotel_rooms} room(s). "
            f"Flight: {itinerary.flight.airline} (₹{itinerary.flight_cost:,.2f}). "
            f"Hotel: {itinerary.hotel.name} in {itinerary.hotel.neighbourhood} (₹{itinerary.hotel_cost:,.2f} incl. taxes). "
            f"Total Trip Cost: ₹{itinerary.total_cost:,.2f} (Budget: ₹{reqs.max_budget:,.2f}, Savings: ₹{itinerary.budget_remaining:,.2f}). "
            f"Verification: {report.status} ({len(report.checks_passed)} checks passed). "
            f"Note: This is an autonomous recommendation and simulated plan. No booking transaction has occurred."
        )
        return summary, "DETERMINISTIC_FALLBACK"

_llm_service: Optional[LLMService] = None

def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
