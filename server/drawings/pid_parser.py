import io
import re
import math
from typing import List, Dict, Any, Optional, Tuple
import fitz
from PIL import Image, ImageDraw, ImageFont

EQUIPMENT_PATTERNS = [
    (r"\b(C-\d{3,4}[A-Z]?)\b", "EQUIPMENT", "COLUMN"),
    (r"\b(E-\d{3,4}[A-Z]?)\b", "EQUIPMENT", "HEAT_EXCHANGER"),
    (r"\b(P-\d{3,4}[A-Z]?)\b", "EQUIPMENT", "PUMP"),
    (r"\b(V-\d{3,4}[A-Z]?)\b", "EQUIPMENT", "VESSEL"),
    (r"\b(D-\d{3,4}[A-Z]?)\b", "EQUIPMENT", "DRUM"),
    (r"\b(F-\d{3,4}[A-Z]?)\b", "EQUIPMENT", "FURNACE"),
    (r"\b(TK-\d{3,4}[A-Z]?)\b", "EQUIPMENT", "TANK"),
]

INSTRUMENT_PATTERNS = [
    (r"\b(PT-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "PRESSURE_TRANSMITTER"),
    (r"\b(PG-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "PRESSURE_GAUGE"),
    (r"\b(PI-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "PRESSURE_INDICATOR"),
    (r"\b(PDT-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "DIFF_PRESSURE_TRANSMITTER"),
    (r"\b(TT-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "TEMP_TRANSMITTER"),
    (r"\b(TG-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "TEMP_GAUGE"),
    (r"\b(TI-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "TEMP_INDICATOR"),
    (r"\b(FT-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "FLOW_TRANSMITTER"),
    (r"\b(FI-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "FLOW_INDICATOR"),
    (r"\b(LT-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "LEVEL_TRANSMITTER"),
    (r"\b(LG-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "LEVEL_GAUGE"),
    (r"\b(AT-\d{3,4}[A-Z]?)\b", "INSTRUMENT", "ANALYZER_TRANSMITTER"),
]

VALVE_PATTERNS = [
    (r"\b(XV-\d{3,4}[A-Z]?)\b", "VALVE", "EMERGENCY_SHUTDOWN_VALVE"),
    (r"\b(PSV-\d{3,4}[A-Z]?)\b", "VALVE", "SAFETY_RELIEF_VALVE"),
    (r"\b(PRV-\d{3,4}[A-Z]?)\b", "VALVE", "PRESSURE_RELIEF_VALVE"),
    (r"\b(FCV-\d{3,4}[A-Z]?)\b", "VALVE", "FLOW_CONTROL_VALVE"),
    (r"\b(PCV-\d{3,4}[A-Z]?)\b", "VALVE", "PRESSURE_CONTROL_VALVE"),
    (r"\b(LCV-\d{3,4}[A-Z]?)\b", "VALVE", "LEVEL_CONTROL_VALVE"),
    (r"\b(TCV-\d{3,4}[A-Z]?)\b", "VALVE", "TEMP_CONTROL_VALVE"),
    (r"\b(CV-\d{3,4}[A-Z]?)\b", "VALVE", "CONTROL_VALVE"),
    (r"\b(MOV-\d{3,4}[A-Z]?)\b", "VALVE", "MOTOR_OPERATED_VALVE"),
    (r"\b(BDV-\d{3,4}[A-Z]?)\b", "VALVE", "BLOWDOWN_VALVE"),
]

LINE_PATTERNS = [
    (r"\b(\d{1,2}\"-[A-Z0-9]+-\d{3,4}(?:-[A-Z0-9]+)?)\b", "LINE", "PROCESS_PIPING"),
]

ALL_PATTERNS = LINE_PATTERNS + VALVE_PATTERNS + INSTRUMENT_PATTERNS + EQUIPMENT_PATTERNS

def classify_tag(token: str) -> Optional[Tuple[str, str, str]]:
    clean = token.strip().upper()
    for pattern, cat, sub in ALL_PATTERNS:
        m = re.search(pattern, clean)
        if m:
            return m.group(1), cat, sub
    return None

def parse_drawing_entities(doc_bytes: bytes) -> Dict[str, Any]:
    doc = fitz.open(stream=doc_bytes, filetype="pdf")
    detected_entities: List[Dict[str, Any]] = []
    seen_tags: set = set()

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        words = page.get_text("words")

        for w in words:
            x0, y0, x1, y1, word_text = w[0], w[1], w[2], w[3], w[4]
            match_res = classify_tag(word_text)
            if match_res:
                tag, cat, sub = match_res
                key = (page_idx + 1, tag)
                if key not in seen_tags:
                    seen_tags.add(key)
                    cx = (x0 + x1) / 2.0
                    cy = (y0 + y1) / 2.0
                    detected_entities.append({
                        "tag": tag,
                        "entity_type": cat,
                        "sub_type": sub,
                        "page_number": page_idx + 1,
                        "bbox": [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)],
                        "center": [round(cx, 2), round(cy, 2)],
                        "raw_text": word_text,
                    })

    doc.close()

    equip_count = sum(1 for e in detected_entities if e["entity_type"] == "EQUIPMENT")
    inst_count = sum(1 for e in detected_entities if e["entity_type"] == "INSTRUMENT")
    valve_count = sum(1 for e in detected_entities if e["entity_type"] == "VALVE")
    line_count = sum(1 for e in detected_entities if e["entity_type"] == "LINE")

    return {
        "total_entities": len(detected_entities),
        "equipment_count": equip_count,
        "instruments_count": inst_count,
        "valves_count": valve_count,
        "lines_count": line_count,
        "entities": detected_entities,
    }

def trace_equipment_network(
    entities: List[Dict[str, Any]],
    target_tag: str,
    radius_px: float = 300.0,
) -> Dict[str, Any]:
    norm_target = target_tag.strip().upper()
    target_entity = None

    for e in entities:
        if e["tag"].upper() == norm_target:
            target_entity = e
            break

    if not target_entity:
        return {
            "target_tag": norm_target,
            "target_entity": None,
            "connected_instruments": [],
            "connected_valves": [],
            "connected_lines": [],
            "total_associated": 0,
        }

    t_page = target_entity["page_number"]
    tx, ty = target_entity["center"][0], target_entity["center"][1]

    instruments = []
    valves = []
    lines = []

    for e in entities:
        if e["tag"].upper() == norm_target:
            continue
        if e["page_number"] != t_page:
            continue

        ex, ey = e["center"][0], e["center"][1]
        dist = math.sqrt((ex - tx) ** 2 + (ey - ty) ** 2)

        if dist <= radius_px:
            item = dict(e)
            item["distance_px"] = round(dist, 1)

            if e["entity_type"] == "INSTRUMENT":
                instruments.append(item)
            elif e["entity_type"] == "VALVE":
                valves.append(item)
            elif e["entity_type"] == "LINE":
                lines.append(item)

    instruments.sort(key=lambda x: x["distance_px"])
    valves.sort(key=lambda x: x["distance_px"])
    lines.sort(key=lambda x: x["distance_px"])

    total = len(instruments) + len(valves) + len(lines)

    return {
        "target_tag": norm_target,
        "target_entity": target_entity,
        "connected_instruments": instruments,
        "connected_valves": valves,
        "connected_lines": lines,
        "total_associated": total,
    }

def render_annotated_drawing(
    doc_bytes: bytes,
    page_num: int = 1,
    entities: Optional[List[Dict[str, Any]]] = None,
    target_tag: Optional[str] = None,
    dpi: int = 150,
) -> bytes:
    doc = fitz.open(stream=doc_bytes, filetype="pdf")
    if page_num < 1 or page_num > len(doc):
        page_num = 1

    page = doc[page_num - 1]
    pix = page.get_pixmap(dpi=dpi)
    img_data = pix.tobytes("png")
    doc.close()

    image = Image.open(io.BytesIO(img_data)).convert("RGB")
    draw = ImageDraw.Draw(image)

    scale = dpi / 72.0

    color_map = {
        "EQUIPMENT": (30, 144, 255),
        "INSTRUMENT": (46, 204, 113),
        "VALVE": (231, 76, 60),
        "LINE": (155, 89, 182),
    }

    norm_target = target_tag.strip().upper() if target_tag else None

    if entities:
        for e in entities:
            if e.get("page_number") != page_num:
                continue

            tag = e["tag"].upper()
            etype = e.get("entity_type", "EQUIPMENT")
            bbox = e["bbox"]

            x0 = bbox[0] * scale
            y0 = bbox[1] * scale
            x1 = bbox[2] * scale
            y1 = bbox[3] * scale

            is_target = norm_target and (tag == norm_target)
            box_color = (255, 215, 0) if is_target else color_map.get(etype, (100, 100, 100))
            width = 4 if is_target else 2

            draw.rectangle([x0 - 2, y0 - 2, x1 + 2, y1 + 2], outline=box_color, width=width)
            draw.text((x0, max(0, y0 - 12)), tag, fill=box_color)

    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()

