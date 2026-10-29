from typing import TypedDict, List, Dict, Any, Optional

class TravelPlanningState(TypedDict, total=False):
    session_id: str
    user_request: str
    structured_requirements: Optional[Dict[str, Any]]
    clarification_required: bool
    clarification_questions: List[str]
    flight_candidates: List[Dict[str, Any]]
    hotel_candidates: List[Dict[str, Any]]
    rejected_combinations: List[Dict[str, Any]]
    current_itinerary: Optional[Dict[str, Any]]
    candidate_total_cost: Optional[float]
    constraint_results: List[Dict[str, Any]]
    optimization_attempts: int
    retry_count: int
    max_retries: int
    execution_step_count: int
    max_execution_steps: int
    search_strategy: Optional[Dict[str, Any]]
    verification_report: Optional[Dict[str, Any]]
    execution_trace: List[Dict[str, Any]]
    error_records: List[str]
    final_status: str
    user_approval_status: str
    failure_explanation: Optional[str]
    nearest_alternatives: List[Dict[str, Any]]

