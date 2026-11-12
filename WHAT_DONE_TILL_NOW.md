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

### 3. LangGraph Multi-Agent Orchestration Core and Sovereign Document Chat
Allows plant engineers to chat with refinery documents, ask operational questions, and run engineering workflows through an autonomous multi-agent pipeline powered 100% locally by Ollama.

* **Deterministic Intent Classification:** Analyzes user questions using local `llama3.2:1b` to automatically route requests between document knowledge retrieval, engineering calculation execution, or direct operational assistance.
* **Stateful Multi-Agent Workflow:** Orchestrates specialized pipeline nodes (`intent_node`, `retrieval_node`, `sandbox_node`, `verifier_node`, `synthesis_node`) using LangGraph with complete state isolation and conditional branching.
* **Evidence-Grounded AI Synthesis:** Answers technical queries strictly based on retrieved SOP chunks, citing exact document titles, page numbers, and safety warnings with zero external internet access.
* **Autonomous Math Handoff:** Identifies formula queries, routes inputs directly into the isolated calculation sandbox, and delivers verified physical results within the chat response.
* **Audit-Ready Task Ledger:** Automatically records every chat session, intent category, pipeline step duration, and citations into PostgreSQL for full compliance tracking.

### 4. Asynchronous Task Queue and Live WebSocket Step Streaming
Allows plant engineers to run heavy multi-agent workflows and calculations asynchronously without freezing the interface, watching reasoning steps live via WebSockets.

* **Redis-Backed FIFO Task Queue:** Offloads long-running AI queries and multi-step formula calculations into a dedicated Redis queue, allowing the server to accept requests immediately with HTTP 202 status.
* **Live WebSocket Step Streaming:** Streams real-time lifecycle events (`TASK_STARTED`, `STEP_STARTED`, `STEP_COMPLETED`, `TASK_COMPLETED`) directly to the user interface via `/ws/tasks/{task_id}`.
* **Background Worker Engine:** Runs an asynchronous consumer loop inside the FastAPI lifecycle to process queued tasks, execute agent graphs, and write results to the database without dropping connections.
* **Granular Step Transparency:** Emits exact node status and timing metrics for each pipeline stage (Intent Analysis, Vector Search, Math Sandbox, Engineering Synthesis) so engineers see full reasoning visibility.
* **Bidirectional Task Controls:** Supports live client ping/pong keepalive signals and asynchronous task cancellation flags, allowing operators to halt long-running tasks immediately.
* **Queue Telemetry and Status Polling:** Provides endpoints to monitor queue depth, active worker health, and percentage-based task progress for non-WebSocket clients.

### 5. Multimodal Engineering Drawing and P&ID Intelligence Engine
Allows plant engineers to upload Piping and Instrumentation Diagrams (P&IDs) and technical schematics to automatically locate equipment, trace instrumentation networks, and run visual engineering queries.

* **Multi-Class Tag and Symbol Recognition:** Automatically detects and categorizes industrial tags across ISA-5.1 standards including major equipment (columns, exchangers, pumps, vessels), instrumentation (pressure, temperature, flow transmitters), safety valves (XV, PSV, BDV), and piping line specifications.
* **Spatial Proximity and Connectivity Tracing:** Uses geometric distance calculations to determine which safety valves, transmitters, and piping lines are directly connected or adjacent to any selected equipment piece.
* **Interactive Bounding Box Coordinate Mapping:** Extracts precise coordinate boundaries for every identified component, allowing user interfaces to highlight tags with 1-click inspection.
* **High-Resolution Vector Rasterization:** Generates high-definition visual representations of schematic pages with color-coded bounding box overlays for equipment, instruments, and isolation valves.
* **Topological Schematic Q&A:** Allows engineers to ask natural language questions about technical drawings, combining extracted spatial connectivity with local AI reasoning to deliver accurate operational answers.



