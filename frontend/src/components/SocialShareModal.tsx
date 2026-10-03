import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Twitter, 
  Share2, 
  Flame, 
  Briefcase, 
  Sparkles,
  Smartphone,
  Square,
  Monitor
} from 'lucide-react';
import { InvestigationDetail } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigation: InvestigationDetail | null;
}

type AspectPreset = 'landscape' | 'square' | 'portrait';
type RoastStyle = 'roast' | 'corporate';

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  investigation
}) => {
  const [aspect, setAspect] = useState<AspectPreset>('landscape');
  const [roastStyle, setRoastStyle] = useState<RoastStyle>('roast');
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const target = investigation?.target || 'target.corp';
  const grade = investigation?.scorecard?.grade || 'C';
  const score = investigation?.scorecard?.score ?? 68;

  // Count findings
  const originNodes = investigation?.nodes.filter(n => n.type === 'origin_ip') || [];
  const originLeaked = originNodes.length > 0;
  const breachNodes = investigation?.nodes.filter(n => n.properties?.breach_source || n.properties?.stealer_family) || [];
  const nodeCount = investigation?.nodes.length || 0;

  // Generate dynamic contextual roasts
  const generateRoast = useCallback((): string => {
    if (roastStyle === 'corporate') {
      if (score >= 85) {
        return `Perimeter defense conforms to zero-trust standards. CDN reverse-proxy effectively isolates backend compute assets with minimal reconnaissance surface.`;
      } else if (score >= 65) {
        return `Moderate exposure observed across external DNS subdomains and infrastructure headers. Perimeter isolation hardening and credential hygiene advised.`;
      } else {
        return `Critical perimeter vulnerability identified: backend origin infrastructure is unmasked and bypasses CDN filtering. Immediate remediation recommended.`;
      }
    }

    // Cyberpunk Roast mode
    if (grade === 'A+' || grade === 'A') {
      return `Perimeter tighter than Fort Knox. Shodan couldn't find a single crack. Go buy your sysadmin a drink.`;
    } else if (originLeaked) {
      const originIp = originNodes[0]?.value || 'direct IP';
      return `Your Cloudflare WAF is pure cosplay. Leaked origin server waving hello on ${originIp} like it's 2017.`;
    } else if (breachNodes.length > 0) {
      return `Found credentials floating on infostealer botnets. Your developers are treating passwords like open-source software.`;
    } else if (grade === 'D' || grade === 'F') {
      return `Your infrastructure is held together by duct tape, prayer, and an expired SSL wildcard.`;
    } else {
      return `Your perimeter is playing hide-and-seek, but left its feet sticking out of the DNS records.`;
    }
  }, [roastStyle, score, grade, originLeaked, originNodes, breachNodes]);

  // Canvas drawing routine
  const renderCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions based on preset
    let width = 1200;
    let height = 630;
    if (aspect === 'square') {
      width = 1080;
      height = 1080;
    } else if (aspect === 'portrait') {
      width = 1080;
      height = 1920;
    }

    canvas.width = width;
    canvas.height = height;

    // 1. Deep Obsidian / Cyberpunk Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#060911');
    bgGrad.addColorStop(0.5, '#0b1120');
    bgGrad.addColorStop(1, '#05070d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Tactical Grid Lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Glowing Cyber Border
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // 4. Header Bar: Brand + Watermark
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('⚡ NEXUSINTEL // ATTACK SURFACE AUDIT', 60, 80);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '16px monospace';
    ctx.fillText(new Date().toISOString().slice(0, 10) + ' • DECLASSIFIED DOSSIER', width - 460, 80);

    // Divider Line
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 105);
    ctx.lineTo(width - 60, 105);
    ctx.stroke();

    // 5. Target Domain Heading
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px monospace';
    ctx.fillText(target.toUpperCase(), 60, 180);

    // Target status pill
    ctx.fillStyle = originLeaked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = originLeaked ? '#ef4444' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(60, 205, 200, 32, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = originLeaked ? '#fca5a5' : '#6ee7b7';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(originLeaked ? '⚠️ ORIGIN UNMASKED' : '🛡️ PERIMETER CLOAKED', 75, 226);

    // 6. Giant Security Posture Grade Box
    const gradeX = width - 260;
    const gradeY = 140;
    const gradeSize = 200;

    let gradeColor = '#10b981';
    let gradeBg = 'rgba(16, 185, 129, 0.12)';
    if (grade === 'B') {
      gradeColor = '#00f2fe';
      gradeBg = 'rgba(0, 242, 254, 0.12)';
    } else if (grade === 'C') {
      gradeColor = '#f59e0b';
      gradeBg = 'rgba(245, 158, 11, 0.12)';
    } else if (grade === 'D' || grade === 'F') {
      gradeColor = '#f43f5e';
      gradeBg = 'rgba(244, 63, 94, 0.15)';
    }

    // Grade container
    ctx.fillStyle = gradeBg;
    ctx.strokeStyle = gradeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(gradeX, gradeY, gradeSize, gradeSize, 18);
    ctx.fill();
    ctx.stroke();

    // Grade Letter
    ctx.fillStyle = gradeColor;
    ctx.font = '900 96px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(grade, gradeX + gradeSize / 2, gradeY + 120);

    // Score text
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`SCORE: ${score} / 100`, gradeX + gradeSize / 2, gradeY + 165);
    ctx.textAlign = 'left';

    // 7. Roast / Critique Quote Block
    const roastY = 280;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(60, roastY, width - 360, 130, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(roastStyle === 'roast' ? '🔥 CORTEX ROAST ASSESSMENT:' : '👔 EXECUTIVE SECURITY SUMMARY:', 80, roastY + 35);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 18px sans-serif';
    const quote = `"${generateRoast()}"`;
    ctx.fillText(quote, 80, roastY + 75, width - 400);

    // 8. 4 Key Recon Metric Badges
    const metricsY = roastY + 160;
    const boxW = (width - 120 - 45) / 4;
    const boxH = 95;

    const metrics = [
      { label: 'DISCOVERED ASSETS', val: `${nodeCount} Nodes`, color: '#00f2fe' },
      { label: 'ORIGIN STATUS', val: originLeaked ? 'EXPOSED' : 'PROTECTED', color: originLeaked ? '#f43f5e' : '#10b981' },
      { label: 'DARK WEB BREACHES', val: breachNodes.length > 0 ? `${breachNodes.length} Creds` : 'CLEAN', color: breachNodes.length > 0 ? '#f59e0b' : '#10b981' },
      { label: 'SURFACE HYGIENE', val: score >= 80 ? 'DEFENDED' : score >= 60 ? 'ELEVATED' : 'CRITICAL', color: gradeColor }
    ];

    metrics.forEach((m, idx) => {
      const bx = 60 + idx * (boxW + 15);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, metricsY, boxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(m.label, bx + 16, metricsY + 30);

      ctx.fillStyle = m.color;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(m.val, bx + 16, metricsY + 65);
    });

    // 9. Footer Watermark & URL
    const footY = height - 45;
    ctx.fillStyle = '#64748b';
    ctx.font = '13px monospace';
    ctx.fillText('⚡ Autonomous Graph-Native OSINT Workbench • Zero Server Proxying', 60, footY);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('github.com/pavanbabuk/nexus-intel', width - 360, footY);

  }, [aspect, roastStyle, target, grade, score, originLeaked, nodeCount, breachNodes.length, generateRoast]);

  useEffect(() => {
    if (isOpen) {
      renderCard();
      audioTelemetry.playLaserSweep();
    }
  }, [isOpen, renderCard]);

  if (!isOpen) return null;

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedImage(true);
          audioTelemetry.playKeyClick();
          setTimeout(() => setCopiedImage(null as any), 2000);
        } catch {
          // Fallback download if clipboard item not permitted
          handleDownloadPng();
        }
      });
    } catch (e) {
      console.error('Failed to copy canvas to clipboard', e);
      handleDownloadPng();
    }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusintel-${target}-${aspect}.png`;
    a.click();
    audioTelemetry.playKeyClick();
  };

  const shareText = `Just scanned ${target} on @NexusIntel...
