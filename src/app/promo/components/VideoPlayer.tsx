"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipForward,
  SkipBack,
  Mic,
  MicOff,
  Video,
  Download,
  FileText,
  Sliders,
  Sparkles,
} from "lucide-react";
import { VIDEO_SCENES, TOTAL_VIDEO_DURATION } from "./video-data";
import { soundEffects, VoiceoverEngine } from "./AudioEngine";
import Scene1PainPoints from "./scenes/Scene1PainPoints";
import Scene2Solution from "./scenes/Scene2Solution";
import Scene3Timetable from "./scenes/Scene3Timetable";
import Scene4KpiEngine from "./scenes/Scene4KpiEngine";
import Scene5ExamAnalytics from "./scenes/Scene5ExamAnalytics";
import Scene6AuditLocking from "./scenes/Scene6AuditLocking";
import Scene7OutroMetrics from "./scenes/Scene7OutroMetrics";

interface VideoPlayerProps {
  onOpenScript?: () => void;
  onOpenDeck?: () => void;
}

export default function VideoPlayer({ onOpenScript, onOpenDeck }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [sceneProgress, setSceneProgress] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVoiceoverEnabled, setIsVoiceoverEnabled] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const voiceEngineRef = useRef<VoiceoverEngine | null>(null);

  // Initialize Voiceover Engine
  useEffect(() => {
    voiceEngineRef.current = new VoiceoverEngine();
    return () => {
      voiceEngineRef.current?.stop();
    };
  }, []);

  // Update Mute / Voiceover settings
  useEffect(() => {
    soundEffects.setMuted(isMuted);
    if (voiceEngineRef.current) {
      voiceEngineRef.current.enabled = isVoiceoverEnabled && !isMuted;
    }
  }, [isMuted, isVoiceoverEnabled]);

  // Current Scene Object
  const currentScene = VIDEO_SCENES[currentSceneIndex];

  // Calculate cumulative start time for scenes
  const getSceneStartTime = (index: number) => {
    let t = 0;
    for (let i = 0; i < index; i++) {
      t += VIDEO_SCENES[i].duration;
    }
    return t;
  };

  // Trigger Voiceover & Sound Effects on scene enter
  const triggerSceneAudio = useCallback(
    (sceneIdx: number) => {
      soundEffects.playTransition();
      if (sceneIdx === 2) {
        setTimeout(() => soundEffects.playSuccessChime(), 1800);
      } else if (sceneIdx === 3) {
        setTimeout(() => soundEffects.playPodiumFanfare(), 3000);
      } else if (sceneIdx === 4) {
        setTimeout(() => soundEffects.playTelemetryBeep(1040), 1200);
      } else if (sceneIdx === 5) {
        setTimeout(() => soundEffects.playSuccessChime(), 2500);
      }

      if (voiceEngineRef.current && isVoiceoverEnabled && !isMuted) {
        const text = VIDEO_SCENES[sceneIdx].voiceover;
        voiceEngineRef.current.speak(text);
      }
    },
    [isVoiceoverEnabled, isMuted]
  );

  // Jump to specific scene
  const goToScene = useCallback(
    (sceneIdx: number) => {
      if (sceneIdx < 0 || sceneIdx >= VIDEO_SCENES.length) return;
      setCurrentSceneIndex(sceneIdx);
      setSceneProgress(0);
      setElapsedTime(getSceneStartTime(sceneIdx));
      if (isPlaying) {
        triggerSceneAudio(sceneIdx);
      }
    },
    [isPlaying, triggerSceneAudio]
  );

  // Main animation frame loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      if (!isPlaying) {
        lastTimestamp = now;
        return;
      }

      const delta = ((now - lastTimestamp) / 1000) * playbackSpeed;
      lastTimestamp = now;

      setElapsedTime((prevElapsed) => {
        const newElapsed = prevElapsed + delta;

        if (newElapsed >= TOTAL_VIDEO_DURATION) {
          setIsPlaying(false);
          voiceEngineRef.current?.stop();
          return TOTAL_VIDEO_DURATION;
        }

        // Determine which scene we are in
        let cumulative = 0;
        let foundIdx = 0;
        let progressInScene = 0;

        for (let i = 0; i < VIDEO_SCENES.length; i++) {
          const sceneDuration = VIDEO_SCENES[i].duration;
          if (newElapsed >= cumulative && newElapsed < cumulative + sceneDuration) {
            foundIdx = i;
            progressInScene = (newElapsed - cumulative) / sceneDuration;
            break;
          }
          cumulative += sceneDuration;
        }

        if (foundIdx !== currentSceneIndex) {
          setCurrentSceneIndex(foundIdx);
          triggerSceneAudio(foundIdx);
        }

        setSceneProgress(progressInScene);
        return newElapsed;
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, playbackSpeed, currentSceneIndex, triggerSceneAudio]);

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (elapsedTime >= TOTAL_VIDEO_DURATION) {
      goToScene(0);
      setIsPlaying(true);
      triggerSceneAudio(0);
      return;
    }

    if (!isPlaying) {
      setIsPlaying(true);
      triggerSceneAudio(currentSceneIndex);
    } else {
      setIsPlaying(false);
      voiceEngineRef.current?.stop();
    }
  };

  // Replay Video from start
  const handleReplay = () => {
    goToScene(0);
    setIsPlaying(true);
    triggerSceneAudio(0);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Screen recording feature (records video directly to download)
  const handleRecordVideo = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: true,
      });

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `School-Management-Marketing-Video-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      handleReplay();
    } catch {
      alert("Trình duyệt không cấp quyền quay màn hình hoặc đã bị hủy.");
      setIsRecording(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full max-w-6xl mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl shadow-indigo-950/40"
    >
      {/* ── 16:9 Cinema Canvas Screen ── */}
      <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Render Active Scene */}
        {currentSceneIndex === 0 && <Scene1PainPoints progress={sceneProgress} />}
        {currentSceneIndex === 1 && <Scene2Solution progress={sceneProgress} />}
        {currentSceneIndex === 2 && <Scene3Timetable progress={sceneProgress} />}
        {currentSceneIndex === 3 && <Scene4KpiEngine progress={sceneProgress} />}
        {currentSceneIndex === 4 && <Scene5ExamAnalytics progress={sceneProgress} />}
        {currentSceneIndex === 5 && <Scene6AuditLocking progress={sceneProgress} />}
        {currentSceneIndex === 6 && (
          <Scene7OutroMetrics
            progress={sceneProgress}
            onOpenScript={onOpenScript}
            onOpenDeck={onOpenDeck}
          />
        )}

        {/* Top Watermark & Scene Badge */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 pointer-events-none">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/90 border border-indigo-400/50 flex items-center justify-center text-white font-black text-sm shadow-md">
            SM
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wider text-white drop-shadow">
              SCHOOL MANAGEMENT
            </span>
            <span className="text-[10px] text-slate-300 drop-shadow">
              Hệ Thống Quản Lý Trường Học Thông Minh
            </span>
          </div>
        </div>

        {/* Scene Badge Indicator (Top Right) */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md transition-all duration-300 ${currentScene.badgeColor}`}
          >
            Cảnh {currentSceneIndex + 1}/{VIDEO_SCENES.length}: {currentScene.badge}
          </div>
        </div>

        {/* Play Overlay Button if Paused */}
        {!isPlaying && (
          <div
            onClick={handleTogglePlay}
            className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer group transition-all"
          >
            <div className="w-20 h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-400 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 transition-all transform group-hover:scale-110">
              <Play className="w-9 h-9 fill-white translate-x-0.5" />
            </div>
            <span className="absolute mt-28 text-xs font-bold text-slate-200 tracking-wider uppercase bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
              Nhấn để bắt đầu video tiếp thị
            </span>
          </div>
        )}

        {/* Subtitles Overlay Bar (TikTok / Reels Style at Bottom) */}
        <div className="absolute bottom-3 inset-x-6 z-30 flex justify-center pointer-events-none">
          <div className="px-5 py-2 rounded-2xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-xl max-w-2xl text-center shadow-xl">
            <p className="text-xs md:text-sm font-semibold text-slate-100 tracking-wide leading-relaxed">
              💬 {currentScene.shortCaption}
            </p>
          </div>
        </div>
      </div>

      {/* ── Control Bar & Timeline ── */}
      <div className="relative z-30 p-4 bg-slate-900/95 border-t border-slate-800 flex flex-col gap-3">
        {/* Timeline Scrubber */}
        <div className="relative w-full flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {formatTime(elapsedTime)}
          </span>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const targetTime = ratio * TOTAL_VIDEO_DURATION;

              // Find scene corresponding to targetTime
              let cum = 0;
              for (let i = 0; i < VIDEO_SCENES.length; i++) {
                if (targetTime >= cum && targetTime <= cum + VIDEO_SCENES[i].duration) {
                  setCurrentSceneIndex(i);
                  setSceneProgress((targetTime - cum) / VIDEO_SCENES[i].duration);
                  setElapsedTime(targetTime);
                  break;
                }
                cum += VIDEO_SCENES[i].duration;
              }
            }}
            className="relative flex-1 h-3 rounded-full bg-slate-800 cursor-pointer overflow-hidden group"
          >
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-100"
              style={{ width: `${(elapsedTime / TOTAL_VIDEO_DURATION) * 100}%` }}
            />

            {/* Scene Markers */}
            {VIDEO_SCENES.map((s, idx) => {
              const startT = getSceneStartTime(idx);
              const posPercent = (startT / TOTAL_VIDEO_DURATION) * 100;
              return (
                <div
                  key={s.id}
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-950/80 pointer-events-none"
                  style={{ left: `${posPercent}%` }}
                />
              );
            })}
          </div>

          <span className="text-xs font-mono text-slate-400 shrink-0">
            {formatTime(TOTAL_VIDEO_DURATION)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Controls: Play, Replay, Prev/Next Scene */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTogglePlay}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
              title={isPlaying ? "Tạm dừng" : "Phát"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={handleReplay}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
              title="Phát lại từ đầu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => goToScene(currentSceneIndex - 1)}
              disabled={currentSceneIndex === 0}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-all"
              title="Cảnh trước"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => goToScene(currentSceneIndex + 1)}
              disabled={currentSceneIndex === VIDEO_SCENES.length - 1}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-all"
              title="Cảnh tiếp theo"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Center Scene Quick Selector Tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {VIDEO_SCENES.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => goToScene(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  currentSceneIndex === idx
                    ? "bg-indigo-600 text-white font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Cảnh {idx + 1}
              </button>
            ))}
          </div>

          {/* Right Controls: Speed, Audio, Voiceover, Record, Fullscreen */}
          <div className="flex items-center gap-1.5">
            {/* Playback Speed */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-slate-800 text-slate-200 text-xs font-semibold px-2 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x (Chuẩn)</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>

            {/* Voiceover Speech Toggle */}
            <button
              onClick={() => {
                const next = !isVoiceoverEnabled;
                setIsVoiceoverEnabled(next);
                if (!next) voiceEngineRef.current?.stop();
                else if (isPlaying) triggerSceneAudio(currentSceneIndex);
              }}
              className={`p-2.5 rounded-xl border transition-all ${
                isVoiceoverEnabled
                  ? "bg-indigo-950/80 border-indigo-500/40 text-indigo-300"
                  : "bg-slate-800 border-slate-700 text-slate-500"
              }`}
              title={isVoiceoverEnabled ? "Tắt thuyết minh AI tiếng Việt" : "Bật thuyết minh AI tiếng Việt"}
            >
              {isVoiceoverEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-xl border transition-all ${
                isMuted
                  ? "bg-rose-950/80 border-rose-500/40 text-rose-300"
                  : "bg-slate-800 border-slate-700 text-slate-200"
              }`}
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Screen Recorder */}
            <button
              onClick={handleRecordVideo}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isRecording
                  ? "bg-rose-600 text-white border-rose-400 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
              title="Quay và tải video trực tiếp từ trình duyệt"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">{isRecording ? "Dừng & Tải" : "Ghi Video"}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
