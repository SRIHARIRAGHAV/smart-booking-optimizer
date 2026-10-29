from datetime import datetime, timezone
from typing import Dict, Any, List
from app.graph.state import TravelPlanningState
from app.models.schemas import StructuredRequirements, TraceStep
from app.services.llm_service import get_llm_service
from app.services.retrieval_service import get_retrieval_service

def request_planner_node(state: TravelPlanningState) -> Dict[str, Any]:
    step_num = state.get("execution_step_count", 0) + 1
    trace = list(state.get("execution_trace", []))
    errors = list(state.get("error_records", []))

    user_req = state.get("user_request", "")
    existing_reqs = state.get("structured_requirements")

    # If structured requirements were passed directly (e.g. from structured form)
    if existing_reqs and isinstance(existing_reqs, dict):
        try:
            reqs = StructuredRequirements(**existing_reqs)
            trace.append(TraceStep(
                step_number=step_num,
                timestamp=datetime.now(timezone.utc).isoformat(),
                agent_name="Agent 1: Request Planner",
                tool_invoked="validate_structured_input",
                input_summary=f"Direct structured input for {reqs.origin} -> {reqs.destination}",
                decision="Direct validated structured requirements accepted",
                output_summary=f"Origin: {reqs.origin}, Dest: {reqs.destination}, Budget: ₹{reqs.max_budget:,.2f}",
                execution_type="DETERMINISTIC_TOOL",
                success=True,
                evidence_sources=[]
            ).model_dump())
            return {
                "structured_requirements": reqs.model_dump(),
                "clarification_required": False,
                "clarification_questions": [],
                "execution_step_count": step_num,
                "execution_trace": trace
            }
        except Exception as e:
            errors.append(f"Validation error in structured requirements: {e}")

    # Otherwise parse user_request natural language
    retrieval_svc = get_retrieval_service()
    policy_docs = retrieval_svc.retrieve("mandatory budget policy and travel rules", top_k=1)
    evidence_sources = [f"LlamaIndex: {doc['source']}" for doc in policy_docs if doc.get("source")]

    llm_svc = get_llm_service()
    reqs, needs_clarification, questions, engine = llm_svc.parse_travel_request(user_req)

    if needs_clarification or not reqs:
        trace.append(TraceStep(
            step_number=step_num,
            timestamp=datetime.now(timezone.utc).isoformat(),
            agent_name="Agent 1: Request Planner",
            tool_invoked="extract_requirements",
            input_summary=f"Input: '{user_req[:80]}...'",
            decision="Essential travel requirements missing or ambiguous",
            output_summary=f"Clarification required: {len(questions)} question(s) asked",
            execution_type=engine,
            success=False,
            evidence_sources=evidence_sources
        ).model_dump())
        return {
            "clarification_required": True,
            "clarification_questions": questions,
            "final_status": "CLARIFICATION_REQUIRED",
            "execution_step_count": step_num,
            "execution_trace": trace,
            "error_records": errors
        }

    trace.append(TraceStep(
        step_number=step_num,
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent_name="Agent 1: Request Planner",
        tool_invoked="extract_requirements",
        input_summary=f"Natural language request: '{user_req[:80]}...'",
        decision="Extracted structured requirements with non-negotiable constraints and preferences",
        output_summary=(
            f"Trip: {reqs.origin} -> {reqs.destination} ({reqs.departure_date} to {reqs.return_date}), "
            f"Pax: {reqs.passengers}, Budget: ₹{reqs.max_budget:,.2f}, "
            f"Mandatory: {reqs.mandatory_constraints}, Prefs: {reqs.preferences}"
        ),
        execution_type=engine,
        success=True,
        evidence_sources=evidence_sources
    ).model_dump())

    return {
        "structured_requirements": reqs.model_dump(),
        "clarification_required": False,
        "clarification_questions": [],
        "execution_step_count": step_num,
        "execution_trace": trace,
        "error_records": errors
    }
