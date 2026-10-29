from datetime import datetime, timezone
from typing import Dict, Any, List
from app.graph.state import TravelPlanningState
from app.models.schemas import StructuredRequirements, HotelCandidate, TraceStep
from app.tools.hotel_tools import search_hotels
from app.services.retrieval_service import get_retrieval_service

def hotel_searcher_node(state: TravelPlanningState) -> Dict[str, Any]:
    step_num = state.get("execution_step_count", 0) + 1
    trace = list(state.get("execution_trace", []))
    errors = list(state.get("error_records", []))
    existing_candidates = list(state.get("hotel_candidates", []))

    raw_reqs = state.get("structured_requirements")
    if not raw_reqs:
        errors.append("Hotel searcher invoked without structured requirements.")
        return {"error_records": errors, "execution_step_count": step_num}

    reqs = StructuredRequirements(**raw_reqs)
    strategy = state.get("search_strategy") or {}
    retry_count = state.get("retry_count", 0)

    try:
        d1 = datetime.strptime(reqs.departure_date, "%Y-%m-%d")
        d2 = datetime.strptime(reqs.return_date, "%Y-%m-%d")
        nights = max(1, (d2 - d1).days)
    except Exception:
        nights = 2

    retrieval_svc = get_retrieval_service()
    hotel_docs = retrieval_svc.retrieve("city centre hotel guidelines and distance", top_k=1)
    evidence_sources = [f"LlamaIndex: {d['source']}" for d in hotel_docs if d.get("source")]

    target_tier = strategy.get("search_tier")
    if not target_tier and retry_count == 0:
        query_tier = "standard"
    else:
        query_tier = target_tier

    max_hotel_budget = strategy.get("target_budget_hotel")
    require_centre = ("city_centre_only" in reqs.mandatory_constraints)

    found_candidates, rejected = search_hotels(
        city=reqs.destination,
        nights=nights,
        rooms=reqs.hotel_rooms,
        max_hotel_budget=max_hotel_budget,
        tier=query_tier,
        require_city_centre=require_centre,
        include_all_for_ranking=False
    )

    existing_ids = {c["hotel_id"] for c in existing_candidates}
    added_count = 0
    for cand in found_candidates:
        if cand.hotel_id not in existing_ids:
            existing_candidates.append(cand.model_dump())
            existing_ids.add(cand.hotel_id)
            added_count += 1

    summary_msg = (
        f"Found {len(found_candidates)} hotel candidate(s) in {reqs.destination} (tier: {query_tier or 'all'}). "
        f"({added_count} new, {len(rejected)} screened out)."
    )

    trace.append(TraceStep(
        step_number=step_num,
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent_name="Agent 3: Hotel Searcher",
        tool_invoked="search_hotels",
        input_summary=f"City: {reqs.destination}, Nights: {nights}, Rooms: {reqs.hotel_rooms}, Tier: {query_tier or 'all'}, Attempt: #{retry_count + 1}",
        decision=f"Retrieved {len(found_candidates)} accommodation candidates with deterministic room and tax totals",
        output_summary=summary_msg,
        execution_type="DETERMINISTIC_TOOL",
        success=(len(found_candidates) > 0),
        evidence_sources=evidence_sources
    ).model_dump())

    return {
        "hotel_candidates": existing_candidates,
        "execution_step_count": step_num,
        "execution_trace": trace,
        "error_records": errors
    }
