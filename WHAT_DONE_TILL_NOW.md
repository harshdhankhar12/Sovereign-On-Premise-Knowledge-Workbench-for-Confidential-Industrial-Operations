# Completed Features

### 1. Document Intelligence and Local Vector Retrieval Engine
Allows plant engineers to upload confidential refinery Standard Operating Procedures (SOPs), equipment vendor manuals, and inspection logs for instant offline search.

* **Page-Aware PDF Ingestion:** Parses technical documents page-by-page and extracts clean text while preserving exact page numbers for 1-click verification.
* **Cryptographic Deduplication:** Uses SHA-256 file hashing to immediately identify previously uploaded files, saving storage space and avoiding duplicate processing.
* **Local AI Embeddings:** Converts document text into 768-dimensional mathematical concepts using `nomic-embed-text` running locally through Ollama with zero internet dependency.
* **Sub-Millisecond Semantic Search:** Searches document chunks in PostgreSQL using pgvector and HNSW indexing, allowing engineers to ask questions in plain English and retrieve exact procedure steps.
* **Exact Source Citations:** Every search result returns the specific document title, page number, and similarity confidence score so engineers never receive unverified or hallucinated information.

### 2. Isolated Calculation and Verification Sandbox
Provides a zero-network, mathematically deterministic execution environment to verify engineering formulas and vendor technical claims without AI hallucinations.

* **Abstract Syntax Tree (AST) Security Guard:** Statically validates code before execution to strictly block network calls, shell commands, and unauthorized file access.
* **Resource-Capped Ephemeral Subprocess:** Executes calculations in isolated child processes with disabled socket creation, a 10-second hard timeout, and a 512 MB memory ceiling.
* **Petrochemical Formula Library:** Computes standard industrial formulas including Heat Exchanger Duty (LMTD), Darcy-Weisbach pipe friction and head loss, centrifugal pump power and motor ratings, and plant log sensor outlier detection.
* **Vendor Proposal Cross-Verification:** Mathematically verifies performance numbers quoted in vendor equipment proposals against physical design formulas, calculating discrepancy percentages and tolerance compliance.
* **Spreadsheet Manipulation:** Safely reads and updates plant operational spreadsheets (`.xlsx`) cell-by-cell without corrupting existing formulas or formatting.
* **Immutable Calculation Ledger:** Automatically records every calculation run, input parameter set, python script, execution duration, and verification result into PostgreSQL for safety audit compliance.
