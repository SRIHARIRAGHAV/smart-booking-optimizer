from typing import List, Tuple, Dict, Any, Optional
from app.models.schemas import (
    StructuredRequirements,
    FlightCandidate,
    HotelCandidate,
    ItineraryCandidate,
    SiteBookingLinks
)
from app.tools.booking_links import build_site_booking_links

def calculate_itinerary_cost(
    flight: FlightCandidate,
    hotel: HotelCandidate
) -> Dict[str, float]:
    """
    Deterministically calculate full itinerary costs.
    No LLM financial arithmetic is used.
    """
    flight_cost = round(flight.total_price, 2)
    hotel_cost = round(hotel.total_price, 2)
    taxes_and_fees = round(hotel.taxes_and_fees, 2)
    total_cost = round(flight_cost + hotel_cost, 2)

    return {
        "flight_cost": flight_cost,
        "hotel_cost": hotel_cost,
        "taxes_and_fees": taxes_and_fees,
        "total_cost": total_cost
    }

def evaluate_constraints(
    flight: FlightCandidate,
    hotel: HotelCandidate,
    reqs: StructuredRequirements
) -> Tuple[bool, List[str]]:
    """
    Evaluate all non-negotiable mandatory constraints.
    Returns (is_feasible, list_of_violations).
    """
    violations: List[str] = []

    # 1. Budget constraint
    costs = calculate_itinerary_cost(flight, hotel)
    if costs["total_cost"] > reqs.max_budget:
        violations.append(
            f"Over budget: total ₹{costs['total_cost']:,.2f} exceeds limit ₹{reqs.max_budget:,.2f} "
            f"(over by ₹{costs['total_cost'] - reqs.max_budget:,.2f})"
        )

    # 2. Return trip constraint
    if "return_trip" in reqs.mandatory_constraints:
        if not flight.return_flight_id:
            violations.append("Missing required return flight leg")

    # 3. Hotel accommodation constraint
    if "hotel_accommodation" in reqs.mandatory_constraints:
        if hotel.available_rooms < reqs.hotel_rooms:
            violations.append(
                f"Insufficient rooms: requires {reqs.hotel_rooms}, hotel only has {hotel.available_rooms}"
            )
        if hotel.availability_status != "AVAILABLE":
            violations.append(f"Hotel is {hotel.availability_status}")

    # 4. Seat capacity check
    if flight.available_seats < reqs.passengers:
        violations.append(
            f"Insufficient flight seats: requires {reqs.passengers}, available {flight.available_seats}"
        )
    if flight.availability_status != "AVAILABLE":
        violations.append(f"Flight is {flight.availability_status}")

    # 5. Direct flight mandatory constraint (if explicitly in mandatory constraints)
    if "direct_flight" in reqs.mandatory_constraints or "direct_flight_only" in reqs.mandatory_constraints:
        if not flight.is_direct:
            violations.append("Flight is not direct, violating mandatory direct flight constraint")

    # 6. City centre mandatory constraint (if explicitly in mandatory constraints)
    if "city_centre_hotel" in reqs.mandatory_constraints or "city_centre_only" in reqs.mandatory_constraints:
        if not hotel.is_city_centre:
            violations.append("Hotel is not located in city centre, violating mandatory location constraint")

    # 7. Check non-positive pricing or corrupted values
    if flight.price_per_passenger <= 0 or hotel.price_per_night <= 0:
        violations.append("Corrupted price data detected in candidates")

    is_feasible = (len(violations) == 0)
    return is_feasible, violations

def score_preferences(
    flight: FlightCandidate,
    hotel: HotelCandidate,
    reqs: StructuredRequirements
) -> Tuple[float, List[str]]:
    """
    Deterministically score flexible user preferences for valid candidates.
    A high preference score NEVER overrides a hard-constraint failure.
    """
    satisfied: List[str] = []
    score: float = 0.0

    prefs = [p.lower().strip() for p in reqs.preferences]

    # Preference: direct_flight
    if "direct_flight" in prefs or "direct" in prefs:
        if flight.is_direct:
            score += 30.0
            satisfied.append("Direct flight preference met (+30)")

    # Preference: city_centre_hotel
    if "city_centre_hotel" in prefs or "city_centre" in prefs or "central" in prefs:
        if hotel.is_city_centre:
            score += 25.0
            satisfied.append("City centre hotel location preference met (+25)")

    # Preference: high rating
    if "high_rating" in prefs or "good_hotel" in prefs or "rating_above_4" in prefs:
        if hotel.rating >= 4.2:
            score += 20.0
            satisfied.append(f"Hotel rating {hotel.rating} exceeds 4.2 preference (+20)")
        elif hotel.rating >= 4.0:
            score += 10.0
            satisfied.append(f"Hotel rating {hotel.rating} meets 4.0 threshold (+10)")

    # Preference: morning departure
    if "morning_departure" in prefs or "morning_flight" in prefs:
        try:
            hour = int(flight.departure_time.split("T")[1].split(":")[0])
            if 6 <= hour <= 11:
                score += 15.0
                satisfied.append("Morning flight departure preference met (+15)")
        except Exception:
            pass

    # Budget savings bonus (max 10 points for cost-efficiency within budget)
    costs = calculate_itinerary_cost(flight, hotel)
    if costs["total_cost"] <= reqs.max_budget:
        savings_ratio = (reqs.max_budget - costs["total_cost"]) / reqs.max_budget
        bonus = round(savings_ratio * 10.0, 1)
        score += bonus
        satisfied.append(f"Budget efficiency bonus (+{bonus})")

    return round(score, 2), satisfied

