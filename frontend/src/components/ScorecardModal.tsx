import React, { useState } from 'react';
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Twitter,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { SecurityScorecard } from '../types';

interface ScorecardModalProps {
  scorecard: SecurityScorecard;
  target: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  scorecard,
  target,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-500/50',
          glow: 'shadow-[0_0_30px_rgba(16,185,129,0.35)]',
          bar: 'bg-emerald-500'
        };
      case 'B':
        return {
          text: 'text-cyan-400',
          bg: 'bg-cyan-950/80',
          border: 'border-cyan-500/50',
          glow: 'shadow-[0_0_30px_rgba(0,242,254,0.35)]',
          bar: 'bg-cyan-500'
        };
      case 'C':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-950/80',
          border: 'border-amber-500/50',
          glow: 'shadow-[0_0_30px_rgba(245,158,11,0.35)]',
          bar: 'bg-amber-500'
        };
      case 'D':
      case 'F':
      default:
        return {
          text: 'text-rose-500',
          bg: 'bg-rose-950/80',
          border: 'border-rose-500/50',
          glow: 'shadow-[0_0_30px_rgba(244,63,94,0.35)]',
          bar: 'bg-rose-500'
        };
    }
  };

  const style = getGradeColor(scorecard.grade);

  const categories = ['all', ...Array.from(new Set(scorecard.factors.map(f => f.category)))];
  const filteredFactors = filterCategory === 'all'
    ? scorecard.factors
    : scorecard.factors.filter(f => f.category === filterCategory);

  const passCount = scorecard.factors.filter(f => f.status === 'pass').length;
  const warnCount = scorecard.factors.filter(f => f.status === 'warn').length;
  const failCount = scorecard.factors.filter(f => f.status === 'fail').length;

  const shareText = `🔍 Security Scorecard for ${target} on @NexusIntel:
Grade: ${scorecard.grade} (${scorecard.score}/100)
✅ ${passCount} Passed | ⚠️ ${warnCount} Warnings | ❌ ${failCount} Exposed

Scan your domain posture: http://localhost:8000`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTweet = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(tweetUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-cyber-800 border border-cyber-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Roast / Posture Badge */}
        <div className="p-6 border-b border-cyber-border bg-gradient-to-b from-cyber-700/50 to-transparent relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>SECURITY POSTURE & EXPOSURE ROAST</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-cyber-700 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            {/* Scorecard Circular Ring / Grade Badge */}
            <div className={`w-28 h-28 rounded-2xl ${style.bg} ${style.border} border-2 flex flex-col items-center justify-center ${style.glow} shrink-0`}>
              <span className={`text-4xl font-black font-mono tracking-tight ${style.text}`}>
                {scorecard.grade}
              </span>
              <span className="text-xs font-mono text-slate-300 font-semibold mt-1">
                {scorecard.score} / 100
              </span>
            </div>

            {/* Target Title and Summary */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-black text-white font-mono">{target}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyber-900 border border-cyber-border text-slate-300 font-mono">
                  {scorecard.score >= 80 ? 'DEFENDED' : 'EXPOSED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">
                {scorecard.summary}
              </p>

              {/* Progress meter bar */}
              <div className="mt-3 w-full bg-cyber-900 rounded-full h-2 overflow-hidden border border-cyber-border">
                <div
                  className={`h-full ${style.bar} transition-all duration-1000`}
                  style={{ width: `${scorecard.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stat Chips */}
          <div className="mt-4 pt-3 border-t border-cyber-border/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {passCount} Passed
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> {warnCount} Warnings
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <XCircle className="w-3.5 h-3.5" /> {failCount} Failed
              </span>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTweet}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1d9bf0]/20 hover:bg-[#1d9bf0]/30 text-[#1d9bf0] border border-[#1d9bf0]/40 transition-colors"
                title="Post Roast to X / Twitter"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-700 hover:bg-cyber-600 text-slate-200 transition-colors"
                title="Copy Scorecard Summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 pt-3 flex items-center gap-2 overflow-x-auto text-xs font-mono border-b border-cyber-border/40 pb-2">
          <span className="text-slate-500">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                filterCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-cyber-900/60 text-slate-400 hover:text-slate-200 border border-cyber-border/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Breakdown Factors List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-2.5 font-sans">
          {filteredFactors.map((f, idx) => {
            const isPass = f.status === 'pass';
            const isWarn = f.status === 'warn';
            const isFail = f.status === 'fail';

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-colors ${
                  isPass
                    ? 'bg-emerald-950/20 border-emerald-500/20'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-500/20'
                    : 'bg-rose-950/20 border-rose-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {isFail && <XCircle className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{f.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-900 border border-cyber-border text-slate-400 uppercase">
                        {f.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-normal">
                      {f.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 font-mono text-xs font-bold">
                  <span className={f.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {f.impact > 0 ? `+${f.impact}` : f.impact} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
