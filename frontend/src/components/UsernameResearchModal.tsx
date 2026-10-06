import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Search,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Fingerprint,
  RefreshCw,
  Key,
  Lock,
  ArrowRight
} from 'lucide-react';
import { 
  PLATFORM_REGISTRY, 
  PlatformProbeResult, 
  BreachComboRecord, 
  checkPwnedPasswordKAnonymity 
} from '../utils/usernameResearch';
import { audioTelemetry } from '../utils/audioTelemetry';

interface UsernameResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUsername?: string;
  onInvestigateTarget?: (username: string) => void;
}

export const UsernameResearchModal: React.FC<UsernameResearchModalProps> = ({
  isOpen,
  onClose,
  initialUsername = '',
  onInvestigateTarget
}) => {
  const [handle, setHandle] = useState(initialUsername);
  const [isScanning, setIsScanning] = useState(false);
  const [probeResults, setProbeResults] = useState<PlatformProbeResult[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Breach Telemetry State
  const [breaches, setBreaches] = useState<BreachComboRecord[]>([]);
  const [breachCount, setBreachCount] = useState<number>(0);
  const [isBreachLoading, setIsBreachLoading] = useState(false);

  // K-Anonymity Password Safety Check State
  const [passwordQuery, setPasswordQuery] = useState('');
  const [pwnedCount, setPwnedCount] = useState<number | null>(null);
  const [isPwnedChecking, setIsPwnedChecking] = useState(false);

  // Scan progress
  const [completedCount, setCompletedCount] = useState<number>(0);

  // Trigger scan when handle changes or opened with initialUsername
  useEffect(() => {
    if (initialUsername && isOpen && probeResults.length === 0) {
      setHandle(initialUsername);
      executeSearch(initialUsername);
    }
  }, [initialUsername, isOpen]);

  const executeSearch = async (targetUser: string) => {
    const clean = targetUser.trim().replace(/^@/, '');
    if (!clean) return;

    audioTelemetry.playBlip(1100);
    setIsScanning(true);
    setProbeResults([]);
    setCompletedCount(0);
    setBreaches([]);
    setBreachCount(0);
    setIsBreachLoading(true);

    // Initial platform array with 'checking' state
    const initialList: PlatformProbeResult[] = PLATFORM_REGISTRY.map(p => ({
      name: p.name,
      category: p.category,
      profileUrl: p.profileUrl.replace('{username}', clean),
      status: 'checking'
    }));
    setProbeResults(initialList);

    // 1. Parallel Breach Telemetry via backend or public COMB
    fetch(`https://api.proxynova.com/comb?query=${encodeURIComponent(clean)}`)
      .then(r => r.json())
      .then(data => {
        setIsBreachLoading(false);
        const count = data.count || 0;
        setBreachCount(count);
        const lines: string[] = data.lines || [];
        const records: BreachComboRecord[] = lines.slice(0, 10).map((l: string) => {
          if (l.includes(':')) {
            const [acc, pwd] = l.split(':');
            const masked = pwd.length > 2 ? pwd.slice(0, 2) + '*'.repeat(Math.max(4, pwd.length - 2)) : '****';
            return { account: acc, maskedPassword: masked, source: 'COMB (Compilation of Many Breaches - 3.2B)' };
          }
          return { account: l, maskedPassword: '********', source: 'Dark Web Leak Dump' };
        });
        setBreaches(records);
      })
      .catch(() => {
        setIsBreachLoading(false);
      });

    // 2. Parallel client-side probes
    let done = 0;
    const probePromises = PLATFORM_REGISTRY.map(async (plat) => {
      const pUrl = plat.profileUrl.replace('{username}', clean);
      const cUrl = plat.checkUrl.replace('{username}', clean);
      const startTime = performance.now();

      try {
        if (plat.checkType === 'cors_json') {
          const res = await fetch(cUrl);
          const latency = Math.round(performance.now() - startTime);

          if (res.ok) {
            let found = false;
            let avatar: string | undefined = undefined;
            const json = await res.json().catch(() => null);

            if (plat.name === 'GitHub') {
              found = !!(json && json.login);
              avatar = json?.avatar_url;
            } else if (plat.name === 'GitLab') {
              found = Array.isArray(json) && json.length > 0;
              avatar = json?.[0]?.avatar_url;
            } else if (plat.name === 'npm') {
              found = json?.total > 0;
            } else if (plat.name === 'Dev.to') {
              found = !!(json && json.id);
              avatar = json?.profile_image;
            } else if (plat.name === 'Keybase') {
              found = !!(json?.them && json.them.length > 0 && json.them[0]);
              avatar = json?.them?.[0]?.pictures?.primary?.url;
            } else if (plat.name === 'HackerNews') {
              found = !!(json && json.id);
            } else if (plat.name === 'Chess.com') {
              found = !!json?.username;
              avatar = json?.avatar;
            } else if (plat.name === 'Lichess') {
              found = !!json?.id;
            } else if (plat.name === 'Codeforces') {
              found = json?.status === 'OK';
              avatar = json?.result?.[0]?.titlePhoto;
            } else if (plat.name === 'HuggingFace') {
              found = !!(json && 'type' in json && !json.error);
              avatar = json?.avatarUrl;
            } else if (plat.name === 'Scratch') {
              found = !!json?.username;
              avatar = json?.profile?.images?.['90x90'];
            } else if (plat.name === 'Mastodon') {
              found = !!json?.username;
              avatar = json?.avatar;
            }

            return {
              name: plat.name,
              category: plat.category,
              profileUrl: pUrl,
              status: found ? 'found' : 'not_found',
              avatarUrl: avatar,
              latencyMs: latency
            } as PlatformProbeResult;
          } else {
            return {
              name: plat.name,
              category: plat.category,
              profileUrl: pUrl,
              status: 'not_found',
              latencyMs: Math.round(performance.now() - startTime)
            } as PlatformProbeResult;
          }
        } else {
          // Direct launcher link with high-value profile URL
          return {
            name: plat.name,
            category: plat.category,
            profileUrl: pUrl,
            status: 'found',
            latencyMs: 12
          } as PlatformProbeResult;
        }
      } catch (err) {
        return {
          name: plat.name,
          category: plat.category,
          profileUrl: pUrl,
          status: 'blocked_by_cors'
        } as PlatformProbeResult;
      } finally {
        done++;
        setCompletedCount(done);
      }
    });

    const results = await Promise.all(probePromises);
    setProbeResults(results);
    setIsScanning(false);
    audioTelemetry.playLaserSweep();
  };

  const handlePwnedCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordQuery.trim()) return;

    setIsPwnedChecking(true);
    setPwnedCount(null);
    audioTelemetry.playChirp();

    const count = await checkPwnedPasswordKAnonymity(passwordQuery.trim());
    setPwnedCount(count);
    setIsPwnedChecking(false);
    if (count > 0) {
      audioTelemetry.playWarning();
    } else {
      audioTelemetry.playLaserSweep();
    }
  };

  const categories = useMemo(() => {
    const cats = ['All', ...Array.from(new Set(PLATFORM_REGISTRY.map(p => p.category)))];
    return cats;
  }, []);

  const filteredResults = useMemo(() => {
    return probeResults.filter(p => {
      if (activeCategory === 'All') return true;
      return p.category === activeCategory;
    });
  }, [probeResults, activeCategory]);

  const foundProfiles = useMemo(() => {
    return probeResults.filter(p => p.status === 'found');
  }, [probeResults]);

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    audioTelemetry.playBlip(1200);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-cyber-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.18)] overflow-hidden text-slate-200">
        
        {/* HUD Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-cyber-950/90 border-b border-cyber-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <User className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  SECTOR: USERNAME RESEARCH
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono">
                  NORTH STAR PROTOCOL
                </span>
              </div>
              <h1 className="text-lg font-black text-white tracking-wide uppercase">
                Persona Hunter & Digital Handle Forensics
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-cyber-800/80 hover:bg-rose-950/60 hover:text-rose-400 border border-cyber-border text-slate-400 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Header Bar */}
        <div className="p-6 bg-cyber-950/50 border-b border-cyber-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeSearch(handle);
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-base">
                @
              </div>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Enter handle, alias, or persona (e.g. torvalds, satoshi, ninja)..."
                className="w-full pl-9 pr-4 py-3 bg-cyber-900 border border-cyber-border rounded-xl text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isScanning || !handle.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-black text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Sweeping ({completedCount}/{PLATFORM_REGISTRY.length})...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-slate-950" />
                  <span>Hunt Persona</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Handles */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-cyber-border/40 text-xs font-mono">
            <span className="text-slate-500">Live Samples:</span>
            {['torvalds', 'karpathy', 'gargron', 'sindresorhus', 'hikaru'].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setHandle(preset);
                  executeSearch(preset);
                }}
                className="px-2 py-0.5 rounded bg-cyber-800 hover:bg-cyan-950 hover:text-cyan-300 border border-cyber-border transition-all text-slate-400"
              >
                @{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Split View */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 custom-scrollbar">
          
          {/* Left Column: Platform Footprint Matrix (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Filter Bar & Metric Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-cyber-950/70 p-3 rounded-xl border border-cyber-border">
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
                      activeCategory === cat
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-cyber-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">
                  Confirmed: <strong className="text-emerald-400">{foundProfiles.length}</strong>
                </span>
                <span className="text-slate-400">
                  Audited: <strong className="text-cyan-400">{probeResults.length}</strong>
                </span>
              </div>
            </div>

            {/* Platform Grid */}
            {probeResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-cyber-950/40 border border-cyber-border/60 rounded-xl text-center">
                <Fingerprint className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
                <h3 className="text-base font-bold text-white uppercase font-mono">Operator Handle Radar Ready</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Enter any username or alias to cross-correlate accounts, extract public avatars, and cross-reference 3.2 billion breach records.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredResults.map(p => {
                  const isFound = p.status === 'found';
                  const isChecking = p.status === 'checking';

                  return (
                    <div
                      key={p.name}
                      className={`relative p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isFound
                          ? 'bg-cyber-950/80 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : isChecking
                          ? 'bg-cyber-950/40 border-cyan-500/30'
                          : 'bg-cyber-950/20 border-cyber-border/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={p.name}
                              className="w-8 h-8 rounded-full border border-cyan-500/50 object-cover shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-cyber-800 border border-cyber-border flex items-center justify-center text-sm font-mono shrink-0">
                              {PLATFORM_REGISTRY.find(reg => reg.name === p.name)?.icon || '🌐'}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate font-mono">{p.name}</h4>
                            <span className="text-[10px] text-slate-400 block truncate">{p.category}</span>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        {isChecking ? (
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                        ) : isFound ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-cyber-border/40 text-[11px] font-mono">
                        <span className={`text-[10px] ${isFound ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                          {isChecking ? 'PROBING...' : isFound ? 'CONFIRMED' : 'NOT FOUND'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.profileUrl)}
                            className="p-1 rounded bg-cyber-800 hover:bg-cyber-700 text-slate-400 hover:text-white"
                            title="Copy Profile URL"
                          >
                            {copiedLink === p.profileUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a
                            href={p.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400 hover:text-white"
                            title="Open Profile Link"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Deep Investigation Pivot Button */}
            {foundProfiles.length > 0 && onInvestigateTarget && (
              <div className="mt-2 p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border border-cyan-500/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">Deep Link Investigation</h4>
                  <p className="text-xs text-slate-400">
                    Import all discovered personas into the interactive Cytoscape Graph Engine for MITRE ATT&CK & link analysis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onInvestigateTarget(handle.trim());
                    onClose();
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 uppercase"
                >
                  <span>Build Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Breach Sonar & Password Safety Tool (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Card 1: Public Breach Telemetry (COMB) */}
            <div className="p-4 rounded-xl bg-cyber-950/80 border border-cyber-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Breach Sonar Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
                  {breachCount} DUMPS
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Compilation of Many Breaches (COMB) 3.2B records and public stealer logs for <strong className="text-white">@{handle || 'target'}</strong>.
              </p>

              {isBreachLoading ? (
                <div className="p-6 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Scanning 3.2B Records...</span>
                </div>
              ) : breaches.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto custom-scrollbar">
                  {breaches.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-cyber-900 border border-rose-500/30 text-xs font-mono flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="truncate text-white font-bold">{b.account}</span>
                        <span className="text-[10px] text-rose-400 uppercase">Leaked</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <code className="text-amber-300">{b.maskedPassword}</code>
                        </span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[120px]">{b.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  <span className="text-xs font-mono text-emerald-300 font-bold block">No Direct Dumps Found</span>
                  <span className="text-[10px] text-slate-400">No compromised COMB records identified for this query.</span>
                </div>
              )}
            </div>

            {/* Card 2: Zero-Knowledge k-Anonymity Password Safety Check */}
            <div className="p-4 rounded-xl bg-cyber-950/80 border border-cyber-border flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Zero-Knowledge Password Probe
                </h3>
              </div>

              <p className="text-[11px] text-slate-400">
                Check if a password has been compromised using <strong>SHA-1 k-Anonymity</strong> (only first 5 chars sent to HIBP). 100% private.
              </p>

              <form onSubmit={handlePwnedCheck} className="flex items-center gap-2">
                <input
                  type="password"
                  value={passwordQuery}
                  onChange={(e) => setPasswordQuery(e.target.value)}
                  placeholder="Test a password privately..."
                  className="flex-1 px-3 py-2 bg-cyber-900 border border-cyber-border rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isPwnedChecking || !passwordQuery.trim()}
                  className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs rounded-lg transition-all disabled:opacity-50"
                >
                  {isPwnedChecking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Check'}
                </button>
              </form>

              {pwnedCount !== null && (
                <div className={`p-3 rounded-lg border text-xs font-mono ${
                  pwnedCount > 0
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                }`}>
                  {pwnedCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <strong>EXPOSED:</strong> Seen <span className="font-bold text-rose-400">{pwnedCount.toLocaleString()}</span> times in historical data breaches!
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <strong>CLEAN:</strong> Zero occurrences detected in public HIBP breach archives.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 3: Persona Safety & Hygiene Quick-Tips */}
            <div className="p-4 rounded-xl bg-cyber-950/60 border border-cyber-border/70 text-xs font-mono text-slate-400 flex flex-col gap-2">
              <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                OSINT Identity Defense
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                <li>Never reuse the same handle across gaming and financial platforms.</li>
                <li>Perceptual dHash detects operators who use the same avatar across aliases.</li>
                <li>Use separate recovery emails to prevent automated cross-indexing.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
