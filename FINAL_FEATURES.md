# Final Features Specification

## Sovereign On-Premise Knowledge Workbench for Confidential Industrial Operations
**Smart India Hackathon 2026** | **Problem Statement SIH26117**  
**Host Organization:** Mangalore Refinery and Petrochemicals Limited (MRPL)

---

## 1. Project Mission & Value Proposition

Industrial facilities like refineries, oil & gas plants, and power stations handle massive volumes of confidential data—piping diagrams (P&IDs), standard operating procedures (SOPs), maintenance logs, and technical calculation spreadsheets. Because this data is mission-critical and proprietary, **it cannot be uploaded to public cloud AI tools** like ChatGPT or Claude.

The **Sovereign On-Premise Knowledge Workbench** is a private, self-contained AI assistant running 100% inside the organization's local network. It automates paperwork, analyzes engineering drawings, and verifies technical calculations with zero internet connection.

---

## 2. Core Feature Catalog

### 1. Document Intelligence (SOPs, Manuals & Inspection Logs)
* **Natural Language Search:** Engineers can search across hundreds of SOPs, safety guidelines, and equipment manuals by asking simple questions in plain English.
* **Smart Summaries:** Automatically condenses lengthy incident reports, vendor technical papers, and shutdown logs into executive summaries.
* **SOP Compliance Checking:** Compares a proposed maintenance step or plant procedure against official SOPs to flag safety or protocol violations.
* **Exact Source Highlighting:** Every response cites the exact document name, page number, and paragraph so engineers can verify the original source with one click.

---

### 2. Engineering Drawing & Visual Intelligence (P&IDs & Blueprints)
* **Equipment Tag Extraction:** Upload scanned Piping & Instrumentation Diagrams (P&IDs) and electrical schematics to automatically extract equipment tags (e.g., `Pump P-204A`, `Exchanger E-101`, `Control Valve CV-12`).
* **Visual Question Answering:** Ask natural questions about diagrams:
  * *"Which isolation valves surround Pump P-204A?"*
  * *"What is the design pressure rating for line 10-HC-402-A1A?"*
* **Drawing Version Diffing:** Compare an as-built drawing against a revised vendor drawing to detect deleted or added lines and valves.
* **Local Vision Processing:** Uses local vision models (`phi3.5-vision`) running on-premise without sending images externally.

---

### 3. Spreadsheet & Tabular Intelligence
* **Data File Ingestion:** Ingests plant operational spreadsheets (`.xlsx`, `.csv`), such as daily log sheets, temperature/pressure logs, and equipment run-hours.
* **Natural Language Data Queries:** Ask questions like: *"Show all compressors running hotter than 80°C in the last 7 days"* without needing to write SQL or complex Excel lookup formulas.
* **Spreadsheet Parameter Updates:** Automatically updates target cells with verified calculations, computes monthly averages, and generates downloadable updated `.xlsx` files.

---

### 4. Isolated Calculation & Verification Sandbox
* **Zero-Hallucination Engineering Math:** AI models can make math mistakes. To prevent this, the workbench writes Python code and executes it in an isolated, offline sandbox to get deterministic, mathematically correct results.
* **Standard Engineering Formulas:** Computes standard petrochemical formulas:
  * Heat Exchanger Duty: $Q = U \cdot A \cdot \Delta T_{lm}$
  * Pipe Flow & Pressure Drop: Darcy-Weisbach equation
  * Pump Head & Power consumption calculations
* **Formula Cross-Verification:** Cross-checks numbers quoted in vendor proposals or approval notes against design formulas to verify their accuracy.
* **Zero-Network Isolation:** The sandbox executes in a restricted runtime with no network access, memory limits, and read-only file access for maximum security.

---

### 5. Automated Engineering Drafting
* **Approval Note Generation:** Automatically drafts formal internal approval notes for equipment modifications, replacements, or chemical dosing changes following company templates.
* **Technical Paper & Proposal Review:** Uploads technical papers from vendors, extracts key operational benefits, and evaluates whether the proposal fits refinery constraints.
* **Shutdown & Turnaround Checklists:** Generates pre-inspection checklists tailored to specific plant equipment before maintenance activities start.

---

### 6. Human-in-the-Loop & Governance
* **Approval Gates:** For sensitive actions (such as generating an official approval note or updating an active operational sheet), the workbench pauses and requires an authorized engineer to review and sign off.
* **Side-by-Side Review Screen:** Displays the generated draft on one side and the cited source documents on the other for fast visual validation.
* **Engineer Override:** Engineers can edit or adjust generated drafts and calculations directly before finalizing.

---

### 7. Sovereign Air-Gap Security & Immutable Audit
* **100% Offline (Air-Gapped):** Runs completely within the plant's local area network. No data leaves the server.
* **Network Egress Verification:** Built-in monitor logs network traffic to prove zero external internet packets leave the server.
* **Immutable Audit Trail:** Logs every interaction to an append-only database table:
  * User/Engineer ID
  * Uploaded document hashes (SHA-256)
  * Exact prompt, retrieved document chunks, and model response
  * Sandbox calculation code and execution output
  * Timestamp of human sign-off

---

### 8. Performance & ROI Tracking
* **Automated Processing Timer:** Automatically times each step of the pipeline from initial upload to final report generation.
* **Productivity Comparison:** Calculates turnaround speed comparing workbench automation (~30 seconds) against manual engineering baselines (~45–60 minutes).
* **ROI Dashboard:** Displays cumulative engineer-hours saved and estimated cost savings across refinery departments.

---

## 3. Real-World Refinery Use Cases

| Scenario | Engineer Input | Workbench Action | Output |
| :--- | :--- | :--- | :--- |
| **SOP Safety Check** | "Can we isolate pump P-102 while line L-40 is live?" | Retrieves SOP-402 & line P&ID; checks valve sequence. | Verified step-by-step isolation procedure with safety warnings and page citations. |
| **Vendor Proposal Review** | Uploads 30-page heat exchanger proposal PDF. | Analyzes specs with Llama 3.1; runs heat duty formula in sandbox. | Concise 2-page evaluation summary with verified duty calculations and flags. |
| **P&ID Valve Identification** | Uploads scanned P&ID drawing image. | Analyzes schematic with Phi 3.5 Vision; maps valve tags. | List of all isolation and control valves with their line IDs. |
| **Spreadsheet Recalculation** | Uploads daily furnace temperature log `.xlsx`. | Runs outlier detection and calculates weighted averages in sandbox. | Updated `.xlsx` with calculated stats and summary approval note draft. |
