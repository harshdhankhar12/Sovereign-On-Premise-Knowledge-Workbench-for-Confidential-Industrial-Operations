import os
from typing import List, Dict, Any, Optional
import openpyxl

def update_excel_cells(
    file_path: str,
    updates: List[Dict[str, Any]],
    output_path: Optional[str] = None,
) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source Excel file not found: {file_path}")

    wb = openpyxl.load_workbook(file_path)
    for item in updates:
        sheet_name = item.get("sheet")
        cell_ref = item.get("cell")
        val = item.get("value")

        if sheet_name and sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
        else:
            ws = wb.active

        ws[cell_ref] = val

    save_path = output_path or file_path
    wb.save(save_path)
    wb.close()
    return save_path

def inspect_excel_structure(file_path: str) -> Dict[str, Any]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Excel file not found: {file_path}")

    wb = openpyxl.load_workbook(file_path, data_only=True)
    summary = {
        "file_path": file_path,
        "sheets": [],
    }

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        headers = []
        for cell in ws[1]:
            if cell.value is not None:
                headers.append(str(cell.value))

        summary["sheets"].append({
            "name": sheet_name,
            "max_row": ws.max_row,
            "max_column": ws.max_column,
            "headers": headers,
        })

    wb.close()
    return summary

