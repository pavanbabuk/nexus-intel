import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TargetLauncher } from './components/TargetLauncher';
import { GraphCanvas } from './components/GraphCanvas';
import { EntityDrawer } from './components/EntityDrawer';
import { InvestigationLogViewer } from './components/InvestigationLog';
import { ExportModal } from './components/ExportModal';
import { ScorecardModal } from './components/ScorecardModal';
import {
  InvestigationSummary,
  InvestigationDetail,
  EntityNode,
  AnalyzerInfo
} from './types';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function App() {
  const [cases, setCases] = useState<InvestigationSummary[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<InvestigationDetail | null>(null);
  const [analyzers, setAnalyzers] = useState<AnalyzerInfo[]>([]);
  const [selectedNode, setSelectedNode] = useState<EntityNode | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'launcher'>('launcher');

  // Load analyzers on mount
  useEffect(() => {
    fetch('/api/analyzers')
      .then(res => res.json())
      .then(data => setAnalyzers(data))
      .catch(err => console.error('Failed to load analyzers', err));
  }, []);

  // Load cases on mount
  const loadCases = useCallback(async () => {
    try {
      const res = await fetch('/api/investigations');
      if (res.ok) {
        const data: InvestigationSummary[] = await res.json();
        setCases(data);
        if (data.length > 0 && !activeCaseId) {
          setActiveCaseId(data[0].id);
          setViewMode('canvas');
        }
      }
    } catch (err) {
      console.error('Failed to load investigations', err);
    }
  }, [activeCaseId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Fetch details of active case
  const fetchActiveCase = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/investigations/${id}`);
      if (res.ok) {
        const detail: InvestigationDetail = await res.json();
        setActiveDetail(detail);

        // Update selected node if still exists
        if (selectedNode) {
          const updated = detail.nodes.find(n => n.id === selectedNode.id);
          if (updated) setSelectedNode(updated);
        }
      }
    } catch (err) {
      console.error('Error polling case detail', err);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (!activeCaseId) return;
    fetchActiveCase(activeCaseId);

    // Polling interval if status is running
    const interval = setInterval(() => {
      if (activeDetail?.status === 'running' || !activeDetail) {
        fetchActiveCase(activeCaseId);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeCaseId, activeDetail?.status, fetchActiveCase]);

  // Launch new investigation
  const handleLaunch = async (target: string, caseName: string, enabledAnalyzers: string[]) => {
    setIsLaunching(true);
    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          case_name: caseName || undefined,
          enabled_analyzers: enabledAnalyzers
        })
      });

      if (res.ok) {
        const newCase: InvestigationSummary = await res.json();
        setCases(prev => [newCase, ...prev]);
        setActiveCaseId(newCase.id);
        setViewMode('canvas');
        setSelectedNode(null);
        setShowLogs(true); // Open timeline by default on launch
      }
    } catch (err) {
      console.error('Failed to dispatch investigation', err);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleSelectRelatedNode = (nodeId: string) => {
    if (!activeDetail) return;
    const match = activeDetail.nodes.find(n => n.id === nodeId);
    if (match) setSelectedNode(match);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-cyber-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        cases={cases}
        activeCaseId={activeCaseId}
        onSelectCase={(id) => {
          setActiveCaseId(id);
          setViewMode('canvas');
          setSelectedNode(null);
        }}
        onNewInvestigation={() => {
          setViewMode('launcher');
          setSelectedNode(null);
        }}
        onOpenExport={() => setShowExport(true)}
        onOpenScorecard={() => setShowScorecard(true)}
        scorecard={activeDetail?.scorecard}
        nodeCount={activeDetail?.nodes.length || 0}
        edgeCount={activeDetail?.edges.length || 0}
        showLogs={showLogs}
        onToggleLogs={() => setShowLogs(!showLogs)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'launcher' || !activeCaseId ? (
          <TargetLauncher
            onLaunch={handleLaunch}
            isLoading={isLaunching}
            analyzers={analyzers}
          />
        ) : (
          <>
            {/* Status indicator pill & quick scorecard trigger */}
            {activeDetail && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-800/90 border border-cyber-border text-xs font-mono shadow-lg backdrop-blur">
                {activeDetail.status === 'running' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span className="text-cyan-300 font-semibold">Analyzers Active...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">Investigation Complete</span>
                  </>
                )}
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 font-bold">{activeDetail.target}</span>

                {activeDetail.scorecard && (
                  <>
                    <span className="text-slate-500">•</span>
                    <button
                      onClick={() => setShowScorecard(true)}
                      className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 transition-colors"
                      title="View Posture Roast"
                    >
                      Grade: {activeDetail.scorecard.grade}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Interactive Graph Canvas */}
            <GraphCanvas
              nodes={activeDetail?.nodes || []}
              edges={activeDetail?.edges || []}
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode?.id || null}
            />

            {/* Entity Details Slide-Out Drawer */}
            <EntityDrawer
              node={selectedNode}
              edges={activeDetail?.edges || []}
              onClose={() => setSelectedNode(null)}
              onSelectRelatedNode={handleSelectRelatedNode}
            />

            {/* Timeline Log Console */}
            <InvestigationLogViewer
              logs={activeDetail?.logs || []}
              isOpen={showLogs}
              onClose={() => setShowLogs(false)}
            />
          </>
        )}
      </main>

      {/* Export Dossier Modal */}
      {activeCaseId && (
        <ExportModal
          investigationId={activeCaseId}
          isOpen={showExport}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Security Posture & Exposure Roast Scorecard Modal */}
      {activeDetail?.scorecard && (
        <ScorecardModal
          scorecard={activeDetail.scorecard}
          target={activeDetail.target}
          isOpen={showScorecard}
          onClose={() => setShowScorecard(false)}
        />
      )}
    </div>
  );
}
