'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Factory,
  ArrowLeft,
  ShieldCheck,
  MessageSquareText,
  FileText,
  Calculator,
  Layers,
  ShieldAlert,
  ClipboardCheck,
  Activity,
  FileCheck2,
  Lock,
  Cpu,
  Database,
  CheckCircle2,
  Terminal,
  Zap,
  BookOpen
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const navItems = [
    { id: 'overview', label: '1. System Overview & Air-Gap Mandate', icon: ShieldCheck },
    { id: 'quickstart', label: '2. Offline Launch & Verification', icon: Terminal },
    { id: 'tab1-chat', label: 'Tab 1: Sovereign Multi-Agent Chat', icon: MessageSquareText },
    { id: 'tab2-docs', label: 'Tab 2: Document Intelligence (PDF Upload)', icon: FileText },
    { id: 'tab3-sandbox', label: 'Tab 3: Deterministic Physics Sandbox', icon: Calculator },
    { id: 'tab4-pid', label: 'Tab 4: P&ID Schematic Explorer', icon: Layers },
    { id: 'tab5-audit', label: 'Tab 5: Cryptographic Audit Ledger', icon: ShieldAlert },
    { id: 'tab6-governance', label: 'Tab 6: Drafting, Governance & MOC', icon: ClipboardCheck },
    { id: 'tab7-telemetry', label: 'Tab 7: DCS Telemetry & Live Incidents', icon: Activity },
    { id: 'tab8-investigation', label: 'Tab 8: Shift Handover & 5-Why RCA', icon: FileCheck2 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 text-white p-2 rounded-md">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                    SOVEREIGN INDUSTRIAL WORKBENCH
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-mono font-medium border border-slate-200">
                    DOCUMENTATION &amp; USER GUIDE
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Mangalore Refinery &amp; Petrochemicals Limited (MRPL) • Smart India Hackathon 2026 (SIH26117)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded transition flex items-center space-x-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Operational Console</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 space-y-2">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm sticky top-24">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-2">
                Table of Contents
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full text-left px-3 py-2.5 rounded text-xs font-medium flex items-center space-x-2.5 transition ${
                        isActive
                          ? 'bg-slate-900 text-white font-semibold shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-500 space-y-1">
                <div>Air-Gapped: 100% On-Premise</div>
                <div>Zero Cloud API Dependencies</div>
                <div>Hash Verification: SHA-256 Ledger</div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-8 space-y-8">
            {activeSection === 'overview' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">1. System Overview &amp; Air-Gap Mandate</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Problem Statement: SIH26117 • Refinery Operations Division</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    The <strong>Sovereign On-Premise Knowledge Workbench</strong> is engineered specifically for confidential industrial operations at Mangalore Refinery and Petrochemicals Limited (MRPL). It solves the critical operational risk of leaking sensitive refinery operating limits, proprietary catalyst kinetics, and plant schematics to external commercial cloud AI endpoints.
                  </p>
                  <p>
                    Every query, document chunk, vector embedding, calculation run, and approval note executes <strong>100% locally on-premise</strong> with mathematical zero network egress.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-700" />
                      <span>Local Inference</span>
                    </div>
                    <p className="text-slate-600">llama3.2:1b &amp; nomic-embed-text running through local Ollama on 127.0.0.1:11434 with zero cloud fallbacks.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Database className="w-3.5 h-3.5 text-slate-700" />
                      <span>PostgreSQL &amp; pgvector</span>
                    </div>
                    <p className="text-slate-600">768-dimensional local vector indexing with HNSW cosine similarity and Row-Level Security clearance tiers.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-700" />
                      <span>SHA-256 Hash Chain</span>
                    </div>
                    <p className="text-slate-600">Tamper-evident audit ledger cryptographically chaining every action, calculation, and MOC sign-off.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'quickstart' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">2. Offline Launch &amp; Air-Gap Verification</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">How to boot and prove zero network egress to evaluators</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Step 1: Starting the Local Backend</h3>
                  <div className="bg-slate-900 text-slate-100 rounded p-3 font-mono text-xs">
                    cd C:\capstone<br />
                    uvicorn server.main:app --host 0.0.0.0 --port 8000
                  </div>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Step 2: Starting the Next.js Frontend</h3>
                  <div className="bg-slate-900 text-slate-100 rounded p-3 font-mono text-xs">
                    cd C:\capstone\client<br />
                    pnpm dev
                  </div>
                  <p className="text-xs text-slate-600">Open your browser at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">http://localhost:3000</code>.</p>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Step 3: Proving Zero External Egress</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs space-y-2">
                    <p className="text-slate-700">1. Disconnect laptop WiFi / Ethernet completely.</p>
                    <p className="text-slate-700">2. In a separate terminal, execute the automated air-gap verification script:</p>
                    <div className="bg-slate-900 text-slate-100 rounded p-2.5 font-mono text-xs">
                      python scripts/verify_air_gap_egress.py
                    </div>
                    <p className="text-slate-600">
                      This script tests raw socket outbound calls to external cloud AI endpoints (intercepted and blocked), triggers malicious AST sandbox code (intercepted), and audits the database to verify exactly <strong>0 egress bytes</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tab1-chat' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 1: Sovereign Multi-Agent Inquiry (Chat)</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Offline conversational intelligence with deterministic reasoning timelines</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    <strong>What it does:</strong> Allows plant engineers to query complex operational procedures, shutdown protocols, and engineering formulas in plain English.
                  </p>
                  <p>
                    <strong>How to use:</strong> Select an operational query preset (e.g. <em>&quot;Under SOP ESD-101, what are the mandatory steps to isolate column C-101?&quot;</em>) or type a custom question, then click <strong>Run Sovereign Multi-Agent Inquiry</strong>.
                  </p>
                  <p>
                    <strong>What happens behind the scenes:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li><strong>Intent Classification:</strong> Classifies prompt into SOP inquiry, physics calculation, or vendor verification.</li>
                    <li><strong>Vector Search:</strong> Queries 768-dimensional embeddings in PostgreSQL with pgvector, constrained by your active clearance level.</li>
                    <li><strong>Math Sandbox:</strong> If physics formulas or claims are detected, routes them to the isolated calculation sandbox.</li>
                    <li><strong>Synthesis:</strong> Local llama3.2:1b formats the final answer citing exact document names and page numbers.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'tab2-docs' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 2: Document Intelligence &amp; Vector RAG (PDF Upload)</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Where confidential SOPs, vendor manuals, and inspection sheets are ingested</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    <strong>Where to upload PDFs:</strong> Use the drag-and-drop file uploader at the top of Tab 2.
                  </p>
                  <p>
                    <strong>Step-by-step ingestion:</strong>
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-600">
                    <li>Select a technical PDF from your laptop (e.g. from <code className="bg-slate-100 px-1 rounded font-mono">c:\capstone\uploads</code>).</li>
                    <li>Select the target Plant Unit (e.g. <code className="font-mono">CDU</code>, <code className="font-mono">FCCU</code>, <code className="font-mono">HCU</code>).</li>
                    <li>Assign the Confidentiality Clearance Tier: <code className="font-mono">PUBLIC</code>, <code className="font-mono">INTERNAL</code>, <code className="font-mono">RESTRICTED</code>, or <code className="font-mono">SECRET</code>.</li>
                    <li>Click <strong>Ingest &amp; Vectorize Document</strong>.</li>
                  </ol>
                  <p>
                    <strong>What happens:</strong> The server computes a SHA-256 hash to deduplicate files, parses pages via PyMuPDF, extracts text chunks, embeds them locally via <code className="font-mono">nomic-embed-text</code>, and creates HNSW vector indices in PostgreSQL.
                  </p>
                  <p>
                    <strong>Row-Level Security:</strong> Test searching for <em>&quot;catalyst kinetics&quot;</em> as an Operator (0 results returned) vs as a Plant Manager (secret SOP chunks unlocked).
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'tab3-sandbox' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 3: Deterministic Physics Sandbox</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Mathematically verified engineering calculations without LLM hallucinations</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    <strong>Why it exists:</strong> Large language models are prone to mathematical hallucinations when calculating pressure drops, heat loads, or pump kW. The sandbox executes real deterministic Python physics formulas in a zero-network child process.
                  </p>
                  <p>
                    <strong>Available calculators:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li><strong>Heat Exchanger Duty (LMTD):</strong> Computes thermal duty in kW, corrected log-mean temperature difference, and effective overall heat transfer coefficient (U).</li>
                    <li><strong>Darcy-Weisbach Hydraulic Friction:</strong> Calculates Reynolds number, Colebrook-White friction factor (f), and pressure drop (bar).</li>
                    <li><strong>Centrifugal Pump Sizing:</strong> Calculates hydraulic power, motor brake kW, and safety head margins under API 610.</li>
                    <li><strong>Vendor Claim Discrepancy Verifier:</strong> Compares vendor quote claims against physical design laws and flags discrepancies exceeding 5% tolerance.</li>
                  </ul>
                  <p>
                    <strong>AST Security Test:</strong> Click the red <em>&quot;Test Malicious Code&quot;</em> button to demonstrate how Abstract Syntax Tree validation blocks unauthorized network sockets and shell commands.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'tab4-pid' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 4: P&amp;ID Schematic Explorer</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Multimodal engineering drawing intelligence and spatial connectivity tracing</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    <strong>What it does:</strong> Analyzes Piping &amp; Instrumentation Diagrams (P&amp;IDs) to identify ISA-5.1 tags, trace connected safety relief valves and instruments, and render visual overlays.
                  </p>
                  <p>
                    <strong>How to use:</strong> Select the pre-loaded <code className="font-mono">MRPL-PID-CDU-101.pdf</code> schematic. Click any entity on the left (e.g. Column <code className="font-mono">T-101</code>, Pump <code className="font-mono">P-101A</code>, or Valve <code className="font-mono">XV-101</code>).
                  </p>
                  <p>
                    <strong>Spatial Proximity Tracing:</strong> The middle panel dynamically displays all transmitters, relief valves (<code className="font-mono">PSV-101A</code>, <code className="font-mono">BDV-101</code>), and process lines directly connected to the selected equipment.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'tab5-audit' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 5: Cryptographic Audit Ledger</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Blockchain-inspired SHA-256 tamper-evident hash chain for safety compliance</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    <strong>How it works:</strong> Every operational event (user query, document chunk view, sandbox calculation, MOC sign-off) is hashed using SHA-256 and chained to the previous record&apos;s hash.
                  </p>
                  <p>
                    <strong>1-Click Ledger Verifier:</strong> Click <strong>Verify Ledger Integrity</strong> to recalculate the mathematical hash sequence from genesis to latest in real time. If any row is tampered with or modified in PostgreSQL, an alarm triggers pinpointing the exact corrupted sequence ID.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'tab6-governance' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 6: Drafting, Governance &amp; MOC Notes</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Automated technical drafting, human sign-offs, watermarked PDF export, and ROI metrics</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    <strong>What it does:</strong> Transforms informal engineering observations into formal Management of Change (MOC) notes grounded in cited SOPs and verified sandbox physics.
                  </p>
                  <p>
                    <strong>Governance Workflow:</strong>
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-600">
                    <li>Select a drafting preset or enter a custom prompt, then click <strong>Generate Draft Note</strong>.</li>
                    <li>Lead engineers can review the 5-section AI draft and make inline edits.</li>
                    <li>Click <strong>Sign &amp; Approve (Cryptographic Seal)</strong> to generate an immutable SHA-256 signature stamp.</li>
                    <li>Click <strong>Download PDF</strong> to export an official MRPL branded memorandum.</li>
                  </ol>
                  <p>
                    <strong>ROI Metrics:</strong> Displays real-time metrics showing total engineer hours saved and estimated cost savings in INR (@ ₹1,500/hr baseline rate).
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'tab7-telemetry' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 7: DCS Telemetry &amp; Live Incidents</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Real-time SCADA/DCS process stream simulator and SOP emergency checklist synthesis</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    <strong>What it does:</strong> Simulates live Distributed Control System (DCS) process streams for CDU-1, FCCU, and HCU units.
                  </p>
                  <p>
                    <strong>Fault Injection Simulator:</strong> Click any scenario button (e.g. <em>CDU Furnace Overheat TT-102 &gt; 385°C</em>).
                  </p>
                  <p>
                    <strong>Automated SOP Cross-Correlation:</strong> The system detects the trip threshold, identifies the governing procedure (<code className="font-mono">MRPL-SOP-OPS-101</code>) and connected safety valves (<code className="font-mono">XV-101</code>, <code className="font-mono">BDV-101</code>), and automatically generates an interactive 5-step emergency execution checklist.
                  </p>
                  <p>
                    Operators can click <strong>Sign-Off Step</strong> to acknowledge safety actions with cryptographic audit logging.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'tab8-investigation' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 8: Shift Handover &amp; 5-Why RCA</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Autonomous shift logs, dual-signatory custody transfer, and 5-Why root cause analysis</p>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    <strong>Shift Handover Intelligence:</strong> Select a shift period (<code className="font-mono">MORNING</code>, <code className="font-mono">EVENING</code>, <code className="font-mono">NIGHT</code>) and click <strong>Synthesize Shift Handover</strong>. It reads active alarms, equipment lineups, and pending MOCs directly from the audit ledger. Outgoing and relieving engineers complete a dual-signature seal and export a signed PDF.
                  </p>
                  <p>
                    <strong>5-Why Incident Investigation:</strong> Select an incident preset (e.g. <em>FCCU Slurry Pump Trip</em>) and click <strong>Run 5-Why Causal Investigation</strong>. The engine builds a 5-level causal tree (Why 1 → Why 2 → Why 3 → Why 4 → Why 5) with cited evidence, assigns Corrective &amp; Preventive Actions (CAPA) with deadlines, and generates an official signed RCA PDF report.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-mono">
        SOVEREIGN WORKBENCH • SMART INDIA HACKATHON 2026 (SIH26117) • MANGALORE REFINERY &amp; PETROCHEMICALS LIMITED (MRPL)
      </footer>
    </div>
  );
}
