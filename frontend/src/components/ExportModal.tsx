import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Share2, Shield } from 'lucide-react';

interface ExportModalProps {
  investigationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ investigationId, isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'stix' | 'json'>('markdown');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const fetchExport = async (fmt: 'markdown' | 'stix' | 'json') => {
    setSelectedFormat(fmt);
    setLoading(true);
    try {
      const resp = await fetch(`/api/investigations/${investigationId}/export/${fmt}`);
      if (fmt === 'markdown') {
        const text = await resp.text();
        setPreviewContent(text);
      } else {
        const data = await resp.json();
        setPreviewContent(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setPreviewContent(`Error generating export: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = selectedFormat === 'markdown' ? 'md' : 'json';
    const blob = new Blob([previewContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_investigation_${investigationId}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fetch initial on open
  if (!previewContent && !loading) {
    fetchExport('markdown');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-cyber-800 border border-cyber-border rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] font-sans">
        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white uppercase tracking-wider">Export Intelligence Dossier</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-cyber-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="px-6 pt-4 flex gap-3 font-mono text-xs">
          <button
            onClick={() => fetchExport('markdown')}
            className={`flex-1 p-3 rounded-lg border flex items-center gap-2 transition-all ${
              selectedFormat === 'markdown'
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-cyber-900 border-cyber-border text-slate-400 hover:bg-cyber-700/60'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-left">
              <div className="font-bold text-white">Markdown Dossier</div>
              <div className="text-[10px] text-slate-400 font-sans">Executive briefing & table audit</div>
            </div>
          </button>

          <button
            onClick={() => fetchExport('stix')}
            className={`flex-1 p-3 rounded-lg border flex items-center gap-2 transition-all ${
              selectedFormat === 'stix'
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-cyber-900 border-cyber-border text-slate-400 hover:bg-cyber-700/60'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="text-left">
              <div className="font-bold text-white">STIX 2.1 Bundle</div>
              <div className="text-[10px] text-slate-400 font-sans">OASIS Cyber Threat Intel format</div>
            </div>
          </button>

          <button
            onClick={() => fetchExport('json')}
            className={`flex-1 p-3 rounded-lg border flex items-center gap-2 transition-all ${
              selectedFormat === 'json'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-cyber-900 border-cyber-border text-slate-400 hover:bg-cyber-700/60'
            }`}
          >
            <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-left">
              <div className="font-bold text-white">Raw Graph JSON</div>
              <div className="text-[10px] text-slate-400 font-sans">Cytoscape / Neo4j node dump</div>
            </div>
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>Payload Preview</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-700 hover:bg-cyber-600 text-slate-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-accent/20 hover:bg-cyber-accent/30 text-cyan-300 border border-cyber-accent/40 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-cyber-900 border border-cyber-border rounded-lg p-3">
            {loading ? (
              <div className="flex items-center justify-center h-48 text-cyan-400 font-mono text-xs">
                Generating dossier formatting...
              </div>
            ) : (
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap select-text">
                {previewContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
