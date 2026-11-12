import os
import pymupdf

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_documents")

def draw_header_banner(page, doc_id, clearance_level, title):
    page.draw_rect(pymupdf.Rect(40, 40, 555, 802), color=(0.8, 0.85, 0.9), width=1)
    page.draw_rect(pymupdf.Rect(40, 40, 555, 95), color=(0.08, 0.18, 0.36), fill=(0.08, 0.18, 0.36))
    page.insert_text((55, 62), "MANGALORE REFINERY AND PETROCHEMICALS LIMITED (MRPL)", fontsize=11, color=(1, 1, 1))
    page.insert_text((55, 78), "SOVEREIGN INDUSTRIAL KNOWLEDGE WORKBENCH - TECHNICAL REPOSITORY", fontsize=8, color=(0.7, 0.85, 1.0))
    page.insert_text((430, 62), f"DOC: {doc_id}", fontsize=9, color=(1, 1, 1))
    page.insert_text((430, 78), f"CLEARANCE: {clearance_level}", fontsize=8, color=(1, 0.8, 0.4))
    page.draw_rect(pymupdf.Rect(40, 95, 555, 125), color=(0.92, 0.95, 0.98), fill=(0.92, 0.95, 0.98))
    page.insert_text((55, 114), title, fontsize=10, color=(0.08, 0.18, 0.36))
    page.draw_rect(pymupdf.Rect(40, 782, 555, 802), color=(0.95, 0.96, 0.98), fill=(0.95, 0.96, 0.98))
    page.insert_text((55, 796), "MRPL CONFIDENTIAL - ON-PREMISE AIR-GAPPED CONTROL SYSTEM", fontsize=8, color=(0.4, 0.45, 0.5))

