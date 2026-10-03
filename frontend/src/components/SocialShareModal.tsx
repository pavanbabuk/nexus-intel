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
  Monitor,
  Shield,
  Link2,
  Code
} from 'lucide-react';
import { InvestigationDetail } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';
import { generatePermalinkUrl } from '../utils/permalink';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigation: InvestigationDetail | null;
}

type ModalTab = 'card' | 'badges' | 'permalink';
type AspectPreset = 'landscape' | 'square' | 'portrait';
type RoastStyle = 'roast' | 'corporate';

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  investigation
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('card');
  const [aspect, setAspect] = useState<AspectPreset>('landscape');
  const [roastStyle, setRoastStyle] = useState<RoastStyle>('roast');
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [copiedPermalink, setCopiedPermalink] = useState(false);
  const [permalinkUrl, setPermalinkUrl] = useState('');
  const [isGeneratingPermalink, setIsGeneratingPermalink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const target = investigation?.target || 'target.corp';
  const grade = investigation?.scorecard?.grade || 'C';
  const score = investigation?.scorecard?.score ?? 68;

  // Count findings
  const originNodes = investigation?.nodes.filter(n => n.type === 'origin_ip' || n.properties?.is_origin_server || n.properties?.origin_ip) || [];
  const originLeaked = originNodes.length > 0;
  const breachNodes = investigation?.nodes.filter(n => n.properties?.exposed || n.properties?.breach_source || n.properties?.stealer_family) || [];
  const nodeCount = investigation?.nodes.length || 0;

  // Badge color mapping
  const badgeColor = grade.startsWith('A') ? '00f2fe' : grade.startsWith('B') ? '38bdf8' : grade.startsWith('C') ? 'f59e0b' : 'ef4444';
  const shieldsMarkdown = `[![NexusIntel Posture](https://img.shields.io/badge/NexusIntel_Posture-Grade_${grade}_(${score}%2F100)-${badgeColor}?style=for-the-badge&logo=shield)](https://github.com/pavanbabuk/nexus-intel)`;
  const htmlEmbed = `<a href="https://github.com/pavanbabuk/nexus-intel" target="_blank"><img src="https://img.shields.io/badge/NexusIntel_Posture-Grade_${grade}_(${score}%2F100)-${badgeColor}?style=for-the-badge&logo=shield" alt="Perimeter Posture" /></a>`;

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

  // Generate permalink on demand
  useEffect(() => {
    if (investigation && activeTab === 'permalink') {
      setIsGeneratingPermalink(true);
      generatePermalinkUrl(investigation)
        .then(url => setPermalinkUrl(url))
        .catch(err => console.error('Failed to generate permalink', err))
        .finally(() => setIsGeneratingPermalink(false));
    }
  }, [investigation, activeTab]);

  // Canvas drawing routine
  const renderCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Neon Hex / Dot Tactical Grid
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Cyber Glow Orbs
    const rad1 = ctx.createRadialGradient(width * 0.8, height * 0.2, 10, width * 0.8, height * 0.2, 400);
    rad1.addColorStop(0, grade.startsWith('A') ? 'rgba(0, 242, 254, 0.15)' : 'rgba(239, 68, 68, 0.15)');
    rad1.addColorStop(1, 'transparent');
    ctx.fillStyle = rad1;
    ctx.fillRect(0, 0, width, height);

    // 4. Perimeter Border Frame
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Corner brackets
    const cSize = 25;
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 4;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(30, 30 + cSize);
    ctx.lineTo(30, 30);
    ctx.lineTo(30 + cSize, 30);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - 30 - cSize, 30);
    ctx.lineTo(width - 30, 30);
    ctx.lineTo(width - 30, 30 + cSize);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(30, height - 30 - cSize);
    ctx.lineTo(30, height - 30);
    ctx.lineTo(30 + cSize, height - 30);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - 30 - cSize, height - 30);
    ctx.lineTo(width - 30, height - 30);
    ctx.lineTo(width - 30, height - 30 - cSize);
    ctx.stroke();

    // 5. Header Bar
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('NEXUS//INTEL OSINT DOSSIER', 60, 80);

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('CLASSIFICATION: DECLASSIFIED // PUBLIC RECON', 60, 105);

    // 6. Target Domain
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(target, 60, 180);

    // Target Subtitle / Metadata
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`NODES: ${nodeCount} | ORIGIN STATUS: ${originLeaked ? 'COMPROMISED' : 'PROTECTED'}`, 60, 215);

    // 7. Giant Grade Seal (Right Side)
    const gradeX = width - 200;
    const gradeY = aspect === 'portrait' ? 360 : 180;
    
    // Grade Circle Outer
    ctx.beginPath();
    ctx.arc(gradeX, gradeY, 80, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = grade.startsWith('A') ? '#00f2fe' : grade === 'B' ? '#38bdf8' : grade === 'C' ? '#f59e0b' : '#ef4444';
    ctx.stroke();

    // Grade Text
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(grade, gradeX, gradeY - 8);

    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`SCORE: ${score}/100`, gradeX, gradeY + 45);

    // Reset alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // 8. Micro-Findings Pills
    const startY = aspect === 'portrait' ? 520 : 270;
    const findings = [
      { 
        label: originLeaked ? 'ORIGIN SERVER EXPOSED' : 'ORIGIN CLOAKED (WAF ACTIVE)', 
        color: originLeaked ? '#ef4444' : '#10b981', 
        bg: originLeaked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' 
      },
      { 
        label: breachNodes.length > 0 ? `${breachNodes.length} DARKWEB LEAKS` : 'CLEAN CREDENTIAL HYGIENE', 
        color: breachNodes.length > 0 ? '#f59e0b' : '#00f2fe', 
        bg: breachNodes.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 242, 254, 0.15)' 
      },
      { 
        label: `${nodeCount} TOPOLOGY NODES MAP`, 
        color: '#a855f7', 
        bg: 'rgba(168, 85, 247, 0.15)' 
      }
    ];

    let pillX = 60;
    findings.forEach(f => {
      ctx.font = 'bold 14px "Courier New", monospace';
      const textWidth = ctx.measureText(f.label).width;
      const pWidth = textWidth + 28;
      const pHeight = 34;

      // Pill Background
      ctx.fillStyle = f.bg;
      ctx.beginPath();
      ctx.roundRect(pillX, startY, pWidth, pHeight, 17);
      ctx.fill();

      // Pill Border
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pillX, startY, pWidth, pHeight, 17);
      ctx.stroke();

      // Pill Text
      ctx.fillStyle = f.color;
      ctx.fillText(f.label, pillX + 14, startY + 22);

      pillX += pWidth + 15;
    });

    // 9. Roast / Intelligence Briefing Card Box
    const roastY = aspect === 'portrait' ? 620 : 340;
    const roastBoxHeight = aspect === 'portrait' ? 240 : 160;
    const roastBoxWidth = width - 120;

    // Box Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(60, roastY, roastBoxWidth, roastBoxHeight, 12);
    ctx.fill();

    // Box Border
    ctx.strokeStyle = roastStyle === 'roast' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(0, 242, 254, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(60, roastY, roastBoxWidth, roastBoxHeight, 12);
    ctx.stroke();

    // Roast Header
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillStyle = roastStyle === 'roast' ? '#f97316' : '#00f2fe';
    const tagText = roastStyle === 'roast' ? '🔥 CORTEX AI // PERIMETER ROAST' : '📋 C-SUITE EXECUTIVE THREAT BRIEFING';
    ctx.fillText(tagText, 85, roastY + 38);

    // Roast Text (Wrapped)
    ctx.font = '18px "Georgia", serif';
    ctx.fillStyle = '#f1f5f9';
    const roast = generateRoast();
    
    // Word wrap helper
    const words = roast.split(' ');
    let line = '';
    let lineY = roastY + 75;
    const maxLineLength = roastBoxWidth - 50;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineLength && i > 0) {
        ctx.fillText(line, 85, lineY);
        line = words[i] + ' ';
        lineY += 28;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 85, lineY);

    // 10. Footer / Watermark
    const footerY = height - 55;
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('GENERATED BY NEXUS//INTEL 2.0 • OPEN SOURCE OSINT', 60, footerY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('github.com/pavanbabuk/nexus-intel', width - 60, footerY);

  }, [aspect, roastStyle, target, grade, score, originLeaked, breachNodes.length, nodeCount, generateRoast]);

  // Re-render canvas when inputs change or when switching to 'card' tab
  useEffect(() => {
    if (isOpen && activeTab === 'card') {
      const timer = setTimeout(() => {
        renderCard();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, renderCard]);

  // 1-Click Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          setCopiedImage(true);
          audioTelemetry.playKeyClick();
          setTimeout(() => setCopiedImage(false), 2500);
        } else {
          handleDownloadPng();
        }
      });
    } catch (err) {
      console.warn('Clipboard write failed, triggering PNG download', err);
      handleDownloadPng();
    }
  };

  // Download PNG file
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `nexusintel-${target}-${grade}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    audioTelemetry.playChirp();
  };

  // Copy Viral Tweet Text
  const handleCopyText = async () => {
    const tweetText = `Just scanned ${target} on NexusIntel OSINT... Grade: ${grade} (${score}/100) 💀\n\n"${generateRoast()}"\n\nAudit your own attack surface for free:\nhttps://github.com/pavanbabuk/nexus-intel #OSINT #CyberSecurity #InfoSec`;
    await navigator.clipboard.writeText(tweetText);
    setCopiedText(true);
    audioTelemetry.playKeyClick();
    setTimeout(() => setCopiedText(false), 2000);
  };

  // 1-Click Post to X (Twitter)
  const handleShareTwitter = () => {
    const tweetText = `Just scanned ${target} on NexusIntel OSINT... Grade: ${grade} (${score}/100) 💀\n\n"${generateRoast()}"\n\nAudit your own attack surface for free:\nhttps://github.com/pavanbabuk/nexus-intel\n\n#OSINT #CyberSecurity #BugBounty`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    audioTelemetry.playLaserSweep();
  };

  // Copy Badge Markdown
  const handleCopyBadge = async () => {
    await navigator.clipboard.writeText(shieldsMarkdown);
    setCopiedBadge(true);
    audioTelemetry.playKeyClick();
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  // Copy Permalink
  const handleCopyPermalink = async () => {
    if (!investigation) return;
    try {
      const url = permalinkUrl || await generatePermalinkUrl(investigation);
      await navigator.clipboard.writeText(url);
      setCopiedPermalink(true);
      audioTelemetry.playKeyClick();
      setTimeout(() => setCopiedPermalink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-cyber-900 border border-cyber-border rounded-2xl shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border/80 bg-cyber-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider text-white uppercase font-mono flex items-center gap-2">
                Holographic Social Studio
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  VIRAL SUITE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-click social cards, README badges, and zero-backend interactive permalinks.
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-cyber-border/60 bg-cyber-900 text-xs font-mono">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'card'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Social Card Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'badges'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>GitHub README Badges</span>
          </button>
          <button
            onClick={() => setActiveTab('permalink')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'permalink'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Interactive Permalink</span>
          </button>
        </div>

        {/* Tab 1: Social Card Studio */}
        {activeTab === 'card' && (
          <>
            {/* Format & Style Controls */}
            <div className="px-6 py-3 bg-cyber-800/50 border-b border-cyber-border/60 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              {/* Aspect Ratio Switcher */}
              <div className="flex items-center gap-1.5 bg-cyber-900 p-1 rounded-lg border border-cyber-border">
                <button
                  onClick={() => {
                    setAspect('landscape');
                    audioTelemetry.playBlip(1000);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-all ${
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
                    audioTelemetry.playBlip(1000);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-all ${
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
                    audioTelemetry.playBlip(1000);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-all ${
                    aspect === 'portrait'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,242,254,0.25)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Stories / Reels (9:16)</span>
                </button>
              </div>

              {/* Roast Style Switcher */}
              <div className="flex items-center gap-1.5 bg-cyber-900 p-1 rounded-lg border border-cyber-border">
                <button
                  onClick={() => {
                    setRoastStyle('roast');
                    audioTelemetry.playLaserSweep();
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-all ${
                    roastStyle === 'roast'
                      ? 'bg-orange-950 text-orange-400 border border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.25)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>AI Roast Mode</span>
                </button>
                <button
                  onClick={() => {
                    setRoastStyle('corporate');
                    audioTelemetry.playBlip(1200);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-all ${
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
                  className="max-h-[46vh] max-w-full object-contain block mx-auto"
                />
              </div>
            </div>

            {/* Action Controls Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Target: <strong className="text-white">{target}</strong> ({grade})</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopyImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold transition-all"
                  title="Copy image directly to clipboard to paste into X or Slack"
                >
                  {copiedImage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedImage ? 'IMAGE COPIED!' : 'COPY IMAGE'}</span>
                </button>

                <button
                  onClick={handleDownloadPng}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold transition-all"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>DOWNLOAD PNG</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold transition-all"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedText ? 'COPIED!' : 'COPY TWEET'}</span>
                </button>

                <button
                  onClick={handleShareTwitter}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(29,155,240,0.3)]"
                >
                  <Twitter className="w-4 h-4 fill-white" />
                  <span>POST TO X</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: GitHub README Badges */}
        {activeTab === 'badges' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Live Repository Posture Badges</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Display your certified perimeter grade directly on your open-source GitHub README or security documentation.
              </p>
            </div>

            {/* Live Badges Preview */}
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Live Badge Previews:</span>
              <div className="flex flex-wrap items-center gap-4">
                <img 
                  src={`https://img.shields.io/badge/NexusIntel_Posture-Grade_${grade}_(${score}%2F100)-${badgeColor}?style=for-the-badge&logo=shield`} 
                  alt="NexusIntel Posture Badge" 
                  className="h-8 shadow-lg"
                />
                <img 
                  src={`https://img.shields.io/badge/Perimeter_Defense-Grade_${grade}-00f2fe?style=flat-square&logo=nexus`} 
                  alt="Flat Posture Badge" 
                  className="h-6"
                />
              </div>
            </div>

            {/* Markdown Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">GitHub Markdown Embed</span>
                <button
                  onClick={handleCopyBadge}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  {copiedBadge ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBadge ? 'Copied!' : 'Copy Markdown'}</span>
                </button>
              </div>
              <div className="p-3 bg-cyber-950 border border-cyber-border rounded-lg text-xs font-mono text-slate-300 break-all select-all">
                {shieldsMarkdown}
              </div>
            </div>

            {/* HTML Embed Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">HTML Documentation Embed</span>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(htmlEmbed);
                    audioTelemetry.playKeyClick();
                  }}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Copy HTML</span>
                </button>
              </div>
              <div className="p-3 bg-cyber-950 border border-cyber-border rounded-lg text-xs font-mono text-slate-300 break-all select-all">
                {htmlEmbed}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Permalink */}
        {activeTab === 'permalink' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Zero-Backend Shareable Permalinks</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                NexusIntel serializes and gzip-compresses the complete investigation graph into a URL hash. Anyone clicking this link will load the interactive 3D Threat Globe and nodes immediately without needing an account or database!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-cyber-800 to-indigo-950/40 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-300 font-bold uppercase">
                  🔗 Compressed Investigation Link:
                </span>
                {isGeneratingPermalink && (
                  <span className="text-xs font-mono text-slate-400 animate-pulse">
                    Compressing state...
                  </span>
                )}
              </div>

              <div className="p-3 bg-black/70 border border-cyber-border rounded-lg text-xs font-mono text-cyan-400 break-all max-h-28 overflow-y-auto select-all">
                {permalinkUrl || 'Generating URL hash...'}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Total Payload: ~{Math.round((permalinkUrl.length) / 1024 * 10) / 10} KB (Gzip Compressed)
                </span>
                <button
                  onClick={handleCopyPermalink}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {copiedPermalink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPermalink ? 'PERMALINK COPIED!' : 'COPY PERMALINK'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
