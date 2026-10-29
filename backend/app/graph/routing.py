from typing import Literal
from app.graph.state import TravelPlanningState

def route_after_planner(state: TravelPlanningState) -> Literal["clarification_exit", "flight_searcher"]:
    if state.get("clarification_required", False):
        return "clarification_exit"
    return "flight_searcher"

def route_after_budget_optimizer(
    state: TravelPlanningState
) -> Literal["booking_verifier", "recovery_dispatcher", "end"]:
    status = state.get("final_status")
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)

    if status == "FEASIBLE_FOUND":
        return "booking_verifier"
    elif status == "FAILED_RETRY_EXHAUSTED" or retry_count >= max_retries:
        return "end"
    elif status == "INFEASIBLE_ATTEMPT":
        return "recovery_dispatcher"

    return "end"

def route_after_booking_verifier(
    state: TravelPlanningState
) -> Literal["end", "recovery_dispatcher"]:
    status = state.get("final_status")
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)

    if status == "VERIFIED_RECOMMENDATION":
        return "end"
    elif status == "VERIFICATION_FAILED":
        if retry_count < max_retries:
            return "recovery_dispatcher"
        return "end"

    return "end"

def route_recovery_target(
    state: TravelPlanningState
) -> Literal["flight_searcher", "hotel_searcher", "flight_and_hotel"]:
    strategy = state.get("search_strategy") or {}
    target = strategy.get("search_target", "BOTH").upper()
    if target == "FLIGHT":
        return "flight_searcher"
    elif target == "HOTEL":
        return "hotel_searcher"
    return "flight_and_hotel"

