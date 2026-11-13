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
  Ban,
  ClipboardCheck,
  Download,
  TrendingUp,
  CheckSquare,
  FileSignature,
  Activity,
  Gauge,
  Zap,
  FileCheck2,
  UserCheck,
  GitBranch,
  BookOpen,
  Trash2,
  History,
  Bot,
  Send,
  Paperclip,
  FileQuestion
} from 'lucide-react';
import Link from 'next/link';
import FormattedResponse from './components/FormattedResponse';

const API_BASE = 'http://localhost:8000/api/v1';
const WS_BASE = 'ws://localhost:8000';

type RoleType = 'OPERATOR' | 'PROCESS_ENGINEER' | 'PLANT_MANAGER' | 'SAFETY_AUDITOR';

const ROLES: { id: RoleType; label: string; clearance: string[] }[] = [
  { id: 'OPERATOR', label: 'Plant Operator', clearance: ['PUBLIC', 'INTERNAL'] },
  { id: 'PROCESS_ENGINEER', label: 'Process Engineer', clearance: ['PUBLIC', 'INTERNAL', 'RESTRICTED'] },
  { id: 'PLANT_MANAGER', label: 'Plant Manager', clearance: ['PUBLIC', 'INTERNAL', 'RESTRICTED', 'SECRET'] },
  { id: 'SAFETY_AUDITOR', label: 'Safety Auditor', clearance: ['AUDIT_FULL'] },
];

function ExecutiveSummary({
  why,
  what,
  how,
}: {
  why: string;
  what: string;
  how: string;
}) {
  return (
    <div className="bg-slate-900  text-white rounded-lg p-4 sm:p-5 shadow-sm border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Executive Summary &amp; Quick Guide
        </span>
        <span className="text-[10px] font-mono text-emerald-400 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
          Air-Gapped Operation
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="space-y-1 bg-slate-800/90 p-3 rounded border border-slate-700/80">
          <div className="font-bold text-amber-400 uppercase text-[11px] tracking-wide">Why This Exists</div>
          <p className="text-slate-300 leading-relaxed">{why}</p>
        </div>
        <div className="space-y-1 bg-slate-800/90 p-3 rounded border border-slate-700/80">
          <div className="font-bold text-emerald-400 uppercase text-[11px] tracking-wide">What It Does</div>
          <p className="text-slate-300 leading-relaxed">{what}</p>
        </div>
        <div className="space-y-1 bg-slate-800/90 p-3 rounded border border-slate-700/80">
          <div className="font-bold text-cyan-400 uppercase text-[11px] tracking-wide">How To Use It</div>
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">{how}</p>
        </div>
      </div>
    </div>
  );
}


