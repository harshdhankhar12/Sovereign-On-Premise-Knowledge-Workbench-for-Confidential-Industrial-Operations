from typing import Dict, Any, Optional, List, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class FormulaExecutionRequest(BaseModel):
    formula_name: Literal[
        "HEAT_EXCHANGER_DUTY",
        "DARCY_WEISBACH",
        "PUMP_POWER",
        "OUTLIER_STATS",
    ]
    parameters: Dict[str, Any]
    task_id: Optional[UUID] = None

class FormulaExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    formula_name: str
    status: str
    calculated_output: Dict[str, Any]
    execution_time_ms: int
    run_id: Optional[UUID] = None

class CodeExecutionRequest(BaseModel):
    python_code: str
    input_params: Optional[Dict[str, Any]] = Field(default_factory=dict)
    task_id: Optional[UUID] = None

class CodeExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    calculated_output: Optional[Any] = None
    execution_time_ms: int
    stdout: str
    stderr: str
    verification_passed: bool
    run_id: Optional[UUID] = None

class ProposalVerificationRequest(BaseModel):
    formula_name: Literal[
        "HEAT_EXCHANGER_DUTY",
        "DARCY_WEISBACH",
        "PUMP_POWER",
    ]
    parameters: Dict[str, Any]
    claimed_value: float
    tolerance_pct: float = Field(default=5.0, ge=0.1, le=50.0)
    task_id: Optional[UUID] = None

class ProposalVerificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    formula_name: str
    claimed_value: float
    calculated_value: float
    discrepancy_pct: float
    tolerance_pct: float
    verification_passed: bool
    details: Dict[str, Any]
    execution_time_ms: int
    run_id: Optional[UUID] = None

class ExcelCellUpdateItem(BaseModel):
    sheet: Optional[str] = None
    cell: str
    value: Any

class ExcelUpdateRequest(BaseModel):
    file_path: str
    updates: List[ExcelCellUpdateItem]
    output_path: Optional[str] = None

class ExcelUpdateResponse(BaseModel):
    status: str
    output_file: str
    cells_updated: int

