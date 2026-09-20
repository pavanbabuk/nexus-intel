import React, { useState } from 'react';
import { Radio, ChevronUp, ChevronDown, Crosshair } from 'lucide-react';
import { EntityNode } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface RadarWidgetProps {
  nodes: EntityNode[];
  selectedNodeId?: string;
  onSelectNode: (node: EntityNode) => void;
}

export const RadarWidget: React.FC<RadarWidgetProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode
}) => {
  const [minimized, setMinimized] = useState(false);

  // Filter significant nodes to project onto radar (limit to 12 for high fidelity)
  const radarNodes = nodes.slice(0, 12).map((node, index) => {
    // Distribute nodes in polar coordinates pseudo-deterministically based on ID hash
    const hash = node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angle = (hash % 360) * (Math.PI / 180);
    const radiusPct = 25 + (hash % 55); // between 25% and 80% from center
    const x = 50 + radiusPct * Math.cos(angle) * 0.45;
    const y = 50 + radiusPct * Math.sin(angle) * 0.45;

    const isHighRisk = node.confidence < 0.6 || node.type === 'ip' || node.label.toLowerCase().includes('leak');
    const isSelected = node.id === selectedNodeId;

    return {
      ...node,
      x,
      y,
      isHighRisk,
      isSelected,
      index
    };
  });

  return (
    <div className="absolute bottom-4 right-4 z-30 font-mono text-xs select-none">
      <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] overflow-hidden backdrop-blur-md">
        {/* Radar Header */}
        <div 
          onClick={() => {
            setMinimized(!minimized);
            audioTelemetry.playLaserSweep();
          }}
          className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-500/20 cursor-pointer hover:bg-slate-850"
        >
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-300 tracking-wider">
              SONAR ATTACK RADAR
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              {nodes.length} TGT
            </span>
          </div>
          <button className="text-slate-400 hover:text-cyan-300">
            {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!minimized && (
          <div className="p-3 flex flex-col items-center">
            {/* Radar Scope */}
            <div className="relative w-44 h-44 rounded-full border border-cyan-500/40 bg-[#060913] overflow-hidden flex items-center justify-center">
              {/* Concentric rings */}
              <div className="absolute inset-2 rounded-full border border-cyan-500/20"></div>
              <div className="absolute inset-7 rounded-full border border-cyan-500/25"></div>
              <div className="absolute inset-12 rounded-full border border-cyan-500/30"></div>
              <div className="absolute inset-17 rounded-full border border-cyan-500/35"></div>

              {/* Crosshairs */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/25"></div>
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/25"></div>

              {/* Sweeping radar blade */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0.4) 0deg, rgba(6, 182, 212, 0.0) 55deg, transparent 55deg)',
                  animation: 'radarSweep 3.5s linear infinite'
                }}
              />

              {/* Center origin */}
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] z-10"></div>

              {/* Node Blips */}
              {radarNodes.map(node => (
                <button
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (node.isHighRisk) {
                      audioTelemetry.playWarning();
                    } else {
                      audioTelemetry.playBlip(1100);
                    }
                    onSelectNode(node);
                  }}
                  title={`${node.type.toUpperCase()}: ${node.label}`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute z-20 w-2.5 h-2.5 rounded-full transition-transform hover:scale-175 ${
                    node.isSelected
                      ? 'bg-white shadow-[0_0_12px_#ffffff] scale-150 animate-ping'
                      : node.isHighRisk
                      ? 'bg-red-400 shadow-[0_0_8px_#ef4444] animate-pulse'
                      : 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]'
                  }`}
                />
              ))}
            </div>

            {/* Radar Telemetry Footer */}
            <div className="w-full mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-400">
              <span className="flex items-center gap-1">
                <Crosshair className="w-2.5 h-2.5 text-cyan-400" />
                <span>POLAR SCAN</span>
              </span>
              <span className="text-cyan-400 font-bold">RANGE 360°</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
