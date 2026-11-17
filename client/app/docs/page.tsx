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
  BookOpen,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface DocsSummaryProps {
  why: string;
  what: string;
  how: React.ReactNode;
}

function DocsExecutiveSummary({ why, what, how }: DocsSummaryProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-700 font-bold">
            Executive Summary &amp; Protocol Guide
          </span>
        </div>
        <span className="inline-flex items-center text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
          AIR-GAPPED SOVEREIGN
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="space-y-1.5 bg-amber-50/40 p-3.5 rounded-lg border border-amber-200/70">
          <div className="font-bold text-amber-800 uppercase text-[11px] tracking-wide flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Why This Exists</span>
          </div>
          <p className="text-slate-700 leading-relaxed font-sans">{why}</p>
        </div>
        <div className="space-y-1.5 bg-blue-50/40 p-3.5 rounded-lg border border-blue-200/70">
          <div className="font-bold text-blue-800 uppercase text-[11px] tracking-wide flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>What It Does</span>
          </div>
          <p className="text-slate-700 leading-relaxed font-sans">{what}</p>
        </div>
        <div className="space-y-1.5 bg-indigo-50/40 p-3.5 rounded-lg border border-indigo-200/70">
          <div className="font-bold text-indigo-800 uppercase text-[11px] tracking-wide flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>How To Use</span>
          </div>
          <div className="text-slate-700 leading-relaxed font-sans">{how}</div>
        </div>
      </div>
    </div>
  );
}

