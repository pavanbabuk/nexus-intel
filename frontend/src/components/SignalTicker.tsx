import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Radio } from 'lucide-react';
import { InvestigationLog, EntityNode } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface SignalTickerProps {
  logs: InvestigationLog[];
  nodes: EntityNode[];
  onSelectNode?: (node: EntityNode) => void;
  target?: string;
}

interface SignalItem {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  relatedNodeValue?: string;
}

export const SignalTicker: React.FC<SignalTickerProps> = ({
  logs,
  nodes,
  onSelectNode,
  target
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Transform investigation logs and node events into rich telemetry signals
  useEffect(() => {
    const list: SignalItem[] = [];

    // Add target initialized event
    if (target) {
      list.push({
        id: 'init-0',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.000',
        source: 'CORE_ENGINE',
        message: `Surveillance cascade initiated on [${target}]`,
        severity: 'INFO',
        relatedNodeValue: target
      });
    }

    // Process nodes into signals
    nodes.forEach((n, idx) => {
      let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO' = 'INFO';
      let src = 'ANALYSER';

      if (n.type === 'origin_ip') {
        severity = 'CRITICAL';
        src = 'ORIGIN_HUNTER';
      } else if (n.type === 'ip') {
        severity = 'MEDIUM';
        src = 'IP_ENRICH';
      } else if (n.type === 'social_profile' || n.type === 'username') {
        severity = 'HIGH';
        src = 'AVATAR_DHASH';
      } else if (n.type === 'certificate') {
        severity = 'INFO';
        src = 'CT_MONITOR';
      }

      list.push({
        id: `node-${n.id || idx}`,
        timestamp: new Date(Date.now() - (nodes.length - idx) * 400).toLocaleTimeString('en-US', { hour12: false }) + `.${(idx * 73) % 999}`,
        source: src,
        message: `${n.type.toUpperCase()}: ${n.label || n.value}`,
        severity,
        relatedNodeValue: n.value
      });
    });

    // Add investigation logs
    logs.slice(-15).forEach((log, idx) => {
      list.push({
        id: `log-${idx}`,
        timestamp: log.timestamp ? log.timestamp.split('T')[1]?.slice(0, 12) || '00:00:00' : '00:00:00',
        source: (log.module || 'SYSTEM').toUpperCase(),
        message: log.message,
        severity: log.level === 'ERROR' ? 'CRITICAL' : log.level === 'WARNING' ? 'HIGH' : 'INFO'
      });
    });

    setSignals(list.slice(-30));
  }, [logs, nodes, target]);

  const handleSignalClick = (item: SignalItem) => {
    if (!item.relatedNodeValue || !onSelectNode) return;
    const found = nodes.find(n => n.value.toLowerCase() === item.relatedNodeValue?.toLowerCase());
    if (found) {
      audioTelemetry.playBlip(1350);
      onSelectNode(found);
    }
  };

  if (signals.length === 0) return null;

  return (
    <div className="h-7 bg-slate-950/95 border-b border-cyan-500/25 flex items-center px-3 text-[11px] font-mono select-none overflow-hidden z-20">
      {/* Ticker Status Badge */}
      <div className="flex items-center gap-1.5 pr-3 border-r border-slate-800 flex-shrink-0">
        <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
        <span className="font-bold text-[10px] tracking-wider text-cyan-300 uppercase">SIGNAL STREAM</span>
        <button
          onClick={() => {
            setIsPaused(prev => !prev);
            audioTelemetry.playKeyClick();
          }}
          className="text-slate-500 hover:text-slate-300 ml-1 p-0.5 rounded"
          title={isPaused ? 'Resume live ticker' : 'Pause ticker'}
        >
          {isPaused ? <Play className="w-2.5 h-2.5 text-amber-400" /> : <Pause className="w-2.5 h-2.5" />}
        </button>
      </div>

      {/* Marquee / Scrolling Signal Feed */}
      <div 
        ref={tickerRef}
        className="flex-1 overflow-x-hidden whitespace-nowrap pl-3 flex items-center gap-6"
      >
        <div className={`flex items-center gap-6 ${isPaused ? '' : 'animate-[marquee_45s_linear_infinite]'} hover:[animation-play-state:paused]`}>
          {signals.map((sig) => (
            <div
              key={sig.id}
              onClick={() => handleSignalClick(sig)}
              className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                sig.relatedNodeValue ? 'hover:underline' : ''
              }`}
            >
              <span className="text-[10px] text-slate-500">[{sig.timestamp}]</span>
              <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${
                sig.severity === 'CRITICAL' ? 'bg-rose-950 border-rose-500/50 text-rose-300 animate-pulse' :
                sig.severity === 'HIGH' ? 'bg-amber-950 border-amber-500/50 text-amber-300' :
                'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
              }`}>
                {sig.source}
              </span>
              <span className="text-slate-300 text-[10px]">{sig.message}</span>
              <span className="text-slate-700">///</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Nodes Counter */}
      <div className="pl-3 border-l border-slate-800 flex-shrink-0 flex items-center gap-2 text-[10px] text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>RECORDS: <strong className="text-emerald-300">{nodes.length}</strong></span>
      </div>
    </div>
  );
};
