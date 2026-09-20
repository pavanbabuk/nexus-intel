import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, Code, ArrowRight, Clock, Layers } from 'lucide-react';
import { EntityNode, EntityEdge } from '../types';

interface EntityDrawerProps {
  node: EntityNode | null;
  edges: EntityEdge[];
  onClose: () => void;
  onSelectRelatedNode: (nodeId: string) => void;
}

export const EntityDrawer: React.FC<EntityDrawerProps> = ({
  node,
  edges,
  onClose,
  onSelectRelatedNode
}) => {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!node) return null;

  // Filter edges connected to this node
  const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);

  return (
    <div className="absolute right-0 top-16 bottom-0 w-96 bg-cyber-800/95 border-l border-cyber-border shadow-2xl backdrop-blur z-20 flex flex-col font-sans transition-transform duration-300">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {node.type.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{Math.round(node.confidence * 100)}% Confidence</span>
            </div>
          </div>
          <h3 className="text-base font-bold text-white mt-1 break-all font-mono">{node.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-cyber-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Origin Metadata */}
        <div className="bg-cyber-900/80 rounded-lg p-3 border border-cyber-border/80 space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Source Module:</span>
            <span className="text-slate-200 font-semibold">{node.source_module}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Discovered:</span>
            <span className="text-slate-300">{node.first_seen.slice(11, 19)} UTC</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Identifier:</span>
            <span className="text-slate-400 truncate max-w-[180px]">{node.id}</span>
          </div>
        </div>

        {/* Properties Key-Value */}
        {Object.keys(node.properties).length > 0 && (
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Attributes & Metadata
            </div>
            <div className="bg-cyber-900/80 rounded-lg p-3 border border-cyber-border/80 divide-y divide-cyber-border/40 font-mono">
              {Object.entries(node.properties).map(([k, v]) => {
                if (k.startsWith('is_') || v === null || v === undefined) return null;
                const displayVal = typeof v === 'object' ? JSON.stringify(v) : String(v);
                return (
                  <div key={k} className="py-1.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <span className="text-slate-400 capitalize">{k.replace('_', ' ')}:</span>
                    <span className="text-slate-200 text-right break-all max-w-[200px] font-semibold">{displayVal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* External Link if URL / Social / Domain */}
        {(node.value.startsWith('http') || node.type === 'social_profile' || node.type === 'domain') && (
          <div>
            <a
              href={node.value.startsWith('http') ? node.value : `https://${node.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded bg-cyber-700 hover:bg-cyber-600 border border-cyber-border text-cyan-400 flex items-center justify-center gap-1.5 font-mono text-xs transition-colors"
            >
              <span>Inspect Source Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Connected Graph Edges */}
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Connected Links ({connectedEdges.length})
          </div>
          <div className="space-y-1.5">
            {connectedEdges.map((edge) => {
              const isSource = edge.source === node.id;
              const relatedNodeId = isSource ? edge.target : edge.source;
              return (
                <div
                  key={edge.id}
                  onClick={() => onSelectRelatedNode(relatedNodeId)}
                  className="p-2 rounded bg-cyber-900/60 hover:bg-cyber-700/60 border border-cyber-border cursor-pointer transition-colors flex items-center justify-between font-mono"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-[11px] text-slate-400 uppercase font-bold">{edge.type}:</span>
                    <span className="text-slate-200 truncate">{relatedNodeId.split(':')[1]}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">{Math.round(edge.confidence * 100)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raw JSON Toggle */}
        <div>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-mono transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showRawJson ? 'Hide Raw JSON' : 'View Raw JSON Node'}</span>
          </button>
          {showRawJson && (
            <pre className="mt-2 p-2.5 rounded bg-cyber-900 border border-cyber-border text-[10px] font-mono text-slate-300 overflow-x-auto max-h-40">
              {JSON.stringify(node, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