function CodeSnippet({ code, label = 'Terminal Command' }: { code: string; label?: string }) {
  return (
    <div className="my-2.5 rounded-lg overflow-hidden border border-slate-200 shadow-2xs bg-slate-900">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/90 border-b border-slate-700/60 text-[11px] font-mono text-slate-300">
        <span>{label}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Offline Safe</span>
      </div>
      <pre className="p-3 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const navItems = [
    { id: 'overview', label: '1. System Overview & Air-Gap Mandate', icon: ShieldCheck },
    { id: 'quickstart', label: '2. Offline Launch & Verification', icon: Terminal },
    { id: 'tab1-chat', label: 'Tab 1: Ask Refinery AI (Multi-Agent Chat)', icon: MessageSquareText },
    { id: 'tab2-docs', label: 'Tab 2: Upload & Search Documents', icon: FileText },
    { id: 'tab3-sandbox', label: 'Tab 3: Industrial Physics Calculator', icon: Calculator },
    { id: 'tab4-pid', label: 'Tab 4: P&ID Drawing Explorer', icon: Layers },
    { id: 'tab5-audit', label: 'Tab 5: Safety Audit Ledger', icon: ShieldAlert },
    { id: 'tab6-governance', label: 'Tab 6: Drafting, Review & MOC Notes', icon: ClipboardCheck },
    { id: 'tab7-telemetry', label: 'Tab 7: Live DCS Telemetry & Emergency Lists', icon: Activity },
    { id: 'tab8-investigation', label: 'Tab 8: Shift Handover & 5-Why Investigation', icon: FileCheck2 },
    { id: 'tab9-universal', label: 'Tab 9: Universal AI Document Chat (Generic RAG)', icon: Bot },
  ];

  const currentIdx = navItems.findIndex((n) => n.id === activeSection);
  const prevSection = currentIdx > 0 ? navItems[currentIdx - 1] : null;
  const nextSection = currentIdx < navItems.length - 1 ? navItems[currentIdx + 1] : null;

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-2 rounded-lg shadow-2xs shrink-0">
                <Factory className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base md:text-lg truncate">
                    SOVEREIGN INDUSTRIAL WORKBENCH
                  </span>
                  <span className="bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 rounded-md font-mono font-semibold border border-blue-200/70 shrink-0">
                    DOCUMENTATION &amp; GUIDE
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block truncate">
                  Mangalore Refinery &amp; Petrochemicals Limited (MRPL) • Smart India Hackathon 2026 (SIH26117)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Link
                href="/"
                className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 transition flex items-center space-x-1.5 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Console</span>
                <span className="sm:hidden">Console</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        {/* Mobile Navigation Dropdown & Carousel */}
        <div className="lg:hidden mb-6 bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="mobile-docs-select" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Select Module Guide
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {currentIdx + 1} of {navItems.length}
            </span>
          </div>

          <div className="relative">
            <select
              id="mobile-docs-select"
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs sm:text-sm font-medium rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs pr-8"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-xs">
            <button
              onClick={() => prevSection && setActiveSection(prevSection.id)}
              disabled={!prevSection}
              className="text-slate-600 hover:text-slate-900 disabled:opacity-30 flex items-center space-x-1 py-1.5 px-2.5 rounded-md hover:bg-slate-100 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">
              {navItems[currentIdx].label.replace(/^[0-9.]+\s*|Tab\s*\d+:\s*/g, '')}
            </span>

            <button
              onClick={() => nextSection && setActiveSection(nextSection.id)}
              disabled={!nextSection}
              className="text-slate-600 hover:text-slate-900 disabled:opacity-30 flex items-center space-x-1 py-1.5 px-2.5 rounded-md hover:bg-slate-100 transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 space-y-2">
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs sticky top-24">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-2 flex items-center justify-between">
                <span>Table of Contents</span>
                <span className="text-[10px] font-mono text-slate-400">11 SECTIONS</span>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center space-x-2.5 transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200/80 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Air-Gapped: 100% On-Premise</span>
                </div>
                <div className="text-slate-600 pl-3">Zero External Cloud Calls</div>
                <div className="text-slate-600 pl-3">SHA-256 Cryptographic Chain</div>
              </div>
            </div>
          </aside>

          {/* Section Body */}
          <section className="lg:col-span-8 space-y-8">
            {activeSection === 'overview' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    1. System Overview &amp; Air-Gap Mandate
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Problem Statement: SIH26117 • Refinery Operations Division</p>
                </div>

                <DocsExecutiveSummary
                  why="Refineries handle trade secrets and critical national infrastructure. Sending queries to commercial cloud AI leaks formulas and schematics."
                  what="Runs complete AI models, vector search, physics math, and audit logging 100% locally on-premise with zero external internet traffic."
                  how="Turn off laptop WiFi. Everything continues working smoothly. An automated audit check proves exactly 0 bytes leave the machine."
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3.5 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span>Local Inference</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      llama3.2:1b &amp; nomic-embed-text running through local Ollama with zero internet dependency.
                    </p>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3.5 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Database className="w-4 h-4 text-indigo-600" />
                      <span>PostgreSQL &amp; pgvector</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      768-dimensional local vector indexing with clearance security levels (Public, Internal, Restricted, Secret).
                    </p>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3.5 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span>SHA-256 Hash Chain</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Tamper-evident audit ledger cryptographically chaining every action, calculation, and MOC sign-off.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'quickstart' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    2. Offline Launch &amp; Air-Gap Verification
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Quick instructions to start and prove zero-egress to evaluators</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                      Step 1: Starting the Local Backend
                    </h3>
                    <CodeSnippet code={`cd C:\\capstone\nuvicorn server.main:app --host 0.0.0.0 --port 8000`} label="Backend Server" />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                      Step 2: Starting the Next.js Frontend
                    </h3>
                    <CodeSnippet code={`cd C:\\capstone\\client\npnpm dev`} label="Frontend Client" />
                    <p className="text-xs text-slate-600 mt-1.5">
                      Open your browser at <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">http://localhost:3000</code>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                      Step 3: Proving Zero External Internet Traffic
                    </h3>
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-4 text-xs space-y-2.5">
                      <p className="text-slate-700 font-medium">1. Disconnect laptop WiFi / Ethernet completely.</p>
                      <p className="text-slate-700 font-medium">2. Run the automated air-gap test suite:</p>
                      <CodeSnippet code="python scripts/verify_air_gap_egress.py" label="Air-Gap Automated Audit" />
                      <p className="text-slate-600 leading-relaxed">
                        The test attempts outbound socket calls (blocked), triggers dangerous sandbox syscalls (blocked), and verifies the database ledger records exactly <strong>0 egress bytes</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tab1-chat' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 1: Ask Refinery AI (Sovereign Multi-Agent Chat)
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Natural language questions grounded strictly in refinery procedures</p>
                </div>

                <DocsExecutiveSummary
                  why="Refinery operators cannot afford to spend 20 minutes flipping through 300-page paper binders during an emergency column trip."
                  what="Reads indexed SOPs page-by-page, classifies the question, runs physics if math is needed, and provides step-by-step instructions with exact citations."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Click an active document pill or preset.</li>
                      <li>Click &quot;Dispatch Query&quot;.</li>
                      <li>Read the verified answer and check citations.</li>
                    </ol>
                  }
                />

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 pt-2">
                  <p>
                    <strong>What data the AI reads:</strong> Above the chat prompt, the <em>&quot;Active Grounding Documents&quot;</em> toolbar shows all indexed files in PostgreSQL (<code className="font-mono text-xs">MRPL-SOP-OPS-101</code>, <code className="font-mono text-xs">MRPL-SOP-MEC-201</code>, <code className="font-mono text-xs">MRPL-SOP-HSE-001</code>, <code className="font-mono text-xs">MRPL-SPEC-HCK-901</code>, plus any newly uploaded PDFs).
                  </p>
                  <p>
                    <strong>Live Reasoning Timeline:</strong> The right panel displays the 5 stages as they execute live via WebSockets:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                    <li><strong>Intent Classifier:</strong> Checks whether the question asks for a procedure, calculation, or vendor check.</li>
                    <li><strong>Vector Retrieval:</strong> Finds relevant paragraphs matching your security clearance.</li>
                    <li><strong>Math Sandbox:</strong> Runs deterministic formulas if numbers are detected.</li>
                    <li><strong>Cross-Verifier:</strong> Confirms results obey physical engineering limits.</li>
                    <li><strong>Report Synthesis:</strong> Formats clean answers with bold tags, bullet points, and exact page citations.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'tab2-docs' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 2: Upload &amp; Search Documents (Document Intelligence)
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Where confidential SOPs and vendor manuals are indexed and searched</p>
                </div>

                <DocsExecutiveSummary
                  why="Refineries have thousands of confidential procedures across different units. Unrestricted access risks trade secrets, while lost files delay operations."
                  what="Chunks and embeds technical PDFs locally into pgvector, tagged by plant unit (CDU, VDU, FCCU) and security clearance (Public to Secret)."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Choose a PDF file, title, and clearance level.</li>
                      <li>Click &quot;Upload &amp; Index Document&quot;.</li>
                      <li>Click &quot;Chat with this Doc&quot; to ask questions immediately.</li>
                    </ol>
                  }
                />

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 pt-2">
                  <p>
                    <strong>Clearance Levels Explained:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                    <li><code className="font-mono font-bold text-slate-800">PUBLIC:</code> General safety orientation, muster stations, PPE guidelines. Accessible by everyone.</li>
                    <li><code className="font-mono font-bold text-slate-800">INTERNAL:</code> Mechanical maintenance SOPs, pump switchovers, seal barrier checks.</li>
                    <li><code className="font-mono font-bold text-slate-800">RESTRICTED:</code> Unit shutdown protocols, furnace trips, emergency bypass sequences.</li>
                    <li><code className="font-mono font-bold text-slate-800">SECRET:</code> Proprietary catalyst kinetic models and reaction yield optimization formulas.</li>
                  </ul>
                  <p>
                    <strong>Testing Clearance Gates:</strong> Try searching for <em>&quot;catalyst kinetics&quot;</em> as an Operator (0 results returned). Then switch your role to Plant Manager in the header—the secret chunks unlock immediately!
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'tab3-sandbox' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 3: Industrial Physics Calculator (Math Sandbox)
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Real mathematical engineering calculations with zero hallucinations</p>
                </div>

                <DocsExecutiveSummary
                  why="LLMs guess and hallucinate numbers. In a refinery, trusting a fake heat duty or pump kW could blow a seal or cause a thermal runaway."
                  what="Executes real Python physics formulas in a locked child process with zero network access and strict 10-second resource limits."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Select a formula (LMTD, Darcy, Pump).</li>
                      <li>Adjust parameters or claimed values.</li>
                      <li>Click &quot;Execute Deterministic Verification&quot;.</li>
                    </ol>
                  }
                />

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 pt-2">
                  <p>
                    <strong>Vendor Claim Verifier:</strong> Enter the vendor&apos;s quoted duty (e.g. 1,850 kW). The sandbox runs the actual physical calculation (1,480.9 kW), calculates the discrepancy percentage (24.9%), and flags the quote as non-compliant if it exceeds 5% tolerance.
                  </p>
                  <p>
                    <strong>Security Guard Test:</strong> Click the red <em>&quot;Test Malicious Code&quot;</em> button. The system inspects the Python Abstract Syntax Tree (AST) before running it, instantly blocking dangerous commands like <code className="font-mono text-xs">import socket</code> or <code className="font-mono text-xs">os.system</code>.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'tab4-pid' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 4: P&amp;ID Drawing Explorer
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Schematic entity recognition and connected valve tracing</p>
                </div>

                <DocsExecutiveSummary
                  why="When an equipment piece fails, engineers must immediately trace which safety valves, relief lines, and sensors isolate that unit."
                  what="Detects ISA-5.1 tags, measures geometric distances between symbols, and maps connected isolation valves and transmitters."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Click any equipment tag (e.g. Column T-101).</li>
                      <li>See all connected valves and transmitters.</li>
                      <li>Click &quot;Render Overlay&quot; to see highlighted bounding boxes.</li>
                    </ol>
                  }
                />
              </div>
            )}

            {activeSection === 'tab5-audit' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 5: Safety Audit Ledger
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Tamper-evident cryptographic ledger linking all actions</p>
                </div>

                <DocsExecutiveSummary
                  why="In industrial safety investigations, investigators need absolute proof that audit logs were not secretly modified or deleted after an accident."
                  what="Links every search, calculation, and MOC approval into a sequential SHA-256 hash chain (like a local private blockchain)."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>View the live table of sequence hashes.</li>
                      <li>Click &quot;Verify Ledger Integrity&quot;.</li>
                      <li>See 100% mathematical proof of zero tampering.</li>
                    </ol>
                  }
                />
              </div>
            )}

            {activeSection === 'tab6-governance' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 6: Drafting, Review &amp; MOC Notes
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Management of Change (MOC) and procedural amendments workflow</p>
                </div>

                <DocsExecutiveSummary
                  why="Unauthorized changes to plant procedures cause industrial explosions (e.g. Flixborough disaster). Every procedure change requires strict multi-role approval."
                  what="Generates structured SOP drafts from raw shift logs and enforces an approval workflow before an amendment can be published."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Select an incident or draft a new amendment.</li>
                      <li>Review the AI-generated procedure.</li>
                      <li>Sign off with authorized role permissions.</li>
                    </ol>
                  }
                />
              </div>
            )}

            {activeSection === 'tab7-telemetry' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 7: Live DCS Telemetry &amp; Emergency Lists
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Simulated DCS sensor feeds with instant contextual procedure lookup</p>
                </div>

                <DocsExecutiveSummary
                  why="When high pressure or temperature trips an alarm, operators cannot afford to guess which valves to close first."
                  what="Streams realistic refinery sensor values (CDU, VDU, FCCU) and maps active alarms directly to emergency shutdown steps."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Watch live temperature, pressure, and flow rates.</li>
                      <li>If an alarm triggers, see immediate procedure steps.</li>
                      <li>Follow the emergency response checklist.</li>
                    </ol>
                  }
                />
              </div>
            )}

            {activeSection === 'tab8-investigation' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 8: Shift Handover &amp; 5-Why Root Cause Analysis
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Automated shift log summarization and incident root cause trees</p>
                </div>

                <DocsExecutiveSummary
                  why="Miscommunication during shift handovers is a leading cause of industrial accidents. Incident investigations often stop at operator error instead of root mechanical causes."
                  what="Synthesizes clear shift handovers with open permits and equipment status. Builds 5-Why root cause trees with corrective and preventive actions (CAPA)."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Click &quot;Synthesize Shift Handover&quot; &amp; export signed PDF.</li>
                      <li>Pick an incident preset (e.g. Slurry Pump Trip).</li>
                      <li>Click &quot;Run 5-Why Investigation&quot; &amp; review CAPA deadlines.</li>
                    </ol>
                  }
                />
              </div>
            )}

            {activeSection === 'tab9-universal' && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-7 shadow-xs space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Tab 9: Universal AI Document Chat (Generic RAG)
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    Upload any arbitrary PDF document and run multi-turn conversational RAG with 100% offline local embeddings
                  </p>
                </div>

                <DocsExecutiveSummary
                  why="Refinery personnel receive ad-hoc technical documents (vendor proposals, contractor resumes, incident memos, environmental audits) that cannot be sent to commercial cloud AI without violating corporate secrecy."
                  what="Universal air-gapped document RAG. Ingests any PDF, generates 768-dimensional local vector embeddings, and provides a multi-turn conversational chat grounded strictly in that document with page citations."
                  how={
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Drag &amp; drop or choose ANY PDF document in the right panel and click &quot;Upload &amp; Ingest to Local RAG&quot;.</li>
                      <li>The active document is immediately loaded into the chat engine with verified pgvector chunks.</li>
                      <li>Chat naturally, click quick prompt suggestions, and inspect verified source citations with page numbers.</li>
                    </ol>
                  }
                />

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 pt-2">
                  <p>
                    <strong>Universal Document Compatibility:</strong> Tab 9 accepts any standard PDF file—technical manuals, engineering specifications, vendor catalogs, resumes, or safety memos. The title is automatically detected from the file name.
                  </p>
                  <p>
                    <strong>Conversational RAG Features:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                    <li><strong>Multi-Turn Thread:</strong> Maintains conversation history per document stored in browser memory.</li>
                    <li><strong>Quick Prompts:</strong> 1-click pills for document summarization, safety limits, equipment tags, and risk identification.</li>
                    <li><strong>Source Citations:</strong> Displays exact extracted chunk citations and page numbers under every response.</li>
                    <li><strong>Library Switching:</strong> Instant switching between any previously ingested documents in the local database.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Bottom sequential pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              {prevSection ? (
                <button
                  onClick={() => setActiveSection(prevSection.id)}
                  className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 rounded-lg px-3.5 py-2 hover:bg-slate-50 transition shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                  <span className="truncate max-w-[200px]">Previous: {prevSection.label}</span>
                </button>
              ) : <div />}

              {nextSection && (
                <button
                  onClick={() => setActiveSection(nextSection.id)}
                  className="flex items-center space-x-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition shadow-xs ml-auto"
                >
                  <span className="truncate max-w-[200px]">Next: {nextSection.label}</span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-mono">
        SOVEREIGN WORKBENCH • SMART INDIA HACKATHON 2026 (SIH26117) • MANGALORE REFINERY &amp; PETROCHEMICALS LIMITED (MRPL)
      </footer>
    </div>
  );
}
