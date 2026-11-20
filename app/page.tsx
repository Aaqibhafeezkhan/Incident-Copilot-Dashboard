"use client";

import { useMemo, useState } from "react";
import { Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Bell, BookOpen, Bot, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Command, ExternalLink, Filter, Gauge, GitBranch, Layers3, LifeBuoy, ListFilter, Loader2, Search, Server, ShieldCheck, Sparkles, Terminal, Zap } from "lucide-react";
import { incidents, knowledge, type Incident, type Status } from "@/lib/demo-data";

type Analysis = {
  summary: string; suspectedRootCause: string; confidence: number; impactAssessment: string;
  recommendedActions: { priority: "now"|"next"|"later"; title: string; detail: string }[];
  evidence: string[]; missingInformation: string[]; relatedIncidents: string[]; provider: string;
};

const timeAgo = (date: string) => {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  return mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : `${Math.floor(mins/1440)}d ago`;
};
const severityClass = (severity: string) => severity.toLowerCase();
const statusLabel = (status: string) => status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ");
const priorityLabel = (priority: string) => priority === "now" ? "IMMEDIATE" : priority === "next" ? "NEXT STEP" : "FOLLOW-UP";

export default function Home() {
  const [selectedId, setSelectedId] = useState(incidents[0].id);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisIncident, setAnalysisIncident] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [showRunbooks, setShowRunbooks] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const selected = incidents.find((item) => item.id === selectedId) || incidents[0];
  const filtered = useMemo(() => incidents.filter((item) => (filter === "ALL" || item.severity === filter) && (item.title + item.id + item.service + item.assignee).toLowerCase().includes(query.toLowerCase())), [filter, query]);
  const activeCount = incidents.filter((item) => item.status !== "RESOLVED").length;
  const criticalCount = incidents.filter((item) => item.severity === "P1" && item.status !== "RESOLVED").length;
  const runbook = knowledge.find((item) => item.service === selected.service);

  async function runAnalysis() {
    setAnalysis(null); setAnalysisError(""); setAnalysisIncident(selected.id); setActiveTab("copilot");
    try {
      const response = await fetch(`/api/incidents/${encodeURIComponent(selected.id)}/analyze`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to analyze incident.");
      setAnalysis(payload.analysis);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Unable to analyze incident.");
    } finally { setAnalysisIncident(""); }
  }

  async function updateStatus(status: Status) {
    setStatusMessage("");
    try {
      const response = await fetch(`/api/incidents/${encodeURIComponent(selected.id)}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const payload = await response.json();
      setStatusMessage(payload.message || "Status update requested.");
    } catch { setStatusMessage("Could not update incident status."); }
  }

  return <div className="shell flex min-h-screen">
    <aside className="sidebar flex shrink-0 flex-col px-3 py-5">
      <div className="mb-9 flex items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[#344a70] bg-[#1b2d4a] text-[#a8bdff]"><Activity size={19}/></div><div className="brand-label"><div className="text-sm font-bold tracking-tight">signal<span className="text-[#91aaff]">/</span>ops</div><div className="text-[10px] text-[#74839a]">INCIDENT COMMAND</div></div></div>
      <div className="side-section eyebrow mb-2 px-3">Workspace</div>
      <nav className="space-y-1"><a className="nav-item active" href="#"><Layers3 size={16}/><span className="nav-label">Incident queue</span><span className="nav-label ml-auto rounded bg-[#2a4165] px-1.5 py-0.5 text-[10px]">06</span></a><a className="nav-item" href="#services"><Server size={16}/><span className="nav-label">Services</span></a><button className="nav-item w-full" onClick={()=>setShowRunbooks(!showRunbooks)}><BookOpen size={16}/><span className="nav-label">Knowledge base</span><ChevronDown className="nav-label ml-auto" size={13}/></button>{showRunbooks && <div className="ml-8 space-y-2 py-2">{knowledge.map(k=><button key={k.id} onClick={()=>{setSelectedId(incidents.find(i=>i.service===k.service)?.id || selectedId);setActiveTab("runbook")}} className="block text-left text-[11px] text-[#8e9db3] hover:text-white">{k.service}</button>)}</div>}</nav>
      <div className="side-section eyebrow mb-2 mt-9 px-3">Operate</div>
      <nav className="space-y-1"><button className="nav-item w-full" onClick={()=>setActiveTab("copilot")}><Bot size={16}/><span className="nav-label">AI copilot</span><span className="nav-label ml-auto h-1.5 w-1.5 rounded-full bg-[#65d6b1]"/></button><button className="nav-item w-full" onClick={()=>setActiveTab("timeline")}><Clock3 size={16}/><span className="nav-label">Activity log</span></button><a className="nav-item" href="#health"><Gauge size={16}/><span className="nav-label">System health</span></a></nav>
      <div className="mt-auto rounded-xl border border-[#263750] bg-[#111e31] p-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><ShieldCheck size={14} className="text-[#6bd5b1]"/> Demo environment</div><p className="text-[10px] leading-relaxed text-[#8998ad]">Sample incident data. No production systems connected.</p><div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#6bd5b1]"><span className="h-1.5 w-1.5 rounded-full bg-[#55c9a3]"/> All systems operational</div></div>
    </aside>

    <main className="min-w-0 flex-1">
      <header className="topbar flex h-[70px] items-center justify-between border-b border-[#202c3e] px-7">
        <div><div className="eyebrow mb-1">Operations / Incident management</div><div className="text-sm font-semibold">Incident command center <span className="ml-2 rounded border border-[#2c3b52] px-1.5 py-0.5 text-[10px] font-normal text-[#8292aa]">PRODUCTION · DEMO</span></div></div>
        <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-md border border-[#29384d] bg-[#101a29] px-3 py-2 text-[11px] text-[#91a0b5] sm:flex"><Command size={12}/> Quick search <span className="ml-3 rounded border border-[#34445b] px-1">⌘ K</span></div><button aria-label="Notifications" className="relative rounded-lg border border-[#29384d] p-2 text-[#93a2b7]"><Bell size={16}/><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ed9d66]"/></button><div className="grid h-8 w-8 place-items-center rounded-full bg-[#293d5e] text-[11px] font-semibold text-[#dce7ff]">AK</div></div>
      </header>

      <div className="content p-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow mb-2">Friday, 20 November 2026 <span className="mx-2 text-[#40506a]">/</span> Live overview</div><h1 className="text-[25px] font-semibold tracking-tight">Good morning, Aaqib <span className="text-[#8ca8f6]">.</span></h1><p className="mt-1 text-xs text-[#8b9ab0]">Here&apos;s what needs your attention across the stack.</p></div><div className="flex gap-2"><button className="ghost-button flex items-center gap-2" onClick={()=>{setFilter("ALL");setQuery("")}}><ListFilter size={13}/> Reset view</button><button className="action-button flex items-center gap-2" onClick={runAnalysis}><Sparkles size={14}/> Analyze selected incident</button></div></div>

        <section className="metrics mb-6 grid grid-cols-4 gap-3">
          <Metric label="Active incidents" value={String(activeCount).padStart(2,"0")} note="Across all services" icon={<Activity size={15}/>} trend="2 require attention"/>
          <Metric label="Critical · P1" value={String(criticalCount).padStart(2,"0")} note="Highest severity" icon={<AlertCircle size={15}/>} trend="Immediate response"/>
          <Metric label="Mitigated today" value="01" note="Awaiting resolution" icon={<Check size={15}/>} trend="Recovery in progress"/>
          <Metric label="Mean response" value="8.4m" note="Last 24 hours · demo" icon={<Zap size={15}/>} trend="↓ 12% vs prior period"/>
        </section>

        <div className="main-grid grid grid-cols-[minmax(320px,0.86fr)_minmax(430px,1.4fr)] items-start gap-4">
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#202c3e] px-4 py-4"><div><div className="text-sm font-semibold">Incident queue <span className="ml-1 text-xs font-normal text-[#8794a8]">({filtered.length})</span></div><div className="mt-1 text-[10px] text-[#8492a7]">Prioritized by severity and recency</div></div><button className="ghost-button flex items-center gap-1.5"><Filter size={12}/> Filter</button></div>
            <div className="border-b border-[#202c3e] p-3"><div className="flex items-center gap-2 rounded-lg border border-[#2a3a51] bg-[#0c1523] px-3"><Search size={14} className="text-[#8494ac]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search incidents, services..." className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-[#66768d]"/></div><div className="mt-3 flex gap-1.5">{["ALL","P1","P2","P3","P4"].map(item=><button key={item} onClick={()=>setFilter(item)} className={`rounded px-2.5 py-1 text-[10px] ${filter===item?"bg-[#293d5d] text-[#e3ebff]":"text-[#8291a7] hover:bg-[#19263a]"}`}>{item}</button>)}</div></div>
            <div className="incident-list max-h-[625px] overflow-y-auto p-2">{filtered.map(item=><button key={item.id} onClick={()=>{setSelectedId(item.id);setAnalysis(null);setActiveTab("overview");setStatusMessage("")}} className={`incident-row selected? flex w-full flex-col gap-2 rounded-lg p-3 text-left mb-1 ${selectedId===item.id?"selected":""}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`pill ${severityClass(item.severity)}`}>{item.severity}</span><span className="mono text-[10px] text-[#8090a7]">{item.id}</span></div><span className="text-[10px] text-[#77879e]">{timeAgo(item.startedAt)}</span></div><div className="text-xs font-semibold leading-snug text-[#e1e8f4]">{item.title}</div><div className="flex items-center justify-between"><span className="text-[10px] text-[#8392a8]">{item.service}</span><span className="flex items-center gap-1.5 text-[10px] text-[#9aa8bc]"><span className={`status-dot ${item.status.toLowerCase()}`}/>{statusLabel(item.status)}</span></div></button>)}</div>
            <div className="flex items-center justify-between border-t border-[#202c3e] px-4 py-3 text-[10px] text-[#8392a8]"><span>Showing {filtered.length} of {incidents.length} incidents</span><span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#59c9a3]"/> Synced just now</span></div>
          </section>

          <section className="panel detail-panel min-h-[760px] overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#202c3e] p-5"><div><div className="mb-2 flex items-center gap-2"><span className={`pill ${severityClass(selected.severity)}`}>{selected.severity} SEVERITY</span><span className="mono text-[10px] text-[#8292a8]">{selected.id}</span></div><h2 className="max-w-xl text-lg font-semibold leading-snug">{selected.title}</h2><div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-[#8c9bb0]"><span className="flex items-center gap-1"><Server size={11}/>{selected.service}</span><span>·</span><span>{selected.environment}</span><span>·</span><span>Started {timeAgo(selected.startedAt)}</span></div></div><button className="ghost-button flex items-center gap-1.5">More <ChevronDown size={12}/></button></div>
            <div className="flex gap-5 border-b border-[#202c3e] px-5">{["overview","copilot","timeline","runbook"].map(tab=><button key={tab} className={`tab ${activeTab===tab?"active":""}`} onClick={()=>setActiveTab(tab)}>{tab==="copilot"?"AI copilot":tab.charAt(0).toUpperCase()+tab.slice(1)}</button>)}</div>
            <div className="p-5">
              {activeTab==="overview" && <div className="space-y-5"><div className="grid grid-cols-2 gap-3"><Info label="ASSIGNEE" value={selected.assignee}/><Info label="STATUS" value={statusLabel(selected.status)}/></div><div><div className="eyebrow mb-2">Incident description</div><p className="text-xs leading-6 text-[#b2bfd1]">{selected.description}</p></div><div><div className="eyebrow mb-2">Customer & business impact</div><div className="rounded-lg border border-[#34415a] bg-[#172438] p-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><AlertCircle size={14} className="text-[#f0b16e]"/> Impact assessment</div><p className="text-xs leading-5 text-[#b3c0d2]">{selected.impact}</p></div></div><div><div className="mb-3 flex items-center justify-between"><div className="eyebrow">Response actions</div><button className="text-[10px] text-[#9ab0f4]" onClick={runAnalysis}>Generate recommendations <ChevronRight size={11} className="inline"/></button></div><div className="space-y-2">{selected.events.map((event,i)=><div key={i} className="flex gap-3 rounded-lg border border-[#24334a] bg-[#111d2e] p-3"><div className="mt-1 h-2 w-2 rounded-full bg-[#7e9ef4]"/><div className="min-w-0 flex-1"><div className="text-xs text-[#dce5f3]">{event.message}</div><div className="mt-1 text-[10px] text-[#8292a8]">{event.actor} · {timeAgo(event.createdAt)}</div></div></div>)}</div></div><div className="flex flex-wrap gap-2"><button className="action-button" onClick={()=>updateStatus("MITIGATED")}>Mark mitigated</button><button className="ghost-button" onClick={()=>updateStatus("RESOLVED")}>Resolve incident</button></div>{statusMessage&&<p className="text-[11px] text-[#e8bd81]">{statusMessage}</p>}</div>}

              {activeTab==="copilot" && <div className="space-y-4"><div className="rounded-xl border border-[#344b72] bg-gradient-to-br from-[#1c2d4a] to-[#121e31] p-4"><div className="mb-3 flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#2b4268] text-[#a9c0ff]"><Bot size={17}/></div><div><div className="text-xs font-semibold">Incident Copilot</div><div className="text-[10px] text-[#9aabc5]">Evidence-grounded investigation assistant</div></div><span className="ml-auto rounded bg-[#263f39] px-2 py-1 text-[9px] text-[#75d6b5]">HUMAN IN THE LOOP</span></div><p className="text-xs leading-5 text-[#c1cce0]">Analyze incident context, correlate relevant runbooks and generate prioritized next steps. Recommendations are advisory and require operator approval.</p><button className="action-button mt-4 flex items-center gap-2" onClick={runAnalysis} disabled={Boolean(analysisIncident)}>{analysisIncident===selected.id?<><Loader2 size={13} className="animate-spin"/> Investigating...</>:<><Sparkles size={13}/> Run incident analysis</>}</button></div>
                {analysisError&&<div className="rounded-lg border border-[#75404a] bg-[#351e29] p-3 text-xs text-[#ffb0b5]">{analysisError}</div>}
                {analysis&&analysisIncident===""&&<div className="space-y-4"><div className="flex items-center justify-between"><div className="eyebrow">Investigation result</div><span className="rounded bg-[#20364a] px-2 py-1 text-[9px] text-[#a9c3ef]">{analysis.provider}</span></div><div className="rounded-lg border border-[#2a3a51] bg-[#111d2e] p-3"><div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#91a9ed]">Situation summary</div><p className="text-xs leading-5 text-[#c4cfdf]">{analysis.summary}</p></div><div><div className="mb-2 flex items-center justify-between"><div className="eyebrow">Root cause hypothesis</div><span className="mono text-[11px] text-[#d3bb8d]">{Math.round(analysis.confidence*100)}% confidence</span></div><p className="text-xs leading-5 text-[#c1cddd]">{analysis.suspectedRootCause}</p><div className="mt-2 bar"><span style={{width:`${analysis.confidence*100}%`}}/></div><p className="mt-1 text-[9px] text-[#75859d]">Confidence is a model estimate, not a probability of correctness.</p></div><div><div className="eyebrow mb-2">Prioritized next steps</div><div className="space-y-2">{analysis.recommendedActions.map((action,i)=><div key={i} className="rounded-lg border border-[#26364c] bg-[#111d2e] p-3"><div className="mb-1 flex items-center gap-2"><span className={`pill ${action.priority==="now"?"p1":action.priority==="next"?"p2":"p3"}`}>{priorityLabel(action.priority)}</span><span className="text-xs font-semibold">{action.title}</span></div><p className="text-[11px] leading-5 text-[#aab8cb]">{action.detail}</p></div>)}</div></div><div><div className="eyebrow mb-2">Evidence considered</div><ul className="space-y-2">{analysis.evidence.map((item,i)=><li key={i} className="flex gap-2 text-[11px] leading-5 text-[#aab8cb]"><Check size={12} className="mt-0.5 shrink-0 text-[#6bc9a8]"/>{item}</li>)}</ul></div><div><div className="eyebrow mb-2">Information still needed</div><ul className="space-y-2">{analysis.missingInformation.map((item,i)=><li key={i} className="flex gap-2 text-[11px] leading-5 text-[#aab8cb]"><CircleHelp size={12} className="mt-0.5 shrink-0 text-[#d7ad78]"/>{item}</li>)}</ul></div><div className="rounded-lg border border-[#34415a] bg-[#172438] p-3"><div className="eyebrow mb-1">Impact assessment</div><p className="text-[11px] leading-5 text-[#b5c2d4]">{analysis.impactAssessment}</p></div></div>}
                {!analysis&&!analysisIncident&&!analysisError&&<div className="py-10 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl border border-[#2c3e59] bg-[#17263c] text-[#9db5ff]"><Sparkles size={19}/></div><div className="text-xs font-semibold">Ready to investigate</div><p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-[#8494aa]">Run the copilot to generate a structured investigation with evidence, hypotheses and recommended actions.</p></div>}
                {analysisIncident===selected.id&&<div className="space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-16 rounded-lg"/>)}</div>}
              </div>}

              {activeTab==="timeline"&&<div><div className="eyebrow mb-4">Incident activity</div><div className="space-y-4">{[...selected.events].reverse().map((event,i)=><div key={i} className="flex gap-3"><div className="flex flex-col items-center"><div className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-[#91a9f1] bg-[#1b2a43]"/><div className="mt-1 h-full w-px bg-[#293a53]"/></div><div className="pb-3"><div className="text-xs font-semibold text-[#dbe4f2]">{event.message}</div><div className="mt-1 text-[10px] text-[#8292a8]">{event.actor} · {new Date(event.createdAt).toLocaleString()}</div></div></div>)}</div></div>}

              {activeTab==="runbook"&&<div>{runbook?<><div className="mb-3 flex items-center gap-2"><BookOpen size={15} className="text-[#91a9f1]"/><div className="text-sm font-semibold">{runbook.title}</div></div><div className="mb-3 flex flex-wrap gap-1.5">{runbook.tags.map(tag=><span key={tag} className="rounded bg-[#1b2b42] px-2 py-1 text-[10px] text-[#9aacc8]">{tag}</span>)}</div><p className="text-xs leading-6 text-[#b8c5d8]">{runbook.content}</p><div className="mt-5 rounded-lg border border-[#35445c] bg-[#172438] p-3 text-[11px] leading-5 text-[#aebdd1]">Runbook guidance is reference material. Confirm applicability and operational safety before executing any change.</div></>:<p className="text-xs text-[#8494aa]">No runbook is linked to this service yet.</p>}</div>}
            </div>
          </section>
        </div>

        <section id="health" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3"><Health icon={<Activity size={14}/>} label="API gateway" state="Operational" value="99.98% uptime"/><Health icon={<Server size={14}/>} label="Core services" state="Operational" value="12 / 12 healthy"/><Health icon={<GitBranch size={14}/>} label="Event pipeline" state="Degraded" value="1 consumer group lagging"/></section>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-[#64748b]"><span>Signal/Ops · Incident Copilot v1.0</span><span className="flex items-center gap-3"><span>Sample data · Demo mode</span><a className="flex items-center gap-1 hover:text-[#a9bbf4]" href="https://github.com/Aaqibhafeezkhan/Incident-Copilot-Dashboard" target="_blank" rel="noreferrer">Repository <ExternalLink size={10}/></a></span></div>
      </div>
    </main>
  </div>;
}

function Metric({label,value,note,icon,trend}:{label:string;value:string;note:string;icon:React.ReactNode;trend:string}) { return <div className="panel p-4"><div className="mb-3 flex items-center justify-between text-[#91a0b5]"><span className="text-[11px]">{label}</span>{icon}</div><div className="metric">{value}</div><div className="mt-1 text-[10px] text-[#7f8fa6]">{note}</div><div className="mt-3 border-t border-[#24334a] pt-2 text-[10px] text-[#9aabc1]">{trend}</div></div>; }
function Info({label,value}:{label:string;value:string}) { return <div className="rounded-lg border border-[#25354b] bg-[#111d2e] p-3"><div className="eyebrow mb-2">{label}</div><div className="text-xs font-semibold">{value}</div></div>; }
function Health({icon,label,state,value}:{icon:React.ReactNode;label:string;state:string;value:string}) { return <div className="panel flex items-center gap-3 p-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1b2c42] text-[#94adf4]">{icon}</div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{label}</div><div className="mt-1 text-[10px] text-[#8292a8]">{value}</div></div><span className={`text-[10px] ${state==="Operational"?"text-[#6bd2ad]":"text-[#e7b073"}`}>{state}</span></div>; }