Grade: ${grade} (${score}/100) ${grade === 'A+' ? '🛡️' : '💀'}
"${generateRoast()}"

Audit your own perimeter here: https://github.com/pavanbabuk/nexus-intel #OSINT #CyberSecurity`;

  const handleShareTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    audioTelemetry.playLaserSweep();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    audioTelemetry.playKeyClick();
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-5xl max-h-[92vh] bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(0,242,254,0.3)] flex flex-col overflow-hidden font-mono text-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-cyan-950/40 border-b border-cyan-500/30">
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.4)]">
              <Share2 className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-bold tracking-widest text-cyan-300 uppercase">
                  HOLOGRAPHIC SOCIAL SNAPSHOT STUDIO
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-950 border border-purple-500/50 text-purple-300">
                  VIRAL RECON CARD
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                1-Click pixel-perfect social cards for X (Twitter), LinkedIn, Discord, and Stories
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Aspect Ratio & Roast Mode */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Aspect Ratio Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setAspect('landscape');
                audioTelemetry.playBlip(1300);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
                aspect === 'landscape'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,242,254,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>X / LinkedIn (16:9)</span>
            </button>

            <button
              onClick={() => {
                setAspect('square');
                audioTelemetry.playBlip(1300);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
                aspect === 'square'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,242,254,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Square (1:1)</span>
            </button>

            <button
              onClick={() => {
                setAspect('portrait');
                audioTelemetry.playBlip(1300);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
                aspect === 'portrait'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,242,254,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Stories (9:16)</span>
            </button>
          </div>

          {/* Roast Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setRoastStyle('roast');
                audioTelemetry.playWarning();
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
                roastStyle === 'roast'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>AI Roast Mode</span>
            </button>

            <button
              onClick={() => {
                setRoastStyle('corporate');
                audioTelemetry.playBlip(1200);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-bold transition-all ${
                roastStyle === 'corporate'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,242,254,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Corporate Brief</span>
            </button>
          </div>
        </div>

        {/* Live Card Preview Area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/80">
          <div className="relative max-w-full rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <canvas 
              ref={canvasRef} 
              className="max-h-[50vh] max-w-full object-contain block mx-auto"
            />
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Target: <strong className="text-white">{target}</strong> ({grade})</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold transition-all"
              title="Copy image directly to clipboard to paste into X or Slack"
            >
              {copiedImage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedImage ? 'IMAGE COPIED!' : 'COPY IMAGE'}</span>
            </button>

            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>DOWNLOAD PNG</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-bold transition-all"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedText ? 'COPIED!' : 'COPY TWEET'}</span>
            </button>

            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)]"
            >
              <Twitter className="w-4 h-4 fill-slate-950" />
              <span>POST TO X</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
