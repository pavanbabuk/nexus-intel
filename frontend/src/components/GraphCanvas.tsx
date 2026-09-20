import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, NodeSingular } from 'cytoscape';
import { Maximize2, ZoomIn, ZoomOut, RefreshCw, Filter, Camera } from 'lucide-react';
import { EntityNode, EntityEdge } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface GraphCanvasProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  onSelectNode: (node: EntityNode | null) => void;
  selectedNodeId: string | null;
}

const ENTITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  root_target: { bg: '#00f2fe', border: '#ffffff', text: '#0a0d14' },
  domain: { bg: '#3b82f6', border: '#60a5fa', text: '#ffffff' },
  subdomain: { bg: '#1d4ed8', border: '#3b82f6', text: '#ffffff' },
  ip: { bg: '#10b981', border: '#34d399', text: '#0a0d14' },
  asn: { bg: '#8b5cf6', border: '#a78bfa', text: '#ffffff' },
  nameserver: { bg: '#f59e0b', border: '#fbbf24', text: '#0a0d14' },
  mailserver: { bg: '#d97706', border: '#f59e0b', text: '#ffffff' },
  certificate: { bg: '#ec4899', border: '#f472b6', text: '#ffffff' },
  organization: { bg: '#06b6d4', border: '#22d3ee', text: '#0a0d14' },
  registrar: { bg: '#64748b', border: '#94a3b8', text: '#ffffff' },
  url: { bg: '#6366f1', border: '#818cf8', text: '#ffffff' },
  username: { bg: '#14b8a6', border: '#2dd4bf', text: '#0a0d14' },
  social_profile: { bg: '#059669', border: '#10b981', text: '#ffffff' },
  technology: { bg: '#f97316', border: '#fb923c', text: '#0a0d14' },
  dns_record: { bg: '#475569', border: '#64748b', text: '#ffffff' }
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedNodeId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [layoutName, setLayoutName] = useState<'cose' | 'concentric' | 'circle' | 'breadthfirst'>('cose');
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Initialize entity filters
  useEffect(() => {
    const availableTypes = Array.from(new Set(nodes.map(n => n.type)));
    const initial: Record<string, boolean> = {};
    availableTypes.forEach(t => { initial[t] = true; });
    setActiveFilters(prev => ({ ...initial, ...prev }));
  }, [nodes]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter nodes and edges based on activeFilters
    const filteredNodes = nodes.filter(n => activeFilters[n.type] !== false);
    const validNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = edges.filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target));

    const elements = [
      ...filteredNodes.map(n => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          value: n.value,
          confidence: n.confidence,
          is_root: n.properties?.is_root || false
        }
      })),
      ...filteredEdges.map(e => ({
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.type,
          type: e.type,
          confidence: e.confidence
        }
      }))
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#cbd5e1',
            'font-family': 'monospace',
            'font-size': '11px',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': (ele) => {
              const type = ele.data('type');
              return ENTITY_COLORS[type]?.bg || '#64748b';
            },
            'border-width': 2,
            'border-color': (ele) => {
              const type = ele.data('type');
              return ENTITY_COLORS[type]?.border || '#94a3b8';
            },
            'width': ((ele: NodeSingular) => ele.data('is_root') ? 45 : 30) as any,
            'height': ((ele: NodeSingular) => ele.data('is_root') ? 45 : 30) as any,
            'text-background-opacity': 0.85,
            'text-background-color': '#0a0d14',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#00f2fe',
            'border-width': 4,
            'underlay-color': '#00f2fe',
            'underlay-padding': '6px',
            'underlay-opacity': 0.35
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#2a3854',
            'target-arrow-color': '#3b82f6',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.8,
            'label': 'data(label)',
            'font-size': '9px',
            'font-family': 'monospace',
            'color': '#64748b',
            'text-background-opacity': 0.85,
            'text-background-color': '#0a0d14',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#00f2fe',
            'target-arrow-color': '#00f2fe',
            'width': 2.5
          }
        }
      ],
      layout: {
        name: layoutName,
        animate: false,
        randomize: false,
        nodeDimensionsIncludeLabels: true,
        fit: true,
        padding: 50
      }
    });

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data();
      const match = nodes.find(n => n.id === nodeData.id);
      if (match) {
        if (match.confidence < 0.6) {
          audioTelemetry.playWarning();
        } else {
          audioTelemetry.playBlip(1050);
        }
        onSelectNode(match);
      }
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onSelectNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [nodes, edges, layoutName, activeFilters]);

  // Sync selected node with cytoscape selection visual
  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.nodes().unselect();
    if (selectedNodeId) {
      const target = cyRef.current.getElementById(selectedNodeId);
      if (target.length > 0) {
        target.select();
      }
    }
  }, [selectedNodeId]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 50);
  const handleRelayout = () => {
    if (!cyRef.current) return;
    const layout = cyRef.current.layout({ name: layoutName, animate: true, animationDuration: 400 });
    layout.run();
  };

  const handleExportPNG = () => {
    if (!cyRef.current) return;
    const png64 = cyRef.current.png({ full: true, scale: 2, bg: '#0a0d14' });
    const link = document.createElement('a');
    link.href = png64;
    link.download = `nexus_graph_${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  };

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="relative w-full h-full bg-cyber-900 overflow-hidden flex flex-col">
      {/* Canvas Controls Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-cyber-800/90 border border-cyber-border rounded-lg p-1.5 shadow-xl backdrop-blur">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-cyber-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-cyber-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          className="p-1.5 rounded hover:bg-cyber-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Fit Graph to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRelayout}
          className="p-1.5 rounded hover:bg-cyber-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Recalculate Layout"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-cyber-border mx-1" />

        {/* Layout Switcher */}
        <select
          value={layoutName}
          onChange={(e) => {
            setLayoutName(e.target.value as any);
            audioTelemetry.playLaserSweep();
          }}
          aria-label="Graph layout algorithm"
          className="bg-cyber-900 border border-cyber-border rounded px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none cursor-pointer"
        >
          <option value="cose">Force-Directed (CoSE)</option>
          <option value="concentric">Concentric Circles</option>
          <option value="breadthfirst">Hierarchical Tree</option>
          <option value="circle">Circle Orbit</option>
        </select>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className={`p-1.5 rounded transition-colors ${
            showFilterMenu ? 'bg-cyber-accent/20 text-cyan-300' : 'hover:bg-cyber-700 text-slate-300'
          }`}
          title="Filter Entities"
        >
          <Filter className="w-4 h-4" />
        </button>

        {/* Screenshot */}
        <button
          onClick={handleExportPNG}
          className="p-1.5 rounded hover:bg-cyber-700 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Export Canvas PNG"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Dropdown */}
      {showFilterMenu && (
        <div className="absolute top-16 left-4 z-20 bg-cyber-800/95 border border-cyber-border rounded-lg p-3 shadow-2xl backdrop-blur w-56 font-mono text-xs">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Entity Filter</div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {Object.keys(activeFilters).map((type) => {
              const active = activeFilters[type] !== false;
              const meta = ENTITY_COLORS[type] || { bg: '#64748b' };
              return (
                <div
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className="flex items-center gap-2 p-1 rounded hover:bg-cyber-700/60 cursor-pointer text-slate-300"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: meta.bg }}
                  />
                  <span className={`capitalize ${!active ? 'line-through text-slate-600' : ''}`}>
                    {type.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
