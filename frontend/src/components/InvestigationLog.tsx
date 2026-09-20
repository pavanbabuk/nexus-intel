import React, { useEffect, useRef, useState } from 'react';
import { Terminal, X, CheckCircle2, AlertTriangle, Info, Bug } from 'lucide-react';
import { InvestigationLog } from '../types';

interface InvestigationLogViewerProps {
  logs: InvestigationLog[];
  isOpen: boolean;
  onClose: () => void;
}

export const InvestigationLogViewer: React.FC<InvestigationLogViewerProps> = ({
  logs,
  isOpen,
  onClose
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  const filtered = logs.filter(l => filterLevel === 'ALL' || l.level === filterLevel);

  const getLevelIcon = (lvl: string) => {
    switch (lvl) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'DEBUG':
        return <Bug className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 bg-cyber-900/95 border-t border-cyber-border shadow-2xl backdrop-blur z-20 flex flex-col font-mono text-xs">
      {/* Console Header */}
      <div className="h-9 px-4 border-b border-cyber-border/80 flex items-center justify-between bg-cyber-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white tracking-wider">INVESTIGATION EVENT TIMELINE</span>
          <span className="px-1.5 py-0.5 text-[10px] bg-cyber-700 text-slate-300 rounded border border-cyber-border">
            {logs.length} Events
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            aria-label="Filter log severity level"
            className="bg-cyber-900 border border-cyber-border rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warnings</option>
            <option value="DEBUG">Debug</option>
          </select>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-cyber-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 select-text">
        {filtered.length === 0 ? (
          <div className="text-slate-500 text-center py-8 italic">No matching event logs yet...</div>
        ) : (
          filtered.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2.5 py-0.5 hover:bg-cyber-800/40 rounded px-1.5 transition-colors">
              <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp.slice(11, 19)}</span>
              {getLevelIcon(log.level)}
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-cyber-800 text-slate-300 border border-cyber-border shrink-0 font-bold">
                {log.module}
              </span>
              <span className={`break-all ${
                log.level === 'SUCCESS' ? 'text-emerald-300 font-semibold' :
                log.level === 'WARNING' ? 'text-amber-300' :
                log.level === 'DEBUG' ? 'text-slate-500' : 'text-slate-200'
              }`}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
