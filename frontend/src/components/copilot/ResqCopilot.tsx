import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  FileText,
  Download,
  Copy,
  Check,
  ShieldAlert,
  MessageSquare,
  RefreshCw,
  Cpu,
  Bot,
  User,
  ExternalLink
} from 'lucide-react';
import { Building, Incident, Shelter, SensorNode } from '../../types';

interface ResqCopilotProps {
  buildings: Building[];
  shelters: Shelter[];
  sensors: SensorNode[];
  activeIncident: Incident;
  overallRisk: number;
}

interface Message {
  id: string;
  sender: 'USER' | 'COPILOT';
  text: string;
  timestamp: string;
  source?: string;
}

export const ResqCopilot: React.FC<ResqCopilotProps> = ({
  buildings,
  shelters,
  sensors,
  activeIncident,
  overallRisk
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-01',
      sender: 'COPILOT',
      text: `Hello Commander. I am **RESQ-AI Command Copilot**, your real-time multi-hazard decision support system.\n\nI am continuously analyzing:\n- **16 IoT sensor telemetry streams** (Krishna river gauge at 4.82m, Giri rain gauge at 94.5 mm/h)\n- **Digital Twin vulnerability records** across 50+ structures in Sector 4 & Giri Ridge\n- **Live shelter capacity & food/water logistics** across 6 relief centers\n- **Field units status** (NDRF 10th Bn, SDRF Unit 4, Fire Rescue Squad 8)\n\nHow can I assist your incident command today?`,
      timestamp: '11:30 AM',
      source: 'RESQ_CORE_AI'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSitRep, setIsGeneratingSitRep] = useState(false);
  const [sitrepContent, setSitrepContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const quickPrompts = [
    'Which buildings in Sector 4 have trapped victims?',
    'Generate NDMA Situation Report for the Collector',
    'Assess shelter capacity and food days remaining',
    'What is the safest evacuation route from Surya Housing Colony?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const riverSensor = sensors.find(s => s.type === 'WATER_LEVEL');
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            hazardType: activeIncident.type,
            overallRisk,
            exposedPopulation: activeIncident.estimatedExposedPopulation,
            vulnerableCount: activeIncident.vulnerableCount,
            incidentTitle: activeIncident.title,
            riverGauge: `${riverSensor?.currentReading.value || 4.82}m`
          }
        })
      });

      const data = await response.json();

      const copilotMsg: Message = {
        id: `cop-${Date.now()}`,
        sender: 'COPILOT',
        text: data.response || 'Tactical directive synthesized.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'GEMINI_3_7_FLASH'
      };

      setMessages(prev => [...prev, copilotMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'COPILOT',
        text: `### 🚨 Tactical Recommendation (Offline Mode):\nPrioritize watercraft evacuation of Sector 4 Lowland Plain. Krishna Basin water gauge is at 4.82m with active embankment overflow.\n- **Designated Green Corridor:** Sector 4 North Overbridge.\n- **Primary Shelter Hub:** North Highland Shelter (Capacity: 1,500).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'LOCAL_RULE_ENGINE'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSitRep = async () => {
    setIsGeneratingSitRep(true);
    try {
      const totalShelterOccupancy = shelters.reduce((a, s) => a + s.currentOccupancy, 0);
      const totalShelterCapacity = shelters.reduce((a, s) => a + s.capacity, 0);

      const response = await fetch('/api/sitrep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: 'RESQ-DEMO Riverfront District',
          incident: activeIncident,
          stats: {
            exposedPopulation: activeIncident.estimatedExposedPopulation,
            affectedBuildings: buildings.filter(b => b.overallRiskScore >= 60).length,
            shelterOccupancy: `${totalShelterOccupancy} / ${totalShelterCapacity}`,
            trappedCount: buildings.reduce((a, b) => a + (b.estimatedTrappedCount || 0), 0)
          }
        })
      });

      const data = await response.json();
      setSitrepContent(data.sitrepText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSitRep(false);
    }
  };

  const handleCopySitRep = () => {
    if (!sitrepContent) return;
    navigator.clipboard.writeText(sitrepContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1920px] mx-auto animate-fade-up">
      {/* Top Banner — light enterprise header */}
      <div className="card flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6 md:py-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-line)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-tactical text-[15px] md:text-[17px] font-bold tracking-tight text-[var(--ink)] leading-none">
                AI Command Decision Copilot
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--ink-2)] text-[10px] font-mono-code font-bold tracking-widest uppercase">
                Gemini 3.7 Flash Reasoning
              </span>
            </div>
            <p className="text-[12.5px] leading-5 text-[var(--ink-3)] mt-1">
              Review current sensor and building data, then generate a draft situation report.
            </p>
          </div>
        </div>

        <button
          id="btn-generate-sitrep"
          onClick={handleGenerateSitRep}
          disabled={isGeneratingSitRep}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-xs tracking-wide shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isGeneratingSitRep ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span>{isGeneratingSitRep ? 'Synthesizing SitRep...' : 'Generate Official SitRep #04'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Chat Conversation Interface (7 cols) */}
        <div className="lg:col-span-7 card flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3.5 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-3)]">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="font-tactical text-[11px] font-bold tracking-widest uppercase text-[var(--ink-2)]">
                Live Incident Decision Console
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono-code font-semibold tracking-widest uppercase text-[var(--ink-3)] whitespace-nowrap">
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute inline-flex w-2 h-2 rounded-full bg-[var(--ok)] opacity-75 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
              </span>
              Telemetry Grounded
            </span>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-3 bg-[var(--bg-subtle)]/70 border-b border-[var(--line)] flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                id={`btn-quick-prompt-${idx}`}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1.5 rounded-full bg-white border border-[var(--line)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--surface)] hover:shadow-sm transition-all whitespace-nowrap text-xs font-medium shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 bg-white">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'COPILOT' && (
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-line)] flex items-center justify-center text-[var(--accent)] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    m.sender === 'USER'
                      ? 'bg-[var(--accent)] text-white rounded-br-md'
                      : 'bg-[var(--bg-subtle)] border border-[var(--line)] text-[var(--ink-2)] rounded-bl-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-[13px] leading-6">{m.text}</div>
                  <div
                    className={`flex items-center justify-between gap-3 mt-2.5 pt-2 text-[10px] font-mono-code tracking-wide ${
                      m.sender === 'USER'
                        ? 'border-t border-white/20 text-white/70'
                        : 'border-t border-[var(--line)] text-[var(--ink-4)]'
                    }`}
                  >
                    <span>{m.timestamp}</span>
                    {m.source && (
                      <span className={m.sender === 'USER' ? 'text-white/80 font-semibold' : 'text-[var(--ink-3)] font-semibold'}>
                        {m.source}
                      </span>
                    )}
                  </div>
                </div>
                {m.sender === 'USER' && (
                  <div className="w-7 h-7 rounded-full bg-[var(--accent)] border border-[var(--accent)] flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center text-xs text-[var(--ink-3)]">
                <div className="w-7 h-7 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-line)] flex items-center justify-center text-[var(--accent)]">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <span className="font-medium">RESQ-AI is synthesizing GIS spatial telemetry...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[var(--bg-subtle)]/60 border-t border-[var(--line)] flex items-center gap-2"
          >
            <input
              id="copilot-input-field"
              type="text"
              placeholder="Ask Copilot about evacuation, trapped buildings, shelter logistics..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-white border border-[var(--line)] rounded-xl text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-4)] focus:outline-none focus:border-[var(--accent-line)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
            />
            <button
              id="btn-copilot-send"
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Right: Official Situation Report (SitRep) Panel (5 cols) */}
        <div className="lg:col-span-5 card flex flex-col h-[650px] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-3)]">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="font-tactical text-[11px] font-bold tracking-widest uppercase text-[var(--ink-2)]">
                NDMA / SDMA Situation Report
              </span>
            </div>
            {sitrepContent && (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-copy-sitrep"
                  onClick={handleCopySitRep}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[var(--line)] hover:bg-[var(--bg-subtle)] hover:border-[var(--line-strong)] text-[var(--ink-3)] hover:text-[var(--ink)] text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[var(--ok)]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-5 overflow-y-auto bg-white text-[var(--ink-2)] font-mono-code text-[12px] leading-7 whitespace-pre-wrap">
            {sitrepContent ? (
              sitrepContent
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--line)] flex items-center justify-center text-[var(--ink-4)]">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-tactical text-sm font-bold tracking-tight text-[var(--ink-2)]">No SitRep Generated Yet</h4>
                  <p className="text-xs leading-5 text-[var(--ink-3)] mt-1.5 max-w-[28ch] mx-auto font-sans">
                    Click &ldquo;Generate Official SitRep #04&rdquo; to synthesize a complete state-level incident briefing.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-[var(--bg-subtle)] border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono-code">
            <span className="text-[var(--ink-4)] font-medium">Standard: NDMA SOP Form 04</span>
            <span className="inline-flex items-center gap-1.5 text-[var(--ok)] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
              Draft generated locally
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
