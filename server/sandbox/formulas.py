import math
from typing import Dict, Any, List

def calculate_heat_exchanger_duty(
    U: float,
    A: float,
    Th_in: float,
    Th_out: float,
    Tc_in: float,
    Tc_out: float,
    flow_arrangement: str = "counter",
) -> Dict[str, Any]:
    if flow_arrangement.lower() == "counter":
        delta_T1 = Th_in - Tc_out
        delta_T2 = Th_out - Tc_in
    else:
        delta_T1 = Th_in - Tc_in
        delta_T2 = Th_out - Tc_out

    if delta_T1 <= 0 or delta_T2 <= 0:
        raise ValueError("Temperature cross or invalid temperature difference detected.")

    if abs(delta_T1 - delta_T2) < 1e-6:
        lmtd = delta_T1
    else:
        lmtd = (delta_T1 - delta_T2) / math.log(delta_T1 / delta_T2)

    duty_watts = U * A * lmtd
    duty_kw = duty_watts / 1000.0
    duty_mw = duty_kw / 1000.0

    return {
        "formula": "Q = U * A * LMTD",
        "inputs": {
            "U_W_m2_K": U,
            "A_m2": A,
            "Th_in_C": Th_in,
            "Th_out_C": Th_out,
            "Tc_in_C": Tc_in,
            "Tc_out_C": Tc_out,
            "flow_arrangement": flow_arrangement,
        },
        "delta_T1": round(delta_T1, 3),
        "delta_T2": round(delta_T2, 3),
        "lmtd_C": round(lmtd, 3),
        "duty_watts": round(duty_watts, 2),
        "duty_kw": round(duty_kw, 3),
        "duty_mw": round(duty_mw, 4),
    }

def calculate_darcy_weisbach_loss(
    flow_rate_m3_h: float,
    pipe_diameter_mm: float,
    pipe_length_m: float,
    fluid_density_kg_m3: float = 1000.0,
    fluid_viscosity_pa_s: float = 0.001,
    pipe_roughness_mm: float = 0.045,
) -> Dict[str, Any]:
    flow_m3_s = flow_rate_m3_h / 3600.0
    d_m = pipe_diameter_mm / 1000.0
    area_m2 = (math.pi / 4.0) * (d_m ** 2)
    velocity = flow_m3_s / area_m2

    reynolds = (fluid_density_kg_m3 * velocity * d_m) / fluid_viscosity_pa_s

    if reynolds < 2300:
        regime = "Laminar"
        friction_factor = 64.0 / reynolds if reynolds > 0 else 0.0
    else:
        regime = "Turbulent"
        eps_d = (pipe_roughness_mm / 1000.0) / d_m
        friction_factor = 0.25 / (math.log10((eps_d / 3.7) + (5.74 / (reynolds ** 0.9))) ** 2)

    g = 9.80665
    head_loss_m = friction_factor * (pipe_length_m / d_m) * ((velocity ** 2) / (2 * g))
    pressure_drop_pa = fluid_density_kg_m3 * g * head_loss_m
    pressure_drop_bar = pressure_drop_pa / 100000.0

    return {
        "formula": "hf = f * (L/D) * (v^2 / 2g)",
        "velocity_m_s": round(velocity, 3),
        "reynolds_number": round(reynolds, 1),
        "flow_regime": regime,
        "friction_factor": round(friction_factor, 5),
        "head_loss_meters": round(head_loss_m, 3),
        "pressure_drop_bar": round(pressure_drop_bar, 4),
        "pressure_drop_kpa": round(pressure_drop_pa / 1000.0, 3),
    }

def calculate_centrifugal_pump_power(
    flow_rate_m3_h: float,
    head_meters: float,
    fluid_density_kg_m3: float = 1000.0,
    pump_efficiency_pct: float = 75.0,
    motor_efficiency_pct: float = 92.0,
) -> Dict[str, Any]:
    g = 9.80665
    flow_m3_s = flow_rate_m3_h / 3600.0
    mass_flow_kg_s = flow_m3_s * fluid_density_kg_m3

    hydraulic_power_kw = (mass_flow_kg_s * g * head_meters) / 1000.0
    pump_eff = max(0.01, min(1.0, pump_efficiency_pct / 100.0))
    brake_power_kw = hydraulic_power_kw / pump_eff

    motor_eff = max(0.01, min(1.0, motor_efficiency_pct / 100.0))
    electrical_input_kw = brake_power_kw / motor_eff

    standard_motor_margin = 1.15
    recommended_rating_kw = math.ceil(brake_power_kw * standard_motor_margin)

    return {
        "formula": "P_hyd = (rho * g * Q * H) / 1000, P_brake = P_hyd / eta_pump",
        "hydraulic_power_kw": round(hydraulic_power_kw, 3),
        "brake_power_kw": round(brake_power_kw, 3),
        "electrical_input_kw": round(electrical_input_kw, 3),
        "recommended_motor_rating_kw": recommended_rating_kw,
    }

def detect_outliers_and_stats(
    readings: List[float],
    threshold_sigma: float = 2.0,
) -> Dict[str, Any]:
    if not readings:
        raise ValueError("Readings array cannot be empty.")

    n = len(readings)
    mean_val = sum(readings) / n

    variance = sum((x - mean_val) ** 2 for x in readings) / (n if n == 1 else n - 1)
    std_dev = math.sqrt(variance)

    sorted_vals = sorted(readings)
    q1 = sorted_vals[int(0.25 * n)]
    q3 = sorted_vals[int(0.75 * n)]
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    outliers = []
    for idx, val in enumerate(readings):
        is_z_outlier = False
        z_val = 0.0
        if std_dev > 1e-9:
            z_val = (val - mean_val) / std_dev
            if abs(z_val) >= threshold_sigma:
                is_z_outlier = True

        is_iqr_outlier = val < lower_bound or val > upper_bound

        if is_z_outlier or is_iqr_outlier:
            outliers.append({
                "index": idx,
                "value": val,
                "z_score": round(z_val, 2),
                "iqr_outlier": is_iqr_outlier,
            })

    median_val = sorted_vals[n // 2] if n % 2 != 0 else (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2.0

    return {
        "count": n,
        "mean": round(mean_val, 3),
        "std_dev": round(std_dev, 3),
        "median": round(median_val, 3),
        "min": round(min(readings), 3),
        "max": round(max(readings), 3),
        "iqr": round(iqr, 3),
        "outlier_count": len(outliers),
        "outliers": outliers,
    }
