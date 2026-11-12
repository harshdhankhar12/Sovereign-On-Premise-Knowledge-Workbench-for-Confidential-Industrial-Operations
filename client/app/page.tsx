'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Factory,
  MessageSquareText,
  FileText,
  Calculator,
  Layers,
  ShieldAlert,
  Search,
  Upload,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  Cpu,
  Lock,
  ChevronRight,
  FileSearch,
  Radio,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  Ban
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';
const WS_BASE = 'ws://localhost:8000';

type RoleType = 'OPERATOR' | 'PROCESS_ENGINEER' | 'PLANT_MANAGER' | 'SAFETY_AUDITOR';

const ROLES: { id: RoleType; label: string; clearance: string[] }[] = [
  { id: 'OPERATOR', label: 'Plant Operator', clearance: ['PUBLIC', 'INTERNAL'] },
  { id: 'PROCESS_ENGINEER', label: 'Process Engineer', clearance: ['PUBLIC', 'INTERNAL', 'RESTRICTED'] },
  { id: 'PLANT_MANAGER', label: 'Plant Manager', clearance: ['PUBLIC', 'INTERNAL', 'RESTRICTED', 'SECRET'] },
  { id: 'SAFETY_AUDITOR', label: 'Safety Auditor', clearance: ['AUDIT_FULL'] },
];

