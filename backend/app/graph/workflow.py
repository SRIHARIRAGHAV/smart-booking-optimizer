from datetime import datetime, timezone
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.graph.state import TravelPlanningState
from app.agents.request_planner import request_planner_node
from app.agents.flight_searcher import flight_searcher_node
from app.agents.hotel_searcher import hotel_searcher_node
from app.agents.budget_optimizer import budget_optimizer_node
from app.agents.booking_verifier import booking_verifier_node
from app.models.schemas import TraceStep

def recovery_dispatcher_node(state: TravelPlanningState) -> Dict[str, Any]:
    """
    Manages bounded recovery retry counters and logs state transition.
    """
    retry_count = state.get("retry_count", 0) + 1
    step_num = state.get("execution_step_count", 0) + 1
    trace = list(state.get("execution_trace", []))
    strategy = state.get("search_strategy") or {}
    max_retries = state.get("max_retries", 3)

    trace.append(TraceStep(
        step_number=step_num,
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent_name="LangGraph Orchestrator",
        tool_invoked="recovery_loop_transition",
        input_summary=f"Recovery triggered for target: {strategy.get('search_target', 'BOTH')}",
        decision=f"Advancing retry count to {retry_count}/{max_retries} and executing targeted re-search",
        output_summary=f"Dispatched strategy: {strategy.get('reason', 'Searching alternative inventory')}",
        execution_type="DETERMINISTIC_TOOL",
        success=True,
        evidence_sources=[]
    ).model_dump())

    return {
        "retry_count": retry_count,
        "execution_step_count": step_num,
        "execution_trace": trace
    }

def route_after_planner(state: TravelPlanningState) -> Literal["clarification_exit", "flight_searcher"]:
    if state.get("clarification_required", False):
        return "clarification_exit"
    return "flight_searcher"

def route_after_flight_searcher(state: TravelPlanningState) -> Literal["hotel_searcher", "budget_optimizer"]:
    strategy = state.get("search_strategy") or {}
    target = strategy.get("search_target", "BOTH").upper()
    if target == "FLIGHT":
        return "budget_optimizer"
    return "hotel_searcher"

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
) -> Literal["flight_searcher", "hotel_searcher"]:
    strategy = state.get("search_strategy") or {}
    target = strategy.get("search_target", "BOTH").upper()
    if target == "HOTEL":
        return "hotel_searcher"
    return "flight_searcher"

def create_travel_planning_graph():
    graph = StateGraph(TravelPlanningState)

    # 1. Register Nodes
    graph.add_node("request_planner", request_planner_node)
    graph.add_node("flight_searcher", flight_searcher_node)
    graph.add_node("hotel_searcher", hotel_searcher_node)
    graph.add_node("budget_optimizer", budget_optimizer_node)
    graph.add_node("booking_verifier", booking_verifier_node)
    graph.add_node("recovery_dispatcher", recovery_dispatcher_node)

    # 2. Add Edges & Conditional Routing
    graph.add_edge(START, "request_planner")

    graph.add_conditional_edges(
        "request_planner",
        route_after_planner,
        {
            "clarification_exit": END,
            "flight_searcher": "flight_searcher"
        }
    )

    graph.add_conditional_edges(
        "flight_searcher",
        route_after_flight_searcher,
        {
            "hotel_searcher": "hotel_searcher",
            "budget_optimizer": "budget_optimizer"
        }
    )

    graph.add_edge("hotel_searcher", "budget_optimizer")

    graph.add_conditional_edges(
        "budget_optimizer",
        route_after_budget_optimizer,
        {
            "booking_verifier": "booking_verifier",
            "recovery_dispatcher": "recovery_dispatcher",
            "end": END
        }
    )

    graph.add_conditional_edges(
        "recovery_dispatcher",
        route_recovery_target,
        {
            "flight_searcher": "flight_searcher",
            "hotel_searcher": "hotel_searcher"
        }
    )

    graph.add_conditional_edges(
        "booking_verifier",
        route_after_booking_verifier,
        {
            "end": END,
            "recovery_dispatcher": "recovery_dispatcher"
        }
    )

    checkpointer = MemorySaver()
    compiled_app = graph.compile(checkpointer=checkpointer)
    return compiled_app

travel_app = create_travel_planning_graph()
