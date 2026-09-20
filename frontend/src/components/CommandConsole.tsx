import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Sparkles, Volume2, VolumeX, Eye, Shuffle, Download, X, Globe } from 'lucide-react';
import { audioTelemetry } from '../utils/audioTelemetry';

interface CommandConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchScan: (target: string) => void;
  onFilterNodes: (query: string) => void;
  onChangeLayout: (layout: 'cose' | 'concentric' | 'circle' | 'breadthfirst') => void;
  onToggleCrt: () => void;
  isCrtActive: boolean;
  onToggleAudio: () => void;
  isAudioActive: boolean;
  onOpenExport: () => void;
  onOpenScorecard: () => void;
  onToggleLogs: () => void;
  onSwitchView?: (view: 'graph' | 'globe') => void;
}

interface CommandSuggestion {
  command: string;
  syntax: string;
  description: string;
  icon: React.ReactNode;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({
  isOpen,
  onClose,
  onLaunchScan,
  onFilterNodes,
  onChangeLayout,
  onToggleCrt,
  isCrtActive,
  onToggleAudio,
  isAudioActive,
  onOpenExport,
  onOpenScorecard,
  onToggleLogs,
  onSwitchView
}) => {
  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableCommands: CommandSuggestion[] = [
    {
      command: ':scan',
      syntax: ':scan <domain|ip|username|url>',
      description: 'Launch tactical autonomous recon scan against target',
      icon: <Terminal className="w-4 h-4 text-cyan-400" />
    },
    {
      command: ':globe',
      syntax: ':globe',
      description: 'Switch perspective to 3D Orthographic Threat Globe',
      icon: <Globe className="w-4 h-4 text-cyan-400" />
    },
    {
      command: ':graph',
      syntax: ':graph',
      description: 'Switch perspective to 2D Cytoscape Graph Canvas',
      icon: <Shuffle className="w-4 h-4 text-emerald-400" />
    },
    {
      command: ':filter',
      syntax: ':filter <query>',
      description: 'Filter active graph nodes by type, IP, or label',
      icon: <Eye className="w-4 h-4 text-emerald-400" />
    },
    {
      command: ':layout',
      syntax: ':layout <cose|concentric|circle|breadthfirst>',
      description: 'Reconfigure topology layout physics',
      icon: <Shuffle className="w-4 h-4 text-purple-400" />
    },
    {
      command: ':crt',
      syntax: ':crt',
      description: `Toggle retro CRT phosphor scanlines (${isCrtActive ? 'ENABLED' : 'DISABLED'})`,
      icon: <Sparkles className="w-4 h-4 text-amber-400" />
    },
    {
      command: ':audio',
      syntax: ':audio',
      description: `Toggle synthesized audio telemetry HUD (${isAudioActive ? 'ON' : 'MUTED'})`,
      icon: isAudioActive ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-red-400" />
    },
    {
      command: ':scorecard',
      syntax: ':scorecard',
      description: 'Open Attack Surface Risk Scorecard & breakdown',
      icon: <Shield className="w-4 h-4 text-emerald-400" />
    },
    {
      command: ':export',
      syntax: ':export',
      description: 'Export intelligence report (STIX 2.1, Cytoscape JSON, Markdown)',
      icon: <Download className="w-4 h-4 text-cyan-400" />
    },
    {
      command: ':logs',
      syntax: ':logs',
      description: 'Toggle real-time analyzer audit logs & event timeline',
      icon: <Terminal className="w-4 h-4 text-slate-400" />
    }
  ];

  const filteredCommands = availableCommands.filter(c =>
    c.command.toLowerCase().startsWith(input.trim().split(' ')[0].toLowerCase()) ||
    c.description.toLowerCase().includes(input.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      audioTelemetry.playLaserSweep();
      setStatusMessage(null);
    } else {
      setInput('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    audioTelemetry.playKeyClick();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (filteredCommands.length > 0) {
        const cmd = filteredCommands[selectedIndex];
        setInput(cmd.command + ' ');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(input.trim());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const executeCommand = (cmdStr: string) => {
    if (!cmdStr) {
      if (filteredCommands.length > 0) {
        const cmd = filteredCommands[selectedIndex];
        setInput(cmd.command + ' ');
      }
      return;
    }

    const parts = cmdStr.split(' ');
    const verb = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    audioTelemetry.playChirp();

    if (verb === ':scan') {
      if (!arg) {
        setStatusMessage('ERR: Specify target (e.g. :scan example.com)');
        audioTelemetry.playWarning();
        return;
      }
      onLaunchScan(arg);
      onClose();
    } else if (verb === ':globe') {
      if (onSwitchView) onSwitchView('globe');
      setStatusMessage('PERSPECTIVE: 3D THREAT GLOBE ONLINE');
      onClose();
    } else if (verb === ':graph') {
      if (onSwitchView) onSwitchView('graph');
      setStatusMessage('PERSPECTIVE: 2D GRAPH CANVAS ONLINE');
      onClose();
    } else if (verb === ':filter') {
      onFilterNodes(arg);
      setStatusMessage(`FILTER APPLIED: "${arg}"`);
      audioTelemetry.playBlip();
    } else if (verb === ':layout') {
      const valid = ['cose', 'concentric', 'circle', 'breadthfirst'];
      if (valid.includes(arg)) {
        onChangeLayout(arg as 'cose' | 'concentric' | 'circle' | 'breadthfirst');
        setStatusMessage(`LAYOUT REORGANIZED: ${arg.toUpperCase()}`);
        onClose();
      } else {
        setStatusMessage(`ERR: Invalid layout. Choose: ${valid.join(', ')}`);
        audioTelemetry.playWarning();
      }
    } else if (verb === ':crt') {
      onToggleCrt();
      setStatusMessage(`CRT SCANLINES: ${!isCrtActive ? 'ENABLED' : 'DISABLED'}`);
      audioTelemetry.playBlip(1200);
    } else if (verb === ':audio') {
      onToggleAudio();
      setStatusMessage(`AUDIO HUD: ${!isAudioActive ? 'ONLINE' : 'MUTED'}`);
      audioTelemetry.playBlip(1400);
    } else if (verb === ':export') {
      onOpenExport();
      onClose();
    } else if (verb === ':scorecard') {
      onOpenScorecard();
      onClose();
    } else if (verb === ':logs') {
      onToggleLogs();
      onClose();
    } else if (verb === ':clear' || verb === ':cls') {
      setInput('');
      setStatusMessage(null);
    } else {
      // If user typed a domain without :scan prefix, auto-scan
      if (cmdStr.includes('.') && !cmdStr.startsWith(':')) {
        onLaunchScan(cmdStr);
        onClose();
      } else {
        setStatusMessage(`UNKNOWN COMMAND: "${verb}". Type :help or select below.`);
        audioTelemetry.playWarning();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-950 border border-cyan-500/50 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.25)] overflow-hidden font-mono text-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-cyan-500/20">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-bold text-cyan-300 tracking-wider text-[11px] uppercase">
              NEXUS//QUAKE-CONSOLE [Ctrl+K / ~]
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[10px] text-slate-400">
            <span>ESC to dismiss</span>
            <button 
              onClick={onClose}
              className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 flex items-center space-x-2 border-b border-slate-800">
          <span className="text-cyan-400 font-bold text-sm">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type command (e.g. :scan tesla.com, :crt, :layout concentric)..."
            className="w-full bg-transparent text-cyan-100 placeholder-slate-600 focus:outline-none text-sm font-mono tracking-wide"
            autoFocus
          />
        </div>

        {/* Status Message / Output Banner */}
        {statusMessage && (
          <div className="px-4 py-1.5 bg-cyan-950/60 border-b border-cyan-500/30 text-cyan-300 text-[11px] flex items-center justify-between">
            <span>{statusMessage}</span>
            <span className="text-[10px] text-slate-500 font-mono">CODE: 200 OK</span>
          </div>
        )}

        {/* Auto-complete Suggestions List */}
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-900 p-1">
          {filteredCommands.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={cmd.command}
                onClick={() => {
                  setInput(cmd.command + ' ');
                  inputRef.current?.focus();
                  audioTelemetry.playKeyClick();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-3 py-2 rounded flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-200' : 'text-slate-400 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800">
                    {cmd.icon}
                  </div>
                  <div>
                    <span className="font-bold text-cyan-300 mr-2">{cmd.syntax}</span>
                    <span className="text-[11px] text-slate-400">{cmd.description}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="text-[10px] text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded bg-cyan-950">
                    ENTER ⏎
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Console Footer */}
        <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>Tab Auto-fill</span>
            <span>Enter Execute</span>
          </div>
          <div className="text-cyan-400/80 font-mono">
            SYS: AUDIO {isAudioActive ? 'ON' : 'OFF'} | CRT {isCrtActive ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
    </div>
  );
};
