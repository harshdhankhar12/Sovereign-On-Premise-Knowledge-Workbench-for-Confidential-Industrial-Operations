import time
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from server.core.database import get_db
from server.models.calculation import CalculationRun
from server.schemas.sandbox import (
    FormulaExecutionRequest,
    FormulaExecutionResponse,
    CodeExecutionRequest,
    CodeExecutionResponse,
    ProposalVerificationRequest,
    ProposalVerificationResponse,
    ExcelUpdateRequest,
    ExcelUpdateResponse,
)
from server.sandbox.runner import SandboxRunner
from server.sandbox.security import SecurityViolationError
from server.sandbox.formulas import (
    calculate_heat_exchanger_duty,
    calculate_darcy_weisbach_loss,
    calculate_centrifugal_pump_power,
    detect_outliers_and_stats,
)
from server.sandbox.excel_tool import update_excel_cells

router = APIRouter(prefix="/sandbox", tags=["sandbox"])
runner = SandboxRunner()

@router.post("/run-formula", response_model=FormulaExecutionResponse)
async def run_formula(
    request: FormulaExecutionRequest,
    db: AsyncSession = Depends(get_db),
):
    start = time.perf_counter()
    p = request.parameters
    output: dict

    try:
        if request.formula_name == "HEAT_EXCHANGER_DUTY":
            output = calculate_heat_exchanger_duty(
                U=float(p["U"]),
                A=float(p["A"]),
                Th_in=float(p["Th_in"]),
                Th_out=float(p["Th_out"]),
                Tc_in=float(p["Tc_in"]),
                Tc_out=float(p["Tc_out"]),
                flow_arrangement=str(p.get("flow_arrangement", "counter")),
            )
        elif request.formula_name == "DARCY_WEISBACH":
            output = calculate_darcy_weisbach_loss(
                flow_rate_m3_h=float(p["flow_rate_m3_h"]),
                pipe_diameter_mm=float(p["pipe_diameter_mm"]),
                pipe_length_m=float(p["pipe_length_m"]),
                fluid_density_kg_m3=float(p.get("fluid_density_kg_m3", 1000.0)),
                fluid_viscosity_pa_s=float(p.get("fluid_viscosity_pa_s", 0.001)),
                pipe_roughness_mm=float(p.get("pipe_roughness_mm", 0.045)),
            )
        elif request.formula_name == "PUMP_POWER":
            output = calculate_centrifugal_pump_power(
                flow_rate_m3_h=float(p["flow_rate_m3_h"]),
                head_meters=float(p["head_meters"]),
                fluid_density_kg_m3=float(p.get("fluid_density_kg_m3", 1000.0)),
                pump_efficiency_pct=float(p.get("pump_efficiency_pct", 75.0)),
                motor_efficiency_pct=float(p.get("motor_efficiency_pct", 92.0)),
            )
        elif request.formula_name == "OUTLIER_STATS":
            output = detect_outliers_and_stats(
                readings=[float(x) for x in p["readings"]],
                threshold_sigma=float(p.get("threshold_sigma", 3.0)),
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported formula name.")
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required parameter: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Math calculation error: {str(e)}")

    elapsed_ms = int((time.perf_counter() - start) * 1000)

    run_record = CalculationRun(
        task_id=request.task_id,
        formula_name=request.formula_name,
        python_code=f"formulas.{request.formula_name.lower()}(**parameters)",
        input_params=request.parameters,
        calculated_output=output,
        verification_passed=True,
        execution_time_ms=elapsed_ms,
        sandbox_status="SUCCESS",
    )
    db.add(run_record)
    await db.commit()
    await db.refresh(run_record)

    return FormulaExecutionResponse(
        formula_name=request.formula_name,
        status="SUCCESS",
        calculated_output=output,
        execution_time_ms=elapsed_ms,
        run_id=run_record.id,
    )

@router.post("/execute-code", response_model=CodeExecutionResponse)
async def execute_code(
    request: CodeExecutionRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        res = await runner.execute(
            code=request.python_code,
            input_params=request.input_params,
        )
    except SecurityViolationError as e:
        run_record = CalculationRun(
            task_id=request.task_id,
            formula_name="CUSTOM_CODE",
            python_code=request.python_code,
            input_params=request.input_params or {},
            calculated_output=None,
            verification_passed=False,
            execution_time_ms=0,
            sandbox_status="SECURITY_VIOLATION",
        )
        db.add(run_record)
        await db.commit()
        await db.refresh(run_record)

        return CodeExecutionResponse(
            status="SECURITY_VIOLATION",
            calculated_output=None,
            execution_time_ms=0,
            stdout="",
            stderr=str(e),
            verification_passed=False,
            run_id=run_record.id,
        )

    run_record = CalculationRun(
        task_id=request.task_id,
        formula_name="CUSTOM_CODE",
        python_code=request.python_code,
        input_params=request.input_params or {},
        calculated_output={"result": res["calculated_output"]},
        verification_passed=res["verification_passed"],
        execution_time_ms=res["execution_time_ms"],
        sandbox_status=res["status"],
    )
    db.add(run_record)
    await db.commit()
    await db.refresh(run_record)

    return CodeExecutionResponse(
        status=res["status"],
        calculated_output=res["calculated_output"],
        execution_time_ms=res["execution_time_ms"],
        stdout=res["stdout"],
        stderr=res["stderr"],
        verification_passed=res["verification_passed"],
        run_id=run_record.id,
    )

@router.post("/verify-proposal", response_model=ProposalVerificationResponse)
async def verify_proposal(
    request: ProposalVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    start = time.perf_counter()
    p = request.parameters
    calculated_val: float
    output_details: dict

    try:
        if request.formula_name == "HEAT_EXCHANGER_DUTY":
            output_details = calculate_heat_exchanger_duty(
                U=float(p["U"]),
                A=float(p["A"]),
                Th_in=float(p["Th_in"]),
                Th_out=float(p["Th_out"]),
                Tc_in=float(p["Tc_in"]),
                Tc_out=float(p["Tc_out"]),
                flow_arrangement=str(p.get("flow_arrangement", "counter")),
            )
            unit = p.get("unit", "kw").lower()
            calculated_val = output_details["duty_mw"] if unit == "mw" else output_details["duty_kw"]

        elif request.formula_name == "DARCY_WEISBACH":
            output_details = calculate_darcy_weisbach_loss(
                flow_rate_m3_h=float(p["flow_rate_m3_h"]),
                pipe_diameter_mm=float(p["pipe_diameter_mm"]),
                pipe_length_m=float(p["pipe_length_m"]),
                fluid_density_kg_m3=float(p.get("fluid_density_kg_m3", 1000.0)),
                fluid_viscosity_pa_s=float(p.get("fluid_viscosity_pa_s", 0.001)),
                pipe_roughness_mm=float(p.get("pipe_roughness_mm", 0.045)),
            )
            unit = p.get("unit", "bar").lower()
            calculated_val = output_details["head_loss_meters"] if unit == "m" else output_details["pressure_drop_bar"]

        elif request.formula_name == "PUMP_POWER":
            output_details = calculate_centrifugal_pump_power(
                flow_rate_m3_h=float(p["flow_rate_m3_h"]),
                head_meters=float(p["head_meters"]),
                fluid_density_kg_m3=float(p.get("fluid_density_kg_m3", 1000.0)),
                pump_efficiency_pct=float(p.get("pump_efficiency_pct", 75.0)),
                motor_efficiency_pct=float(p.get("motor_efficiency_pct", 92.0)),
            )
            calculated_val = output_details["brake_power_kw"]
        else:
            raise HTTPException(status_code=400, detail="Unsupported formula.")
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    discrepancy = 0.0
    if abs(calculated_val) > 1e-9:
        discrepancy = (abs(calculated_val - request.claimed_value) / abs(calculated_val)) * 100.0

    passed = discrepancy <= request.tolerance_pct
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    run_record = CalculationRun(
        task_id=request.task_id,
        formula_name=request.formula_name,
        python_code=f"verify_proposal({request.formula_name}, claimed={request.claimed_value})",
        input_params=request.parameters,
        calculated_output=output_details,
        claimed_value=request.claimed_value,
        discrepancy_pct=round(discrepancy, 3),
        verification_passed=passed,
        execution_time_ms=elapsed_ms,
        sandbox_status="SUCCESS",
    )
    db.add(run_record)
    await db.commit()
    await db.refresh(run_record)

    return ProposalVerificationResponse(
        formula_name=request.formula_name,
        claimed_value=request.claimed_value,
        calculated_value=round(calculated_val, 3),
        discrepancy_pct=round(discrepancy, 3),
        tolerance_pct=request.tolerance_pct,
        verification_passed=passed,
        details=output_details,
        execution_time_ms=elapsed_ms,
        run_id=run_record.id,
    )

@router.post("/update-spreadsheet", response_model=ExcelUpdateResponse)
async def update_spreadsheet(request: ExcelUpdateRequest):
    try:
        updates_payload = [item.model_dump() for item in request.updates]
        out_file = update_excel_cells(
            file_path=request.file_path,
            updates=updates_payload,
            output_path=request.output_path,
        )
        return ExcelUpdateResponse(
            status="SUCCESS",
            output_file=out_file,
            cells_updated=len(request.updates),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update spreadsheet: {str(e)}")

@router.get("/history")
async def get_calculation_history(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CalculationRun).order_by(CalculationRun.executed_at.desc()).limit(limit)
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [
        {
            "id": r.id,
            "task_id": r.task_id,
            "formula_name": r.formula_name,
            "sandbox_status": r.sandbox_status,
            "verification_passed": r.verification_passed,
            "claimed_value": r.claimed_value,
            "discrepancy_pct": r.discrepancy_pct,
            "execution_time_ms": r.execution_time_ms,
            "executed_at": r.executed_at,
        }
        for r in records
    ]
