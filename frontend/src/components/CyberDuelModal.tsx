import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Swords, 
  Trophy, 
  Copy, 
  Download, 
  Check, 
  Share2, 
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { InvestigationDetail } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface CyberDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigationA: InvestigationDetail | null;
  investigationB: InvestigationDetail | null;
  onSelectCase?: (id: string) => void;
}

export const CyberDuelModal: React.FC<CyberDuelModalProps> = ({
  isOpen,
  onClose,
  investigationA,
  investigationB,
  onSelectCase
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Derive stats for A and B
  const statsA = useMemo(() => {
    if (!investigationA) return null;
    const score = investigationA.scorecard?.score ?? 75;
    const grade = investigationA.scorecard?.grade ?? 'B';
    const originExposed = investigationA.nodes.some(n => n.type === 'origin_ip' || n.properties?.is_origin_server || n.properties?.origin_ip);
    const leakedCreds = investigationA.nodes.filter(n => n.properties?.exposed || n.properties?.breach_source || n.properties?.stealer_family).length;
    const nodeCount = investigationA.nodes.length;
    return { target: investigationA.target, score, grade, originExposed, leakedCreds, nodeCount };
  }, [investigationA]);

  const statsB = useMemo(() => {
    if (!investigationB) return null;
    const score = investigationB.scorecard?.score ?? 70;
    const grade = investigationB.scorecard?.grade ?? 'C';
    const originExposed = investigationB.nodes.some(n => n.type === 'origin_ip' || n.properties?.is_origin_server || n.properties?.origin_ip);
    const leakedCreds = investigationB.nodes.filter(n => n.properties?.exposed || n.properties?.breach_source || n.properties?.stealer_family).length;
    const nodeCount = investigationB.nodes.length;
    return { target: investigationB.target, score, grade, originExposed, leakedCreds, nodeCount };
  }, [investigationB]);

  // Determine winner
  const duelOutcome = useMemo(() => {
    if (!statsA || !statsB) return null;
    const diff = statsA.score - statsB.score;
    if (diff > 0) {
      return {
        winner: statsA.target,
        winnerSide: 'A' as const,
        margin: diff,
        verdict: `${statsA.target} dominates with superior perimeter shielding (+${diff} pts). ${statsB.target} leaves too much exposed attack surface.`
      };
    } else if (diff < 0) {
      return {
        winner: statsB.target,
        winnerSide: 'B' as const,
        margin: Math.abs(diff),
        verdict: `${statsB.target} secures the perimeter crown (+${Math.abs(diff)} pts). ${statsA.target}'s perimeter defenses buckled under recon.`
      };
    } else {
      return {
        winner: 'TIE',
        winnerSide: 'TIE' as const,
        margin: 0,
        verdict: `A dead heat! Both targets demonstrate identical threat resilience scores.`
      };
    }
  }, [statsA, statsB]);

  // Render 1200x630 Tale of the Tape canvas card
  useEffect(() => {
    if (!isOpen || !statsA || !statsB || !canvasRef.current) return;
    setIsRendering(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#0b0f19');
    bgGrad.addColorStop(1, '#05070f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle tactical grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Left team (Alpha) Cyan/Blue side tint
    const alphaTint = ctx.createRadialGradient(200, 300, 20, 200, 300, 450);
    alphaTint.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
    alphaTint.addColorStop(1, 'transparent');
    ctx.fillStyle = alphaTint;
    ctx.fillRect(0, 0, 600, height);

    // Right team (Beta) Crimson/Orange side tint
    const betaTint = ctx.createRadialGradient(1000, 300, 20, 1000, 300, 450);
    betaTint.addColorStop(0, 'rgba(244, 63, 94, 0.12)');
    betaTint.addColorStop(1, 'transparent');
    ctx.fillStyle = betaTint;
    ctx.fillRect(600, 0, 600, height);

    // Top Header Banner
    ctx.font = '900 13px monospace';
    ctx.fillStyle = '#06b6d4';
    ctx.textAlign = 'left';
    ctx.fillText('NEXUS//INTEL 2.0 • TALE OF THE TAPE // CYBER DUEL', 60, 55);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PASSIVE RECON DUEL MATCH', width - 60, 55);

    // Center divider with VS badge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(600, 80);
    ctx.lineTo(600, 540);
    ctx.stroke();
    ctx.setLineDash([]);

    // VS Circle Badge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(600, 250, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 24px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText('VS', 600, 258);

    // Alpha Target (Left)
    ctx.textAlign = 'left';
    ctx.font = '900 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(statsA.target.length > 18 ? statsA.target.substring(0, 18) + '...' : statsA.target, 60, 130);

    // Winner badge for Alpha if won
    if (duelOutcome?.winnerSide === 'A') {
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.fillRect(60, 145, 140, 26);
      ctx.strokeRect(60, 145, 140, 26);
      ctx.fillStyle = '#fef08a';
      ctx.font = '900 12px monospace';
      ctx.fillText('👑 VICTOR (+'+duelOutcome.margin+' PTS)', 72, 163);
    }

    // Alpha Grade Seal
    ctx.font = '900 80px monospace';
    ctx.fillStyle = statsA.grade.startsWith('A') ? '#4ade80' : statsA.grade.startsWith('B') ? '#38bdf8' : '#f87171';
    ctx.fillText(statsA.grade, 60, 260);

    ctx.font = '900 28px monospace';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(`${statsA.score} / 100`, 170, 235);
    ctx.font = '600 13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('RESILIENCE SCORE', 170, 258);

    // Alpha Metrics Table
    const metricsA = [
      { label: 'Origin Cloaking', val: statsA.originExposed ? 'EXPOSED ⚠️' : 'SHIELDED 🛡️', color: statsA.originExposed ? '#f87171' : '#4ade80' },
      { label: 'Dark Web Leaks', val: `${statsA.leakedCreds} Records`, color: statsA.leakedCreds > 0 ? '#fb923c' : '#4ade80' },
      { label: 'Attack Surface Nodes', val: `${statsA.nodeCount} Entities`, color: '#38bdf8' }
    ];

    metricsA.forEach((m, idx) => {
      const y = 320 + idx * 48;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(60, y, 480, 38);
      ctx.font = '600 14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(m.label, 80, y + 24);
      ctx.font = '900 14px monospace';
      ctx.fillStyle = m.color;
      ctx.fillText(m.val, 360, y + 24);
    });

    // Beta Target (Right)
    ctx.textAlign = 'right';
    ctx.font = '900 36px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(statsB.target.length > 18 ? statsB.target.substring(0, 18) + '...' : statsB.target, width - 60, 130);

    // Winner badge for Beta if won
    if (duelOutcome?.winnerSide === 'B') {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.fillRect(width - 200, 145, 140, 26);
      ctx.strokeRect(width - 200, 145, 140, 26);
      ctx.fillStyle = '#fef08a';
      ctx.font = '900 12px monospace';
      ctx.fillText('👑 VICTOR (+'+duelOutcome.margin+' PTS)', width - 188, 163);
    }

    // Beta Grade Seal
    ctx.font = '900 80px monospace';
    ctx.fillStyle = statsB.grade.startsWith('A') ? '#4ade80' : statsB.grade.startsWith('B') ? '#38bdf8' : '#f87171';
    ctx.textAlign = 'right';
    ctx.fillText(statsB.grade, width - 60, 260);

    ctx.font = '900 28px monospace';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(`${statsB.score} / 100`, width - 170, 235);
    ctx.font = '600 13px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('RESILIENCE SCORE', width - 170, 258);

    // Beta Metrics Table
    const metricsB = [
      { label: 'Origin Cloaking', val: statsB.originExposed ? 'EXPOSED ⚠️' : 'SHIELDED 🛡️', color: statsB.originExposed ? '#f87171' : '#4ade80' },
      { label: 'Dark Web Leaks', val: `${statsB.leakedCreds} Records`, color: statsB.leakedCreds > 0 ? '#fb923c' : '#4ade80' },
      { label: 'Attack Surface Nodes', val: `${statsB.nodeCount} Entities`, color: '#f43f5e' }
    ];

    metricsB.forEach((m, idx) => {
      const y = 320 + idx * 48;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(660, y, 480, 38);
      ctx.textAlign = 'left';
      ctx.font = '600 14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(m.label, 680, y + 24);
      ctx.font = '900 14px monospace';
      ctx.fillStyle = m.color;
      ctx.fillText(m.val, 960, y + 24);
    });

    // Bottom Referee Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(60, 500, width - 120, 80);
    ctx.strokeRect(60, 500, width - 120, 80);

    ctx.textAlign = 'left';
    ctx.font = '900 12px monospace';
    ctx.fillStyle = '#eab308';
    ctx.fillText('REFEREE VERDICT // CORTEX NEURAL ANALYSIS:', 80, 528);

    ctx.font = 'italic 15px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    const verdictText = duelOutcome ? duelOutcome.verdict : 'Analyzing confrontation telemetry...';
    ctx.fillText(verdictText, 80, 555);

    // Watermark
    ctx.textAlign = 'right';
    ctx.font = '700 11px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('nexus-intel // open-source osint', width - 80, 555);

    setIsRendering(false);
  }, [isOpen, statsA, statsB, duelOutcome]);

  const handleCopyCard = async () => {
    if (!canvasRef.current) return;
    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          audioTelemetry.playKeyClick();
          setTimeout(() => setCopied(false), 2500);
        } else {
          handleDownloadCard();
        }
      });
    } catch (err) {
      console.error('Clipboard copy error', err);
      handleDownloadCard();
    }
  };

  const handleDownloadCard = () => {
    if (!canvasRef.current || !statsA || !statsB) return;
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `cyber-duel-${statsA.target}-vs-${statsB.target}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    audioTelemetry.playChirp();
  };

  const handlePostToTwitter = () => {
    if (!statsA || !statsB || !duelOutcome) return;
    const tweetText = `⚔️ Cyber Duel: ${statsA.target} (${statsA.grade}) vs ${statsB.target} (${statsB.grade})!\n\n👑 Victor: ${duelOutcome.winner} (+${duelOutcome.margin} pts)\n\nWho has the stronger perimeter defense? Battle your target with @NexusIntel OSINT:\nhttps://github.com/pavanbabuk/nexus-intel`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-cyber-900 border border-cyber-border rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border/80 bg-cyber-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider text-white uppercase font-mono flex items-center gap-2">
                Cyber Duel // Head-to-Head Clash
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  TALE OF THE TAPE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct reconnaissance posture confrontation between two adversary or competing perimeters.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(!statsA || !statsB) ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white font-mono uppercase">Duel Requires Two Scanned Targets</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Launch an investigation for at least two domains or observables to generate a Tale of the Tape confrontation card.
              </p>
            </div>
          ) : (
            <>
              {/* Victor Banner */}
              {duelOutcome && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-cyber-800 to-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                        VICTOR DECLARED // BY POSTURE SCORE (+{duelOutcome.margin} PTS)
                      </div>
                      <div className="text-sm font-semibold text-white mt-0.5">
                        {duelOutcome.verdict}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-black text-sm uppercase">
                      👑 {duelOutcome.winner}
                    </span>
                  </div>
                </div>
              )}

              {/* Tale of the Tape Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Side Alpha */}
                <div className={`p-5 rounded-xl border transition-all ${
                  duelOutcome?.winnerSide === 'A' 
                    ? 'bg-cyber-800/90 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                    : 'bg-cyber-800/50 border-cyber-border'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                        TARGET ALPHA
                      </span>
                      <h3 className="text-xl font-black text-white font-mono mt-1 break-all">
                        {statsA.target}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black font-mono text-cyan-400">
                        {statsA.grade}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        SCORE: {statsA.score}/100
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-border/40">
                      <span className="text-slate-400">Origin Cloaking:</span>
                      <span className={statsA.originExposed ? 'text-rose-400 font-bold flex items-center gap-1' : 'text-emerald-400 font-bold flex items-center gap-1'}>
                        {statsA.originExposed ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        {statsA.originExposed ? 'EXPOSED' : 'SHIELDED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-border/40">
                      <span className="text-slate-400">Dark Web Breaches:</span>
                      <span className={statsA.leakedCreds > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {statsA.leakedCreds} Records
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-border/40">
                      <span className="text-slate-400">Surface Node Count:</span>
                      <span className="text-slate-200 font-bold">{statsA.nodeCount} Entities</span>
                    </div>
                  </div>

                  {investigationA && onSelectCase && (
                    <button
                      onClick={() => {
                        onSelectCase(investigationA.id);
                        onClose();
                      }}
                      className="mt-4 w-full py-2 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Explore Alpha Graph</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Side Beta */}
                <div className={`p-5 rounded-xl border transition-all ${
                  duelOutcome?.winnerSide === 'B' 
                    ? 'bg-cyber-800/90 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]' 
                    : 'bg-cyber-800/50 border-cyber-border'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/30">
                        TARGET BETA
                      </span>
                      <h3 className="text-xl font-black text-white font-mono mt-1 break-all">
                        {statsB.target}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black font-mono text-rose-400">
                        {statsB.grade}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        SCORE: {statsB.score}/100
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-border/40">
                      <span className="text-slate-400">Origin Cloaking:</span>
                      <span className={statsB.originExposed ? 'text-rose-400 font-bold flex items-center gap-1' : 'text-emerald-400 font-bold flex items-center gap-1'}>
                        {statsB.originExposed ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        {statsB.originExposed ? 'EXPOSED' : 'SHIELDED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-border/40">
                      <span className="text-slate-400">Dark Web Breaches:</span>
                      <span className={statsB.leakedCreds > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {statsB.leakedCreds} Records
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-cyber-900/60 border border-cyber-border/40">
                      <span className="text-slate-400">Surface Node Count:</span>
                      <span className="text-slate-200 font-bold">{statsB.nodeCount} Entities</span>
                    </div>
                  </div>

                  {investigationB && onSelectCase && (
                    <button
                      onClick={() => {
                        onSelectCase(investigationB.id);
                        onClose();
                      }}
                      className="mt-4 w-full py-2 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Explore Beta Graph</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

              {/* Live Canvas Preview of Social Duel Card */}
              <div className="p-4 rounded-xl bg-black/60 border border-cyber-border flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-3 text-xs font-mono text-slate-400">
                  <span>Holographic Battle Card (1200x630 High-Resolution)</span>
                  <span className="text-emerald-400">● READY FOR X / REDDIT</span>
                </div>
                <div className="relative w-full overflow-hidden rounded-lg border border-cyber-border/80 shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto block"
                    style={{ maxHeight: '360px', objectFit: 'contain' }}
                  />
                  {isRendering && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-cyber-border bg-cyber-800/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400">
            Export or post duel to spark debate on Twitter, LinkedIn, Reddit, or Discord.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyCard}
              disabled={!statsA || !statsB}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyber-700 hover:bg-cyber-600 border border-cyber-border text-slate-200 text-xs font-mono font-bold transition-all disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Image Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCard}
              disabled={!statsA || !statsB}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyber-700 hover:bg-cyber-600 border border-cyber-border text-slate-200 text-xs font-mono font-bold transition-all disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={handlePostToTwitter}
              disabled={!statsA || !statsB}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white text-xs font-mono font-bold shadow-lg shadow-sky-500/20 transition-all disabled:opacity-40"
            >
              <Share2 className="w-4 h-4" />
              <span>Post Duel to X</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
