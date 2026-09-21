import React, { useState } from 'react';
import { 
  FileText, 
  Bookmark, 
  Trash2, 
  Download, 
  X, 
  Sparkles
} from 'lucide-react';
import { EntityNode, InvestigationDetail } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface AnalystNotebookProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedNodes: EntityNode[];
  onRemovePinnedNode: (nodeId: string) => void;
  investigation: InvestigationDetail | null;
}

export type EvidenceTag = 'CONFIRMED' | 'SUSPECT' | 'EXPOSED_ORIGIN' | 'CREDENTIAL_LEAK' | 'PIVOT_ROOT';

interface PinnedItemMeta {
  tag: EvidenceTag;
  notes: string;
}

export const AnalystNotebook: React.FC<AnalystNotebookProps> = ({
  isOpen,
  onClose,
  pinnedNodes,
  onRemovePinnedNode,
  investigation
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'notes' | 'preview'>('evidence');
  const [markdownNotes, setMarkdownNotes] = useState<string>(() => {
    return `# OPERATIONAL RECONNAISSANCE DOSSIER\n**Classification:** TACTICAL DECLASSIFIED // RESTRICTED ACCESS\n\n## 1. Executive Assessment\nInitial surveillance sweep identified perimeter assets, unproxied services, and potential credential exposures.\n\n## 2. Key Hypotheses & Evidence\n- Origin server discovered bypassing CDN reverse-proxy.\n- Correlated developer identities verified via avatar perceptual hashing.\n\n## 3. Recommended Defensive Actions\n- Restrict direct-to-metal IP ingress via firewall ACLs.\n- Invalidate exposed API tokens and implement MFA.\n`;
  });

  const [itemMeta, setItemMeta] = useState<Record<string, PinnedItemMeta>>({});

  if (!isOpen) return null;

  const updateItemTag = (nodeId: string, tag: EvidenceTag) => {
    setItemMeta(prev => ({
      ...prev,
      [nodeId]: { ...(prev[nodeId] || { notes: '' }), tag }
    }));
    audioTelemetry.playKeyClick();
  };

  const updateItemNotes = (nodeId: string, notes: string) => {
    setItemMeta(prev => ({
      ...prev,
      [nodeId]: { ...(prev[nodeId] || { tag: 'CONFIRMED' }), notes }
    }));
  };

  const insertFindingsIntoNotes = () => {
    const findingsTable = `\n### Pinned Evidence Matrix (${pinnedNodes.length} Items)\n| Type | Value | Classification | Analyst Notes |\n| :--- | :--- | :--- | :--- |\n` +
      pinnedNodes.map(n => {
        const meta = itemMeta[n.id] || { tag: 'CONFIRMED', notes: '' };
        return `| **${n.type.toUpperCase()}** | \`${n.value}\` | \`${meta.tag}\` | ${meta.notes || 'No annotations'} |`;
      }).join('\n') + '\n';

    setMarkdownNotes(prev => prev + '\n' + findingsTable);
    setActiveTab('notes');
    audioTelemetry.playLaserSweep();
  };

  const handleExportHtmlDossier = () => {
    audioTelemetry.playLaserSweep();
    const target = investigation?.target || 'target-entity';
    const caseName = investigation?.case_name || 'Operation Nexus';
    const dateStr = new Date().toUTCString();

    const rows = pinnedNodes.map(n => {
      const meta = itemMeta[n.id] || { tag: 'CONFIRMED', notes: '' };
      return `
        <tr>
          <td><span class="badge ${meta.tag.toLowerCase()}">${meta.tag}</span></td>
          <td><strong>${n.type.toUpperCase()}</strong></td>
          <td><code>${n.value}</code></td>
          <td>${meta.notes || 'Verified during reconnaissance cascade.'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DECLASSIFIED DOSSIER // ${target}</title>
  <style>
    body { background-color: #0b0f19; color: #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin: 0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; background: #111827; border: 1px solid #1f293d; border-radius: 12px; padding: 32px; box-shadow: 0 0 50px rgba(0,0,0,0.6); }
    .header { border-bottom: 2px solid #00f2fe; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .classified-stamp { border: 2px dashed #f43f5e; color: #f43f5e; padding: 6px 16px; font-weight: bold; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
    h1 { margin: 0 0 8px 0; color: #00f2fe; font-size: 24px; }
    h2 { color: #38bdf8; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-top: 28px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #1e293b; padding: 10px; text-align: left; }
    th { background: #0f172a; color: #38bdf8; }
    code { background: #030712; padding: 2px 6px; border-radius: 4px; color: #67e8f9; }
    .badge { padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; }
    .confirmed { background: #064e3b; color: #6ee7b7; }
    .suspect { background: #78350f; color: #fde68a; }
    .exposed_origin { background: #881337; color: #fda4af; }
    .credential_leak { background: #581c87; color: #d8b4fe; }
    .footer { margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
    @media print { body { background: #fff; color: #000; } .container { border: none; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div style="font-size: 11px; color: #64748b; letter-spacing: 2px;">NEXUSINTEL // TACTICAL INTELLIGENCE DOSSIER</div>
        <h1>TARGET: ${target}</h1>
        <div style="font-size: 12px; color: #94a3b8;">OPERATION: ${caseName} • GENERATED: ${dateStr}</div>
      </div>
      <div class="classified-stamp">RESTRICTED DOSSIER</div>
    </div>

    <h2>1. Executive Intelligence Notes</h2>
    <div style="white-space: pre-wrap; line-height: 1.6; background: #0a0e17; padding: 16px; border-radius: 8px; border: 1px solid #1e293b;">
${markdownNotes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </div>

    <h2>2. Verified Pinned Evidence Chain (${pinnedNodes.length} Artifacts)</h2>
    <table>
      <thead>
        <tr>
          <th>Class</th>
          <th>Type</th>
          <th>Entity Value</th>
          <th>Analyst Annotation</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="footer">
      <div>Produced by NexusIntel Autonomous OSINT Platform</div>
      <div>Zero-Server Client Heuristics • Chain of Custody Confirmed</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier-${target.replace(/[^a-zA-Z0-9.-]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-5xl h-[85vh] bg-slate-950 border border-emerald-500/50 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.25)] flex flex-col overflow-hidden font-mono text-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950/40 border-b border-emerald-500/30">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <FileText className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-bold tracking-widest text-emerald-300 uppercase">
                  ANALYST EVIDENCE NOTEBOOK & DOSSIER STUDIO
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                  {pinnedNodes.length} PINNED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Case evidence chain, operational annotations, and standalone dossier compiler
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportHtmlDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.25)]"
              title="Download standalone single-file HTML dossier"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT DOSSIER</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/60 border-b border-slate-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTab('evidence');
                audioTelemetry.playBlip(1300);
              }}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                activeTab === 'evidence'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PINNED EVIDENCE ({pinnedNodes.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('notes');
                audioTelemetry.playBlip(1300);
              }}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                activeTab === 'notes'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OPERATIONAL NOTES (MARKDOWN)
            </button>
          </div>

          {activeTab === 'notes' && (
            <button
              onClick={insertFindingsIntoNotes}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 text-[10px]"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Insert Pinned Findings Table</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden p-6 bg-slate-900/20">
          {activeTab === 'evidence' ? (
            pinnedNodes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                <Bookmark className="w-10 h-10 text-slate-600 animate-bounce" />
                <p className="text-center max-w-sm">
                  No entities pinned yet. Click or right-click any node in the graph and select <strong>"PIN EVIDENCE"</strong> from the radial action wheel!
                </p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto space-y-3 pr-2">
                {pinnedNodes.map(node => {
                  const meta = itemMeta[node.id] || { tag: 'CONFIRMED', notes: '' };

                  return (
                    <div
                      key={node.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700 uppercase font-bold">
                            {node.type}
                          </span>
                          <span className="text-emerald-300 font-bold text-xs truncate">
                            {node.value}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Tag Selector */}
                          <select
                            value={meta.tag}
                            onChange={(e) => updateItemTag(node.id, e.target.value as EvidenceTag)}
                            aria-label={`Tag for ${node.value}`}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] rounded px-2 py-1 focus:outline-none cursor-pointer"
                          >
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="SUSPECT">SUSPECT</option>
                            <option value="EXPOSED_ORIGIN">EXPOSED_ORIGIN</option>
                            <option value="CREDENTIAL_LEAK">CREDENTIAL_LEAK</option>
                            <option value="PIVOT_ROOT">PIVOT_ROOT</option>
                          </select>

                          <button
                            onClick={() => {
                              onRemovePinnedNode(node.id);
                              audioTelemetry.playKeyClick();
                            }}
                            className="p-1 rounded bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Remove pin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Analyst Inline Note Input */}
                      <input
                        type="text"
                        value={meta.notes}
                        onChange={(e) => updateItemNotes(node.id, e.target.value)}
                        placeholder="Add analyst notes or operational hypothesis for this entity..."
                        className="w-full bg-slate-900/60 border border-slate-800 focus:border-emerald-500/40 rounded px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="h-full flex flex-col">
              <textarea
                value={markdownNotes}
                onChange={(e) => setMarkdownNotes(e.target.value)}
                placeholder="Write your tactical case notes and observations in Markdown..."
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Target: <strong className="text-emerald-400">{investigation?.target || 'None'}</strong></span>
          <span>NexusIntel Evidence Chain v2.0 • Standalone Dossier Engine</span>
        </div>
      </div>
    </div>
  );
};
