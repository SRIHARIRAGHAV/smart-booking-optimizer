from datetime import datetime, timezone
from typing import Dict, Any, List
from app.graph.state import TravelPlanningState
from app.models.schemas import (
    StructuredRequirements,
    FlightCandidate,
    HotelCandidate,
    ItineraryCandidate,
    TraceStep
)
from app.tools.optimization_tools import (
    generate_candidate_combinations,
    rank_itineraries,
    select_recovery_search_strategy
)
from app.services.llm_service import get_llm_service
from app.services.retrieval_service import get_retrieval_service

def budget_optimizer_node(state: TravelPlanningState) -> Dict[str, Any]:
    step_num = state.get("execution_step_count", 0) + 1
    trace = list(state.get("execution_trace", []))
    errors = list(state.get("error_records", []))
    optimization_attempts = state.get("optimization_attempts", 0) + 1
    retry_count = state.get("retry_count", 0)
    max_retries = state.get("max_retries", 3)

    raw_reqs = state.get("structured_requirements")
    if not raw_reqs:
        errors.append("Budget optimizer invoked without structured requirements.")
        return {"error_records": errors, "execution_step_count": step_num}

    reqs = StructuredRequirements(**raw_reqs)
    raw_flights = state.get("flight_candidates", [])
    raw_hotels = state.get("hotel_candidates", [])

    flights = [FlightCandidate(**f) for f in raw_flights]
    hotels = [HotelCandidate(**h) for h in raw_hotels]

    rejected_history = list(state.get("rejected_combinations", []))
    rejected_pair_ids = {
        (r.get("flight", {}).get("flight_id"), r.get("hotel", {}).get("hotel_id"))
        for r in rejected_history if r.get("flight") and r.get("hotel")
    }

    # Generate all candidate combinations
    combinations = generate_candidate_combinations(flights, hotels, reqs)

    # Apply historical rejection memory and provenance sanity check
    for c in combinations:
        pair = (c.flight.flight_id, c.hotel.hotel_id)
        if pair in rejected_pair_ids:
            c.is_feasible = False
            c.violated_constraints.append("Previously rejected during independent verification")
        if "UNVERIFIED" in c.flight.data_source or "UNVERIFIED" in c.hotel.data_source:
            c.is_feasible = False
            c.violated_constraints.append("Unverified data source detected during candidate screening")

    ranked = rank_itineraries(combinations)

    feasible = [c for c in ranked if c.is_feasible]
    infeasible = [c for c in ranked if not c.is_feasible]

    for inf in infeasible:
        rejected_history.append(inf.model_dump())

    # Retrieval evidence for ranking policy
    retrieval_svc = get_retrieval_service()
    ranking_docs = retrieval_svc.retrieve("preference ranking guidelines and scoring", top_k=1)
    evidence_sources = [f"LlamaIndex: {d['source']}" for d in ranking_docs if d.get("source")]

    llm_svc = get_llm_service()

    if feasible:
        best_candidate = feasible[0]
        explanation, engine = llm_svc.explain_tradeoffs(best_candidate, reqs)

        trace.append(TraceStep(
            step_number=step_num,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_name="Agent 4: Budget Optimizer",
            tool_invoked="rank_itineraries",
            input_summary=(
                f"Evaluated {len(combinations)} flight-hotel pair(s). "
                f"Attempt #{optimization_attempts} (Retries used: {retry_count}/{max_retries})"
            ),
            decision=(
                f"Identified optimal feasible itinerary {best_candidate.itinerary_id} "
                f"(Preference Score: {best_candidate.preference_score}, Cost: ₹{best_candidate.total_cost:,.2f})"
            ),
            output_summary=f"Selected: {best_candidate.flight.airline} + {best_candidate.hotel.name}. {explanation}",
            execution_type=engine,
            success=True,
            evidence_sources=evidence_sources
        ).model_dump())

        # Alternative feasible candidates (up to 3)
        alternatives = [alt.model_dump() for alt in feasible[1:4]]

        return {
            "current_itinerary": best_candidate.model_dump(),
            "candidate_total_cost": best_candidate.total_cost,
            "final_status": "FEASIBLE_FOUND",
            "optimization_attempts": optimization_attempts,
            "rejected_combinations": rejected_history,
            "nearest_alternatives": alternatives,
            "execution_step_count": step_num,
            "execution_trace": trace,
            "error_records": errors
        }

    # If NO feasible candidate found
    if retry_count >= max_retries:
        nearest = sorted(infeasible, key=lambda c: c.total_cost)[:3]
        nearest_dicts = [n.model_dump() for n in nearest]

        closest_cost = nearest[0].total_cost if nearest else 0.0
        over_by = closest_cost - reqs.max_budget
        failure_msg = (
            f"Search retry limit reached ({retry_count}/{max_retries} retries). "
            f"No itinerary satisfies all mandatory constraints within budget ₹{reqs.max_budget:,.2f}. "
            f"Closest alternative is {nearest[0].flight.airline} + {nearest[0].hotel.name} "
            f"at ₹{closest_cost:,.2f} (exceeds budget by ₹{over_by:,.2f}). "
            f"Mandatory budget ceiling was strictly preserved and never silently violated."
        )

        trace.append(TraceStep(
            step_number=step_num,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_name="Agent 4: Budget Optimizer",
            tool_invoked="select_recovery_search_strategy",
            input_summary=f"Evaluated {len(combinations)} combinations. All violate constraints or budget.",
            decision="Recovery budget exhausted. Refusing to violate hard constraints.",
            output_summary=failure_msg,
            execution_type="DETERMINISTIC_TOOL",
            success=False,
            evidence_sources=evidence_sources
        ).model_dump())

        return {
            "current_itinerary": None,
            "candidate_total_cost": None,
            "final_status": "FAILED_RETRY_EXHAUSTED",
            "failure_explanation": failure_msg,
            "nearest_alternatives": nearest_dicts,
            "optimization_attempts": optimization_attempts,
            "rejected_combinations": rejected_history,
            "execution_step_count": step_num,
            "execution_trace": trace,
            "error_records": errors
        }

    # Formulate recovery strategy
    strategy = select_recovery_search_strategy(infeasible, reqs, retry_count)

    trace.append(TraceStep(
        step_number=step_num,
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent_name="Agent 4: Budget Optimizer",
        tool_invoked="select_recovery_search_strategy",
        input_summary=(
            f"Evaluated {len(combinations)} combination(s). None feasible within ₹{reqs.max_budget:,.2f}. "
            f"Retry #{retry_count + 1} of {max_retries}."
        ),
        decision=f"Initiating autonomous recovery cycle targeting {strategy['search_target']}",
        output_summary=f"Strategy: {strategy['reason']}",
        execution_type="DETERMINISTIC_TOOL",
        success=True,
        evidence_sources=evidence_sources
    ).model_dump())

    return {
        "current_itinerary": None,
        "candidate_total_cost": None,
        "search_strategy": strategy,
        "final_status": "INFEASIBLE_ATTEMPT",
        "optimization_attempts": optimization_attempts,
        "rejected_combinations": rejected_history,
        "execution_step_count": step_num,
        "execution_trace": trace,
        "error_records": errors
    }
