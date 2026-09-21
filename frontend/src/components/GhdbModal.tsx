import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  FolderTree,
  Cloud,
  FileText,
  Bug,
  Code,
  Flame,
  Search,
  Globe,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import {
  GHDB_CATEGORIES,
  GHDB_DORKS,
  SearchEngine,
  GhdbDork,
  cleanDomain,
  compileDorkQuery,
  buildSearchEngineUrl
} from '../utils/ghdbData';
import { audioTelemetry } from '../utils/audioTelemetry';

interface GhdbModalProps {
  isOpen: boolean;
  onClose: () => void;
  target?: string;
}

export const GhdbModal: React.FC<GhdbModalProps> = ({
  isOpen,
  onClose,
  target = ''
}) => {
  const [targetDomain, setTargetDomain] = useState<string>(cleanDomain(target) || 'example.com');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchEngine, setSearchEngine] = useState<SearchEngine>('google');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [batchLaunched, setBatchLaunched] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (target) {
        const cleaned = cleanDomain(target);
        if (cleaned) setTargetDomain(cleaned);
      }
      audioTelemetry.playBlip(1300);
    }
  }, [isOpen, target]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'KeyRound': return <KeyRound className="w-4 h-4 text-rose-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'FolderTree': return <FolderTree className="w-4 h-4 text-emerald-400" />;
      case 'Cloud': return <Cloud className="w-4 h-4 text-cyan-400" />;
      case 'FileText': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'Bug': return <Bug className="w-4 h-4 text-orange-400" />;
      case 'Code': return <Code className="w-4 h-4 text-purple-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-red-500" />;
      default: return <Layers className="w-4 h-4 text-cyan-400" />;
    }
  };

  const filteredDorks = useMemo(() => {
    return GHDB_DORKS.filter((dork: GhdbDork) => {
      const matchesCategory = selectedCategory === 'all' || dork.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        dork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dork.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dork.queryTemplate.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    audioTelemetry.playKeyClick();
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleLaunch = (compiledQuery: string) => {
    const url = buildSearchEngineUrl(compiledQuery, searchEngine);
    window.open(url, '_blank', 'noopener,noreferrer');
    audioTelemetry.playLaserSweep();
  };

  const handleBatchLaunch = () => {
    const topFive = filteredDorks.slice(0, 5);
    if (topFive.length === 0) return;

    setBatchLaunched(true);
    audioTelemetry.playChirp();

    topFive.forEach((dork, index) => {
      setTimeout(() => {
        const query = compileDorkQuery(dork.queryTemplate, targetDomain);
        const url = buildSearchEngineUrl(query, searchEngine);
        window.open(url, '_blank', 'noopener,noreferrer');
      }, index * 250);
    });

    setTimeout(() => setBatchLaunched(false), 3000);
  };

  const handleCopyAll = () => {
    const allCompiled = filteredDorks
      .map(d => `# ${d.title}\n${compileDorkQuery(d.queryTemplate, targetDomain)}`)
      .join('\n\n');
    navigator.clipboard.writeText(allCompiled);
    audioTelemetry.playKeyClick();
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="w-full max-w-6xl h-[90vh] bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden font-mono text-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-cyan-950/40 border-b border-cyan-500/30">
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Search className="w-5 h-5 text-cyan-300 animate-pulse" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base font-bold tracking-widest text-cyan-300 uppercase">
                  GOOGLE HACKING DB // ADVANCED DORKS
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                  <Lock className="w-3 h-3" />
                  100% CLIENT-SIDE • ZERO SERVER HOOKS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct browser-executed search heuristics across Google, DuckDuckGo, Bing, GitHub & Shodan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Domain & Engine Controls Bar */}
        <div className="p-4 bg-slate-900/70 border-b border-cyan-500/20 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Active Target Domain Input */}
          <div className="lg:col-span-5 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-cyan-500/40">
            <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-400 font-bold uppercase whitespace-nowrap">Target:</span>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(cleanDomain(e.target.value) || e.target.value)}
              placeholder="example.com"
              className="w-full bg-transparent text-cyan-300 font-bold focus:outline-none placeholder-slate-600"
            />
          </div>

          {/* Search Engine Selector */}
          <div className="lg:col-span-5 flex items-center gap-1 overflow-x-auto bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['google', 'duckduckgo', 'bing', 'github', 'shodan'] as SearchEngine[]).map(engine => (
              <button
                key={engine}
                onClick={() => {
                  setSearchEngine(engine);
                  audioTelemetry.playBlip(1400);
                }}
                className={`flex-1 min-w-[70px] py-1 px-2 rounded font-bold text-[10px] uppercase transition-all ${
                  searchEngine === engine
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {engine === 'duckduckgo' ? 'DDG' : engine}
              </button>
            ))}
          </div>

          {/* Quick Actions: Batch Launch & Copy All */}
          <div className="lg:col-span-2 flex items-center gap-2 justify-end">
            <button
              onClick={handleBatchLaunch}
              className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all ${
                batchLaunched
                  ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              }`}
              title="Launch top 5 visible dorks in browser tabs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{batchLaunched ? 'Launched!' : 'Launch Top 5'}</span>
            </button>
            <button
              onClick={handleCopyAll}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
              title="Copy all visible dorks to clipboard"
            >
              {copiedId === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Modal Main Area: Category Sidebar + Dork Feed */}
        <div className="flex-1 flex overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-64 border-r border-slate-800/80 bg-slate-950/60 flex flex-col p-3 gap-1 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Dork Categories
            </div>

            <button
              onClick={() => {
                setSelectedCategory('all');
                audioTelemetry.playBlip(1200);
              }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                selectedCategory === 'all'
                  ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-xs">All Categories</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                {GHDB_DORKS.length}
              </span>
            </button>

            {GHDB_CATEGORIES.map(cat => {
              const count = GHDB_DORKS.filter(d => d.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    audioTelemetry.playBlip(1200);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {getCategoryIcon(cat.icon)}
                    <span className="font-semibold text-xs truncate">{cat.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    cat.badge === 'CRITICAL' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' :
                    cat.badge === 'HIGH' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
                    'bg-slate-900 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dork Stream Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/30">
            {/* Filter Search Bar */}
            <div className="p-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/40">
              <Search className="w-4 h-4 text-slate-500 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by keyword (e.g. env, password, aws, git, admin, backup, sql)..."
                className="w-full bg-transparent text-slate-200 focus:outline-none placeholder-slate-600 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-500 hover:text-slate-300 text-xs px-1.5"
                >
                  Clear
                </button>
              )}
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                Showing <strong className="text-cyan-400">{filteredDorks.length}</strong> dorks
              </span>
            </div>

            {/* Dorks Grid / List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredDorks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <Search className="w-8 h-8 text-slate-600 animate-bounce" />
                  <p>No dorks found matching query "{searchQuery}"</p>
                </div>
              ) : (
                filteredDorks.map(dork => {
                  const compiled = compileDorkQuery(dork.queryTemplate, targetDomain);
                  const isCopied = copiedId === dork.id;

                  return (
                    <div
                      key={dork.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-cyan-500/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 text-xs group-hover:text-cyan-300 transition-colors">
                              {dork.title}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                              dork.severity === 'CRITICAL' ? 'bg-rose-950 border-rose-500/50 text-rose-300' :
                              dork.severity === 'HIGH' ? 'bg-amber-950 border-amber-500/50 text-amber-300' :
                              dork.severity === 'MEDIUM' ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300' :
                              'bg-slate-900 border-slate-700 text-slate-400'
                            }`}>
                              {dork.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {dork.description}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleCopy(compiled, dork.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
                            title="Copy query to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] text-emerald-400 font-bold">COPIED</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[10px]">COPY</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleLaunch(compiled)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 hover:text-cyan-100 transition-all shadow-[0_0_8px_rgba(6,182,212,0.15)]"
                            title={`Search directly on ${searchEngine.toUpperCase()}`}
                          >
                            <span className="text-[10px] font-bold uppercase">SEARCH {searchEngine}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Code / Query Block */}
                      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-cyan-200/90 break-all select-all flex items-center justify-between">
                        <code>{compiled}</code>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Target: <strong className="text-cyan-300 font-mono">{targetDomain}</strong></span>
            <span className="text-slate-700">|</span>
            <span>Engine: <strong className="text-slate-300 uppercase">{searchEngine}</strong></span>
          </div>
          <div>
            <span>NexusIntel OSINT GHDB Engine v1.0 • Client-side heuristics</span>
          </div>
        </div>
      </div>
    </div>
  );
};
