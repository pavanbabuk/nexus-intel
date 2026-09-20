import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Sliders, CheckCircle2, Circle } from 'lucide-react';
import { TargetType, AnalyzerInfo } from '../types';

interface TargetLauncherProps {
  onLaunch: (target: string, caseName: string, enabledAnalyzers: string[]) => void;
  isLoading: boolean;
  analyzers: AnalyzerInfo[];
}

export const TargetLauncher: React.FC<TargetLauncherProps> = ({ onLaunch, isLoading, analyzers }) => {
  const [target, setTarget] = useState('');
  const [caseName, setCaseName] = useState('');
  const [detectedType, setDetectedType] = useState<TargetType>('domain');
  const [selectedAnalyzers, setSelectedAnalyzers] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (analyzers.length > 0 && selectedAnalyzers.length === 0) {
      setSelectedAnalyzers(analyzers.map(a => a.id));
    }
  }, [analyzers]);

  useEffect(() => {
    const t = target.trim();
    if (!t) {
      setDetectedType('domain');
      return;
    }
    if (t.startsWith('http://') || t.startsWith('https://') || t.includes('/')) {
      setDetectedType('url');
    } else if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(t)) {
      setDetectedType('ip');
    } else if (t.includes('@') && t.includes('.')) {
      setDetectedType('email');
    } else if (t.includes('.') && !t.startsWith('@')) {
      setDetectedType('domain');
    } else {
      setDetectedType('username');
    }
  }, [target]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim() || isLoading) return;
    onLaunch(target.trim(), caseName.trim(), selectedAnalyzers);
  };

  const toggleAnalyzer = (id: string) => {
    if (selectedAnalyzers.includes(id)) {
      setSelectedAnalyzers(selectedAnalyzers.filter(a => a !== id));
    } else {
      setSelectedAnalyzers([...selectedAnalyzers, id]);
    }
  };

  const presets = [
    { label: 'python.org', type: 'domain' },
    { label: '1.1.1.1', type: 'ip' },
    { label: 'torvalds', type: 'username' },
    { label: 'https://news.ycombinator.com', type: 'url' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 my-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Unified Reconnaissance & Link Analysis</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase">
          Launch Intelligence Target
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Enter an observable entity. NexusIntel will passively aggregate DNS records, Certificate Transparency logs, autonomous systems, and digital footprints.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-cyber-800/90 border border-cyber-border rounded-xl p-6 shadow-2xl backdrop-blur">
        {/* Main Target Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter Domain, IPv4/IPv6, Username, or URL..."
            className="w-full pl-11 pr-32 py-3.5 bg-cyber-900 border border-cyber-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent font-mono text-sm shadow-inner"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
            <span className="px-2 py-1 text-[11px] font-mono uppercase font-semibold rounded bg-cyber-700 border border-cyber-border text-cyan-400">
              {detectedType}
            </span>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
          <span className="text-xs text-slate-500 font-mono">Quick Targets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setTarget(p.label)}
              className="px-2.5 py-1 text-xs font-mono bg-cyber-700/60 hover:bg-cyber-700 border border-cyber-border hover:border-slate-500 rounded text-slate-300 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Case Name (Optional) */}
        <div className="mt-4 pt-4 border-t border-cyber-border/60 flex items-center justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              placeholder="Case Name / Operation Tag (optional)"
              className="w-full px-3 py-2 bg-cyber-900/60 border border-cyber-border/80 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 font-mono"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono rounded bg-cyber-700 hover:bg-cyber-600 border border-cyber-border text-slate-300 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modules ({selectedAnalyzers.length}/{analyzers.length})</span>
          </button>
        </div>

        {/* Analyzers Checklist Collapse */}
        {showConfig && (
          <div className="mt-4 p-4 rounded-lg bg-cyber-900/90 border border-cyber-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {analyzers.map((a) => {
              const active = selectedAnalyzers.includes(a.id);
              return (
                <div
                  key={a.id}
                  onClick={() => toggleAnalyzer(a.id)}
                  className={`p-2.5 rounded border cursor-pointer flex items-start gap-2.5 transition-all ${
                    active
                      ? 'bg-cyber-800/80 border-cyan-500/40 text-slate-200'
                      : 'bg-cyber-900/40 border-cyber-border/40 text-slate-500 opacity-60'
                  }`}
                >
                  {active ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      {a.name}
                      {a.is_passive && (
                        <span className="text-[9px] px-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded">
                          PASSIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{a.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={!target.trim() || isLoading}
            className="w-full py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold uppercase tracking-wider text-sm shadow-[0_0_25px_rgba(0,242,254,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Dispatching OSINT Analyzers...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 stroke-[3]" />
                <span>Start Investigation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