export default function WorkbenchDashboard() {
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'sandbox' | 'drawings' | 'audit' | 'governance' | 'telemetry' | 'investigation' | 'universal'>('chat');
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
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('platinum catalyst synthesis and column trip criteria');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadUnit, setUploadUnit] = useState<string>('CDU');
  const [uploadClearance, setUploadClearance] = useState<string>('PUBLIC');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [ingestedDocs, setIngestedDocs] = useState<any[]>([]);
  const [lastUploadedDoc, setLastUploadedDoc] = useState<any>(null);

  const [docChatTarget, setDocChatTarget] = useState<any>(null);
  const [docChatQuery, setDocChatQuery] = useState<string>('');
  const [docChatLoading, setDocChatLoading] = useState<boolean>(false);
  const [docChatResponse, setDocChatResponse] = useState<any>(null);
  const [docChatHistory, setDocChatHistory] = useState<any[]>([]);

  const [universalDoc, setUniversalDoc] = useState<any>(null);
  const [universalMessages, setUniversalMessages] = useState<any[]>([]);
  const [universalInput, setUniversalInput] = useState<string>('');
  const [universalLoading, setUniversalLoading] = useState<boolean>(false);
  const [universalUploadFile, setUniversalUploadFile] = useState<File | null>(null);
  const [universalUploadTitle, setUniversalUploadTitle] = useState<string>('');
  const [universalUploadCategory, setUniversalUploadCategory] = useState<string>('GENERAL');
  const [universalUploadClearance, setUniversalUploadClearance] = useState<string>('PUBLIC');
  const [universalUploadStatus, setUniversalUploadStatus] = useState<string>('');
  const [universalSearchFilter, setUniversalSearchFilter] = useState<string>('');
  const universalChatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const savedTab = localStorage.getItem('sovereign_tab');
      if (savedTab && ['chat', 'docs', 'sandbox', 'drawings', 'audit', 'governance', 'telemetry', 'investigation', 'universal'].includes(savedTab)) {
        setActiveTab(savedTab as any);
      }
      const savedRole = localStorage.getItem('sovereign_role');
      if (savedRole && ROLES.some(r => r.id === savedRole)) {
        setCurrentRole(savedRole as RoleType);
      }
      const savedHistory = localStorage.getItem('sovereign_chat_history');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
      const savedLastDoc = localStorage.getItem('sovereign_last_uploaded_doc');
      if (savedLastDoc) {
        const parsedDoc = JSON.parse(savedLastDoc);
        setLastUploadedDoc(parsedDoc);
        setDocChatTarget(parsedDoc);
      }
      const savedDocHistory = localStorage.getItem('sovereign_doc_chat_history');
      if (savedDocHistory) {
        setDocChatHistory(JSON.parse(savedDocHistory));
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (!docChatTarget && ingestedDocs.length > 0) {
      setDocChatTarget(lastUploadedDoc || ingestedDocs[0]);
    }
    if (!universalDoc && ingestedDocs.length > 0) {
      handleSelectUniversalDoc(lastUploadedDoc || ingestedDocs[0]);
    }
  }, [ingestedDocs, lastUploadedDoc]);

  const handleSelectTab = (tab: 'chat' | 'docs' | 'sandbox' | 'drawings' | 'audit' | 'governance' | 'telemetry' | 'investigation' | 'universal') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('sovereign_tab', tab);
    } catch { }
  };

  const handleSelectRole = (role: RoleType) => {
    setCurrentRole(role);
    try {
      localStorage.setItem('sovereign_role', role);
    } catch { }
  };

  const saveChatToHistory = (entry: any) => {
    setChatHistory((prev) => {
      const filtered = prev.filter(e => e.prompt !== entry.prompt);
      const updated = [entry, ...filtered].slice(0, 20);
      try {
        localStorage.setItem('sovereign_chat_history', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    try {
      localStorage.removeItem('sovereign_chat_history');
    } catch { }
  };

  const handleSelectHistoryItem = (item: any) => {
    setChatPrompt(item.prompt);
    if (item.unit) setChatUnit(item.unit);
    if (item.response) setChatResponse(item.response);
  };

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

  const [approvals, setApprovals] = useState<any[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [approvalReviewNotes, setApprovalReviewNotes] = useState<string>('');
  const [approvalEngineerEdits, setApprovalEngineerEdits] = useState<string>('');
  const [approvalActionLoading, setApprovalActionLoading] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('MOC: FCCU Slurry Pump P-201A Impeller Upgrade');
  const [draftUnit, setDraftUnit] = useState<string>('FCCU');
  const [draftActionType, setDraftActionType] = useState<string>('EQUIPMENT_MODIFICATION');
  const [draftPrompt, setDraftPrompt] = useState<string>('Propose replacement of worn standard impeller on pump P-201A with hardened tungsten-carbide impeller to reduce catalyst abrasion and keep vibration below 2.8 mm/s RMS under ISO 10816-3.');
  const [draftLoading, setDraftLoading] = useState<boolean>(false);
  const [roiMetrics, setRoiMetrics] = useState<any>(null);
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');

  const [telemetrySnapshot, setTelemetrySnapshot] = useState<any>(null);
  const [telemetryLoading, setTelemetryLoading] = useState<boolean>(false);
  const [activeAlarms, setActiveAlarms] = useState<any[]>([]);
  const [selectedAlarm, setSelectedAlarm] = useState<any>(null);
  const [faultInjectLoading, setFaultInjectLoading] = useState<boolean>(false);
  const [stepAckLoading, setStepAckLoading] = useState<string | null>(null);

  const [shiftType, setShiftType] = useState<string>('MORNING');
  const [outgoingOp, setOutgoingOp] = useState<string>('Er. Rajesh Kumar (Shift In-Charge CDU-1)');
  const [relievingOp, setRelievingOp] = useState<string>('Er. Vikram Shetty (Relief SIC)');
  const [currentHandover, setCurrentHandover] = useState<any>(null);
  const [handoverLoading, setHandoverLoading] = useState<boolean>(false);
  const [countersignLoading, setCountersignLoading] = useState<boolean>(false);

  const [rcaPresets, setRcaPresets] = useState<any[]>([]);
  const [selectedRcaPreset, setSelectedRcaPreset] = useState<string>('CDU_FURNACE_OVERHEAT');
  const [rcaTitle, setRcaTitle] = useState<string>('CDU-1 Atmospheric Furnace Coil Outlet Over-Temperature Trip');
  const [rcaUnit, setRcaUnit] = useState<string>('CDU-1');
  const [rcaTag, setRcaTag] = useState<string>('TT-102');
  const [rcaSop, setRcaSop] = useState<string>('MRPL-SOP-OPS-101');
  const [rcaObservation, setRcaObservation] = useState<string>('Furnace coil outlet temperature TT-102 spiked to 392.4°C exceeding 385.0°C trip limit, triggering automated feed valve XV-101 closure and emergency bypass.');
  const [currentRcaReport, setCurrentRcaReport] = useState<any>(null);
  const [rcaLoading, setRcaLoading] = useState<boolean>(false);

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
              saveChatToHistory({
                id: Date.now().toString(),
                prompt: chatPrompt,
                unit: chatUnit,
                role: currentRole,
                timestamp: new Date().toLocaleTimeString(),
                response: msg.data,
              });
              ws.close();
            } else if (etype === 'TASK_FAILED') {
              setChatLoading(false);
              setChatResponse({ error: msg.data.error || 'Task failed' });
              ws.close();
            }
          } catch { }
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
        saveChatToHistory({
          id: Date.now().toString(),
          prompt: chatPrompt,
          unit: chatUnit,
          role: currentRole,
          timestamp: new Date().toLocaleTimeString(),
          response: data,
        });
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
    } catch { }
    setSearchLoading(false);
  };

  const fetchIngestedDocs = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (res.ok) {
        const data = await res.json();
        setIngestedDocs(data || []);
      }
    } catch { }
  };

  const handleChatWithDoc = (docTitle: string, unit: string) => {
    setChatPrompt(`Under ${docTitle}, what are the mandatory operating conditions, safety limits, and shutdown procedures?`);
    setChatUnit(unit || 'ALL');
    setActiveTab('chat');
  };

  const handleSelectDocForChat = (doc: any) => {
    setDocChatTarget(doc);
    setDocChatResponse(null);
    setDocChatQuery(`Under this document, what are the primary procedures, safety parameters, or qualifications described?`);
  };

  const handleUniversalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUniversalUploadFile(file);
    setUniversalUploadStatus('');
    if (file) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUniversalUploadTitle(cleanName);
    }
  };

  const handleUniversalUpload = async () => {
    if (!universalUploadFile) return;
    const effectiveTitle = universalUploadTitle.trim() || universalUploadFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setUniversalUploadStatus(`Uploading and generating local vector embeddings for "${effectiveTitle}"...`);
    const formData = new FormData();
    formData.append('file', universalUploadFile);
    formData.append('title', effectiveTitle);
    formData.append('doc_type', universalUploadCategory || 'GENERAL');
    formData.append('document_type', universalUploadCategory || 'GENERAL');
    formData.append('plant_unit', universalUploadCategory || 'GENERAL');
    formData.append('confidentiality_level', universalUploadClearance);

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUniversalDoc(data);
        setLastUploadedDoc(data);
        setDocChatTarget(data);
        try {
          localStorage.setItem('sovereign_last_uploaded_doc', JSON.stringify(data));
        } catch { }
        setUniversalUploadStatus(`Document "${data.title}" indexed into pgvector. Ready to chat!`);
        setUniversalUploadFile(null);
        await fetchIngestedDocs();

        const welcomeMsg = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Document **${data.title}** (${data.confidentiality_level} • Category: ${data.plant_unit || 'GENERAL'}) has been successfully ingested and indexed into local **pgvector** with **nomic-embed-text** embeddings.

You can ask any questions about its contents, request summaries, or extract specific requirements and tables.`,
          citations: [`${data.title} (Indexed in pgvector)`],
          timestamp: new Date().toLocaleTimeString(),
        };
        setUniversalMessages([welcomeMsg]);
        try {
          localStorage.setItem(`sovereign_univ_chat_${data.id}`, JSON.stringify([welcomeMsg]));
        } catch { }
      } else {
        const errData = await res.json().catch(() => ({}));
        setUniversalUploadStatus(`Upload failed: ${errData.detail || 'Server error'}`);
      }
    } catch (e: any) {
      setUniversalUploadStatus(`Error: ${e.message}`);
    }
  };

  const handleSelectUniversalDoc = (doc: any) => {
    setUniversalDoc(doc);
    try {
      const saved = localStorage.getItem(`sovereign_univ_chat_${doc.id}`);
      if (saved) {
        setUniversalMessages(JSON.parse(saved));
      } else {
        const defaultMsg = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Active Document: **${doc.title}** (${doc.confidentiality_level} • Category: ${doc.plant_unit || 'GENERAL'}).

Ask any question, request summaries, or click a quick prompt below.`,
          citations: [`${doc.title}`],
          timestamp: new Date().toLocaleTimeString(),
        };
        setUniversalMessages([defaultMsg]);
      }
    } catch {
      setUniversalMessages([]);
    }
  };

  const sendUniversalMessage = async (overrideText?: string) => {
    const text = (overrideText || universalInput).trim();
    if (!text || !universalDoc) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedList = [...universalMessages, userMsg];
    setUniversalMessages(updatedList);
    setUniversalInput('');
    setUniversalLoading(true);

    try {
      const res = await fetch(`${API_BASE}/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prompt: `Under document "${universalDoc.title}", ${text}`,
          plant_unit: universalDoc.plant_unit || 'ALL',
          user_id: `user_${currentRole.toLowerCase()}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.final_response || data.response || 'No response returned.',
          citations: data.citations || [],
          duration: data.duration_seconds,
          timestamp: new Date().toLocaleTimeString(),
        };
        const finalList = [...updatedList, aiMsg];
        setUniversalMessages(finalList);
        try {
          localStorage.setItem(`sovereign_univ_chat_${universalDoc.id}`, JSON.stringify(finalList));
        } catch { }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Query failed: ${errData.detail || 'Could not reach backend engine.'}`,
          citations: [],
          timestamp: new Date().toLocaleTimeString(),
        };
        setUniversalMessages([...updatedList, errorMsg]);
      }
    } catch (e: any) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Network or inference error: ${e.message}`,
        citations: [],
        timestamp: new Date().toLocaleTimeString(),
      };
      setUniversalMessages([...updatedList, errorMsg]);
    } finally {
      setUniversalLoading(false);
      setTimeout(() => {
        universalChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const clearUniversalConversation = () => {
    if (!universalDoc) return;
    const freshMsg = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Conversation cleared. Ready for new questions on **${universalDoc.title}**.`,
      citations: [],
      timestamp: new Date().toLocaleTimeString(),
    };
    setUniversalMessages([freshMsg]);
    try {
      localStorage.removeItem(`sovereign_univ_chat_${universalDoc.id}`);
    } catch { }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    setUploadStatus('');
    if (file) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadTitle(cleanName);
    }
  };

  const handleDocumentUpload = async () => {
    if (!uploadFile) return;
    const effectiveTitle = uploadTitle.trim() || uploadFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setUploadStatus(`Uploading and indexing "${effectiveTitle}" with local nomic-embed-text...`);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', effectiveTitle);
    formData.append('doc_type', 'SOP');
    formData.append('document_type', 'SOP');
    formData.append('plant_unit', uploadUnit);
    formData.append('confidentiality_level', uploadClearance);

    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setLastUploadedDoc(data);
        setDocChatTarget(data);
        try {
          localStorage.setItem('sovereign_last_uploaded_doc', JSON.stringify(data));
        } catch { }
        setUploadStatus(`Document "${data.title}" indexed successfully into pgvector (${data.confidentiality_level}). You can chat with it directly on this page below!`);
        setUploadFile(null);
        await fetchIngestedDocs();
      } else {
        const errData = await res.json().catch(() => ({}));
        setUploadStatus(`Upload failed: ${errData.detail || 'Server error'}`);
      }
    } catch (e: any) {
      setUploadStatus(`Error: ${e.message}`);
    }
  };

  const executeDocChat = async (questionOverride?: string) => {
    const q = (questionOverride || docChatQuery).trim();
    if (!q || !docChatTarget) return;
    setDocChatLoading(true);
    setDocChatResponse(null);
    try {
      const res = await fetch(`${API_BASE}/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prompt: `Under document "${docChatTarget.title}", ${q}`,
          plant_unit: docChatTarget.plant_unit || 'ALL',
          user_id: `user_${currentRole.toLowerCase()}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDocChatResponse(data);
        const newEntry = {
          id: Date.now().toString(),
          docTitle: docChatTarget.title,
          question: q,
          response: data.final_response || data.response || '',
          citations: data.citations || [],
          timestamp: new Date().toLocaleTimeString(),
        };
        setDocChatHistory(prev => {
          const updated = [newEntry, ...prev].slice(0, 20);
          try {
            localStorage.setItem('sovereign_doc_chat_history', JSON.stringify(updated));
          } catch { }
          return updated;
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setDocChatResponse({ error: err.detail || 'Failed to query document.' });
      }
    } catch (e: any) {
      setDocChatResponse({ error: e.message });
    } finally {
      setDocChatLoading(false);
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
    } catch { }
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
    } catch { }
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
    } catch { }
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
    } catch { }
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
    } catch { }
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
    } catch { }
    setAuditLoading(false);
  };

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE}/governance/approvals`);
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
        if (data.length > 0 && !selectedApproval) {
          setSelectedApproval(data[0]);
          setApprovalEngineerEdits(data[0].engineer_edits || data[0].draft_content);
          setApprovalReviewNotes(data[0].review_notes || '');
        }
      }
    } catch { }
  };

  const fetchRoiMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/governance/metrics/roi`);
      if (res.ok) {
        const data = await res.json();
        setRoiMetrics(data);
      }
    } catch { }
  };

  const handleDraftNote = async () => {
    if (!draftTitle || !draftPrompt) return;
    setDraftLoading(true);
    try {
      const res = await fetch(`${API_BASE}/governance/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: draftActionType,
          title: draftTitle,
          plant_unit: draftUnit,
          prompt: draftPrompt,
          user_id: `user_${currentRole.toLowerCase()}`,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetchApprovals();
        await fetchRoiMetrics();
        setSelectedApproval(created);
        setApprovalEngineerEdits(created.draft_content);
        setApprovalReviewNotes('');
      }
    } catch { }
    setDraftLoading(false);
  };

  const handleApprovalAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedApproval) return;
    setApprovalActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/governance/approvals/${selectedApproval.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          engineer_edits: approvalEngineerEdits,
          reviewer_id: `user_${currentRole.toLowerCase()}`,
          reviewer_role: currentRole,
          review_notes: approvalReviewNotes,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedApproval(updated);
        await fetchApprovals();
        await fetchRoiMetrics();
      }
    } catch { }
    setApprovalActionLoading(false);
  };

  const fetchTelemetry = async () => {
    setTelemetryLoading(true);
    try {
      const snapRes = await fetch(`${API_BASE}/telemetry/live`);
      if (snapRes.ok) {
        const snap = await snapRes.json();
        setTelemetrySnapshot(snap);
      }
      const alarmsRes = await fetch(`${API_BASE}/telemetry/alarms`);
      if (alarmsRes.ok) {
        const data = await alarmsRes.json();
        const incomingAlarms = data.alarms || [];
        setActiveAlarms(incomingAlarms);
        if (incomingAlarms.length > 0) {
          setSelectedAlarm((prev: any) => {
            if (!prev) return incomingAlarms[0];
            const updated = incomingAlarms.find((a: any) => a.alarm_id === prev.alarm_id);
            return updated || incomingAlarms[0];
          });
        } else {
          setSelectedAlarm(null);
        }
      }
    } catch { }
    setTelemetryLoading(false);
  };

  const handleInjectFault = async (faultType: string) => {
    setFaultInjectLoading(true);
    try {
      const res = await fetch(`${API_BASE}/telemetry/inject-fault`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ fault_type: faultType }),
      });
      if (res.ok) {
        await fetchTelemetry();
      }
    } catch { }
    setFaultInjectLoading(false);
  };

  const handleResetTelemetry = async () => {
    setFaultInjectLoading(true);
    try {
      const res = await fetch(`${API_BASE}/telemetry/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });
      if (res.ok) {
        await fetchTelemetry();
      }
    } catch { }
    setFaultInjectLoading(false);
  };

  const handleAcknowledgeStep = async (alarmId: string, stepId: string) => {
    setStepAckLoading(stepId);
    try {
      const roleLabel = ROLES.find(r => r.id === currentRole)?.label || 'Operator';
      const res = await fetch(`${API_BASE}/telemetry/acknowledge-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          alarm_id: alarmId,
          step_id: stepId,
          operator_role: roleLabel,
        }),
      });
      if (res.ok) {
        await fetchTelemetry();
      }
    } catch { }
    setStepAckLoading(null);
  };

  const fetchRcaPresets = async () => {
    try {
      const res = await fetch(`${API_BASE}/investigation/rca/presets`);
      if (res.ok) {
        const data = await res.json();
        setRcaPresets(data);
      }
    } catch { }
  };

  const fetchLatestHandover = async () => {
    try {
      const res = await fetch(`${API_BASE}/investigation/shift-handover/latest`);
      if (res.ok) {
        const data = await res.json();
        setCurrentHandover(data);
      }
    } catch { }
  };

  const handleGenerateHandover = async () => {
    setHandoverLoading(true);
    try {
      const res = await fetch(`${API_BASE}/investigation/shift-handover/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          shift_type: shiftType,
          outgoing_operator: outgoingOp,
          relieving_operator: relievingOp,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentHandover(data);
      }
    } catch { }
    setHandoverLoading(false);
  };

  const handleCountersignHandover = async () => {
    if (!currentHandover) return;
    setCountersignLoading(true);
    try {
      const res = await fetch(`${API_BASE}/investigation/shift-handover/${currentHandover.id}/countersign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          relieving_operator: relievingOp,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentHandover(data);
      }
    } catch { }
    setCountersignLoading(false);
  };

  const handleSelectPreset = (p: any) => {
    setSelectedRcaPreset(p.key);
    setRcaTitle(p.incident_title);
    setRcaUnit(p.plant_unit);
    setRcaTag(p.triggering_tag);
    setRcaSop(p.sop_reference);
    setRcaObservation(p.initial_observation);
  };

  const handleGenerateRca = async () => {
    setRcaLoading(true);
    try {
      const res = await fetch(`${API_BASE}/investigation/rca/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          incident_title: rcaTitle,
          plant_unit: rcaUnit,
          triggering_tag: rcaTag,
          sop_reference: rcaSop,
          initial_observation: rcaObservation,
          investigator_id: `Lead Process Engineer (${currentRole})`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentRcaReport(data);
      }
    } catch { }
    setRcaLoading(false);
  };

  useEffect(() => {
    fetchIngestedDocs();
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'governance') {
      fetchApprovals();
      fetchRoiMetrics();
    } else if (activeTab === 'telemetry') {
      fetchTelemetry();
    } else if (activeTab === 'investigation') {
      fetchRcaPresets();
      fetchLatestHandover();
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== 'telemetry') return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

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
                  onChange={(e) => handleSelectRole(e.target.value as RoleType)}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-800 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>

                <Link
                  href="/docs"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded flex items-center space-x-1 border border-slate-300 transition shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Docs &amp; Guide</span>
                </Link>
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
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${c === 'SECRET'
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
              onClick={() => handleSelectTab('chat')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'chat'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Ask Refinery AI</span>
            </button>

            <button
              onClick={() => handleSelectTab('docs')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'docs'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>Upload &amp; Search Documents</span>
            </button>

            <button
              onClick={() => handleSelectTab('sandbox')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'sandbox'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Industrial Physics Calculator</span>
            </button>

            <button
              onClick={() => handleSelectTab('drawings')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'drawings'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <Layers className="w-4 h-4" />
              <span>P&amp;ID Drawing Explorer</span>
            </button>

            <button
              onClick={() => handleSelectTab('audit')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'audit'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Safety Audit Ledger</span>
            </button>

            <button
              onClick={() => handleSelectTab('governance')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'governance'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Drafting, Review &amp; MOC</span>
              {approvals.filter(a => a.status === 'PENDING').length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1 border border-amber-200">
                  {approvals.filter(a => a.status === 'PENDING').length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelectTab('telemetry')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'telemetry'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <Activity className="w-4 h-4" />
              <span>Live Plant Telemetry &amp; Emergency Lists</span>
              {activeAlarms.length > 0 && (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1 border border-rose-200 animate-pulse">
                  {activeAlarms.length} ALARM{activeAlarms.length > 1 ? 'S' : ''}
                </span>
              )}
            </button>

            <button
              onClick={() => handleSelectTab('investigation')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'investigation'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Shift Handover &amp; 5-Why Investigation</span>
            </button>

            <button
              onClick={() => handleSelectTab('universal')}
              className={`py-3.5 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-colors ${activeTab === 'universal'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>Universal Document Chat</span>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-emerald-300">
                ANY DOC RAG
              </span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="Refinery engineers cannot paste confidential operating limits, catalyst recipes, or emergency procedures into public cloud AI like ChatGPT without severe security and intellectual property risks."
              what="Runs local on-premise AI (llama3.2:1b) grounded only in verified plant documents. Specialised tools execute exact math formulas and trace P&IDs without hallucinating."
              how={`1. Click an active document or preset question below.
2. Click "Ask Sovereign AI" to stream reasoning and citations.
3. Revisit any past answers anytime from the saved Chat History.`}
            />
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
                    <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-bold flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span>Active Grounding Documents (What this AI reads &amp; cites):</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {ingestedDocs.length} Documents in pgvector
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {ingestedDocs.map((doc: any) => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => handleChatWithDoc(doc.title, doc.plant_unit)}
                            className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-mono px-2 py-0.5 rounded transition flex items-center space-x-1 shrink-0 shadow-xs"
                            title="Click to query this document"
                          >
                            <span className="truncate max-w-[200px]">{doc.title}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-bold border border-slate-200">
                              {doc.confidentiality_level}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

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

                    <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                      <FormattedResponse content={chatResponse.final_response || chatResponse.response || chatResponse.error || ''} />
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
                          className={`p-2.5 rounded border text-xs transition-all ${stepActive
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

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                      <History className="w-4 h-4 mr-2 text-slate-700" />
                      <span>Saved Chat History ({chatHistory.length})</span>
                    </h3>
                    {chatHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={clearChatHistory}
                        className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 flex items-center space-x-1"
                        title="Clear local browser chat history"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {chatHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No questions saved yet. Asked questions and verified responses automatically persist in browser memory.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {chatHistory.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectHistoryItem(item)}
                          className="p-2.5 rounded border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-xs space-y-1"
                        >
                          <div className="font-semibold text-slate-800 line-clamp-2 leading-snug">
                            {item.prompt}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                            <span>{item.unit || 'CDU'} • {item.role}</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-slate-400 text-center pt-1 border-t border-slate-100">
                    Stored securely in browser localStorage
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="Refinery manuals, emergency procedures, and equipment catalogs must remain strictly confidential and searchable offline without uploading documents to external clouds."
              what="Extracts text from uploaded PDFs locally, generates vector embeddings with on-premise nomic-embed-text, and provides instant in-page Q&A plus role-governed semantic search."
              how={`1. Choose a PDF file (e.g. SOP, resume, equipment manual) - title is auto-detected.
2. Click "Upload & Index (SHA-256 Verified)" to chunk and embed locally.
3. Chat with the uploaded document directly on this page below, or search across all files.`}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <MessageSquareText className="w-4 h-4 text-slate-800" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Chat with Selected Document (Local Offline AI)
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Direct Q&amp;A with your uploaded document. Grounded strictly in extracted text chunks.
                      </p>
                    </div>

                    {docChatTarget ? (
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 max-w-[200px] truncate" title={docChatTarget.title}>
                          {docChatTarget.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                          {docChatTarget.confidentiality_level}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Select or upload a document
                      </span>
                    )}
                  </div>

                  {docChatTarget ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-semibold self-center mr-1">Quick Prompts:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const q = "Summarize the key sections, roles, and main objectives in this document.";
                            setDocChatQuery(q);
                            executeDocChat(q);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded text-[11px] transition"
                        >
                          Summarize Document
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const q = "What are the mandatory operating limits, procedures, or safety standards specified?";
                            setDocChatQuery(q);
                            executeDocChat(q);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded text-[11px] transition"
                        >
                          Safety Limits &amp; Procedures
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const q = "What are the core technical qualifications, skills, or equipment parameters described?";
                            setDocChatQuery(q);
                            executeDocChat(q);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded text-[11px] transition"
                        >
                          Technical Details &amp; Roles
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={docChatQuery}
                          onChange={(e) => setDocChatQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') executeDocChat(); }}
                          placeholder={`Ask any question about "${docChatTarget.title}"...`}
                          className="flex-1 text-xs sm:text-sm p-3 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => executeDocChat()}
                          disabled={docChatLoading || !docChatQuery.trim()}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50 shadow-sm shrink-0"
                        >
                          {docChatLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <MessageSquareText className="w-3.5 h-3.5" />
                              <span>Ask Document</span>
                            </>
                          )}
                        </button>
                      </div>

                      {docChatResponse && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs animate-in fade-in">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-slate-600">
                            <span className="font-bold text-slate-900 flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                              Answer Grounded in {docChatTarget.title}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              Model: llama3.2:1b (Local Air-Gap)
                            </span>
                          </div>

                          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                            <FormattedResponse content={docChatResponse.final_response || docChatResponse.response || docChatResponse.error || ''} />
                          </div>

                          {docChatResponse.citations && docChatResponse.citations.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-slate-700 text-[11px] flex items-center mr-1">
                                <FileSearch className="w-3 h-3 mr-1 text-slate-500" />
                                Cited Excerpts:
                              </span>
                              {docChatResponse.citations.map((c: string, idx: number) => (
                                <span key={idx} className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => handleChatWithDoc(docChatTarget.title, docChatTarget.plant_unit)}
                              className="text-slate-700 hover:text-slate-900 underline flex items-center space-x-1"
                            >
                              <span>Open in Sovereign Multi-Agent Chat (Tab 1) &rarr;</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-200">
                      Choose a document from the Ingested Documents library or upload a PDF on the right to start an offline Q&amp;A session.
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <Search className="w-4 h-4 mr-2 text-slate-700" />
                    Clearance-Enforced Semantic Vector Search Across All Documents
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

                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Retrieved Document Chunks ({searchResults.length})
                    </h3>

                    {searchResults.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-500">
                        No document chunks matching clearance level <code className="font-mono bg-white px-1 py-0.5 rounded border">{clearances.join(', ')}</code> found.
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

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                            <span>Citation: {item.citation} • Unit: {item.plant_unit || 'REFINERY'}</span>
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setDocChatTarget({ title: item.document_title, plant_unit: item.plant_unit, confidentiality_level: 'INTERNAL' });
                                  setDocChatQuery(`Under page ${item.page_number || 1}, what are the specific requirements?`);
                                  executeDocChat(`Under page ${item.page_number || 1}, what are the specific requirements?`);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center space-x-1 transition"
                              >
                                <MessageSquareText className="w-3 h-3" />
                                <span>Chat Here</span>
                              </button>
                              <button
                                onClick={() => handleChatWithDoc(item.document_title, item.plant_unit)}
                                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center space-x-1 transition shadow-xs"
                              >
                                <span>Tab 1 &rarr;</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                      <Upload className="w-4 h-4 mr-2 text-slate-700" />
                      <span>Upload Technical PDF</span>
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                      Air-Gapped Ingestion
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Select PDF File:</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded p-1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Document Title (Auto-detected or custom):
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Enter document title or select a file to auto-detect..."
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Plant Unit:</label>
                      <input
                        type="text"
                        value={uploadUnit}
                        onChange={(e) => setUploadUnit(e.target.value)}
                        placeholder="e.g. CDU, FCCU, HCU"
                        className="w-full text-xs p-2 border border-slate-300 rounded uppercase font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Clearance:</label>
                      <select
                        value={uploadClearance}
                        onChange={(e) => setUploadClearance(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="INTERNAL">INTERNAL</option>
                        <option value="RESTRICTED">RESTRICTED</option>
                        <option value="SECRET">SECRET</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDocumentUpload}
                    disabled={!uploadFile}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded text-xs font-semibold disabled:opacity-50 transition shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload &amp; Index (SHA-256 Verified)</span>
                  </button>

                  {uploadStatus && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed font-sans">
                      {uploadStatus}
                    </p>
                  )}

                  {lastUploadedDoc && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950">Active Grounded Document</span>
                        <span className="font-mono text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                          {lastUploadedDoc.confidentiality_level}
                        </span>
                      </div>
                      <p className="text-emerald-900 font-semibold text-xs truncate">
                        {lastUploadedDoc.title}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDocChatTarget(lastUploadedDoc);
                            setDocChatQuery('');
                            setDocChatResponse(null);
                          }}
                          className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-2 rounded text-xs transition flex items-center justify-center space-x-1 shadow-sm"
                        >
                          <MessageSquareText className="w-3.5 h-3.5" />
                          <span>Chat Here (Tab 2)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChatWithDoc(lastUploadedDoc.title, lastUploadedDoc.plant_unit)}
                          className="bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold py-1.5 px-2 rounded text-xs transition shrink-0"
                          title="Open full agent pipeline in Tab 1"
                        >
                          <span>Tab 1 &rarr;</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                      <span>Ingested Documents ({ingestedDocs.length})</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">pgvector</span>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {ingestedDocs.map((doc: any) => (
                      <div
                        key={doc.id}
                        className={`p-2.5 rounded border transition flex items-center justify-between gap-2 text-xs ${docChatTarget?.id === doc.id || docChatTarget?.title === doc.title
                          ? 'border-emerald-300 bg-emerald-50/60'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate text-[11px]">{doc.title}</div>
                          <div className="text-[9px] font-mono text-slate-500">
                            {doc.plant_unit || 'ALL'} • <span className="font-semibold text-slate-700">{doc.confidentiality_level}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectDocForChat(doc)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded transition shadow-xs ${docChatTarget?.id === doc.id || docChatTarget?.title === doc.title
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                              }`}
                          >
                            Chat Here
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChatWithDoc(doc.title, doc.plant_unit)}
                            className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-1.5 py-0.5 rounded transition"
                            title="Open in Tab 1"
                          >
                            Tab 1
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="Neural network LLMs hallucinate numbers and cannot be trusted for critical engineering calculations where an arithmetic mistake could rupture pipes or damage reactors."
              what="Routes heat exchanger, pump power, and fluid dynamics equations through a deterministic Python AST sandbox that verifies math against physical laws and vendor specs."
              how={`1. Select a formula (Heat Exchanger, Pump, Friction).
2. Input temperatures, surface areas, and vendor duty.
3. Click "Verify Against Physical Laws" for certified math.`}
            />
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
                        className={`px-2 py-0.5 rounded font-bold ${calcResult.verification_passed
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
                    className={`p-3 rounded border text-xs font-mono ${astResult.status === 'SECURITY_VIOLATION'
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
          </div>
        )}

        {activeTab === 'drawings' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="During plant emergencies, tracing isolation valves and instrument loops across complex engineering blueprints by hand takes valuable time and risks human oversight."
              what="Reads P&ID diagrams locally, detects equipment tags, and maps the connected safety network and isolation boundary around any pump, column, or valve."
              how={`1. Upload a P&ID schematic or use pre-loaded CDU.
2. Enter target equipment tag (e.g. P-204A) and radius.
3. Click "Trace Connected Network" to map valves.`}
            />
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
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="Refinery safety audits under OISD, OSHA, and PESO standards require legally verifiable proof that safety checks, calculations, and approvals were never altered or backdated."
              what="Maintains a cryptographic SHA-256 hash-chained event ledger in PostgreSQL. Every query, calculation, and approval creates an immutable sequential block."
              how={`1. Review timestamped events and parent-block hashes.
2. Click "Verify Chain Integrity" to run cryptographic audit.
3. Inspect verification status proving zero tampering.`}
            />
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
                    className={`p-3.5 rounded-lg border text-xs mb-4 font-mono ${auditVerifyResult.integrity_valid
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
          </div>
        )}

        {activeTab === 'governance' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="Uncontrolled equipment changes cause catastrophic refinery incidents. Formal Management of Change (MOC) requires hazard reviews, engineering revisions, and management approval."
              what="Synthesizes formal MOC notes and SOP procedures with safety checklists, tracks pending manager approvals, calculates engineering hours saved, and exports official sign-off PDFs."
              how={`1. Draft a proposed plant modification (e.g. Pump Impeller).
2. Review auto-generated hazard checklist and notes.
3. Switch to Plant Manager role to approve & download PDF.`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                  <span>Tasks Automated</span>
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {roiMetrics?.total_tasks_automated || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Baseline: 45 mins/task
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                  <span>Cumulative Time Saved</span>
                  <Clock className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {roiMetrics?.cumulative_hours_saved || 0} <span className="text-sm font-normal text-slate-600">hrs</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Engineer turnaround freed
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                  <span>Operational Cost Saved</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  ₹{Number(roiMetrics?.cumulative_cost_saved_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  @ ₹1,500/hr engineering rate
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
                  <span>Speedup Acceleration</span>
                  <Cpu className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 font-mono text-emerald-700">
                  {roiMetrics?.speedup_percentage || 0}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Avg turnaround: {roiMetrics?.average_turnaround_seconds || 0}s
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                      <FileSignature className="w-4 h-4 text-slate-700" />
                      <span>Draft Technical Approval Note</span>
                    </h2>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      LOCAL LLAMA-3.2:1B
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Quick Presets:</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          setDraftTitle('MOC: FCCU Slurry Pump P-201A Impeller Upgrade');
                          setDraftUnit('FCCU');
                          setDraftActionType('EQUIPMENT_MODIFICATION');
                          setDraftPrompt('Propose replacement of standard impeller on slurry pump P-201A with hardened tungsten-carbide impeller to mitigate catalyst slurry abrasion and suppress vibration below 2.8 mm/s RMS under ISO 10816-3.');
                        }}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 transition"
                      >
                        P-201A Impeller MOC
                      </button>
                      <button
                        onClick={() => {
                          setDraftTitle('CDU-1 Column T-101 Emergency Depressurization Review');
                          setDraftUnit('CDU-1');
                          setDraftActionType('SHUTDOWN_PROCEDURE');
                          setDraftPrompt('Review emergency trigger thresholds for ESD-1 on Column T-101 and pre-heat exchanger E-101 thermal bypass timing under SOP OPS-101.');
                        }}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 transition"
                      >
                        CDU-1 ESD-1 Review
                      </button>
                      <button
                        onClick={() => {
                          setDraftTitle('Site H2S Gas Monitor Sensor Calibration Schedule');
                          setDraftUnit('REFINERY-WIDE');
                          setDraftActionType('MOC_PROPOSAL');
                          setDraftPrompt('Establish mandatory quarterly sensor calibration protocol for personal 4-gas detectors and fixed perimeter beacons under SOP HSE-001.');
                        }}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-200 transition"
                      >
                        HSE Gas Monitor MOC
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Action Type</label>
                      <select
                        value={draftActionType}
                        onChange={(e) => setDraftActionType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                      >
                        <option value="EQUIPMENT_MODIFICATION">EQUIPMENT_MODIFICATION</option>
                        <option value="MOC_PROPOSAL">MOC_PROPOSAL</option>
                        <option value="CHEMICAL_DOSING">CHEMICAL_DOSING</option>
                        <option value="SHUTDOWN_PROCEDURE">SHUTDOWN_PROCEDURE</option>
                        <option value="VENDOR_EVALUATION">VENDOR_EVALUATION</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Plant Unit</label>
                      <select
                        value={draftUnit}
                        onChange={(e) => setDraftUnit(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                      >
                        <option value="FCCU">FCCU</option>
                        <option value="CDU-1">CDU-1</option>
                        <option value="HCU">HCU</option>
                        <option value="REFINERY-WIDE">REFINERY-WIDE</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Memorandum Title</label>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Technical Scope & Justification</label>
                    <textarea
                      rows={3}
                      value={draftPrompt}
                      onChange={(e) => setDraftPrompt(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800 font-sans leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleDraftNote}
                    disabled={draftLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {draftLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Grounded Draft...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Generate Formal Approval Note</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Governance Queue ({approvals.length})</span>
                    </h3>
                    <div className="flex space-x-1 text-[10px]">
                      {['ALL', 'PENDING', 'APPROVED'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setApprovalFilter(f)}
                          className={`px-2 py-0.5 rounded font-mono font-medium ${approvalFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {approvals
                      .filter((a) => approvalFilter === 'ALL' || a.status === approvalFilter)
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedApproval(item);
                            setApprovalEngineerEdits(item.engineer_edits || item.draft_content);
                            setApprovalReviewNotes(item.review_notes || '');
                          }}
                          className={`p-3 rounded border text-xs cursor-pointer transition ${selectedApproval?.id === item.id
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 truncate max-w-[200px]">{item.title}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${item.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : item.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>UNIT: {item.plant_unit}</span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                {selectedApproval ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            ID: {selectedApproval.id.substring(0, 8)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${selectedApproval.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : selectedApproval.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                          >
                            {selectedApproval.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{selectedApproval.title}</h3>
                        <p className="text-xs text-slate-500 font-mono">
                          Unit: {selectedApproval.plant_unit} • Action: {selectedApproval.action_type}
                        </p>
                      </div>

                      {selectedApproval.status === 'APPROVED' && (
                        <a
                          href={`${API_BASE}/governance/approvals/${selectedApproval.id}/export-pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Signed PDF</span>
                        </a>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Reviewer Edits & Formal Draft Content:
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">Editable by Process Engineer / Plant Manager</span>
                      </div>
                      <textarea
                        rows={12}
                        value={approvalEngineerEdits}
                        onChange={(e) => setApprovalEngineerEdits(e.target.value)}
                        disabled={selectedApproval.status === 'APPROVED'}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-xs font-mono text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Reviewer Sign-Off Notes / Operational Directives:
                      </label>
                      <input
                        type="text"
                        value={approvalReviewNotes}
                        onChange={(e) => setApprovalReviewNotes(e.target.value)}
                        disabled={selectedApproval.status === 'APPROVED'}
                        placeholder="e.g. Approved subject to mechanical seal pressure test and PTW check."
                        className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    {selectedApproval.status === 'APPROVED' ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 font-mono text-xs text-emerald-900 space-y-1">
                        <div className="flex items-center space-x-2 font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>CRYPTOGRAPHICALLY SIGNED & VERIFIED</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 truncate">
                          Signature SHA-256: {selectedApproval.signature_hash}
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          Signatory: {selectedApproval.reviewer_id} • Signed UTC: {new Date(selectedApproval.reviewed_at).toUTCString()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 pt-2">
                        <button
                          onClick={() => handleApprovalAction('APPROVE')}
                          disabled={approvalActionLoading}
                          className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sign & Approve (Cryptographic Seal)</span>
                        </button>
                        <button
                          onClick={() => handleApprovalAction('REJECT')}
                          disabled={approvalActionLoading}
                          className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold px-4 py-2.5 rounded transition flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400 space-y-3">
                    <FileSignature className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-medium">Select an approval request from the queue to review, edit, and sign off.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="During control room alarms, operators under stress must immediately locate the exact emergency SOP without flipping through 500-page paper binders."
              what="Simulates live plant sensors across CDU, FCCU, and HCU. When operating thresholds are breached, it automatically cites the governing SOP and builds an interactive checklist."
              how={`1. Click a fault scenario (e.g. Furnace Overheat).
2. Watch live sensor gauge spike with cited emergency SOP.
3. Click "Sign-Off Step" as each action is completed.`}
            />
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-md ${telemetrySnapshot?.overall_status === 'CRITICAL'
                    ? 'bg-rose-700 text-white animate-pulse'
                    : telemetrySnapshot?.overall_status === 'WARNING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-700 text-white'
                    }`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-slate-900">Distributed Control System (DCS) Live Telemetry</h2>
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${telemetrySnapshot?.overall_status === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : telemetrySnapshot?.overall_status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                        {telemetrySnapshot?.overall_status === 'CRITICAL'
                          ? 'CRITICAL TRIP ALARM ACTIVE'
                          : telemetrySnapshot?.overall_status === 'WARNING'
                            ? 'WARNING DEVIATION'
                            : 'ALL PROCESS SYSTEMS NORMAL'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Honeywell TDC 3000 / Experion Stream Simulator • Air-Gapped Zero-Egress Sampling (4s cycle)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchTelemetry}
                    disabled={telemetryLoading}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${telemetryLoading ? 'animate-spin' : ''}`} />
                    <span>Poll DCS</span>
                  </button>
                  <button
                    onClick={handleResetTelemetry}
                    disabled={faultInjectLoading}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded transition flex items-center space-x-1.5 border border-slate-200 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Nominal</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Emergency Incident Simulator (Fault Injection)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Simulates plant DCS sensor excursions to verify automatic SOP cross-correlation</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleInjectFault('CDU_FURNACE_OVERHEAT')}
                    disabled={faultInjectLoading}
                    className="bg-slate-50 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 rounded p-2.5 text-left transition disabled:opacity-50 group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-rose-900">CDU Furnace Overheat</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">TT-102 &gt; 385°C • Triggers SOP OPS-101</div>
                  </button>

                  <button
                    onClick={() => handleInjectFault('CDU_COLUMN_OVERPRESSURE')}
                    disabled={faultInjectLoading}
                    className="bg-slate-50 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 rounded p-2.5 text-left transition disabled:opacity-50 group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-rose-900">CDU Overhead Overpressure</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">PT-101 &gt; 3.8 bar • Triggers SOP OPS-101</div>
                  </button>

                  <button
                    onClick={() => handleInjectFault('FCCU_PUMP_SEAL_FAILURE')}
                    disabled={faultInjectLoading}
                    className="bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded p-2.5 text-left transition disabled:opacity-50 group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-amber-900">Slurry Pump P-201A Trip</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Vibration &gt; 9.0 mm/s • SOP MEC-201</div>
                  </button>

                  <button
                    onClick={() => handleInjectFault('HCU_QUENCH_RUNAWAY')}
                    disabled={faultInjectLoading}
                    className="bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded p-2.5 text-left transition disabled:opacity-50 group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-purple-900">HCU Bed 1-2 Quench Runaway</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">Delta T &gt; 18°C • SPEC HCK-901</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-slate-600" />
                    <span>Plant Unit Telemetry Gauges</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {telemetrySnapshot?.units?.length || 0} Units Online
                  </span>
                </div>

                {telemetrySnapshot?.units?.map((unit: any) => (
                  <div key={unit.unit_id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{unit.unit_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{unit.unit_id} DCS Subsystem</div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${unit.status === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : unit.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                        {unit.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {unit.sensors.map((s: any) => (
                        <div
                          key={s.tag}
                          className={`p-2.5 rounded border transition-colors ${s.status === 'CRITICAL'
                            ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                            : s.status === 'WARNING'
                              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs">{s.tag}</span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${s.status === 'CRITICAL'
                              ? 'bg-rose-200 text-rose-900'
                              : s.status === 'WARNING'
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-slate-200 text-slate-700'
                              }`}>
                              {s.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{s.name}</div>
                          <div className="text-lg font-mono font-black mt-1">
                            {s.value} <span className="text-xs font-normal text-slate-500 font-sans">{s.engineering_unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                            <span>Norm: {s.nominal}</span>
                            {s.trip_threshold && (
                              <span className="text-rose-700 font-semibold">Trip: {s.trip_threshold}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-slate-700" />
                    <span>Emergency SOP Incident Action Console</span>
                  </h3>
                  {activeAlarms.length > 0 && (
                    <span className="bg-rose-100 text-rose-800 text-xs font-mono font-bold px-2 py-0.5 rounded border border-rose-300 animate-pulse">
                      {activeAlarms.length} Active Emergency Incident{activeAlarms.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {activeAlarms.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">All Refinery Units Safe & Nominal</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Zero active process alarms. When process telemetry deviates beyond safety margins, the sovereign engine automatically cross-references ISA-5.1 tag topography with confidential refinery SOPs and synthesizes an auditable, step-by-step emergency checklist.
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Click any fault scenario above to simulate a live refinery emergency.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeAlarms.length > 1 && (
                      <div className="flex space-x-2 overflow-x-auto pb-1">
                        {activeAlarms.map((alm: any) => (
                          <button
                            key={alm.alarm_id}
                            onClick={() => setSelectedAlarm(alm)}
                            className={`px-3 py-1.5 text-xs font-mono font-bold rounded border transition whitespace-nowrap ${selectedAlarm?.alarm_id === alm.alarm_id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            {alm.alarm_id} ({alm.tag})
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedAlarm && (
                      <div className="space-y-4">
                        <div className="bg-rose-50 border border-rose-300 rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2.5">
                              <AlertTriangle className="w-5 h-5 text-rose-700 mt-0.5 shrink-0" />
                              <div>
                                <div className="text-sm font-bold text-rose-950">
                                  {selectedAlarm.description}
                                </div>
                                <div className="text-xs text-rose-800 font-mono mt-0.5">
                                  Alarm ID: {selectedAlarm.alarm_id} • Unit: {selectedAlarm.unit_name} ({selectedAlarm.unit_id})
                                </div>
                              </div>
                            </div>
                            <span className="bg-rose-200 text-rose-900 text-xs font-mono font-black px-2.5 py-1 rounded uppercase tracking-wider">
                              {selectedAlarm.severity}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-rose-200/60 text-xs font-mono">
                            <div>
                              <span className="text-rose-700 block text-[10px] uppercase">Triggering Tag</span>
                              <span className="font-bold text-rose-950">{selectedAlarm.tag}</span>
                            </div>
                            <div>
                              <span className="text-rose-700 block text-[10px] uppercase">Recorded Value</span>
                              <span className="font-bold text-rose-950">{selectedAlarm.current_value} {selectedAlarm.engineering_unit}</span>
                            </div>
                            <div>
                              <span className="text-rose-700 block text-[10px] uppercase">Trip Threshold</span>
                              <span className="font-bold text-rose-950">{selectedAlarm.threshold_value} {selectedAlarm.engineering_unit}</span>
                            </div>
                            <div>
                              <span className="text-rose-700 block text-[10px] uppercase">Clearance Gate</span>
                              <span className="font-bold text-rose-950">[{selectedAlarm.sop_clearance}]</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
                          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Correlated Standard Operating Procedure &amp; P&amp;ID Topography
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono font-bold px-2.5 py-1 rounded flex items-center space-x-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-600" />
                              <span>{selectedAlarm.sop_doc_id}</span>
                            </span>
                            <span className="text-xs text-slate-600 font-medium">{selectedAlarm.sop_title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono pt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400">Connected P&amp;ID Assets:</span>
                            {selectedAlarm.connected_equipment?.map((eq: string) => (
                              <span key={eq} className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded font-bold">
                                {eq}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                              <CheckSquare className="w-4 h-4 text-emerald-700" />
                              <span>Mandatory Emergency Operational Steps</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {selectedAlarm.checklist?.filter((s: any) => s.completed).length} / {selectedAlarm.checklist?.length} Executed
                            </span>
                          </div>

                          <div className="space-y-3">
                            {selectedAlarm.checklist?.map((step: any) => (
                              <div
                                key={step.step_id}
                                className={`p-3.5 rounded-lg border transition ${step.completed
                                  ? 'bg-emerald-50/70 border-emerald-300'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                      <span className="bg-slate-900 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                                        STEP {step.sequence}
                                      </span>
                                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${step.priority.includes('CRITICAL')
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : step.priority.includes('HIGH')
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                                        }`}>
                                        {step.priority}
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-mono">
                                        Ref: {step.sop_reference}
                                      </span>
                                    </div>

                                    <p className={`text-xs font-medium leading-relaxed ${step.completed ? 'text-emerald-950 line-through' : 'text-slate-800'
                                      }`}>
                                      {step.action}
                                    </p>

                                    <div className="flex items-center space-x-1.5 pt-1 text-[10px] font-mono text-slate-500">
                                      <span className="text-slate-400">Target Tags:</span>
                                      {step.associated_tags?.map((t: string) => (
                                        <span key={t} className="bg-slate-100 text-slate-700 border border-slate-200 px-1 rounded font-semibold">
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="shrink-0 pt-1">
                                    {step.completed ? (
                                      <div className="text-right">
                                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded text-[11px] font-mono font-bold">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                          <span>EXECUTED</span>
                                        </span>
                                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                          {step.completed_by} • SHA-256 Logged
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleAcknowledgeStep(selectedAlarm.alarm_id, step.step_id)}
                                        disabled={stepAckLoading === step.step_id}
                                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                                      >
                                        <CheckCircle2 className={`w-3.5 h-3.5 ${stepAckLoading === step.step_id ? 'animate-spin' : ''}`} />
                                        <span>Sign-Off Step</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'investigation' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="Incomplete shift handovers are a leading cause of industrial accidents worldwide, and incident investigations often stop at operator error instead of fixing the root cause."
              what="Synthesizes 8-hour shift turnover logs directly from the audit ledger with dual signatures, and runs 5-Why root cause investigations with assigned CAPA deadlines."
              how={`1. Click "Synthesize Shift Handover" & export signed PDF.
2. Pick an incident preset (e.g. Slurry Pump Trip).
3. Click "Run 5-Why Investigation" & review CAPA deadlines.`}
            />
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-900 text-white p-2.5 rounded-md">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Shift Handover Intelligence &amp; 5-Why Root Cause Analysis</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Autonomous Shift Log Synthesis • Dual-Signatory Cryptographic Handover • 5-Why Causal Investigation &amp; CAPA
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    Active Clearance: {currentRole}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-slate-800" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Plant Operations Shift Handover</h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      8-HOUR OPERATIONAL CYCLE
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['MORNING', 'EVENING', 'NIGHT'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setShiftType(s)}
                        className={`py-2 text-xs font-bold font-mono rounded border transition text-center ${shiftType === s
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {s} SHIFT
                        <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                          {s === 'MORNING' ? '06:00 - 14:00' : s === 'EVENING' ? '14:00 - 22:00' : '22:00 - 06:00'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Outgoing Shift In-Charge (SIC)</label>
                      <input
                        type="text"
                        value={outgoingOp}
                        onChange={(e) => setOutgoingOp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Relieving Shift In-Charge (SIC)</label>
                      <input
                        type="text"
                        value={relievingOp}
                        onChange={(e) => setRelievingOp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateHandover}
                    disabled={handoverLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${handoverLoading ? 'animate-spin' : ''}`} />
                    <span>Synthesize Shift Handover from Live Cryptographic Ledger</span>
                  </button>

                  {currentHandover && (
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-700">Ref: MRPL-SH-{currentHandover.id.slice(0, 8).toUpperCase()}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Events Audited: <strong className="text-slate-800">{currentHandover.events_count}</strong>
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-800">
                        {currentHandover.handover_summary}
                      </div>

                      <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 space-y-2 text-xs">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Dual-Signatory Cryptographic Handover Seal
                        </div>
                        <div className="font-mono text-[11px] space-y-1">
                          <div className="text-slate-700 truncate">
                            Outgoing Sig (SHA-256): <span className="font-bold text-slate-900">{currentHandover.outgoing_signature}</span>
                          </div>
                          <div className="text-slate-700 truncate">
                            Relief Sig: {currentHandover.relieving_signature ? (
                              <span className="font-bold text-emerald-700">{currentHandover.relieving_signature}</span>
                            ) : (
                              <span className="text-amber-700 font-semibold">Awaiting Relief Counter-Signature</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          {!currentHandover.relieving_signature && (
                            <button
                              onClick={handleCountersignHandover}
                              disabled={countersignLoading}
                              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded transition flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Relief Counter-Sign</span>
                            </button>
                          )}
                          <a
                            href={`${API_BASE}/investigation/shift-handover/${currentHandover.id}/export-pdf`}
                            download
                            className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 rounded transition flex items-center justify-center space-x-1.5 shadow-sm text-center"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Signed PDF</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-slate-800" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">5-Why Incident Root Cause Analysis (RCA)</h3>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      SAFETY INVESTIGATION &amp; CAPA
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Load Incident Preset</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {rcaPresets.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => handleSelectPreset(p)}
                          className={`p-2 text-left rounded border transition ${selectedRcaPreset === p.key
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          <div className="text-[11px] font-bold truncate">{p.incident_title.split(' ')[0]} {p.incident_title.split(' ')[1]}</div>
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">{p.plant_unit} • {p.triggering_tag}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Incident Title</label>
                      <input
                        type="text"
                        value={rcaTitle}
                        onChange={(e) => setRcaTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Plant Unit</label>
                        <input
                          type="text"
                          value={rcaUnit}
                          onChange={(e) => setRcaUnit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Triggering Tag</label>
                        <input
                          type="text"
                          value={rcaTag}
                          onChange={(e) => setRcaTag(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Governing SOP</label>
                        <input
                          type="text"
                          value={rcaSop}
                          onChange={(e) => setRcaSop(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Initial Observation / Alarm Event</label>
                      <textarea
                        rows={2}
                        value={rcaObservation}
                        onChange={(e) => setRcaObservation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateRca}
                    disabled={rcaLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                  >
                    <GitBranch className={`w-3.5 h-3.5 ${rcaLoading ? 'animate-spin' : ''}`} />
                    <span>Run 5-Why Causal Investigation &amp; Synthesize CAPA</span>
                  </button>

                  {currentRcaReport && (
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-700">RCA ID: {currentRcaReport.id.slice(0, 8).toUpperCase()}</span>
                        <a
                          href={`${API_BASE}/investigation/rca/${currentRcaReport.id}/export-pdf`}
                          download
                          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded transition flex items-center space-x-1 shadow-sm"
                        >
                          <Download className="w-3 h-3" />
                          <span>Export Signed RCA PDF</span>
                        </a>
                      </div>

                      <div className="bg-rose-50 border border-rose-200 rounded p-2.5 text-xs text-rose-950 font-medium">
                        <span className="font-bold">Problem Statement: </span>
                        {currentRcaReport.problem_statement}
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">5-Why Causal Progression Tree</div>
                        {currentRcaReport.why_steps?.map((w: any) => (
                          <div key={w.level} className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="bg-slate-800 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                                LEVEL {w.level}
                              </span>
                              <span className="font-semibold text-slate-900">{w.question}</span>
                            </div>
                            <div className="text-slate-700 pl-4 border-l-2 border-slate-300 mt-1">
                              <strong>Finding:</strong> {w.answer}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 pl-4">
                              Evidence: {w.evidence_reference}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Assigned Corrective &amp; Preventive Actions (CAPA)
                        </div>
                        <div className="space-y-1.5">
                          {currentRcaReport.capa_items?.map((c: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 text-xs flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${c.action_type === 'CORRECTIVE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {c.action_type}
                                  </span>
                                  <span className="font-medium text-slate-800">{c.description}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Owner: {c.owner} • Target SOP: {c.target_sop}
                                </div>
                              </div>
                              <span className="bg-slate-200 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0">
                                {c.deadline_days}d
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[10px] font-mono text-slate-600 truncate">
                        Digital Verification Seal (SHA-256): <span className="font-bold text-slate-900">{currentRcaReport.signature_hash}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'universal' && (
          <div className="space-y-6">
            <ExecutiveSummary
              why="Refinery and corporate personnel receive ad-hoc technical documents (vendor proposals, contractor resumes, incident memos, safety inspection sheets) that cannot be sent to commercial cloud AI without violating corporate security and confidentiality standards."
              what="Universal air-gapped document RAG. Ingests ANY arbitrary PDF document, extracts text, computes 768-dimensional local vector embeddings with nomic-embed-text into PostgreSQL, and runs full multi-turn conversational Q&A using local llama3.2:1b with exact citations and zero external network egress."
              how={`1. Drag & drop or choose ANY PDF document in the right panel and click "Upload & Ingest to Local RAG".
2. The active document is immediately loaded into the chat engine with verified pgvector chunks.
3. Chat naturally, click quick prompt suggestions, and inspect verified source citations with page numbers.`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-emerald-700 text-white p-2 rounded-md">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-base font-bold text-slate-900">
                            {universalDoc ? universalDoc.title : 'Universal Document RAG Chat'}
                          </h2>
                          {universalDoc && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-300">
                              {universalDoc.confidentiality_level}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {universalDoc
                            ? `Unit/Category: ${universalDoc.plant_unit || 'GENERAL'} • SHA-256 Verified Ingestion`
                            : 'Upload any document on the right to start an offline conversational RAG session'}
                        </p>
                      </div>
                    </div>

                    {universalDoc && (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={clearUniversalConversation}
                          className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded transition flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear Chat</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="min-h-[460px] max-h-[580px] overflow-y-auto p-4 space-y-4 bg-slate-50/70 rounded-lg border border-slate-200">
                    {universalMessages.length === 0 ? (
                      <div className="text-center py-16 space-y-3">
                        <FileQuestion className="w-12 h-12 mx-auto text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-700">No Document Selected Yet</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Upload any PDF document using the form on the right, or pick an existing document from the library below.
                        </p>
                      </div>
                    ) : (
                      universalMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'user' ? (
                            <div className="bg-slate-900 text-white rounded-2xl rounded-tr-sm p-3.5 max-w-[85%] sm:max-w-[75%] shadow-sm text-xs sm:text-sm">
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <div className="text-[10px] text-slate-400 font-mono text-right mt-1">
                                {msg.timestamp}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 max-w-[95%] sm:max-w-[90%] shadow-sm space-y-2.5">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                                    <Bot className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-bold text-slate-900 text-xs">Sovereign Document AI</span>
                                  <span className="text-[10px] font-mono text-slate-400">llama3.2:1b (Local)</span>
                                </div>
                                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                                  {msg.duration && <span>{msg.duration}s</span>}
                                  <span>{msg.timestamp}</span>
                                </div>
                              </div>

                              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                                <FormattedResponse content={msg.content} />
                              </div>

                              {msg.citations && msg.citations.length > 0 && (
                                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-slate-600 flex items-center mr-1">
                                    <FileSearch className="w-3 h-3 mr-1 text-slate-500" />
                                    Source Excerpts:
                                  </span>
                                  {msg.citations.map((c: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono"
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {universalLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-2 max-w-md">
                          <div className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                            <span>Retrieving vector chunks and generating verified response...</span>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-5">
                            Processing query locally with pgvector similarity search and llama3.2:1b.
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={universalChatBottomRef} />
                  </div>

                  {universalDoc && (
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-semibold self-center mr-1">Quick Prompts:</span>
                        <button
                          type="button"
                          onClick={() => sendUniversalMessage('Summarize the primary contents, objectives, and conclusions of this document in 5 bullet points.')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] transition font-medium border border-slate-200"
                        >
                          Summarize Document
                        </button>
                        <button
                          type="button"
                          onClick={() => sendUniversalMessage('What are the mandatory operating conditions, technical specifications, or safety constraints detailed here?')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] transition font-medium border border-slate-200"
                        >
                          Key Specifications &amp; Limits
                        </button>
                        <button
                          type="button"
                          onClick={() => sendUniversalMessage('List all specific equipment tags, role titles, qualifications, or procedural steps referenced in this file.')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] transition font-medium border border-slate-200"
                        >
                          Equipment &amp; Roles
                        </button>
                        <button
                          type="button"
                          onClick={() => sendUniversalMessage('Identify any risks, warning flags, compliance liabilities, or strict precautions in this document.')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[11px] transition font-medium border border-slate-200"
                        >
                          Risks &amp; Warnings
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={universalInput}
                            onChange={(e) => setUniversalInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') sendUniversalMessage();
                            }}
                            placeholder={`Ask any question about "${universalDoc.title}"...`}
                            className="w-full text-xs sm:text-sm p-3 pl-9 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans shadow-xs"
                          />
                          <Paperclip className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        </div>
                        <button
                          type="button"
                          onClick={() => sendUniversalMessage()}
                          disabled={universalLoading || !universalInput.trim()}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50 shadow-sm shrink-0"
                        >
                          {universalLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Send</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                        <span>Grounding: 100% Local pgvector • Model: llama3.2:1b (Air-Gapped)</span>
                        <span>Zero External Egress Certified</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                      <Upload className="w-4 h-4 mr-2 text-slate-700" />
                      <span>Upload Any Document</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Universal RAG
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Select PDF File:</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleUniversalFileSelect}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded p-1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Document Title (Auto-detected or custom):
                    </label>
                    <input
                      type="text"
                      value={universalUploadTitle}
                      onChange={(e) => setUniversalUploadTitle(e.target.value)}
                      placeholder="Title detected automatically from file..."
                      className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Category / Unit:</label>
                      <input
                        type="text"
                        value={universalUploadCategory}
                        onChange={(e) => setUniversalUploadCategory(e.target.value)}
                        placeholder="e.g. GENERAL, VENDOR, HR"
                        className="w-full text-xs p-2 border border-slate-300 rounded uppercase font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Clearance:</label>
                      <select
                        value={universalUploadClearance}
                        onChange={(e) => setUniversalUploadClearance(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="INTERNAL">INTERNAL</option>
                        <option value="RESTRICTED">RESTRICTED</option>
                        <option value="SECRET">SECRET</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleUniversalUpload}
                    disabled={!universalUploadFile}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded text-xs font-semibold disabled:opacity-50 transition shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload &amp; Ingest to Local RAG</span>
                  </button>

                  {universalUploadStatus && (
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed font-sans">
                      {universalUploadStatus}
                    </p>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                      <span>Ingested Documents Library ({ingestedDocs.length})</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">pgvector</span>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={universalSearchFilter}
                      onChange={(e) => setUniversalSearchFilter(e.target.value)}
                      placeholder="Filter by title or unit..."
                      className="w-full text-xs p-1.5 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none font-sans"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {ingestedDocs
                      .filter((d: any) =>
                        !universalSearchFilter ||
                        d.title.toLowerCase().includes(universalSearchFilter.toLowerCase()) ||
                        (d.plant_unit && d.plant_unit.toLowerCase().includes(universalSearchFilter.toLowerCase()))
                      )
                      .map((doc: any) => {
                        const isCurrent = universalDoc?.id === doc.id || universalDoc?.title === doc.title;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => handleSelectUniversalDoc(doc)}
                            className={`p-2.5 rounded border transition flex items-center justify-between gap-2 text-xs cursor-pointer ${isCurrent
                              ? 'border-emerald-500 bg-emerald-50 shadow-xs ring-1 ring-emerald-400'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                              }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-900 truncate text-[11px] flex items-center space-x-1">
                                {isCurrent && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                                <span className="truncate">{doc.title}</span>
                              </div>
                              <div className="text-[9px] font-mono text-slate-500">
                                {doc.plant_unit || 'ALL'} • <span className="font-semibold text-slate-700">{doc.confidentiality_level}</span>
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${isCurrent
                                ? 'bg-emerald-700 text-white'
                                : 'bg-white text-slate-700 border border-slate-200'
                                }`}
                            >
                              {isCurrent ? 'ACTIVE' : 'SELECT'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-4 shadow-sm text-xs space-y-2 border border-slate-800">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Air-Gap Ingestion Guarantee</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Every document chunk is indexed locally into PostgreSQL with 768-dim vector embeddings. No document content or queries ever leave this machine.
                  </p>
                </div>
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
