import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { EntityNode } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface TimeTravelScrubberProps {
  nodes: EntityNode[];
  onTimeFilterChange: (cutoffPercentage: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TimeTravelScrubber: React.FC<TimeTravelScrubberProps> = ({
  nodes,
  onTimeFilterChange,
  isOpen,
  onToggle
}) => {
  const [progress, setProgress] = useState<number>(100); // 0 to 100%
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 4x
  const animRef = useRef<number | null>(null);

  // Compute keyframes for critical nodes
  const criticalPoints = React.useMemo(() => {
    if (nodes.length <= 1) return [];
    return nodes.map((node, index) => ({
      percentage: (index / (nodes.length - 1)) * 100,
      isOrigin: node.type === 'origin_ip',
      isCritical: node.properties?.severity === 'CRITICAL' || node.type === 'origin_ip',
      label: node.label || node.value
    })).filter(p => p.isCritical);
  }, [nodes]);

  useEffect(() => {
    onTimeFilterChange(progress);
  }, [progress, onTimeFilterChange]);

  // Animation Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setProgress(prev => {
        // Full playback across 12 seconds at 1x
        const step = (delta / (12 / playbackSpeed)) * 100;
        const next = prev + step;
        if (next >= 100) {
          setIsPlaying(false);
          audioTelemetry.playLaserSweep();
          return 100;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          onToggle();
          audioTelemetry.playBlip(1200);
        }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:bg-slate-900 transition-all"
        title="Open Forensic Time-Travel Scrubber"
      >
        <Clock className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-bold">TIME-TRAVEL SCRUBBER</span>
      </button>
    );
  }

  const handlePlayToggle = () => {
    if (progress >= 100) {
      setProgress(0);
    }
    const next = !isPlaying;
    setIsPlaying(next);
    if (next) {
      audioTelemetry.playLaserSweep();
    } else {
      audioTelemetry.playKeyClick();
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
    audioTelemetry.playBlip(900);
  };

  const cycleSpeed = () => {
    const speeds = [1, 2, 4];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
    audioTelemetry.playKeyClick();
  };

  const visibleCount = Math.max(1, Math.round((progress / 100) * nodes.length));

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-3xl px-4 font-mono text-xs select-none">
      <div className="bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md p-3 flex flex-col gap-2">
        {/* Top Controls & Status */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              FORENSIC PLAYBACK
            </span>
            <span className="text-slate-600">|</span>
            <span>
              ENTITIES: <strong className="text-cyan-300">{visibleCount}</strong> / {nodes.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleSpeed}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-[10px] font-bold text-cyan-400"
              title="Toggle playback speed"
            >
              {playbackSpeed}X SPEED
            </button>
            <button
              onClick={onToggle}
              className="text-slate-500 hover:text-slate-300 px-1 py-0.5"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Timeline Slider with Critical Markers */}
        <div className="relative flex items-center py-1">
          {/* Keyframe Markers */}
          {criticalPoints.map((pt, idx) => (
            <div
              key={idx}
              style={{ left: `${pt.percentage}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950 pointer-events-none z-10 animate-pulse"
              title={`Critical Discovery: ${pt.label}`}
            />
          ))}

          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={progress}
            onChange={(e) => {
              setIsPlaying(false);
              setProgress(parseFloat(e.target.value));
              audioTelemetry.playKeyClick();
            }}
            aria-label="Forensic time-travel scrubber progress"
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>

        {/* Bottom Playback Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayToggle}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE' : progress >= 100 ? 'REPLAY' : 'PLAY'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
              title="Reset to beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-slate-500">
            {progress === 100 ? (
              <span className="text-emerald-400 font-bold">● FULL TOPOLOGY ACTIVE</span>
            ) : (
              <span>SCRUBBING TIMELINE: <strong className="text-cyan-300">{Math.round(progress)}%</strong></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
