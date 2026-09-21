import React, { useEffect } from 'react';
import { 
  Zap, 
  Target, 
  BookmarkPlus, 
  Search, 
  EyeOff, 
  Copy, 
  X,
  Crosshair
} from 'lucide-react';
import { EntityNode } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface NodeRadialMenuProps {
  node: EntityNode;
  position: { x: number; y: number };
  onClose: () => void;
  onPivot: (value: string) => void;
  onBlastRadius: (nodeId: string) => void;
  onPinToNotebook: (node: EntityNode) => void;
  onOpenGhdb: (target: string) => void;
  onIsolate: (nodeId: string) => void;
}

interface RadialAction {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  angle: number; // degrees
  action: () => void;
  colorClass: string;
}

export const NodeRadialMenu: React.FC<NodeRadialMenuProps> = ({
  node,
  position,
  onClose,
  onPivot,
  onBlastRadius,
  onPinToNotebook,
  onOpenGhdb,
  onIsolate
}) => {
  // Prevent menu from overflowing viewport edges
  const menuRadius = 110;
  const clampedX = Math.min(Math.max(position.x, menuRadius + 20), window.innerWidth - menuRadius - 20);
  const clampedY = Math.min(Math.max(position.y, menuRadius + 60), window.innerHeight - menuRadius - 40);

  useEffect(() => {
    audioTelemetry.playChirp();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const actions: RadialAction[] = [
    {
      id: 'pivot',
      label: 'PIVOT SCAN',
      sublabel: 'Re-target Analyzer',
      icon: <Zap className="w-4 h-4" />,
      angle: -90, // Top
      colorClass: 'hover:border-cyan-400 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      action: () => {
        audioTelemetry.playLaserSweep();
        onPivot(node.value);
        onClose();
      }
    },
    {
      id: 'blast',
      label: 'BLAST RADIUS',
      sublabel: 'Trace Reachability',
      icon: <Target className="w-4 h-4" />,
      angle: -30, // Top Right
      colorClass: 'hover:border-amber-400 hover:text-amber-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      action: () => {
        audioTelemetry.playBlip(1400);
        onBlastRadius(node.id);
        onClose();
      }
    },
    {
      id: 'pin',
      label: 'PIN EVIDENCE',
      sublabel: 'Analyst Notebook',
      icon: <BookmarkPlus className="w-4 h-4" />,
      angle: 30, // Bottom Right
      colorClass: 'hover:border-emerald-400 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]',
      action: () => {
        audioTelemetry.playKeyClick();
        onPinToNotebook(node);
        onClose();
      }
    },
    {
      id: 'ghdb',
      label: 'GHDB DORK',
      sublabel: 'Client-Side Matrix',
      icon: <Search className="w-4 h-4" />,
      angle: 90, // Bottom
      colorClass: 'hover:border-purple-400 hover:text-purple-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]',
      action: () => {
        audioTelemetry.playLaserSweep();
        onOpenGhdb(node.value);
        onClose();
      }
    },
    {
      id: 'isolate',
      label: 'ISOLATE',
      sublabel: 'Filter Subgraph',
      icon: <EyeOff className="w-4 h-4" />,
      angle: 150, // Bottom Left
      colorClass: 'hover:border-rose-400 hover:text-rose-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]',
      action: () => {
        audioTelemetry.playBlip(900);
        onIsolate(node.id);
        onClose();
      }
    },
    {
      id: 'copy',
      label: 'COPY VALUE',
      sublabel: 'To Clipboard',
      icon: <Copy className="w-4 h-4" />,
      angle: 210, // Top Left
      colorClass: 'hover:border-blue-400 hover:text-blue-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]',
      action: () => {
        navigator.clipboard.writeText(node.value);
        audioTelemetry.playKeyClick();
        onClose();
      }
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div 
        className="absolute font-mono text-xs select-none"
        style={{ left: clampedX, top: clampedY, transform: 'translate(-50%, -50%)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Radar concentric circular rings */}
        <div className="absolute inset-0 -m-32 rounded-full border border-cyan-500/20 pointer-events-none animate-pulse" />
        <div className="absolute inset-0 -m-20 rounded-full border border-cyan-500/30 pointer-events-none" />

        {/* Center Node Display Reticle */}
        <div className="relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-950/95 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] text-center p-2 z-10">
          <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {node.type}
          </span>
          <span className="text-[11px] font-bold text-cyan-200 truncate max-w-[90px] px-1" title={node.label || node.value}>
            {node.label || node.value}
          </span>

          <button
            onClick={onClose}
            className="absolute -top-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Orbital Action Buttons */}
        {actions.map(act => {
          const rad = (act.angle * Math.PI) / 180;
          const dist = 95;
          const x = Math.round(dist * Math.cos(rad));
          const y = Math.round(dist * Math.sin(rad));

          return (
            <button
              key={act.id}
              onClick={act.action}
              onMouseEnter={() => audioTelemetry.playBlip(1500)}
              style={{
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
              }}
              className={`absolute top-1/2 left-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-700/80 text-slate-300 transition-all cursor-pointer whitespace-nowrap shadow-lg backdrop-blur-md group ${act.colorClass}`}
            >
              <span className="group-hover:scale-110 transition-transform">
                {act.icon}
              </span>
              <div className="text-left">
                <div className="text-[10px] font-bold tracking-wider leading-none">
                  {act.label}
                </div>
                <div className="text-[8px] text-slate-500 leading-none mt-0.5 hidden sm:block">
                  {act.sublabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
