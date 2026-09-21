import React from 'react';
import { Network, Download, Plus, Layers, Terminal, ShieldAlert, Volume2, VolumeX, Sparkles, Command, Globe, Brain, Search } from 'lucide-react';
import { InvestigationSummary, SecurityScorecard } from '../types';

interface HeaderProps {
  cases: InvestigationSummary[];
  activeCaseId: string | null;
  onSelectCase: (id: string) => void;
  onNewInvestigation: () => void;
  onOpenExport: () => void;
  onOpenScorecard?: () => void;
  scorecard?: SecurityScorecard;
  nodeCount: number;
  edgeCount: number;
  showLogs: boolean;
  onToggleLogs: () => void;
  onOpenConsole: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  isCrtActive: boolean;
  onToggleCrt: () => void;
  canvasView: 'graph' | 'globe';
  onChangeCanvasView: (mode: 'graph' | 'globe') => void;
  onOpenCortex?: () => void;
  onOpenGhdb?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onNewInvestigation,
  onOpenExport,
  onOpenScorecard,
  scorecard,
  nodeCount,
  edgeCount,
  showLogs,
  onToggleLogs,
  onOpenConsole,
  isAudioActive,
  onToggleAudio,
  isCrtActive,
  onToggleCrt,
  canvasView,
  onChangeCanvasView,
  onOpenCortex,
  onOpenGhdb
}) => {
  const activeCase = cases.find(c => c.id === activeCaseId);

  return (
    <header className="h-16 border-b border-cyber-border bg-cyber-800/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyber-700 border border-cyber-accent/40 shadow-[0_0_15px_rgba(0,242,254,0.25)]">
          <Network className="w-6 h-6 text-cyber-accent animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-cyber-800" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-wider text-white uppercase">Nexus<span className="text-cyber-accent">Intel</span></h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-widest bg-cyber-600/60 text-cyan-300 rounded border border-cyan-500/20">OSINT WORKBENCH</span>
          </div>
          <p className="text-xs text-slate-400 font-mono">Graph-Native Intelligence Platform</p>
        </div>
      </div>

      {/* Case Selector, View Switcher & Stats */}
      <div className="flex items-center gap-4">
        {cases.length > 0 && (
          <div className="flex items-center gap-2 bg-cyber-900/90 px-3 py-1.5 rounded-lg border border-cyber-border text-sm">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={activeCaseId || ''}
              onChange={(e) => onSelectCase(e.target.value)}
              aria-label="Select active investigation case"
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-mono max-w-[200px] truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-cyber-800 text-slate-200">
                  {c.case_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dual-View Switcher: Graph Canvas vs 3D Threat Globe */}
        {activeCase && (
          <div className="flex items-center bg-cyber-900/90 border border-cyber-border rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => onChangeCanvasView('graph')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                canvasView === 'graph'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to 2D Cytoscape Graph Canvas"
            >
              <Network className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">Graph</span>
            </button>
            <button
              onClick={() => onChangeCanvasView('globe')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
                canvasView === 'globe'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to 3D Orthographic Threat Globe"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold">3D Globe</span>
            </button>
          </div>
        )}

        {activeCase && (
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
            <div className="px-2.5 py-1 bg-cyber-700/50 rounded border border-cyber-border text-slate-300">
              <span className="text-slate-500 mr-1.5">Nodes:</span>
              <span className="text-cyan-400 font-bold">{nodeCount}</span>
            </div>
            <div className="px-2.5 py-1 bg-cyber-700/50 rounded border border-cyber-border text-slate-300">
              <span className="text-slate-500 mr-1.5">Edges:</span>
              <span className="text-purple-400 font-bold">{edgeCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quake Command Console Shortcut */}
        <button
          onClick={onOpenConsole}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-cyber-900/90 hover:bg-cyber-800 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          title="Open Quake Command Console (Ctrl+K or ~)"
        >
          <Command className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline font-bold">Console</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">⌘K</span>
        </button>

        {/* Audio HUD Synthesizer Toggle */}
        <button
          onClick={onToggleAudio}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
            isAudioActive
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
              : 'bg-cyber-800/80 border-cyber-border text-slate-400 hover:text-slate-200'
          }`}
          title={isAudioActive ? 'Audio Telemetry HUD: Online' : 'Audio Telemetry HUD: Muted'}
        >
          {isAudioActive ? <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          <span className="hidden lg:inline text-[11px]">{isAudioActive ? 'HUD: ON' : 'MUTED'}</span>
        </button>

        {/* CRT Scanline Toggle */}
        <button
          onClick={onToggleCrt}
          className={`p-1.5 text-xs rounded-lg border transition-all ${
            isCrtActive
              ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
              : 'bg-cyber-800/80 border-cyber-border text-slate-400 hover:text-slate-200'
          }`}
          title={`CRT Scanlines: ${isCrtActive ? 'ENABLED' : 'DISABLED'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        {activeCaseId && scorecard && onOpenScorecard && (
          <button
            onClick={onOpenScorecard}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border transition-all shadow-sm ${
              scorecard.grade.startsWith('A')
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : scorecard.grade === 'B'
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60'
                : scorecard.grade === 'C'
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
            }`}
            title="View Security Posture & Exposure Roast"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="font-bold">Score: {scorecard.grade} ({scorecard.score})</span>
          </button>
        )}

        {activeCaseId && onOpenCortex && (
          <button
            onClick={onOpenCortex}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/50 text-purple-300 transition-all shadow-[0_0_12px_rgba(168,85,247,0.25)]"
            title="Open Project CORTEX AI Autonomous Threat Profiler"
          >
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline font-bold">CORTEX AI</span>
          </button>
        )}

        {onOpenGhdb && (
          <button
            onClick={onOpenGhdb}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
            title="Open Google Hacking Database (GHDB) Recon Matrix (100% Client-Side)"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline font-bold">GHDB DORKS</span>
          </button>
        )}

        <button
          onClick={onToggleLogs}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
            showLogs
              ? 'bg-cyber-accent/20 border-cyber-accent text-cyan-300'
              : 'bg-cyber-700 hover:bg-cyber-600 border-cyber-border text-slate-300'
          }`}
          title="Toggle Timeline & Event Logs"
        >
          <Terminal className="w-4 h-4" />
          <span className="hidden sm:inline">Timeline</span>
        </button>

        {activeCaseId && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-cyber-700 hover:bg-cyber-600 border border-cyber-border text-slate-200 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export Dossier</span>
          </button>
        )}

        <button
          onClick={onNewInvestigation}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)] font-mono"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Target</span>
        </button>
      </div>
    </header>
  );
};
