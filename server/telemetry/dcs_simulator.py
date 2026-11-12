import random
from datetime import datetime, timezone
from typing import Dict, Any, List
from server.schemas.telemetry import SensorTag, UnitTelemetry, TelemetrySnapshot

class DCSSimulator:
    def __init__(self):
        self._fault_override: Dict[str, float] = {}
        self._active_fault: str = "NORMAL"
        self._last_tick = datetime.now(timezone.utc)

    def reset(self):
        self._fault_override.clear()
        self._active_fault = "NORMAL"

    def inject_fault(self, fault_type: str):
        self.reset()
        self._active_fault = fault_type
        if fault_type == "CDU_FURNACE_OVERHEAT":
            self._fault_override["TT-102"] = 392.4
            self._fault_override["PT-101"] = 3.92
            self._fault_override["PDT-105"] = 195.0
        elif fault_type == "CDU_COLUMN_OVERPRESSURE":
            self._fault_override["PT-101"] = 4.28
            self._fault_override["PDT-105"] = 235.0
            self._fault_override["LT-104"] = 84.5
        elif fault_type == "FCCU_PUMP_SEAL_FAILURE":
            self._fault_override["VIB-201A"] = 9.45
            self._fault_override["SEAL-201A"] = 12.4
        elif fault_type == "HCU_QUENCH_RUNAWAY":
            self._fault_override["DT-901"] = 22.8
            self._fault_override["H2P-901"] = 142.0

    def _get_sensor_value(self, tag: str, nominal: float, noise_std: float) -> float:
        if tag in self._fault_override:
            return round(self._fault_override[tag] + random.uniform(-0.05, 0.05), 2)
        val = nominal + random.gauss(0, noise_std)
        return round(val, 2)

    def get_snapshot(self) -> TelemetrySnapshot:
        now_str = datetime.now(timezone.utc).isoformat()
        
        cdu_sensors_def = [
            ("PT-101", "Overhead Pressure", 1.80, 1.50, 2.20, 3.80, 4.50, 0.02, "bar"),
            ("TT-102", "Furnace Coil Temp", 360.0, 350.0, 370.0, 380.0, 385.0, 0.4, "°C"),
            ("FT-103", "Crude Charge Flow", 450.0, 420.0, 480.0, 250.0, 200.0, 1.2, "m³/h"),
            ("LT-104", "Reflux Drum Level", 55.0, 45.0, 65.0, 80.0, 88.0, 0.5, "%"),
            ("PDT-105", "Column Diff Pressure", 120.0, 100.0, 140.0, 180.0, 210.0, 0.8, "mbar"),
            ("TI-106", "Bottoms Temp", 345.0, 335.0, 355.0, 365.0, 372.0, 0.3, "°C"),
        ]

        cdu_sensor_objs: List[SensorTag] = []
        for tag, name, nom, nmin, nmax, warn, trip, noise, unit in cdu_sensors_def:
            val = self._get_sensor_value(tag, nom, noise)
            status = "NORMAL"
            if trip is not None:
                if trip > nom and val >= trip:
                    status = "CRITICAL"
                elif trip < nom and val <= trip:
                    status = "CRITICAL"
            if status != "CRITICAL" and warn is not None:
                if warn > nom and val >= warn:
                    status = "WARNING"
                elif warn < nom and val <= warn:
                    status = "WARNING"
            cdu_sensor_objs.append(
                SensorTag(
                    tag=tag,
                    name=name,
                    unit="CDU-1",
                    value=val,
                    nominal=nom,
                    normal_min=nmin,
                    normal_max=nmax,
                    warning_threshold=warn,
                    trip_threshold=trip,
                    status=status,
                    engineering_unit=unit,
                )
            )

        fccu_sensors_def = [
            ("VIB-201A", "Pump P-201A Vibration", 3.20, 1.0, 4.5, 7.10, 9.00, 0.08, "mm/s"),
            ("VIB-201B", "Standby P-201B Vibration", 0.20, 0.0, 1.0, 7.10, 9.00, 0.01, "mm/s"),
            ("SEAL-201A", "Plan 53B Barrier Press", 18.5, 16.0, 20.0, 15.0, 14.0, 0.15, "bar"),
            ("T-201", "Riser Reactor Temp", 530.0, 520.0, 540.0, 555.0, 565.0, 0.5, "°C"),
        ]

        fccu_sensor_objs: List[SensorTag] = []
        for tag, name, nom, nmin, nmax, warn, trip, noise, unit in fccu_sensors_def:
            val = self._get_sensor_value(tag, nom, noise)
            status = "NORMAL"
            if trip is not None:
                if trip > nom and val >= trip:
                    status = "CRITICAL"
                elif trip < nom and val <= trip:
                    status = "CRITICAL"
            if status != "CRITICAL" and warn is not None:
                if warn > nom and val >= warn:
                    status = "WARNING"
                elif warn < nom and val <= warn:
                    status = "WARNING"
            fccu_sensor_objs.append(
                SensorTag(
                    tag=tag,
                    name=name,
                    unit="FCCU",
                    value=val,
                    nominal=nom,
                    normal_min=nmin,
                    normal_max=nmax,
                    warning_threshold=warn,
                    trip_threshold=trip,
                    status=status,
                    engineering_unit=unit,
                )
            )

        hcu_sensors_def = [
            ("DT-901", "Reactor Bed 1-2 Delta T", 12.0, 10.0, 15.0, 16.5, 18.0, 0.1, "°C"),
            ("H2P-901", "H2 Partial Pressure", 152.0, 148.0, 158.0, 146.0, 145.0, 0.3, "bar"),
        ]

        hcu_sensor_objs: List[SensorTag] = []
        for tag, name, nom, nmin, nmax, warn, trip, noise, unit in hcu_sensors_def:
            val = self._get_sensor_value(tag, nom, noise)
            status = "NORMAL"
            if trip is not None:
                if trip > nom and val >= trip:
                    status = "CRITICAL"
                elif trip < nom and val <= trip:
                    status = "CRITICAL"
            if status != "CRITICAL" and warn is not None:
                if warn > nom and val >= warn:
                    status = "WARNING"
                elif warn < nom and val <= warn:
                    status = "WARNING"
            hcu_sensor_objs.append(
                SensorTag(
                    tag=tag,
                    name=name,
                    unit="HCU",
                    value=val,
                    nominal=nom,
                    normal_min=nmin,
                    normal_max=nmax,
                    warning_threshold=warn,
                    trip_threshold=trip,
                    status=status,
                    engineering_unit=unit,
                )
            )

        def determine_unit_status(sensor_list: List[SensorTag]) -> str:
            if any(s.status == "CRITICAL" for s in sensor_list):
                return "CRITICAL"
            if any(s.status == "WARNING" for s in sensor_list):
                return "WARNING"
            return "NORMAL"

        units = [
            UnitTelemetry(
                unit_id="CDU-1",
                unit_name="Crude Distillation Unit 1",
                status=determine_unit_status(cdu_sensor_objs),
                sensors=cdu_sensor_objs,
            ),
            UnitTelemetry(
                unit_id="FCCU",
                unit_name="Fluid Catalytic Cracking Unit",
                status=determine_unit_status(fccu_sensor_objs),
                sensors=fccu_sensor_objs,
            ),
            UnitTelemetry(
                unit_id="HCU",
                unit_name="Hydrocracker Unit R-901",
                status=determine_unit_status(hcu_sensor_objs),
                sensors=hcu_sensor_objs,
            ),
        ]

        total_alarms = sum(
            1 for u in units for s in u.sensors if s.status in ("WARNING", "CRITICAL")
        )

        overall = "NORMAL"
        if any(u.status == "CRITICAL" for u in units):
            overall = "CRITICAL"
        elif any(u.status == "WARNING" for u in units):
            overall = "WARNING"

        return TelemetrySnapshot(
            timestamp=now_str,
            overall_status=overall,
            active_alarms_count=total_alarms,
            units=units,
        )

dcs_simulator = DCSSimulator()

