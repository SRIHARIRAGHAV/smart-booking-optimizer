from datetime import datetime, timezone
from typing import Dict, Any, List
from app.graph.state import TravelPlanningState
from app.models.schemas import StructuredRequirements, FlightCandidate, TraceStep
from app.tools.flight_tools import search_flights

def flight_searcher_node(state: TravelPlanningState) -> Dict[str, Any]:
    step_num = state.get("execution_step_count", 0) + 1
    trace = list(state.get("execution_trace", []))
    errors = list(state.get("error_records", []))
    existing_candidates = list(state.get("flight_candidates", []))

    raw_reqs = state.get("structured_requirements")
    if not raw_reqs:
        errors.append("Flight searcher invoked without structured requirements.")
        return {"error_records": errors, "execution_step_count": step_num}

    reqs = StructuredRequirements(**raw_reqs)
    strategy = state.get("search_strategy") or {}
    retry_count = state.get("retry_count", 0)

    # Initial search queries standard tier; recovery queries budget tier or requested tier
    target_tier = strategy.get("search_tier")
    if not target_tier and retry_count == 0:
        query_tier = "standard"
    else:
        query_tier = target_tier

    max_flight_budget = strategy.get("target_budget_flight")
    require_direct = ("direct_flight_only" in reqs.mandatory_constraints)

    found_candidates, rejected = search_flights(
        origin=reqs.origin,
        destination=reqs.destination,
        departure_date=reqs.departure_date,
        return_date=reqs.return_date,
        passengers=reqs.passengers,
        max_flight_budget=max_flight_budget,
        tier=query_tier,
        require_direct=require_direct,
        include_all_for_ranking=False
    )

    existing_ids = {c["flight_id"] for c in existing_candidates}
    added_count = 0
    for cand in found_candidates:
        if cand.flight_id not in existing_ids:
            existing_candidates.append(cand.model_dump())
            existing_ids.add(cand.flight_id)
            added_count += 1

    summary_msg = (
        f"Found {len(found_candidates)} flight candidate(s) for {reqs.origin}->{reqs.destination} (tier: {query_tier or 'all'}). "
        f"({added_count} new, {len(rejected)} screened out)."
    )

    trace.append(TraceStep(
        step_number=step_num,
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent_name="Agent 2: Flight Searcher",
        tool_invoked="search_flights",
        input_summary=f"Route: {reqs.origin}->{reqs.destination}, Pax: {reqs.passengers}, Tier: {query_tier or 'all'}, Attempt: #{retry_count + 1}",
        decision=f"Retrieved {len(found_candidates)} matching flight candidate(s) with deterministic pricing",
        output_summary=summary_msg,
        execution_type="DETERMINISTIC_TOOL",
        success=(len(found_candidates) > 0),
        evidence_sources=["Mock Inventory Provider"]
    ).model_dump())

    return {
        "flight_candidates": existing_candidates,
        "execution_step_count": step_num,
        "execution_trace": trace,
        "error_records": errors
    }