def generate_candidate_combinations(
    flights: List[FlightCandidate],
    hotels: List[HotelCandidate],
    reqs: StructuredRequirements
) -> List[ItineraryCandidate]:
    """
    Exhaustively evaluate all candidate flight-hotel combinations.
    """
    combinations: List[ItineraryCandidate] = []
    counter = 1

    for f in flights:
        for h in hotels:
            costs = calculate_itinerary_cost(f, h)
            is_feasible, violations = evaluate_constraints(f, h, reqs)
            score, satisfied = score_preferences(f, h, reqs)

            budget_remaining = round(reqs.max_budget - costs["total_cost"], 2)

            links = build_site_booking_links(f, h, reqs)
            itin = ItineraryCandidate(
                itinerary_id=f"ITIN-{counter:03d}",
                flight=f,
                hotel=h,
                flight_cost=costs["flight_cost"],
                hotel_cost=costs["hotel_cost"],
                taxes_and_fees=costs["taxes_and_fees"],
                total_cost=costs["total_cost"],
                budget_remaining=budget_remaining,
                is_feasible=is_feasible,
                violated_constraints=violations,
                satisfied_preferences=satisfied,
                preference_score=score,
                selection_reason=None,
                site_booking_links=SiteBookingLinks(**links)
            )
            combinations.append(itin)
            counter += 1

    return combinations

def rank_itineraries(combinations: List[ItineraryCandidate]) -> List[ItineraryCandidate]:
    """
    Rank feasible itineraries first (by preference_score descending, then total_cost ascending).
    Infeasible itineraries follow, sorted by closeness to budget.
    """
    feasible = [c for c in combinations if c.is_feasible]
    infeasible = [c for c in combinations if not c.is_feasible]

    feasible.sort(key=lambda x: (-x.preference_score, x.total_cost))
    infeasible.sort(key=lambda x: x.total_cost)

    ranked: List[ItineraryCandidate] = []
    rank = 1
    for item in feasible:
        item.rank = rank
        item.selection_reason = f"Rank {rank}: Score {item.preference_score}, cost ₹{item.total_cost:,.2f}"
        ranked.append(item)
        rank += 1

    for item in infeasible:
        item.rank = rank
        item.selection_reason = f"Infeasible (Rank {rank}): {'; '.join(item.violated_constraints)}"
        ranked.append(item)
        rank += 1

    return ranked

def select_recovery_search_strategy(
    rejected_combinations: List[ItineraryCandidate],
    reqs: StructuredRequirements,
    retry_count: int
) -> Dict[str, Any]:
    """
    Analyze why candidate combinations failed and select targeted recovery action.
    Returns strategy instructions:
      - search_target: 'FLIGHT', 'HOTEL', or 'BOTH'
      - search_tier: 'budget' or 'standard'
      - relax_preferences: bool
      - target_budget_flight: float
      - target_budget_hotel: float
      - reason: str
    """
    if not rejected_combinations:
        return {
            "search_target": "BOTH",
            "search_tier": "budget",
            "relax_preferences": False,
            "target_budget_flight": reqs.max_budget * 0.5,
            "target_budget_hotel": reqs.max_budget * 0.5,
            "reason": "Initial search produced no combinations; querying broader budget inventory."
        }

    # Find the combination that was closest to budget
    closest = min(rejected_combinations, key=lambda c: c.total_cost)
    cost_diff = closest.total_cost - reqs.max_budget

    flight_share = closest.flight_cost / closest.total_cost if closest.total_cost > 0 else 0.5
    hotel_share = closest.hotel_cost / closest.total_cost if closest.total_cost > 0 else 0.5

    # Target the disproportionately expensive component
    if retry_count == 0:
        if flight_share >= 0.55:
            target = "FLIGHT"
            reason = f"Flight costs account for {flight_share*100:.0f}% of total cost (exceeding budget by ₹{cost_diff:,.2f}). Querying lower-tier flights."
        elif hotel_share >= 0.55:
            target = "HOTEL"
            reason = f"Hotel costs account for {hotel_share*100:.0f}% of total cost (exceeding budget by ₹{cost_diff:,.2f}). Querying lower-tier hotels."
        else:
            target = "BOTH"
            reason = f"Both flight and hotel components exceed target allocation. Querying budget tier for both."
        search_tier = "budget"
        relax_pref = False
    elif retry_count == 1:
        target = "BOTH"
        search_tier = "budget"
        relax_pref = False
        reason = f"Second recovery attempt: querying all available budget-tier flights and accommodations."
    else:
        target = "BOTH"
        search_tier = "budget"
        relax_pref = True
        reason = f"Final recovery attempt: widening search parameters across entire non-luxury inventory."

    # Compute target budgets
    target_flight = round(reqs.max_budget * 0.5, 2)
    target_hotel = round(reqs.max_budget * 0.5, 2)

    return {
        "search_target": target,
        "search_tier": search_tier,
        "relax_preferences": relax_pref,
        "target_budget_flight": target_flight,
        "target_budget_hotel": target_hotel,
        "reason": reason
    }

