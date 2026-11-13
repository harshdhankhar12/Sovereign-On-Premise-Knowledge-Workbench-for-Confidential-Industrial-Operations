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
  Bot
} from 'lucide-react';

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

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        Refineries handle trade secrets and critical national infrastructure. Sending queries to commercial cloud AI leaks formulas and schematics.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Runs complete AI models, vector search, physics math, and audit logging 100% locally on-premise with zero external internet traffic.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Verify</div>
                      <p className="text-slate-300 leading-relaxed">
                        Turn off laptop WiFi. Everything continues working smoothly. An automated audit check proves exactly 0 bytes leave the machine.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-700" />
                      <span>Local Inference</span>
                    </div>
                    <p className="text-slate-600">llama3.2:1b &amp; nomic-embed-text running through local Ollama with zero internet dependency.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Database className="w-3.5 h-3.5 text-slate-700" />
                      <span>PostgreSQL &amp; pgvector</span>
                    </div>
                    <p className="text-slate-600">768-dimensional local vector indexing with clearance security levels (Public, Internal, Restricted, Secret).</p>
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
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Quick instructions to start and prove zero-egress to evaluators</p>
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

                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Step 3: Proving Zero External Internet Traffic</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs space-y-2">
                    <p className="text-slate-700">1. Disconnect laptop WiFi / Ethernet completely.</p>
                    <p className="text-slate-700">2. Run the automated air-gap test suite:</p>
                    <div className="bg-slate-900 text-slate-100 rounded p-2.5 font-mono text-xs">
                      python scripts/verify_air_gap_egress.py
                    </div>
                    <p className="text-slate-600">
                      The test attempts outbound socket calls (blocked), triggers dangerous sandbox syscalls (blocked), and verifies the database ledger records exactly <strong>0 egress bytes</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tab1-chat' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 1: Ask Refinery AI (Sovereign Multi-Agent Chat)</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Natural language questions grounded strictly in refinery procedures</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        Refinery operators cannot afford to spend 20 minutes flipping through 300-page paper binders during an emergency column trip.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Reads indexed SOPs page-by-page, classifies the question, runs physics if math is needed, and provides step-by-step instructions with exact citations.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. Click an active document pill or preset.<br />
                        2. Click &quot;Dispatch Query&quot;.<br />
                        3. Read the verified answer and check citations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 pt-2">
                  <p>
                    <strong>What data the AI reads:</strong> Above the chat prompt, the <em>&quot;Active Grounding Documents&quot;</em> toolbar shows all indexed files in PostgreSQL (<code className="font-mono text-xs">MRPL-SOP-OPS-101</code>, <code className="font-mono text-xs">MRPL-SOP-MEC-201</code>, <code className="font-mono text-xs">MRPL-SOP-HSE-001</code>, <code className="font-mono text-xs">MRPL-SPEC-HCK-901</code>, plus any newly uploaded PDFs).
                  </p>
                  <p>
                    <strong>Live Reasoning Timeline:</strong> The right panel displays the 5 stages as they execute live via WebSockets:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
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
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 2: Upload &amp; Search Documents (Document Intelligence)</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Where confidential SOPs and vendor manuals are indexed and searched</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        Refineries have thousands of confidential procedures across different units. Unrestricted access risks trade secrets, while lost files delay operations.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Ingests PDFs page-by-page, deduplicates with SHA-256 hashes, creates local 768-dim embeddings, and enforces clearance levels during search.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. Select a PDF file and clearance level.<br />
                        2. Click &quot;Upload &amp; Index&quot;.<br />
                        3. Click &quot;Chat with Document&quot; to ask questions immediately.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 pt-2">
                  <p>
                    <strong>Clearance Levels Explained:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
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
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 3: Industrial Physics Calculator (Math Sandbox)</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Real mathematical engineering calculations with zero hallucinations</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        LLMs guess and hallucinate numbers. In a refinery, trusting a fake heat duty or pump kW could blow a seal or cause a thermal runaway.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Executes real Python physics formulas in a locked child process with zero network access and strict 10-second resource limits.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. Select a formula (LMTD, Darcy, Pump).<br />
                        2. Adjust parameters or claimed values.<br />
                        3. Click &quot;Execute Deterministic Verification&quot;.
                      </p>
                    </div>
                  </div>
                </div>

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
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 4: P&amp;ID Drawing Explorer</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Schematic entity recognition and connected valve tracing</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        When an equipment piece fails, engineers must immediately trace which safety valves, relief lines, and sensors isolate that unit.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Detects ISA-5.1 tags, measures geometric distances between symbols, and maps connected isolation valves and transmitters.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. Click any equipment tag (e.g. Column T-101).<br />
                        2. See all connected valves and transmitters.<br />
                        3. Click &quot;Render Overlay&quot; to see highlighted bounding boxes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tab5-audit' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 5: Safety Audit Ledger</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Tamper-evident cryptographic ledger linking all actions</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        In industrial safety investigations, investigators need absolute proof that audit logs were not secretly modified or deleted after an accident.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Links every search, calculation, and MOC approval into a sequential SHA-256 hash chain (like a local private blockchain).
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. View the live table of sequence hashes.<br />
                        2. Click &quot;Verify Ledger Integrity&quot;.<br />
                        3. See 100% mathematical proof of zero tampering.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tab6-governance' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 6: Drafting, Review &amp; Management of Change (MOC)</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Automated technical memoranda, human sign-offs, and watermarked PDF exports</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        Drafting formal MOC proposals by hand takes engineers 45 minutes each. Bottlenecks delay safety modifications and cost millions in downtime.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Local AI drafts 5-section technical notes in 2 seconds. Lead engineers review, edit inline, sign digitally, and export official watermarked PDFs.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. Pick a drafting preset and click &quot;Generate Note&quot;.<br />
                        2. Edit text inline in the review panel.<br />
                        3. Click &quot;Sign &amp; Approve&quot; and download the signed PDF.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tab7-telemetry' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 7: Live DCS Telemetry &amp; Emergency Checklists</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">SCADA process stream monitoring and automated SOP emergency procedures</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        When a furnace trips or column overpressurizes, operators must execute rapid emergency actions within 45 seconds to avoid disasters.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Simulates live plant sensors across CDU, FCCU, and HCU. When limits are exceeded, it cross-references SOPs and generates step-by-step checklists.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. Click any fault scenario (e.g. Furnace Overheat).<br />
                        2. See the alert trip and cited emergency procedure.<br />
                        3. Click &quot;Sign-Off Step&quot; as you execute each safety action.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tab8-investigation' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 8: Shift Handover &amp; 5-Why Investigation</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Turnover logs, dual-signatory custody transfer, and 5-Why causal investigation</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        Poor shift handovers are a major cause of industrial refinery accidents worldwide. Incomplete handover notes cause critical warnings to be missed.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Synthesizes 8-hour shift turnover logs directly from the audit ledger with dual signatures, and runs 5-Why root cause investigations with assigned CAPA.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. Click &quot;Synthesize Shift Handover&quot; &amp; export signed PDF.<br />
                        2. Pick an incident preset (e.g. Slurry Pump Trip).<br />
                        3. Click &quot;Run 5-Why Investigation&quot; &amp; review CAPA deadlines.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tab9-universal' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tab 9: Universal AI Document Chat (Generic RAG)</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Upload any arbitrary PDF document and run multi-turn conversational RAG with 100% offline local embeddings</p>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-5 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-amber-400 uppercase text-[11px]">Why This Exists</div>
                      <p className="text-slate-300 leading-relaxed">
                        Refinery personnel receive ad-hoc technical documents (vendor proposals, contractor resumes, incident memos, environmental audits) that cannot be sent to commercial cloud AI without violating corporate secrecy.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-emerald-400 uppercase text-[11px]">What It Does</div>
                      <p className="text-slate-300 leading-relaxed">
                        Universal air-gapped document RAG. Ingests any PDF, generates 768-dimensional local vector embeddings, and provides a multi-turn conversational chat grounded strictly in that document with page citations.
                      </p>
                    </div>
                    <div className="space-y-1 bg-slate-800 p-3 rounded border border-slate-700">
                      <div className="font-bold text-cyan-400 uppercase text-[11px]">How To Use It</div>
                      <p className="text-slate-300 leading-relaxed">
                        1. Drag &amp; drop or choose ANY PDF document in the right panel and click &quot;Upload &amp; Ingest to Local RAG&quot;.<br />
                        2. The active document is immediately loaded into the chat engine with verified pgvector chunks.<br />
                        3. Chat naturally, click quick prompt suggestions, and inspect verified source citations with page numbers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 pt-2">
                  <p>
                    <strong>Universal Document Compatibility:</strong> Tab 9 accepts any standard PDF file—technical manuals, engineering specifications, vendor catalogs, resumes, or safety memos. The title is automatically detected from the file name.
                  </p>
                  <p>
                    <strong>Conversational RAG Features:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                    <li><strong>Multi-Turn Thread:</strong> Maintains conversation history per document stored in browser memory.</li>
                    <li><strong>Quick Prompts:</strong> 1-click pills for document summarization, safety limits, equipment tags, and risk identification.</li>
                    <li><strong>Source Citations:</strong> Displays exact extracted chunk citations and page numbers under every response.</li>
                    <li><strong>Library Switching:</strong> Instant switching between any previously ingested documents in the local database.</li>
                  </ul>
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
