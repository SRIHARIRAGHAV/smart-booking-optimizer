from datetime import datetime, timezone
from typing import Dict, Any, List
from app.graph.state import TravelPlanningState
from app.models.schemas import (
    StructuredRequirements,
    ItineraryCandidate,
    VerificationReport,
    TraceStep
)
from app.tools.verification_tools import verify_itinerary
from app.services.llm_service import get_llm_service

def booking_verifier_node(state: TravelPlanningState) -> Dict[str, Any]:
    step_num = state.get("execution_step_count", 0) + 1
    trace = list(state.get("execution_trace", []))
    errors = list(state.get("error_records", []))
    rejected_history = list(state.get("rejected_combinations", []))

    raw_reqs = state.get("structured_requirements")
    raw_itin = state.get("current_itinerary")

    if not raw_reqs or not raw_itin:
        errors.append("Booking verifier invoked without candidate itinerary or requirements.")
        return {"error_records": errors, "execution_step_count": step_num}

    reqs = StructuredRequirements(**raw_reqs)
    itin = ItineraryCandidate(**raw_itin)

    # Perform independent, multi-point verification
    report = verify_itinerary(itin, reqs)
    llm_svc = get_llm_service()

    if report.status == "VERIFIED":
        summary, engine = llm_svc.summarize_verified_itinerary(itin, report, reqs)

        trace.append(TraceStep(
            step_number=step_num,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_name="Agent 5: Booking Verifier",
            tool_invoked="verify_itinerary",
            input_summary=(
                f"Verifying candidate {itin.itinerary_id}: flight {itin.flight.flight_id}, "
                f"hotel {itin.hotel.hotel_id}, reported cost ₹{itin.total_cost:,.2f}"
            ),
            decision="All 5 independent validation suites passed (recalculated cost matches, budget intact, zero violations)",
            output_summary=summary,
            execution_type=engine,
            success=True,
            evidence_sources=["Independent Verifier Engine"]
        ).model_dump())

        return {
            "verification_report": report.model_dump(),
            "final_status": "VERIFIED_RECOMMENDATION",
            "user_approval_status": "PENDING",
            "execution_step_count": step_num,
            "execution_trace": trace,
            "error_records": errors
        }

    # If verification REJECTED the proposed candidate
    bad_itin = itin.model_dump()
    bad_itin["violated_constraints"] = report.checks_failed
    rejected_history.append(bad_itin)

    trace.append(TraceStep(
        step_number=step_num,
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent_name="Agent 5: Booking Verifier",
        tool_invoked="verify_itinerary",
        input_summary=f"Verifying candidate {itin.itinerary_id}",
        decision=f"Candidate REJECTED by independent verification: {len(report.checks_failed)} failure(s)",
        output_summary=report.explanation,
        execution_type="DETERMINISTIC_TOOL",
        success=False,
        evidence_sources=["Independent Verifier Engine"]
    ).model_dump())

    return {
        "verification_report": report.model_dump(),
        "final_status": "VERIFICATION_FAILED",
        "current_itinerary": None,
        "rejected_combinations": rejected_history,
        "execution_step_count": step_num,
        "execution_trace": trace,
        "error_records": errors
    }
