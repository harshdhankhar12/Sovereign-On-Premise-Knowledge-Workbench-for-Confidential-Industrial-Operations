from typing import TypedDict, List, Dict, Any, Optional

class AgentStepLog(TypedDict):
    node: str
    status: str
    message: str
    duration_ms: int

class AgentState(TypedDict):
    task_id: Optional[str]
    user_id: str
    prompt: str
    plant_unit: Optional[str]
    doc_type: Optional[str]
    document_id: Optional[str]
    document_title: Optional[str]
    top_k: int
    intent: str
    retrieved_chunks: List[Dict[str, Any]]
    citations: List[str]
    formula_name: Optional[str]
    formula_params: Optional[Dict[str, Any]]
    claimed_value: Optional[float]
    sandbox_output: Optional[Dict[str, Any]]
    verification_passed: Optional[bool]
    final_response: str
    steps: List[AgentStepLog]
