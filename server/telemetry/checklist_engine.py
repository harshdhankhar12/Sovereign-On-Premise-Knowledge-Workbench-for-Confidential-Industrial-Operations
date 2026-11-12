import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from server.schemas.telemetry import (
    ActiveAlarm,
    ChecklistStep,
    TelemetrySnapshot,
    AlarmsResponse,
)

class ChecklistEngine:
    def __init__(self):
        self._completed_steps: Dict[str, Dict[str, Any]] = {}

    def acknowledge_step(self, step_id: str, operator_role: str) -> Dict[str, Any]:
        record = {
            "step_id": step_id,
            "completed": True,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "completed_by": operator_role,
        }
        self._completed_steps[step_id] = record
        return record

    def reset_step_acknowledgments(self):
        self._completed_steps.clear()

    def evaluate_alarms_and_checklists(self, snapshot: TelemetrySnapshot) -> AlarmsResponse:
        alarms: List[ActiveAlarm] = []

        for unit in snapshot.units:
            for s in unit.sensors:
                if s.status in ("WARNING", "CRITICAL"):
                    alarm = self._build_alarm_for_sensor(s, unit.unit_id, unit.unit_name)
                    if alarm:
                        alarms.append(alarm)

        return AlarmsResponse(alarms=alarms, total_active=len(alarms))

    def _build_alarm_for_sensor(self, s, unit_id: str, unit_name: str) -> Optional[ActiveAlarm]:
        now_str = datetime.now(timezone.utc).isoformat()

        if s.tag == "TT-102" and s.status == "CRITICAL":
            steps_def = [
                ("1", "CRITICAL (0-45s)", "Trip fuel gas and fuel oil shutoff valves to CDU-1 furnace burners immediately.", "MRPL-SOP-OPS-101 Section 3.1", "RESTRICTED", ["F-101", "FG-SOV"]),
                ("2", "CRITICAL (0-45s)", "Activate Emergency Feed Shutoff Valve XV-101 to isolate crude charge to Column T-101.", "MRPL-SOP-OPS-101 Section 3.2", "RESTRICTED", ["XV-101", "T-101"]),
                ("3", "HIGH (1-2m)", "Engage Pre-Heat Exchanger E-101 automated bypass line to avoid thermal shock and coking.", "MRPL-SOP-OPS-101 Section 3.3", "RESTRICTED", ["E-101"]),
                ("4", "HIGH (2-5m)", "Open Emergency Blowdown Valve BDV-101 to depressurize column overhead to flare header.", "MRPL-SOP-OPS-101 Section 3.4", "RESTRICTED", ["BDV-101", "Flare-1"]),
                ("5", "STABILIZATION (5-10m)", "Monitor overhead pressure transmitter PT-101 and verify relief valve PSV-101A seating integrity.", "MRPL-SOP-OPS-101 Section 3.5", "RESTRICTED", ["PT-101", "PSV-101A"]),
            ]
            steps = self._hydrate_steps(steps_def, "ALM-CDU-TT102")
            return ActiveAlarm(
                alarm_id="ALM-CDU-TT102",
                tag=s.tag,
                unit_id=unit_id,
                unit_name=unit_name,
                severity=s.status,
                current_value=s.value,
                threshold_value=s.trip_threshold or 385.0,
                engineering_unit=s.engineering_unit,
                description="CDU Furnace Coil Outlet Over-Temperature Trip Trigger",
                triggered_at=now_str,
                sop_title="Crude Distillation Unit Emergency Shutdown Protocol",
                sop_doc_id="MRPL-SOP-OPS-101",
                sop_clearance="RESTRICTED",
                connected_equipment=["T-101", "E-101", "XV-101", "BDV-101", "PSV-101A"],
                checklist=steps,
            )

        elif s.tag == "PT-101" and s.status in ("WARNING", "CRITICAL"):
            steps_def = [
                ("1", "CRITICAL (0-30s)", "Increase reflux pump flow rate via LCV-103 to subcool overhead vapor stream.", "MRPL-SOP-OPS-101 Section 4.1", "RESTRICTED", ["LCV-103", "V-101"]),
                ("2", "HIGH (30-60s)", "Verify primary safety relief valve PSV-101A lift status at 4.5 bar design limit.", "MRPL-SOP-OPS-101 Section 4.2", "RESTRICTED", ["PSV-101A", "PSV-101B"]),
                ("3", "HIGH (1-2m)", "Partially open blowdown valve BDV-101 to relieve excessive overhead vapor to flare.", "MRPL-SOP-OPS-101 Section 4.3", "RESTRICTED", ["BDV-101"]),
                ("4", "STABILIZATION (2-5m)", "Reduce crude charge furnace firing rate to alleviate vapor load on Column T-101.", "MRPL-SOP-OPS-101 Section 4.4", "RESTRICTED", ["T-101", "TT-102"]),
            ]
            steps = self._hydrate_steps(steps_def, "ALM-CDU-PT101")
            return ActiveAlarm(
                alarm_id="ALM-CDU-PT101",
                tag=s.tag,
                unit_id=unit_id,
                unit_name=unit_name,
                severity=s.status,
                current_value=s.value,
                threshold_value=s.warning_threshold or 3.80,
                engineering_unit=s.engineering_unit,
                description="Column T-101 Overhead Overpressure Excursion",
                triggered_at=now_str,
                sop_title="Crude Distillation Unit Emergency Shutdown Protocol",
                sop_doc_id="MRPL-SOP-OPS-101",
                sop_clearance="RESTRICTED",
                connected_equipment=["T-101", "BDV-101", "PSV-101A", "PSV-101B", "V-101"],
                checklist=steps,
            )

        elif s.tag == "VIB-201A" and s.status in ("WARNING", "CRITICAL"):
            steps_def = [
                ("1", "CRITICAL (0-60s)", "Acknowledge Class II vibration trip (>9.0 mm/s) and trip main drive motor of Slurry Pump P-201A.", "MRPL-SOP-MEC-201 Section 4.1", "INTERNAL", ["P-201A", "M-201A"]),
                ("2", "HIGH (1-3m)", "Verify standby Slurry Pump P-201B pre-warm suction alignment and start auxiliary lube oil pump.", "MRPL-SOP-MEC-201 Section 4.2", "INTERNAL", ["P-201B"]),
                ("3", "HIGH (3-5m)", "Start standby pump P-201B and throttle discharge control valve to match 180 m³/h baseline.", "MRPL-SOP-MEC-201 Section 4.3", "INTERNAL", ["P-201B", "FCV-201"]),
                ("4", "STABILIZATION (5-10m)", "Isolate damaged mechanical seal Plan 53B barrier fluid circuit on P-201A and lock out tag out (LOTO).", "MRPL-SOP-MEC-201 Section 4.4", "INTERNAL", ["P-201A", "Plan 53B"]),
            ]
            steps = self._hydrate_steps(steps_def, "ALM-FCCU-VIB201")
            return ActiveAlarm(
                alarm_id="ALM-FCCU-VIB201",
                tag=s.tag,
                unit_id=unit_id,
                unit_name=unit_name,
                severity=s.status,
                current_value=s.value,
                threshold_value=s.trip_threshold if s.status == "CRITICAL" else (s.warning_threshold or 7.10),
                engineering_unit=s.engineering_unit,
                description="FCCU Slurry Pump P-201A High Vibration Anomaly",
                triggered_at=now_str,
                sop_title="FCCU Slurry Pump Operating and Switchover Protocol",
                sop_doc_id="MRPL-SOP-MEC-201",
                sop_clearance="INTERNAL",
                connected_equipment=["P-201A", "P-201B", "Plan 53B"],
                checklist=steps,
            )

        elif s.tag == "SEAL-201A" and s.status in ("WARNING", "CRITICAL"):
            steps_def = [
                ("1", "CRITICAL (0-60s)", "Trip primary pump P-201A due to Plan 53B barrier fluid pressure drop below 14.0 bar.", "MRPL-SOP-MEC-201 Section 4.4", "INTERNAL", ["P-201A", "Plan 53B"]),
                ("2", "HIGH (1-3m)", "Start standby slurry pump P-201B and verify seal pressure stability at 18.5 bar.", "MRPL-SOP-MEC-201 Section 4.2", "INTERNAL", ["P-201B"]),
                ("3", "STABILIZATION (3-8m)", "Inspect accumulator bladder charge and top up nitrogen barrier reservoir.", "MRPL-SOP-MEC-201 Section 4.5", "INTERNAL", ["Plan 53B"]),
            ]
            steps = self._hydrate_steps(steps_def, "ALM-FCCU-SEAL201")
            return ActiveAlarm(
                alarm_id="ALM-FCCU-SEAL201",
                tag=s.tag,
                unit_id=unit_id,
                unit_name=unit_name,
                severity=s.status,
                current_value=s.value,
                threshold_value=s.trip_threshold or 14.0,
                engineering_unit=s.engineering_unit,
                description="Slurry Pump P-201A Mechanical Seal Barrier Depressurization",
                triggered_at=now_str,
                sop_title="FCCU Slurry Pump Operating and Switchover Protocol",
                sop_doc_id="MRPL-SOP-MEC-201",
                sop_clearance="INTERNAL",
                connected_equipment=["P-201A", "Plan 53B"],
                checklist=steps,
            )

        elif s.tag == "DT-901" and s.status in ("WARNING", "CRITICAL"):
            steps_def = [
                ("1", "CRITICAL (0-30s)", "Activate emergency maximum cold hydrogen quench flow to Inter-bed 1-2 quench ring.", "MRPL-SPEC-HCK-901 Section 2.3", "SECRET", ["R-901", "Quench-Ring"]),
                ("2", "HIGH (30-60s)", "Ramp down furnace heat input to Reactor R-901 by 25 MW thermal equivalent.", "MRPL-SPEC-HCK-901 Section 2.4", "SECRET", ["R-901", "F-901"]),
                ("3", "HIGH (1-3m)", "Verify reactor bed delta T stabilizes below 18.0°C to prevent irreversible catalyst sintering.", "MRPL-SPEC-HCK-901 Section 2.5", "SECRET", ["R-901"]),
                ("4", "STABILIZATION (3-5m)", "Maintain hydrogen partial pressure H2P-901 above 145 bar minimum safety margin.", "MRPL-SPEC-HCK-901 Section 2.6", "SECRET", ["H2P-901"]),
            ]
            steps = self._hydrate_steps(steps_def, "ALM-HCU-DT901")
            return ActiveAlarm(
                alarm_id="ALM-HCU-DT901",
                tag=s.tag,
                unit_id=unit_id,
                unit_name=unit_name,
                severity=s.status,
                current_value=s.value,
                threshold_value=s.trip_threshold or 18.0,
                engineering_unit=s.engineering_unit,
                description="Hydrocracker Reactor R-901 Inter-bed Temperature Runaway Risk",
                triggered_at=now_str,
                sop_title="Hydrocracker R-901 Catalyst Kinetics & Quench Protocol",
                sop_doc_id="MRPL-SPEC-HCK-901",
                sop_clearance="SECRET",
                connected_equipment=["R-901", "F-901", "Quench-Ring"],
                checklist=steps,
            )

        return None

    def _hydrate_steps(self, steps_def: List[tuple], alarm_prefix: str) -> List[ChecklistStep]:
        res: List[ChecklistStep] = []
        for idx, (seq_str, priority, action, ref, clearance, tags) in enumerate(steps_def, 1):
            step_id = f"{alarm_prefix}-STP-{idx}"
            completed_info = self._completed_steps.get(step_id, {})
            res.append(
                ChecklistStep(
                    step_id=step_id,
                    sequence=idx,
                    priority=priority,
                    time_window=priority.split(" ")[-1].strip("()"),
                    action=action,
                    sop_reference=ref,
                    clearance_required=clearance,
                    associated_tags=tags,
                    completed=completed_info.get("completed", False),
                    completed_at=completed_info.get("completed_at"),
                    completed_by=completed_info.get("completed_by"),
                )
            )
        return res

checklist_engine = ChecklistEngine()

