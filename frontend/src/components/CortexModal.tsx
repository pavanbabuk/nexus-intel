import React, { useState, useEffect } from 'react';
import { Brain, ShieldAlert, X, Copy, Check, ExternalLink, Lightbulb, Activity, Terminal, Loader2 } from 'lucide-react';
import { CortexReport } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface CortexModalProps {
  investigationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CortexModal: React.FC<CortexModalProps> = ({
  investigationId,
  isOpen,
  onClose
}) => {
  const [report, setReport] = useState<CortexReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ttps' | 'hypotheses' | 'dorks'>('hypotheses');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && investigationId) {
      setLoading(true);
      audioTelemetry.playLaserSweep();
      fetch(`/api/investigations/${investigationId}/cortex`)
        .then(res => res.json())
        .then((data: CortexReport) => {
          setReport(data);
          if (data.risk_level === 'CRITICAL') {
            audioTelemetry.playWarning();
          } else {
            audioTelemetry.playBlip(1300);
          }
        })
        .catch(err => {
          console.error('Failed to fetch CORTEX report', err);
          audioTelemetry.playWarning();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, investigationId]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    audioTelemetry.playKeyClick();
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-4xl max-h-[85vh] bg-slate-950 border border-purple-500/50 rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.25)] flex flex-col overflow-hidden font-mono text-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-purple-950/40 border-b border-purple-500/30">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Brain className="w-6 h-6 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-widest text-purple-300 uppercase">
                  PROJECT CORTEX // AI PROFILER
                </h2>
                {report && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    report.risk_level === 'CRITICAL'
                      ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse'
                      : report.risk_level === 'ELEVATED'
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  }`}>
                    RISK: {report.risk_level}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Graph Synthesis & MITRE ATT&CK Correlation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4 text-purple-300">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <span className="tracking-widest">SYNTHESIZING GRAPH TOPOLOGY WITH CORTEX NEURAL ENGINE...</span>
          </div>
        ) : report ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Executive Summary */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 leading-relaxed text-xs">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                EXECUTIVE INTELLIGENCE BRIEF
              </span>
              <p>{report.executive_summary}</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => {
                  setActiveTab('hypotheses');
                  audioTelemetry.playKeyClick();
                }}
                className={`px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                  activeTab === 'hypotheses'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>Threat Hypotheses ({report.hypotheses.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('ttps');
                  audioTelemetry.playKeyClick();
                }}
                className={`px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                  activeTab === 'ttps'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>MITRE ATT&CK Matrix ({report.mitre_ttps.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('dorks');
                  audioTelemetry.playKeyClick();
                }}
                className={`px-4 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                  activeTab === 'dorks'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>Actionable Recon Dorks ({report.recommended_dorks.length})</span>
              </button>
            </div>

            {/* Tab 1: Threat Hypotheses */}
            {activeTab === 'hypotheses' && (
              <div className="space-y-3">
                {report.hypotheses.map(hypo => (
                  <div 
                    key={hypo.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20 space-y-2 hover:border-purple-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-purple-400" />
                        {hypo.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          CONFIDENCE: {(hypo.confidence * 100).toFixed(0)}%
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-400/40 text-purple-300">
                          MITRE: {hypo.mitre_ref}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{hypo.analysis}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: MITRE ATT&CK TTPs */}
            {activeTab === 'ttps' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.mitre_ttps.map(ttp => (
                  <div
                    key={ttp.t_id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-cyan-300">{ttp.t_id}</span>
                        <span className="text-slate-200 font-semibold">{ttp.t_name}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${
                        ttp.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                          : ttp.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {ttp.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{ttp.description}</p>
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex flex-wrap gap-1.5 items-center">
                      <span className="text-slate-500">ASSETS:</span>
                      {ttp.matched_assets.map((asset, i) => (
                        <span key={i} className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-cyan-400">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Actionable Dorks */}
            {activeTab === 'dorks' && (
              <div className="space-y-3">
                {report.recommended_dorks.map((dork, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                          {dork.category}
                        </span>
                        <span className="text-slate-400 text-[11px]">{dork.purpose}</span>
                      </div>
                      <div className="font-mono text-cyan-200 bg-slate-950 px-3 py-2 rounded border border-slate-800 select-all overflow-x-auto text-[11px]">
                        {dork.query}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(dork.query, idx)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copy Dork Query"
                      >
                        {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a
                        href={
                          dork.category === 'Shodan'
                            ? `https://www.shodan.io/search?query=${encodeURIComponent(dork.query)}`
                            : dork.category === 'GitHub'
                            ? `https://github.com/search?type=code&q=${encodeURIComponent(dork.query)}`
                            : `https://www.google.com/search?q=${encodeURIComponent(dork.query)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                        title={`Open ${dork.category} Search in New Tab`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            No intelligence data available for active case.
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
          <span>PROJECT CORTEX v3.4 // REASONING INFERENCE READY</span>
          <span>ENTERPRISE TIP EXPORT COMPLIANT</span>
        </div>
      </div>
    </div>
  );
};