def generate_hse_sop(output_path):
    doc = pymupdf.open()
    page1 = doc.new_page(width=595, height=842)
    draw_header_banner(page1, "MRPL-SOP-HSE-001", "PUBLIC", "Standard Operating Procedure: Refinery HSE & Site Protective Protocols")
    
    y = 145
    page1.insert_text((55, y), "1. Administrative Scope and Safety Objective", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text1 = (
        "This standard operating procedure establishes mandatory health, safety, and environmental (HSE) "
        "regulations for all personnel, process operators, maintenance contractors, and inspection engineers "
        "within the battery limits of Mangalore Refinery and Petrochemicals Limited (MRPL). Compliance with OISD-105 "
        "and OISD-154 statutory safety frameworks is mandatory. Zero tolerance is enforced for non-compliance."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 60), text1, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y += 75
    page1.insert_text((55, y), "2. Mandatory Personal Protective Equipment (PPE) Matrix", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text2 = (
        "All personnel entering process operating areas must continuously wear certified PPE including:\n"
        "a) Flame-Retardant Clothing (FRC) meeting NFPA 2112 and ISO 11612 standards with antistatic weave.\n"
        "b) Portable Multi-Gas Detector (LEL, O2, CO, H2S) attached inside the breathing zone (within 25 cm of mouth/nose). "
        "The H2S alarm threshold is strictly set at: Low Alarm = 10 ppm, High Alarm = 15 ppm.\n"
        "c) Heavy industrial safety footwear compliant with EN ISO 20345 S3 (steel toe, oil-resistant, antistatic sole).\n"
        "d) Impact-resistant safety eyewear conforming to ANSI Z87.1 with permanent side shields.\n"
        "e) Hearing protection mandatory in all designated high-noise compressor and pump zones (>85 dBA)."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 130), text2, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y += 145
    page1.insert_text((55, y), "3. Hazardous Area Classification and Permit-To-Work (PTW)", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text3 = (
        "Operational plant areas are zoned according to hazardous combustible atmosphere likelihood:\n"
        "- Zone 0: Explosive hydrocarbon atmosphere continuously present (>1000 hours/year). No hot work allowed.\n"
        "- Zone 1: Explosive atmosphere likely to occur under normal operating conditions (10 to 1000 hours/year).\n"
        "- Zone 2: Explosive atmosphere not likely in normal operation and only for short durations (<10 hours/year).\n\n"
        "Hot Work Permits (HWP) require authorized signature from Shift In-Charge and continuous LEL explosive gas "
        "monitoring. If combustible gas concentration reaches 1% LEL, hot work must halt immediately. A dedicated "
        "fire watch equipped with a 50 kg Dry Chemical Powder (DCP) wheeled unit must stand by at all times."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 150), text3, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y += 165
    page1.insert_text((55, y), "4. Hydrogen Sulfide (H2S) Emergency Action Protocol", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text4 = (
        "In the event of an audible H2S toxic gas alarm sounding from fixed site beacons or personal monitors:\n"
        "1. Check the nearest wind sock for wind direction immediately.\n"
        "2. Evacuate cross-wind or up-wind to the nearest designated assembly point (Muster Station Alpha or Bravo).\n"
        "3. Never walk downwind or into low-lying drainage pits or pipe trenches.\n"
        "4. Certified rescue teams must don 30-minute 300-bar Self-Contained Breathing Apparatus (SCBA) before entry.\n"
        "5. Notify Main Control Room (MCR) via plant emergency phone extension 5555 or UHF Channel 1."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 130), text4, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)

    doc.save(output_path)
    doc.close()

def generate_pump_sop(output_path):
    doc = pymupdf.open()
    page1 = doc.new_page(width=595, height=842)
    draw_header_banner(page1, "MRPL-SOP-MEC-201", "INTERNAL", "SOP: Centrifugal Slurry Pump P-201A/B Operation & Maintenance")
    
    y = 145
    page1.insert_text((55, y), "1. Mechanical Architecture and Technical Specifications", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text1 = (
        "Slurry Pump P-201A (Primary) and P-201B (Standby) are heavy-duty centrifugal single-stage process pumps "
        "operating in the Fluid Catalytic Cracking Unit (FCCU). The pumps transfer catalyst slurry oil from the "
        "main fractionator bottom sumps via suction line 8\"-P-203-CS-150 and discharge line 6\"-P-204-CS-150.\n"
        "Technical Baseline Data:\n"
        "- Rated Flow: 250.0 m3/hr | Total Dynamic Head (TDH): 45.0 m | Slurry Density: 1050.0 kg/m3\n"
        "- Motor Rating: 55.0 kW | Synchronous Speed: 2950 RPM | Voltage: 415 V, 3-Phase, 50 Hz\n"
        "- Shaft Seal Configuration: Dual mechanical cartridge seal with API Plan 53B pressurized barrier system."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 110), text1, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y += 125
    page1.insert_text((55, y), "2. API Plan 53B Seal Flush and Pre-Start Alignment", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text2 = (
        "Prior to starting pump P-201A or standby P-201B, verify the mechanical seal barrier fluid system:\n"
        "a) Inspect the Plan 53B bladder accumulator pressure gauge: barrier fluid pressure must read exactly "
        "3.5 bar gauge (minimum 1.5 bar above maximum expected stuffing box pressure of 2.0 bar gauge).\n"
        "b) Verify lube oil level in the bearing housing sight glass is maintained between 45% and 55% level.\n"
        "c) Recommended lubricant: ISO VG 46 synthetic turbine oil with high thermal stability.\n"
        "d) Fully open suction isolation valve on line 8\"-P-203-CS-150. Ensure pump casing is vented and primed.\n"
        "e) Crack open discharge throttling valve on line 6\"-P-204-CS-150 to approximately 10% open position."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 130), text2, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y += 145
    page1.insert_text((55, y), "3. Operating Temperature and ISO 10816-3 Vibration Limits", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text3 = (
        "Continuous online condition monitoring instrumentation provides real-time telemetry to the DCS:\n"
        "- Bearing Housing Temperature Limits:\n"
        "  * Normal Steady-State: 50 deg C to 65 deg C\n"
        "  * High Temperature Warning Advisory Alarm: 75.0 deg C\n"
        "  * Emergency High-High Automated Trip Threshold: 85.0 deg C\n\n"
        "- ISO 10816-3 Category Class II Vibration Thresholds (Broadband Velocity RMS):\n"
        "  * Zone A/B (Normal Unrestricted Continuous Operation): Vibration < 2.8 mm/s RMS\n"
        "  * Zone C (High Vibration Warning Alarm Threshold): 7.1 mm/s RMS (Trigger inspection within 2 hours)\n"
        "  * Zone D (Emergency High-High Trip Threshold): 9.0 mm/s RMS (Immediate automated trip shutdown)"
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 140), text3, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)

    page2 = doc.new_page(width=595, height=842)
    draw_header_banner(page2, "MRPL-SOP-MEC-201", "INTERNAL", "SOP: Centrifugal Slurry Pump P-201A/B - Operational Sequencing")
    
    y2 = 145
    page2.insert_text((55, y2), "4. Primary-to-Standby Pump Auto-Switchover Sequence", fontsize=12, color=(0.08, 0.18, 0.36))
    y2 += 18
    text4 = (
        "When high vibration (>7.1 mm/s RMS) or bearing temperature (>75 deg C) occurs on primary pump P-201A, "
        "execute the bumpless switchover procedure to standby pump P-201B as follows:\n"
        "Step 1: Check P-201B auxiliary systems: verify lube oil level and API Plan 53B barrier pressure >= 3.5 bar.\n"
        "Step 2: Confirm P-201B suction valve is 100% open and minimum flow recirculation bypass valve is open.\n"
        "Step 3: Start P-201B electric motor from DCS console or field emergency start button.\n"
        "Step 4: Observe discharge pressure transmitter PT-204: confirm pressure reaches 5.2 bar gauge within 6 sec.\n"
        "Step 5: Gradually open P-201B discharge valve to 100% over 30 seconds while simultaneously throttling "
        "P-201A discharge valve to 0% to avoid flow surging or hydraulic hammer in discharge line 6\"-P-204-CS-150.\n"
        "Step 6: Stop P-201A motor. Apply lockout/tagout (LOTO) padlocks on electrical breaker P-201A-MCC."
    )
    page2.insert_textbox(pymupdf.Rect(55, y2, 540, y2 + 150), text4, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y2 += 165
    page2.insert_text((55, y2), "5. Darcy-Weisbach Friction and NPSH Verification Formulas", fontsize=12, color=(0.08, 0.18, 0.36))
    y2 += 18
    text5 = (
        "Hydraulic friction loss across discharge line 6\"-P-204-CS-150 is governed by the Darcy-Weisbach equation:\n"
        "Head Loss: h_f = f * (L / D) * (V^2 / (2 * g))\n"
        "Where pipe diameter D = 0.15 m, total equivalent length L = 85.0 m, fluid velocity V = 2.2 m/s, "
        "Darcy friction factor f = 0.018, and gravitational acceleration g = 9.81 m/s^2.\n"
        "Calculated head loss h_f = 2.51 m, corresponding to pressure drop Delta P = 25.83 kPa.\n\n"
        "Net Positive Suction Head (NPSH) Security Margin:\n"
        "NPSH_Available = 4.2 m, NPSH_Required = 2.8 m. Safety margin = 1.4 m (Mandatory margin >= 1.0 m). "
        "If suction strainer differential pressure reaches 0.35 bar, clean strainer immediately to prevent cavitation."
    )
    page2.insert_textbox(pymupdf.Rect(55, y2, 540, y2 + 150), text5, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)

    doc.save(output_path)
    doc.close()

def generate_cdu_sop(output_path):
    doc = pymupdf.open()
    page1 = doc.new_page(width=595, height=842)
    draw_header_banner(page1, "MRPL-SOP-OPS-101", "RESTRICTED", "CDU-1 Atmospheric Distillation Emergency Depressurization Protocol")
    
    y = 145
    page1.insert_text((55, y), "1. Atmospheric Distillation Column T-101 Process Baseline", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text1 = (
        "The Crude Distillation Unit (CDU-1) separates desalted crude oil into petroleum fractions inside column T-101.\n"
        "Equipment and Process Envelope:\n"
        "- Column T-101: 42 valve fractionation trays, overall height 48.5 m, shell design pressure 3.5 bar gauge.\n"
        "- Crude Charge Train: Crude oil flows through pre-heat exchanger E-101 via transfer line 8\"-P-101-CS-150 at 450 m3/hr.\n"
        "- Overhead Condenser Circuit: Light naptha vapor exits top nozzle into transfer line 4\"-P-103-CS-300 to drum V-101.\n"
        "- Bottoms Residue Circuit: Heavy residue collected in sump is pumped by charge pumps P-101A/B into line 6\"-P-102-CS-150.\n"
        "- Normal column operating conditions: Overhead pressure 1.25 bar gauge, Flash zone temperature 360 deg C."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 130), text1, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y += 145
    page1.insert_text((55, y), "2. Critical Emergency Trigger Parameters", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text2 = (
        "Automated Emergency Shutdown ESD-1 triggers automatically when any of the following safety trip limits occur:\n"
        "1. Fired Heater Coil Outlet Temperature (COT) exceeds 385.0 deg C (detected by transmitters TT-102A/B).\n"
        "2. Reflux Drum V-101 High-High liquid level reaches 85.0% on level transmitter LT-104 (risk of liquid carryover).\n"
        "3. Column T-101 Differential Pressure across wash section exceeds 0.45 bar (detected by transmitter PDT-105).\n"
        "4. Total loss of instrument air header pressure dropping below 4.5 bar gauge.\n"
        "5. Manual activation of ESD-1 push-button in Main Control Room or Field Marshalling Cabinet."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 130), text2, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y += 145
    page1.insert_text((55, y), "3. Automated Emergency Shutdown (ESD-1) Execution Sequence", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text3 = (
        "Upon ESD-1 activation, the Triconex safety instrumented system initiates simultaneous protective actions:\n"
        "a) Immediate fail-close activation of Emergency Shutdown Valve XV-101 on crude charge line 8\"-P-101-CS-150.\n"
        "b) Simultaneous electrical trip of crude charge bottoms pumps P-101A and P-101B.\n"
        "c) Automated opening of Emergency Blowdown Valve BDV-101, rapidly depressurizing column T-101 vapor inventory "
        "into the refinery high-pressure flare header at an engineered controlled rate of 0.8 bar/minute.\n"
        "d) Primary relief valves PSV-101A and PSV-101B (set at 3.2 bar gauge) provide secondary thermal protection."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 130), text3, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)

    page2 = doc.new_page(width=595, height=842)
    draw_header_banner(page2, "MRPL-SOP-OPS-101", "RESTRICTED", "CDU-1 Exchanger Bypass & Column Blanketing Safeguards")
    
    y2 = 145
    page2.insert_text((55, y2), "4. Pre-Heat Exchanger E-101 Emergency Thermal Bypass Protocol", fontsize=12, color=(0.08, 0.18, 0.36))
    y2 += 18
    text4 = (
        "To prevent severe thermal cracking, tube rupture, and localized coking inside pre-heat exchanger E-101 "
        "when furnace feed is tripped, operators must execute the emergency bypass protocol:\n"
        "- Open emergency bypass line 4\"-P-103-CS-300 around exchanger E-101 within 45 seconds of feed trip.\n"
        "- Close motor-operated inlet isolation valve MOV-102.\n"
        "- Logarithmic Mean Temperature Difference (LMTD) baseline across E-101 under normal operation:\n"
        "  * Shell Hot Stream (Residue): T_hot_in = 160.0 deg C, T_hot_out = 120.0 deg C\n"
        "  * Tube Cold Stream (Crude): T_cold_in = 30.0 deg C, T_cold_out = 85.0 deg C\n"
        "  * Delta T1 = 160 - 85 = 75.0 deg C | Delta T2 = 120 - 30 = 90.0 deg C\n"
        "  * Verified LMTD = (90.0 - 75.0) / ln(90.0 / 75.0) = 82.26 deg C (Vendor claim: 82.0 deg C, Discrepancy: 0.31%)."
    )
    page2.insert_textbox(pymupdf.Rect(55, y2, 540, y2 + 160), text4, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y2 += 175
    page2.insert_text((55, y2), "5. Post-Trip Column Inerting and Vacuum Prevention", fontsize=12, color=(0.08, 0.18, 0.36))
    y2 += 18
    text5 = (
        "As column T-101 cools post-trip, condensing hydrocarbon vapor creates severe negative pressure (vacuum risk).\n"
        "To prevent catastrophic tray deformation and structural shell implosion:\n"
        "1. Open utility nitrogen blanketing valve N2-PCV-108 immediately when overhead pressure drops below 0.6 bar.\n"
        "2. Maintain positive nitrogen pressure inside column T-101 strictly above 0.35 bar gauge at all times.\n"
        "3. Never open column manways or vents to atmospheric air until internal oxygen concentration is verified < 0.5%."
    )
    page2.insert_textbox(pymupdf.Rect(55, y2, 540, y2 + 130), text5, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)

    doc.save(output_path)
    doc.close()

def generate_hydrocracker_spec(output_path):
    doc = pymupdf.open()
    page1 = doc.new_page(width=595, height=842)
    draw_header_banner(page1, "MRPL-SPEC-HCK-901", "SECRET", "Hydrocracker Unit Second-Stage Catalyst Kinetic Model & Quench Spec")
    
    y = 145
    page1.insert_text((55, y), "1. Proprietary Catalyst Chemistry and Operating Envelope", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text1 = (
        "CONFIDENTIAL NOTICE: This document contains proprietary catalyst formulation data for the Second-Stage "
        "Hydrocracker Reactor R-901 at Mangalore Refinery and Petrochemicals Limited. Access is restricted to "
        "Plant Managers and accredited Safety Auditors with SECRET security clearance.\n\n"
        "Catalyst Specifications:\n"
        "- Active Metals: Sulfided Nickel-Molybdenum (Ni-Mo) supported on dealuminated modified Y-Zeolite carrier.\n"
        "- Surface Area: 340 m2/g with tailored micropore distribution optimizing middle-distillate selectivity.\n"
        "- Design Operating Pressure: Total pressure = 162.0 bar gauge | Hydrogen Partial Pressure P_H2 >= 145.0 bar.\n"
        "- Liquid Hourly Space Velocity (LHSV): Nominal 1.25 hr^-1 (allowable range 1.05 to 1.45 hr^-1).\n"
        "- Bed Operating Temperature Window: 370.0 deg C to 415.0 deg C (Maximum metallurgical design limit 440.0 deg C)."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 150), text1, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y += 165
    page1.insert_text((55, y), "2. Reaction Kinetics and Exothermic Runaway Quench Control", fontsize=12, color=(0.08, 0.18, 0.36))
    y += 18
    text2 = (
        "Hydrocracking is strongly exothermic. First-order cracking rate kinetics follow the Arrhenius relationship:\n"
        "Reaction Rate: k = A * exp(-E_a / (R * T))\n"
        "Where Activation Energy E_a = 142.5 kJ/mol, Pre-exponential factor A = 4.82 x 10^9 s^-1, and gas constant R = 8.314 J/(mol*K).\n\n"
        "Automated Inter-Bed Quench Gas Algorithm:\n"
        "To prevent thermal hot-spot runaway in reactor R-901, cold hydrogen quench gas is dynamically injected "
        "between catalyst beds 1, 2, and 3. The automated quench controller throttles quench valves to strictly enforce:\n"
        "Maximum allowable temperature rise across any single catalyst bed: Delta T_bed <= 18.0 deg C.\n"
        "If Delta T_bed exceeds 22.0 deg C, automated emergency depressurization (AED) activates within 15 seconds."
    )
    page1.insert_textbox(pymupdf.Rect(55, y, 540, y + 160), text2, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)

    page2 = doc.new_page(width=595, height=842)
    draw_header_banner(page2, "MRPL-SPEC-HCK-901", "SECRET", "HCU Reactor R-901 Yield Optimization & Compliance Mandate")
    
    y2 = 145
    page2.insert_text((55, y2), "3. Ultra-Low Sulfur Diesel (ULSD) Yield Optimization Matrix", fontsize=12, color=(0.08, 0.18, 0.36))
    y2 += 18
    text3 = (
        "Empirical yield optimization model for maximizing high-cetane BS-VI compliant diesel production:\n"
        "Diesel Yield (wt%) = 58.4 + 0.32 * (Severity Index) - 0.0041 * (Severity Index)^2\n"
        "Optimal Cracking Severity Index target = 68.5%.\n"
        "Predicted Maximum Diesel Yield = 61.2 wt% | Heavy Naphtha Yield = 22.8 wt% | Kerosene/Jet Fuel = 11.5 wt%.\n"
        "Product Sulfur Slip Specification: Finished diesel sulfur content must remain strictly below 8.0 ppm wt.\n"
        "Cetane Index: Minimum 54.0 units with polycyclic aromatics content < 6.0 wt%."
    )
    page2.insert_textbox(pymupdf.Rect(55, y2, 540, y2 + 140), text3, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)
    
    y2 += 155
    page2.insert_text((55, y2), "4. Sovereign Air-Gapped Compliance and Clearance Safeguard", fontsize=12, color=(0.08, 0.18, 0.36))
    y2 += 18
    text4 = (
        "Pursuant to National Critical Information Infrastructure Protection Centre (NCIIPC) guidelines:\n"
        "1. This proprietary kinetic model and catalyst composition specification is classified SECRET.\n"
        "2. Querying or retrieving chunks of this specification requires verified SECRET level clearance.\n"
        "3. Any unauthorized attempt by lower-clearance roles (e.g. OPERATOR or PROCESS_ENGINEER) to access "
        "these records is logged into the SHA-256 cryptographic audit ledger and triggers an immediate security alert.\n"
        "4. All mathematical verifications referencing this formula must execute within the isolated local AST sandbox."
    )
    page2.insert_textbox(pymupdf.Rect(55, y2, 540, y2 + 140), text4, fontsize=9.5, color=(0.15, 0.15, 0.15), lineheight=1.35)

    doc.save(output_path)
    doc.close()

def generate_pid_schematic(output_path):
    doc = pymupdf.open()
    page = doc.new_page(width=842, height=595)
    
    page.draw_rect(pymupdf.Rect(20, 20, 822, 575), color=(0.1, 0.15, 0.25), width=1.5)
    page.draw_rect(pymupdf.Rect(24, 24, 818, 571), color=(0.7, 0.75, 0.8), width=0.5)
    
    page.draw_rect(pymupdf.Rect(560, 500, 818, 571), color=(0.1, 0.15, 0.25), width=1)
    page.draw_rect(pymupdf.Rect(560, 500, 818, 520), color=(0.08, 0.18, 0.36), fill=(0.08, 0.18, 0.36))
    page.insert_text((566, 514), "MANGALORE REFINERY AND PETROCHEMICALS LIMITED", fontsize=8, color=(1, 1, 1))
    page.insert_text((566, 532), "UNIT: CDU-1 ATMOSPHERIC FRACTIONATION", fontsize=8, color=(0.1, 0.1, 0.1))
    page.insert_text((566, 545), "DWG: MRPL-PID-CDU-101", fontsize=9, color=(0.08, 0.18, 0.36))
    page.insert_text((720, 545), "REV: 3", fontsize=9, color=(0.1, 0.1, 0.1))
    page.insert_text((566, 560), "PIPING & INSTRUMENTATION DIAGRAM", fontsize=7.5, color=(0.4, 0.4, 0.4))
    
    page.draw_rect(pymupdf.Rect(410, 200, 480, 430), color=(0.1, 0.2, 0.4), width=2)
    page.draw_circle(pymupdf.Point(445, 200), 35, color=(0.1, 0.2, 0.4), width=1.5)
    page.draw_circle(pymupdf.Point(445, 430), 35, color=(0.1, 0.2, 0.4), width=1.5)
    for tray_y in range(230, 410, 30):
        page.draw_line(pymupdf.Point(415, tray_y), pymupdf.Point(475, tray_y), color=(0.5, 0.5, 0.6), width=0.8)
    page.insert_text((435, 310), "T-101", fontsize=13, color=(0.08, 0.18, 0.36))
    page.insert_text((422, 325), "FRACTIONATOR", fontsize=6, color=(0.3, 0.3, 0.3))
    
    page.draw_circle(pymupdf.Point(220, 340), 28, color=(0.1, 0.2, 0.4), width=2)
    page.draw_line(pymupdf.Point(200, 325), pymupdf.Point(240, 355), color=(0.1, 0.2, 0.4), width=1.2)
    page.draw_line(pymupdf.Point(200, 355), pymupdf.Point(240, 325), color=(0.1, 0.2, 0.4), width=1.2)
    page.insert_text((205, 335), "E-101", fontsize=11, color=(0.08, 0.18, 0.36))
    page.insert_text((195, 380), "PRE-HEAT EXCHANGER", fontsize=6, color=(0.3, 0.3, 0.3))
    
    page.draw_circle(pymupdf.Point(415, 510), 18, color=(0.1, 0.2, 0.4), width=1.8)
    page.draw_line(pymupdf.Point(415, 492), pymupdf.Point(433, 492), color=(0.1, 0.2, 0.4), width=1.5)
    page.insert_text((400, 514), "P-101A", fontsize=9, color=(0.08, 0.18, 0.36))
    
    page.draw_circle(pymupdf.Point(495, 510), 18, color=(0.1, 0.2, 0.4), width=1.8)
    page.draw_line(pymupdf.Point(495, 492), pymupdf.Point(513, 492), color=(0.1, 0.2, 0.4), width=1.5)
    page.insert_text((480, 514), "P-101B", fontsize=9, color=(0.08, 0.18, 0.36))
    
    page.draw_rect(pymupdf.Rect(670, 185, 750, 225), color=(0.1, 0.2, 0.4), width=1.8)
    page.insert_text((695, 208), "V-101", fontsize=11, color=(0.08, 0.18, 0.36))
    page.insert_text((680, 235), "REFLUX DRUM", fontsize=6, color=(0.3, 0.3, 0.3))
    
    page.draw_line(pymupdf.Point(40, 340), pymupdf.Point(192, 340), color=(0.1, 0.1, 0.1), width=2)
    page.draw_line(pymupdf.Point(248, 340), pymupdf.Point(410, 340), color=(0.1, 0.1, 0.1), width=2)
    page.insert_text((75, 332), "8\"-P-101-CS-150", fontsize=8, color=(0.2, 0.2, 0.2))
    page.insert_text((275, 332), "8\"-P-101-CS-150", fontsize=8, color=(0.2, 0.2, 0.2))
    
    page.draw_line(pymupdf.Point(445, 445), pymupdf.Point(445, 480), color=(0.1, 0.1, 0.1), width=2)
    page.draw_line(pymupdf.Point(415, 480), pymupdf.Point(495, 480), color=(0.1, 0.1, 0.1), width=2)
    page.draw_line(pymupdf.Point(415, 480), pymupdf.Point(415, 492), color=(0.1, 0.1, 0.1), width=2)
    page.draw_line(pymupdf.Point(495, 480), pymupdf.Point(495, 492), color=(0.1, 0.1, 0.1), width=2)
    page.insert_text((425, 465), "6\"-P-102-CS-150", fontsize=8, color=(0.2, 0.2, 0.2))
    
    page.draw_line(pymupdf.Point(445, 175), pymupdf.Point(445, 120), color=(0.1, 0.1, 0.1), width=2)
    page.draw_line(pymupdf.Point(445, 120), pymupdf.Point(710, 120), color=(0.1, 0.1, 0.1), width=2)
    page.draw_line(pymupdf.Point(710, 120), pymupdf.Point(710, 185), color=(0.1, 0.1, 0.1), width=2)
    page.insert_text((530, 112), "4\"-P-103-CS-300", fontsize=8, color=(0.2, 0.2, 0.2))
    
    page.draw_line(pymupdf.Point(690, 225), pymupdf.Point(690, 270), color=(0.1, 0.1, 0.1), width=1.5)
    page.draw_line(pymupdf.Point(690, 270), pymupdf.Point(480, 270), color=(0.1, 0.1, 0.1), width=1.5)
    page.insert_text((550, 264), "2\"-P-104-CS-150", fontsize=8, color=(0.2, 0.2, 0.2))
    
    def draw_inst(center, tag):
        page.draw_circle(center, 12, color=(0.15, 0.35, 0.65), width=1.2)
        page.draw_line(pymupdf.Point(center.x - 12, center.y), pymupdf.Point(center.x + 12, center.y), color=(0.15, 0.35, 0.65), width=0.6)
        page.insert_text((center.x - 10, center.y - 2), tag[:2], fontsize=6.5, color=(0.08, 0.18, 0.36))
        page.insert_text((center.x - 9, center.y + 8), tag[2:].lstrip("-"), fontsize=6.5, color=(0.08, 0.18, 0.36))
        page.insert_text((center.x - 18, center.y + 20), tag, fontsize=7.5, color=(0.1, 0.25, 0.5))

    draw_inst(pymupdf.Point(445, 95), "PT-101")
    page.draw_line(pymupdf.Point(445, 107), pymupdf.Point(445, 120), color=(0.3, 0.3, 0.3), width=0.8)
    
    draw_inst(pymupdf.Point(140, 310), "TT-102")
    page.draw_line(pymupdf.Point(140, 322), pymupdf.Point(140, 340), color=(0.3, 0.3, 0.3), width=0.8)
    
    draw_inst(pymupdf.Point(110, 370), "FT-103")
    page.draw_line(pymupdf.Point(110, 358), pymupdf.Point(110, 340), color=(0.3, 0.3, 0.3), width=0.8)
    
    draw_inst(pymupdf.Point(760, 190), "LT-104")
    page.draw_line(pymupdf.Point(750, 190), pymupdf.Point(748, 190), color=(0.3, 0.3, 0.3), width=0.8)
    
    draw_inst(pymupdf.Point(370, 290), "PDT-105")
    page.draw_line(pymupdf.Point(382, 290), pymupdf.Point(410, 290), color=(0.3, 0.3, 0.3), width=0.8)
    
    draw_inst(pymupdf.Point(375, 470), "TI-106")
    page.draw_line(pymupdf.Point(387, 470), pymupdf.Point(415, 470), color=(0.3, 0.3, 0.3), width=0.8)
    
    def draw_valve(center, tag, is_safety=False):
        c = (0.7, 0.2, 0.1) if is_safety else (0.1, 0.4, 0.2)
        page.draw_line(pymupdf.Point(center.x - 8, center.y - 6), pymupdf.Point(center.x + 8, center.y + 6), color=c, width=1.2)
        page.draw_line(pymupdf.Point(center.x - 8, center.y + 6), pymupdf.Point(center.x + 8, center.y - 6), color=c, width=1.2)
        page.draw_line(pymupdf.Point(center.x - 8, center.y - 6), pymupdf.Point(center.x - 8, center.y + 6), color=c, width=1.2)
        page.draw_line(pymupdf.Point(center.x + 8, center.y - 6), pymupdf.Point(center.x + 8, center.y + 6), color=c, width=1.2)
        page.insert_text((center.x - 14, center.y - 10), tag, fontsize=7.5, color=c)

    draw_valve(pymupdf.Point(165, 340), "XV-101", is_safety=True)
    draw_valve(pymupdf.Point(395, 140), "PSV-101A", is_safety=True)
    page.draw_line(pymupdf.Point(445, 150), pymupdf.Point(395, 150), color=(0.2, 0.2, 0.2), width=1)
    page.draw_line(pymupdf.Point(395, 150), pymupdf.Point(395, 146), color=(0.2, 0.2, 0.2), width=1)
    
    draw_valve(pymupdf.Point(495, 140), "PSV-101B", is_safety=True)
    page.draw_line(pymupdf.Point(445, 150), pymupdf.Point(495, 150), color=(0.2, 0.2, 0.2), width=1)
    page.draw_line(pymupdf.Point(495, 150), pymupdf.Point(495, 146), color=(0.2, 0.2, 0.2), width=1)
    
    draw_valve(pymupdf.Point(520, 200), "BDV-101", is_safety=True)
    page.draw_line(pymupdf.Point(480, 200), pymupdf.Point(512, 200), color=(0.2, 0.2, 0.2), width=1)
    
    draw_valve(pymupdf.Point(620, 270), "FCV-102")
    draw_valve(pymupdf.Point(730, 270), "LCV-103")

    doc.save(output_path)
    doc.close()

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    files = {
        "MRPL-SOP-HSE-001.pdf": generate_hse_sop,
        "MRPL-SOP-MEC-201.pdf": generate_pump_sop,
        "MRPL-SOP-OPS-101.pdf": generate_cdu_sop,
        "MRPL-SPEC-HCK-901.pdf": generate_hydrocracker_spec,
        "MRPL-PID-CDU-101.pdf": generate_pid_schematic,
    }
    for filename, gen_fn in files.items():
        target = os.path.join(OUTPUT_DIR, filename)
        gen_fn(target)
        size = os.path.getsize(target)
        print(f"Generated {filename} ({size} bytes)")

if __name__ == "__main__":
    main()