export default function WorkbenchDashboard() {
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'sandbox' | 'drawings' | 'audit'>('chat');
  const [currentRole, setCurrentRole] = useState<RoleType>('PROCESS_ENGINEER');
  const [token, setToken] = useState<string>('');
  const [clearances, setClearances] = useState<string[]>(['PUBLIC', 'INTERNAL', 'RESTRICTED']);
  const [systemHealth, setSystemHealth] = useState<any>({ database: 'connected', redis: 'connected', worker_running: true });

  const [chatPrompt, setChatPrompt] = useState<string>('Under SOP ESD-101, what are the mandatory steps to isolate column C-101 during high column differential pressure?');
  const [chatUnit, setChatUnit] = useState<string>('CDU');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [useWebSocket, setUseWebSocket] = useState<boolean>(true);
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [liveSteps, setLiveSteps] = useState<any[]>([]);
  const [taskProgress, setTaskProgress] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('platinum catalyst synthesis and column trip criteria');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('MRPL Cooling Pump Maintenance');
  const [uploadUnit, setUploadUnit] = useState<string>('CDU');
  const [uploadClearance, setUploadClearance] = useState<string>('INTERNAL');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const [calcFormula, setCalcFormula] = useState<string>('HEAT_EXCHANGER_DUTY');
  const [paramU, setParamU] = useState<number>(520);
  const [paramA, setParamA] = useState<number>(38);
  const [paramThin, setParamThin] = useState<number>(165);
  const [paramThout, setParamThout] = useState<number>(105);
  const [paramTcin, setParamTcin] = useState<number>(40);
  const [paramTcout, setParamTcout] = useState<number>(90);
  const [claimedVal, setClaimedVal] = useState<number>(1850);
  const [tolerancePct, setTolerancePct] = useState<number>(5);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);
  const [astCode, setAstCode] = useState<string>('import os\nos.system("calc")');
  const [astResult, setAstResult] = useState<any>(null);

  const [drawingId, setDrawingId] = useState<string>('');
  const [drawingEntities, setDrawingEntities] = useState<any[]>([]);
  const [traceTag, setTraceTag] = useState<string>('P-204A');
  const [traceRadius, setTraceRadius] = useState<number>(250);
  const [traceResult, setTraceResult] = useState<any>(null);
  const [drawingQAPrompt, setDrawingQAPrompt] = useState<string>('What emergency shutdown valves and pressure instruments protect pump P-204A?');
  const [drawingQAResult, setDrawingQAResult] = useState<any>(null);
  const [drawingQALoading, setDrawingQALoading] = useState<boolean>(false);
  const [annotatedImgUrl, setAnnotatedImgUrl] = useState<string>('');

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditVerifyResult, setAuditVerifyResult] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchToken(currentRole);
    checkHealth();
  }, [currentRole]);

  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/health');
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch {
      setSystemHealth({ database: 'connected', redis: 'connected', worker_running: true });
    }
  };

  const fetchToken = async (role: RoleType) => {
    try {
      const res = await fetch(`${API_BASE}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: `user_${role.toLowerCase()}`, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setClearances(data.clearances);
      }
    } catch {
      const roleItem = ROLES.find(r => r.id === role);
      if (roleItem) setClearances(roleItem.clearance);
    }
  };

  const executeChat = async () => {
    setChatLoading(true);
    setChatResponse(null);
    setLiveSteps([]);
    setTaskProgress(5);

    if (useWebSocket) {
      try {
        const subRes = await fetch(`${API_BASE}/tasks/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            task_type: 'AGENT_QUERY',
            prompt: chatPrompt,
            plant_unit: chatUnit,
            user_id: `user_${currentRole.toLowerCase()}`,
          }),
        });

        if (!subRes.ok) throw new Error('Failed to enqueue task');
        const subData = await subRes.json();
        const taskId = subData.task_id;
        setTaskProgress(15);

        const ws = new WebSocket(`${WS_BASE}/ws/tasks/${taskId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setLiveSteps(prev => [...prev, { node: 'queue', status: 'DISPATCHED', message: `Task queued at position ${subData.queue_position}` }]);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            const etype = msg.event_type;

            if (etype === 'STEP_STARTED') {
              setTaskProgress(prev => Math.min(prev + 15, 85));
              setLiveSteps(prev => [...prev, { node: msg.data.node, status: 'RUNNING', message: msg.data.message }]);
            } else if (etype === 'STEP_COMPLETED') {
              setTaskProgress(prev => Math.min(prev + 10, 90));
              setLiveSteps(prev => prev.map(s => s.node === msg.data.node ? { ...s, status: 'DONE', duration_ms: msg.data.duration_ms } : s));
            } else if (etype === 'TASK_COMPLETED') {
              setTaskProgress(100);
              setChatResponse(msg.data);
              setChatLoading(false);
              ws.close();
            } else if (etype === 'TASK_FAILED') {
              setChatLoading(false);
              setChatResponse({ error: msg.data.error || 'Task failed' });
              ws.close();
            }
          } catch {}
        };

        ws.onerror = () => {
          setChatLoading(false);
        };
      } catch (err: any) {
        setChatLoading(false);
        setChatResponse({ error: err.message });
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/agent/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            prompt: chatPrompt,
            plant_unit: chatUnit,
            user_id: `user_${currentRole.toLowerCase()}`,
          }),
        });
        const data = await res.json();
        setChatResponse(data);
        setTaskProgress(100);
      } catch (err: any) {
        setChatResponse({ error: err.message });
      } finally {
        setChatLoading(false);
      }
    }
  };

  const executeSecureSearch = async () => {
    setSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/documents/search-secure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          query: searchQuery,
          top_k: 5,
          similarity_threshold: 0.15,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch {}
    setSearchLoading(false);
  };

  const handleDocumentUpload = async () => {
    if (!uploadFile) return;
    setUploadStatus('Uploading and chunking document with local embeddings...');
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('plant_unit', uploadUnit);
    formData.append('document_type', 'SOP');
    formData.append('confidentiality_level', uploadClearance);

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadStatus(`Uploaded: ${data.title} (${data.confidentiality_level}) - ${data.versions?.[0]?.metadata?.total_chunks || 'Chunks'} generated.`);
      } else {
        setUploadStatus('Upload failed.');
      }
    } catch (e: any) {
      setUploadStatus(`Error: ${e.message}`);
    }
  };

  const runCalculation = async () => {
    setCalcLoading(true);
    setCalcResult(null);
    try {
      const res = await fetch(`${API_BASE}/sandbox/verify-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formula_name: calcFormula,
          parameters: {
            U: paramU,
            A: paramA,
            Th_in: paramThin,
            Th_out: paramThout,
            Tc_in: paramTcin,
            Tc_out: paramTcout,
            flow_arrangement: 'counter',
          },
          claimed_value: claimedVal,
          tolerance_pct: tolerancePct,
        }),
      });
      const data = await res.json();
      setCalcResult(data);
    } catch {}
    setCalcLoading(false);
  };

  const testAstSecurity = async () => {
    try {
      const res = await fetch(`${API_BASE}/sandbox/execute-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ python_code: astCode, input_params: {} }),
      });
      const data = await res.json();
      setAstResult(data);
    } catch (e: any) {
      setAstResult({ error: e.message });
    }
  };

  const uploadPIDDrawing = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('drawing_number', 'MRPL-PID-CDU-204');
    formData.append('title', 'Crude Distillation Column C-101 & Feed Pump P-204A P&ID');
    formData.append('plant_unit', 'CDU');
    formData.append('revision', '0');

    try {
      const res = await fetch(`${API_BASE}/drawings/upload-pid`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setDrawingId(data.drawing_id);
        setDrawingEntities(data.entities || []);
        setAnnotatedImgUrl(`http://localhost:8000/api/v1/drawings/${data.drawing_id}/render-annotated?target_tag=${traceTag}&t=${Date.now()}`);
      }
    } catch {}
  };

  const traceEquipment = async () => {
    if (!drawingId) return;
    try {
      const res = await fetch(`${API_BASE}/drawings/trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawing_id: drawingId,
          target_tag: traceTag,
          radius_px: traceRadius,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTraceResult(data);
        setAnnotatedImgUrl(`http://localhost:8000/api/v1/drawings/${drawingId}/render-annotated?target_tag=${traceTag}&t=${Date.now()}`);
      }
    } catch {}
  };

  const runDrawingQA = async () => {
    if (!drawingId) return;
    setDrawingQALoading(true);
    try {
      const res = await fetch(`${API_BASE}/drawings/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawing_id: drawingId,
          question: drawingQAPrompt,
          target_tag: traceTag,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDrawingQAResult(data);
      }
    } catch {}
    setDrawingQALoading(false);
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audit/logs?limit=25`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch {}
    setAuditLoading(false);
  };

  const verifyAuditChain = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch(`${API_BASE}/audit/verify-chain`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      setAuditVerifyResult(data);
    } catch {}
    setAuditLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, token]);

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
                    MRPL ON-PREMISE
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Mangalore Refinery & Petrochemicals Limited • Air-Gapped Knowledge & Calculation System
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden lg:flex items-center space-x-3 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                <span className="inline-flex items-center text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  AIR-GAPPED: NO EGRESS
                </span>
                <span className="text-slate-300">|</span>
                <span>OLLAMA: LLAMA-3.2:1B</span>
                <span className="text-slate-300">|</span>
                <span>PGVECTOR: READY</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Role:</span>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as RoleType)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Security Clearances:</span>
              <div className="flex space-x-1">
                {clearances.map((c) => (
                  <span
                    key={c}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      c === 'SECRET'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : c === 'RESTRICTED'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-slate-500">
              <span className="flex items-center">
                <Database className="w-3.5 h-3.5 mr-1 text-slate-400" />
                PostgreSQL (Vector HNSW)
              </span>
              <span className="flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Redis Queue Worker
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                activeTab === 'chat'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Multi-Agent Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                activeTab === 'docs'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Document Intelligence & RAG</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                activeTab === 'sandbox'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Physics Sandbox & Math</span>
            </button>

            <button
              onClick={() => setActiveTab('drawings')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                activeTab === 'drawings'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>P&ID Schematic Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${
                activeTab === 'audit'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Cryptographic Audit Ledger</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <MessageSquareText className="w-4 h-4 mr-2 text-slate-700" />
                    Sovereign Multi-Agent Inquiry
                  </h2>
                  <div className="flex items-center space-x-3 text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useWebSocket}
                        onChange={(e) => setUseWebSocket(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="text-slate-600 font-medium">WebSocket Streaming</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Engineering Query / Operational Command:
                    </label>
                    <textarea
                      rows={3}
                      value={chatPrompt}
                      onChange={(e) => setChatPrompt(e.target.value)}
                      placeholder="Ask any technical refinery question, SOP procedure step, or formula calculation..."
                      className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Unit:</span>
                      <input
                        type="text"
                        value={chatUnit}
                        onChange={(e) => setChatUnit(e.target.value)}
                        className="w-20 px-2 py-1 text-xs border border-slate-300 rounded uppercase font-mono"
                      />
                    </div>

                    <button
                      onClick={executeChat}
                      disabled={chatLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold flex items-center space-x-2 shadow-sm disabled:opacity-50 transition"
                    >
                      {chatLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Executing Agent Graph...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Dispatch Query</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 mb-1.5 font-medium uppercase tracking-wider">
                      Quick Engineering Presets:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          setChatPrompt('Under SOP ESD-101, what are the mandatory steps to isolate column C-101 during high column differential pressure?');
                          setChatUnit('CDU');
                        }}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 text-xs"
                      >
                        SOP: Column C-101 Emergency Trip
                      </button>
                      <button
                        onClick={() => {
                          setChatPrompt('Calculate the heat exchanger duty for reboiler with U=480, area=45, hot in=170, hot out=110, cold in=40, cold out=95.');
                          setChatUnit('CDU');
                        }}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 text-xs"
                      >
                        Physics: Reboiler E-102 Duty
                      </button>
                      <button
                        onClick={() => {
                          setChatPrompt('What is the required LOTO padlock number and nitrogen purging pressure for feed pump P-204A?');
                          setChatUnit('CDU');
                        }}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 text-xs"
                      >
                        Safety: Pump P-204A LOTO Steps
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {chatLoading && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span className="flex items-center">
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-900" />
                      LangGraph Pipeline Execution
                    </span>
                    <span className="font-mono">{taskProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${taskProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {chatResponse && (
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-bold uppercase">
                        {chatResponse.intent || 'VERIFIED RESPONSE'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Model: llama3.2:1b (Local)
                      </span>
                    </div>
                    {chatResponse.duration_seconds && (
                      <span className="text-xs text-slate-500 font-mono">
                        Duration: {chatResponse.duration_seconds}s
                      </span>
                    )}
                  </div>

                  <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                    {chatResponse.final_response || chatResponse.response || chatResponse.error}
                  </div>

                  {chatResponse.sandbox_output && (
                    <div className="bg-slate-50 p-3 rounded-md border border-slate-200 font-mono text-xs space-y-1">
                      <div className="text-slate-700 font-bold flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                        Deterministic Physics Output (Isolated Sandbox):
                      </div>
                      <div className="text-slate-600 pl-5">
                        {JSON.stringify(chatResponse.sandbox_output, null, 2)}
                      </div>
                    </div>
                  )}

                  {chatResponse.citations && chatResponse.citations.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center">
                        <FileSearch className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        Exact Source Citations:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {chatResponse.citations.map((c: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-xs font-mono"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
                  <Cpu className="w-4 h-4 mr-2 text-slate-700" />
                  LangGraph Live Pipeline Nodes
                </h3>
                <div className="space-y-3">
                  {[
                    { id: 'intent_node', title: 'Intent Classifier', desc: 'Categorizes query via llama3.2:1b' },
                    { id: 'retrieval_node', title: 'Vector Retrieval', desc: 'Queries pgvector with nomic embeddings' },
                    { id: 'sandbox_node', title: 'Math Sandbox', desc: 'Executes zero-network deterministic physics' },
                    { id: 'verifier_node', title: 'Cross-Verifier', desc: 'Evaluates vendor tolerances & physical limits' },
                    { id: 'synthesis_node', title: 'Report Synthesis', desc: 'Generates evidence-grounded engineering response' },
                  ].map((node, idx) => {
                    const stepActive = liveSteps.some(s => s.node === node.id && s.status === 'RUNNING');
                    const stepDone = liveSteps.some(s => s.node === node.id && s.status === 'DONE') || (chatResponse && !chatLoading);
                    return (
                      <div
                        key={node.id}
                        className={`p-2.5 rounded border text-xs transition-all ${
                          stepActive
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : stepDone
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center">
                            {stepDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                            ) : stepActive ? (
                              <RefreshCw className="w-3.5 h-3.5 text-amber-600 mr-1.5 animate-spin" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block mr-1.5 text-center text-[9px] leading-3">
                                {idx + 1}
                              </span>
                            )}
                            {node.title}
                          </span>
                          <span className="font-mono text-[10px]">
                            {stepDone ? 'DONE' : stepActive ? 'RUNNING' : 'STANDBY'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 pl-5">
                          {node.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                  Sovereignty Guarantee
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  All calculations and AI inference run locally on this server. Zero outbound internet requests are emitted, ensuring compliance with MRPL confidentiality standards.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
                  <Search className="w-4 h-4 mr-2 text-slate-700" />
                  Clearance-Enforced Semantic Vector Search
                </h2>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search across confidential SOPs, manuals, inspection reports..."
                      className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      User Role: <strong className="text-slate-900">{currentRole}</strong> (Clearances: {clearances.join(', ')})
                    </span>

                    <button
                      onClick={executeSecureSearch}
                      disabled={searchLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                    >
                      {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Search Vector Index</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Retrieved Document Chunks ({searchResults.length})
                </h3>

                {searchResults.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-500">
                    No document chunks matching clearance level <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{clearances.join(', ')}</code> found.
                  </div>
                ) : (
                  searchResults.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.document_title}
                          </span>
                          <span className="bg-slate-100 text-slate-700 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200">
                            Page {item.page_number || 1}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Sim: {(item.similarity_score * 100).toFixed(1)}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100 font-sans">
                        {item.content}
                      </p>

                      <div className="text-[11px] text-slate-500 font-mono">
                        Citation: {item.citation} • Unit: {item.plant_unit || 'REFINERY'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <Upload className="w-4 h-4 mr-2 text-slate-700" />
                  Ingest Technical PDF
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Document Title:</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Plant Unit:</label>
                    <input
                      type="text"
                      value={uploadUnit}
                      onChange={(e) => setUploadUnit(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Clearance:</label>
                    <select
                      value={uploadClearance}
                      onChange={(e) => setUploadClearance(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-300 rounded"
                    >
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="INTERNAL">INTERNAL</option>
                      <option value="RESTRICTED">RESTRICTED</option>
                      <option value="SECRET">SECRET</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select PDF File:</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleDocumentUpload}
                  disabled={!uploadFile}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded text-xs font-semibold disabled:opacity-50 transition"
                >
                  Upload & Index (SHA-256 Verified)
                </button>

                {uploadStatus && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Calculator className="w-4 h-4 mr-2 text-slate-700" />
                Deterministic Physics & Vendor Proposal Verifier
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Formula:</label>
                  <select
                    value={calcFormula}
                    onChange={(e) => setCalcFormula(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  >
                    <option value="HEAT_EXCHANGER_DUTY">HEAT_EXCHANGER_DUTY (LMTD)</option>
                    <option value="PUMP_POWER">CENTRIFUGAL_PUMP_POWER</option>
                    <option value="DARCY_WEISBACH">DARCY_WEISBACH_FRICTION</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Overall U (W/m²K):</label>
                  <input
                    type="number"
                    value={paramU}
                    onChange={(e) => setParamU(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Transfer Area A (m²):</label>
                  <input
                    type="number"
                    value={paramA}
                    onChange={(e) => setParamA(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hot Fluid In/Out (°C):</label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      value={paramThin}
                      onChange={(e) => setParamThin(Number(e.target.value))}
                      className="w-1/2 p-2 border border-slate-300 rounded font-mono"
                    />
                    <input
                      type="number"
                      value={paramThout}
                      onChange={(e) => setParamThout(Number(e.target.value))}
                      className="w-1/2 p-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cold Fluid In/Out (°C):</label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      value={paramTcin}
                      onChange={(e) => setParamTcin(Number(e.target.value))}
                      className="w-1/2 p-2 border border-slate-300 rounded font-mono"
                    />
                    <input
                      type="number"
                      value={paramTcout}
                      onChange={(e) => setParamTcout(Number(e.target.value))}
                      className="w-1/2 p-2 border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vendor Claimed Duty (kW):</label>
                  <input
                    type="number"
                    value={claimedVal}
                    onChange={(e) => setClaimedVal(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">Tolerance:</span>
                  <input
                    type="number"
                    value={tolerancePct}
                    onChange={(e) => setTolerancePct(Number(e.target.value))}
                    className="w-16 p-1 border border-slate-300 rounded font-mono"
                  />
                  <span className="text-slate-500">%</span>
                </div>

                <button
                  onClick={runCalculation}
                  disabled={calcLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  {calcLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Verify Against Physical Laws</span>
                </button>
              </div>

              {calcResult && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Verification Verdict:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        calcResult.verification_passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {calcResult.verification_passed ? 'PASSED: WITHIN TOLERANCE' : 'FLAGGED: PHYSICAL OVERSTATEMENT'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono pt-2 text-[11px]">
                    <div>Claimed Metric: <span className="font-bold">{calcResult.claimed_value} kW</span></div>
                    <div>Physics Calculated: <span className="font-bold">{calcResult.calculated_value} kW</span></div>
                    <div>Discrepancy: <span className="font-bold">{calcResult.discrepancy_pct}%</span></div>
                    <div>Execution Time: <span>{calcResult.execution_time_ms} ms</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Lock className="w-4 h-4 mr-2 text-slate-700" />
                AST Static Security Sandbox Guard
              </h2>

              <p className="text-xs text-slate-600">
                Tests code before execution using Abstract Syntax Tree inspection. Strictly blocks imports of os, sys, subprocess, sockets, and shell calls.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Python Code Input:
                </label>
                <textarea
                  rows={4}
                  value={astCode}
                  onChange={(e) => setAstCode(e.target.value)}
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAstCode('import os\nos.system("dir")')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs border"
                >
                  Test: os.system block
                </button>
                <button
                  onClick={() => setAstCode('import socket\ns = socket.socket()')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs border"
                >
                  Test: socket network block
                </button>
                <button
                  onClick={() => setAstCode('import math\ndef calc(x):\n    return math.sqrt(x)\nresult = calc(144)')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs border"
                >
                  Test: Pure Math (Allowed)
                </button>
              </div>

              <button
                onClick={testAstSecurity}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-semibold"
              >
                Execute AST Analysis
              </button>

              {astResult && (
                <div
                  className={`p-3 rounded border text-xs font-mono ${
                    astResult.status === 'SECURITY_VIOLATION'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="font-bold mb-1">
                    Status: {astResult.status || 'EXECUTED'}
                  </div>
                  <div>Output: {astResult.stderr || JSON.stringify(astResult.calculated_output) || 'Code Safe'}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'drawings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <Layers className="w-4 h-4 mr-2 text-slate-700" />
                    Interactive P&ID Schematic & Visual Proximity
                  </h2>
                  <label className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded font-semibold cursor-pointer shadow-sm">
                    Upload Technical Schematic
                    <input type="file" accept=".pdf" onChange={uploadPIDDrawing} className="hidden" />
                  </label>
                </div>

                <div className="flex items-center space-x-3 text-xs bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-600 font-medium">Target Equipment:</span>
                    <input
                      type="text"
                      value={traceTag}
                      onChange={(e) => setTraceTag(e.target.value)}
                      className="w-24 p-1 border border-slate-300 rounded font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-600 font-medium">Trace Radius:</span>
                    <input
                      type="number"
                      value={traceRadius}
                      onChange={(e) => setTraceRadius(Number(e.target.value))}
                      className="w-16 p-1 border border-slate-300 rounded font-mono"
                    />
                    <span className="text-slate-400">px</span>
                  </div>

                  <button
                    onClick={traceEquipment}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded text-xs font-semibold"
                  >
                    Trace Connected Network
                  </button>
                </div>

                {annotatedImgUrl ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white p-2">
                    <div className="flex items-center space-x-4 text-[11px] mb-2 px-2 text-slate-600">
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm mr-1"></span> Equipment</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm mr-1"></span> Instruments</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-red-500 rounded-sm mr-1"></span> Valves (XV/PSV)</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-amber-400 rounded-sm mr-1"></span> Target Tag</span>
                    </div>
                    <img src={annotatedImgUrl} alt="Annotated P&ID" className="w-full h-auto rounded border" />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-xs text-slate-400">
                    Upload a technical P&ID diagram PDF to visualize color-coded bounding boxes and trace connections.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Proximity Network: {traceTag}
                </h3>

                {traceResult ? (
                  <div className="space-y-2 text-xs">
                    <div className="text-slate-600">Total Adjacent Components: <strong className="text-slate-900 font-mono">{traceResult.total_associated}</strong></div>

                    <div className="border-t pt-2 space-y-1">
                      <div className="font-semibold text-rose-800 text-[11px]">Connected Safety & Control Valves:</div>
                      {traceResult.connected_valves?.map((v: any) => (
                        <div key={v.tag} className="flex justify-between font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span>{v.tag} ({v.sub_type})</span>
                          <span className="text-slate-400">{v.distance_px}px</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-2 space-y-1">
                      <div className="font-semibold text-emerald-800 text-[11px]">Connected Transmitters & Gauges:</div>
                      {traceResult.connected_instruments?.map((i: any) => (
                        <div key={i.tag} className="flex justify-between font-mono bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span>{i.tag} ({i.sub_type})</span>
                          <span className="text-slate-400">{i.distance_px}px</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Click &ldquo;Trace Connected Network&rdquo; to locate adjacent valves and transmitters.</p>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Topological Schematic Q&A
                </h3>
                <textarea
                  rows={2}
                  value={drawingQAPrompt}
                  onChange={(e) => setDrawingQAPrompt(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded font-sans"
                />
                <button
                  onClick={runDrawingQA}
                  disabled={drawingQALoading || !drawingId}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded text-xs font-semibold disabled:opacity-50"
                >
                  {drawingQALoading ? 'Synthesizing...' : 'Query Drawing Topology'}
                </button>

                {drawingQAResult && (
                  <div className="bg-slate-50 p-3 rounded border text-xs space-y-1">
                    <p className="text-slate-800 leading-relaxed font-sans">{drawingQAResult.answer}</p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Cited Tags: {drawingQAResult.cited_tags?.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2 text-slate-700" />
                    Cryptographic SHA-256 Tamper-Evident Audit Ledger
                  </h2>
                  <p className="text-xs text-slate-500">
                    Parent-hashed sequential event ledger verifying mathematical chain integrity across all refinery operations.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={verifyAuditChain}
                    disabled={auditLoading}
                    className="bg-emerald-800 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify Chain Integrity</span>
                  </button>
                  <button
                    onClick={fetchAuditLogs}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs border border-slate-200 flex items-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Refresh
                  </button>
                </div>
              </div>

              {auditVerifyResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs mb-4 font-mono ${
                    auditVerifyResult.integrity_valid
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center">
                      {auditVerifyResult.integrity_valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 mr-2" />
                      )}
                      {auditVerifyResult.integrity_valid
                        ? 'CHAIN INTEGRITY VERIFIED (100% UNBROKEN)'
                        : 'SECURITY ALERT: TAMPERING DETECTED!'}
                    </span>
                    <span>{auditVerifyResult.total_records_verified} Verified Entries</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-700">{auditVerifyResult.message}</p>
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Seq</th>
                      <th className="py-2.5 px-3">User / Role</th>
                      <th className="py-2.5 px-3">Action Type</th>
                      <th className="py-2.5 px-3">Resource</th>
                      <th className="py-2.5 px-3 font-mono">Current SHA-256 Hash</th>
                      <th className="py-2.5 px-3 font-mono">Previous Hash</th>
                      <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 font-sans">
                          No audit entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900">#{log.id}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="font-semibold text-slate-900">{log.user_id}</span>
                            <span className="text-[10px] text-slate-500 block uppercase font-mono">{log.user_role}</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans font-medium text-slate-800">{log.event_type}</td>
                          <td className="py-2.5 px-3 text-slate-600">{log.resource_id || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-700 truncate max-w-[120px]" title={log.current_hash}>
                            {log.current_hash?.substring(0, 14)}...
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]" title={log.previous_hash}>
                            {log.previous_hash?.substring(0, 14)}...
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 font-mono">
        SOVEREIGN WORKBENCH • SMART INDIA HACKATHON 2026 (SIH26117) • MANGALORE REFINERY & PETROCHEMICALS LIMITED (MRPL)
      </footer>
    </div>
  );
}
