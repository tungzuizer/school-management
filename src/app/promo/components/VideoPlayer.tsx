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
  ListVideo,
  Sparkles,
  CheckCircle2,
  Layers,
  Film,
  Zap,
  Clock,
  Award,
  ShieldCheck,
  TrendingUp,
  Building2,
  ChevronRight,
  Info,
  Sliders,
} from "lucide-react";
import {
  VIDEO_SCENES,
  TOTAL_VIDEO_DURATION,
  REAL_VIDEO_PLAYLIST,
  RealVideoItem,
} from "./video-data";
import { soundEffects, VoiceoverEngine } from "./AudioEngine";
import Scene1TimetableAI from "./scenes/Scene1TimetableAI";
import Scene2MultiCampus from "./scenes/Scene2MultiCampus";
import Scene3AuditLocking from "./scenes/Scene3AuditLocking";
import Scene4TelemetryKpi from "./scenes/Scene4TelemetryKpi";
import Scene5GaussAnalytics from "./scenes/Scene5GaussAnalytics";
import Scene6SavingsTT15 from "./scenes/Scene6SavingsTT15";

interface VideoPlayerProps {
  onOpenScript?: () => void;
  onOpenDeck?: () => void;
}

export default function VideoPlayer({ onOpenScript, onOpenDeck }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ── Mode Switch: "interactive" (6-Scene Canvas 05:00) vs "mp4" (Real Video Streaming) ──
  const [playerMode, setPlayerMode] = useState<"mp4" | "interactive">("interactive");

  // ── Real MP4 Video Player State ──
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string>("master");
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(300);
  const [videoVolume, setVideoVolume] = useState<number>(1);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1);
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "master" | "cluster" | "role_guide" | "social_reels"
  >("all");

  // ── Interactive Cinema Canvas State ──
  const [isCanvasPlaying, setIsCanvasPlaying] = useState<boolean>(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [sceneProgress, setSceneProgress] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isCanvasMuted, setIsCanvasMuted] = useState<boolean>(false);
  const [isVoiceoverEnabled, setIsVoiceoverEnabled] = useState<boolean>(true);
  const [canvasPlaybackSpeed, setCanvasPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const voiceEngineRef = useRef<VoiceoverEngine | null>(null);

  // Current Video Object
  const currentVideoItem =
    REAL_VIDEO_PLAYLIST.find((v) => v.id === currentVideoId) || REAL_VIDEO_PLAYLIST[0];

  // Initialize Voiceover Engine
  useEffect(() => {
    voiceEngineRef.current = new VoiceoverEngine();
    return () => {
      voiceEngineRef.current?.stop();
    };
  }, []);

  // Update Mute / Voiceover settings for Canvas
  useEffect(() => {
    soundEffects.setMuted(isCanvasMuted);
    if (voiceEngineRef.current) {
      voiceEngineRef.current.enabled = isVoiceoverEnabled && !isCanvasMuted;
    }
  }, [isCanvasMuted, isVoiceoverEnabled]);

  // Current Canvas Scene Object
  const currentScene = VIDEO_SCENES[currentSceneIndex];

  // Calculate cumulative start time for scenes
  const getSceneStartTime = (index: number) => {
    let t = 0;
    for (let i = 0; i < index; i++) {
      t += VIDEO_SCENES[i].duration;
    }
    return t;
  };

  // Trigger Voiceover & Sound Effects on canvas scene enter
  const triggerSceneAudio = useCallback(
    (sceneIdx: number) => {
      soundEffects.playTransition();
      if (sceneIdx === 0) {
        setTimeout(() => soundEffects.playSuccessChime(), 1500);
      } else if (sceneIdx === 1) {
        setTimeout(() => soundEffects.playTelemetryBeep(1040), 1200);
      } else if (sceneIdx === 2) {
        setTimeout(() => soundEffects.playSuccessChime(), 2000);
      } else if (sceneIdx === 3) {
        setTimeout(() => soundEffects.playPodiumFanfare(), 2500);
      } else if (sceneIdx === 4) {
        setTimeout(() => soundEffects.playTelemetryBeep(880), 1200);
      } else if (sceneIdx === 5) {
        setTimeout(() => soundEffects.playSuccessChime(), 2000);
      }

      if (voiceEngineRef.current && isVoiceoverEnabled && !isCanvasMuted) {
        const text = VIDEO_SCENES[sceneIdx].voiceover;
        voiceEngineRef.current.speak(text);
      }
    },
    [isVoiceoverEnabled, isCanvasMuted]
  );

  // Jump to specific scene in canvas
  const goToScene = useCallback(
    (sceneIdx: number) => {
      if (sceneIdx < 0 || sceneIdx >= VIDEO_SCENES.length) return;
      setCurrentSceneIndex(sceneIdx);
      setSceneProgress(0);
      setElapsedTime(getSceneStartTime(sceneIdx));
      if (isCanvasPlaying) {
        triggerSceneAudio(sceneIdx);
      }
    },
    [isCanvasPlaying, triggerSceneAudio]
  );

  // Canvas animation frame loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      if (!isCanvasPlaying || playerMode !== "interactive") {
        lastTimestamp = now;
        return;
      }

      const delta = ((now - lastTimestamp) / 1000) * canvasPlaybackSpeed;
      lastTimestamp = now;

      setElapsedTime((prevElapsed) => {
        const newElapsed = prevElapsed + delta;

        if (newElapsed >= TOTAL_VIDEO_DURATION) {
          setIsCanvasPlaying(false);
          voiceEngineRef.current?.stop();
          return TOTAL_VIDEO_DURATION;
        }

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

    if (isCanvasPlaying && playerMode === "interactive") {
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCanvasPlaying, playerMode, canvasPlaybackSpeed, currentSceneIndex, triggerSceneAudio]);

  // ── Video Element Event Handlers ──
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration || currentVideoItem.durationSec);
      setIsVideoBuffering(false);
    }
  };

  const handleTogglePlayVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsVideoPlaying(true))
        .catch((err) => console.log("Play interrupted:", err));
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleSeekVideo = (targetSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = targetSeconds;
      setVideoCurrentTime(targetSeconds);
    }
  };

  const handleSkipVideo = (offsetSeconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoDuration, videoRef.current.currentTime + offsetSeconds));
      videoRef.current.currentTime = newTime;
      setVideoCurrentTime(newTime);
    }
  };

  const handleSelectVideoItem = (item: RealVideoItem) => {
    setCurrentVideoId(item.id);
    setIsVideoPlaying(true);
    setVideoCurrentTime(0);
    setVideoDuration(item.durationSec);
    if (videoRef.current) {
      videoRef.current.src = item.src;
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => setIsVideoPlaying(true))
        .catch(() => {});
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVideoVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsVideoMuted(newVol === 0);
    }
  };

  const handleToggleMuteVideo = () => {
    if (!videoRef.current) return;
    const nextMuted = !isVideoMuted;
    videoRef.current.muted = nextMuted;
    setIsVideoMuted(nextMuted);
    if (nextMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = videoVolume || 1;
    }
  };

  const handleSpeedChangeVideo = (speed: number) => {
    setVideoPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
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

  // Screen recording feature
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
        a.download = `School-Management-Promo-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      if (playerMode === "mp4" && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      } else {
        goToScene(0);
        setIsCanvasPlaying(true);
      }
    } catch {
      alert("Trình duyệt không cấp quyền quay màn hình hoặc thao tác bị hủy.");
      setIsRecording(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Filter playlist
  const filteredPlaylist = REAL_VIDEO_PLAYLIST.filter((v) => {
    if (selectedCategory === "all") return true;
    return v.category === selectedCategory;
  });

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full max-w-6xl mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/90 shadow-2xl shadow-indigo-950/50"
    >
      {/* ── Top Bar: Dual Playback Mode Switcher & Status ── */}
      <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 backdrop-blur-md">
        {/* Left: Mode Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => {
                setPlayerMode("mp4");
                setIsCanvasPlaying(false);
                voiceEngineRef.current?.stop();
                setVideoDuration(currentVideoItem.durationSec);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                playerMode === "mp4"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video Thực Tế (HD MP4)</span>
            </button>

            <button
              onClick={() => {
                setPlayerMode("interactive");
                if (videoRef.current) {
                  videoRef.current.pause();
                  setIsVideoPlaying(false);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                playerMode === "interactive"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cinema Canvas Tương Tác</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>1080P FULL HD</span>
          </div>
        </div>

        {/* Right: Playlist Drawer Toggle & Current Title */}
        <div className="flex items-center gap-2">
          {playerMode === "mp4" && (
            <button
              onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isPlaylistOpen
                  ? "bg-indigo-950/90 text-indigo-300 border-indigo-500/50"
                  : "bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <ListVideo className="w-4 h-4 text-indigo-400" />
              <span>Danh Sách 10 Video</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-[10px] text-indigo-200 font-mono">
                {REAL_VIDEO_PLAYLIST.length}
              </span>
            </button>
          )}

          {playerMode === "interactive" && (
            <div className="px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-xs font-bold text-indigo-300">
              Cảnh {currentSceneIndex + 1}/{VIDEO_SCENES.length}: {currentScene.badge}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Viewport Canvas (16:9 Aspect Ratio) ── */}
      <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* ── OPTION A: Native HTML5 MP4 Video Stream ── */}
        {playerMode === "mp4" && (
          <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
            <video
              ref={videoRef}
              src={currentVideoItem.src}
              poster={currentVideoItem.poster}
              className="w-full h-full object-contain"
              playsInline
              preload="metadata"
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onWaiting={() => setIsVideoBuffering(true)}
              onPlaying={() => {
                setIsVideoBuffering(false);
                setIsVideoPlaying(true);
              }}
              onPause={() => setIsVideoPlaying(false)}
              onEnded={() => setIsVideoPlaying(false)}
              onClick={handleTogglePlayVideo}
            />

            {/* Video Buffering Spinner */}
            {isVideoBuffering && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-indigo-300">Đang tải luồng video HD...</span>
                </div>
              </div>
            )}

            {/* Play Overlay Button if Paused */}
            {!isVideoPlaying && !isVideoBuffering && (
              <div
                onClick={handleTogglePlayVideo}
                className="absolute inset-0 z-20 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer group transition-all"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-400 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 transition-all transform group-hover:scale-110">
                    <Play className="w-9 h-9 fill-white translate-x-0.5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-black text-slate-100 tracking-wide uppercase bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-700 shadow-lg">
                      Phát Video: {currentVideoItem.title}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Top Video Overlay Watermark & Info */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 pointer-events-none bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/90 p-1 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-white">QLTHVN</span>
                  <span className="text-[9px] font-mono text-sky-400 bg-sky-950/80 px-1 py-0.2 rounded border border-sky-800">
                    {currentVideoItem.badge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                  {currentVideoItem.title}
                </span>
              </div>
            </div>

            {/* Top Right Video Duration Badge */}
            <div className="absolute top-4 right-4 z-20 pointer-events-none">
              <div className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-mono font-bold text-slate-300">
                ⏱ {currentVideoItem.durationStr}
              </div>
            </div>
          </div>
        )}

        {/* ── OPTION B: Interactive Cinema Canvas Walkthrough ── */}
        {playerMode === "interactive" && (
          <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
            {currentSceneIndex === 0 && <Scene1TimetableAI progress={sceneProgress} />}
            {currentSceneIndex === 1 && <Scene2MultiCampus progress={sceneProgress} />}
            {currentSceneIndex === 2 && <Scene3AuditLocking progress={sceneProgress} />}
            {currentSceneIndex === 3 && <Scene4TelemetryKpi progress={sceneProgress} />}
            {currentSceneIndex === 4 && <Scene5GaussAnalytics progress={sceneProgress} />}
            {currentSceneIndex === 5 && (
              <Scene6SavingsTT15
                progress={sceneProgress}
                onOpenScript={onOpenScript}
                onOpenDeck={onOpenDeck}
              />
            )}

            {/* Top Watermark */}
            <div className="absolute top-4 left-4 z-30 flex items-center gap-2.5 pointer-events-none">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/90 border border-indigo-400/50 p-1 flex items-center justify-center shadow-lg shadow-indigo-950/60 backdrop-blur-md">
                <img src="/logo.png" alt="QLTHVN Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider text-white drop-shadow">
                    QLTHVN
                  </span>
                  <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                    qlthvn.com
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 drop-shadow font-medium">
                  Hệ Thống Quản Lý Trường Học Thông Minh Đa Điểm Trường
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

            {/* Play Overlay Button if Canvas Paused */}
            {!isCanvasPlaying && (
              <div
                onClick={() => {
                  if (elapsedTime >= TOTAL_VIDEO_DURATION) {
                    goToScene(0);
                    setIsCanvasPlaying(true);
                    triggerSceneAudio(0);
                  } else {
                    setIsCanvasPlaying(true);
                    triggerSceneAudio(currentSceneIndex);
                  }
                }}
                className="absolute inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer group transition-all"
              >
                <div className="w-20 h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-400 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 transition-all transform group-hover:scale-110">
                  <Play className="w-9 h-9 fill-white translate-x-0.5" />
                </div>
                <span className="absolute mt-28 text-xs font-bold text-slate-200 tracking-wider uppercase bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                  Nhấn để phát Cinema Canvas
                </span>
              </div>
            )}

            {/* Subtitles Overlay Bar */}
            <div className="absolute bottom-3 inset-x-6 z-30 flex justify-center pointer-events-none">
              <div className="px-5 py-2 rounded-2xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-xl max-w-2xl text-center shadow-xl">
                <p className="text-xs md:text-sm font-semibold text-slate-100 tracking-wide leading-relaxed">
                  💬 {currentScene.shortCaption}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Slide-Over Playlist Drawer (When isPlaylistOpen = true) ── */}
        {isPlaylistOpen && playerMode === "mp4" && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 z-50 p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <ListVideo className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Kho Video Thực Tế</h3>
              </div>
              <button
                onClick={() => setIsPlaylistOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
              >
                Đóng ✕
              </button>
            </div>

            {/* Filter Categories */}
            <div className="flex items-center gap-1 my-3 overflow-x-auto pb-1 shrink-0">
              {[
                { id: "all", label: "Tất Cả" },
                { id: "master", label: "Master" },
                { id: "cluster", label: "5 Cụm Chuyên Sâu" },
                { id: "role_guide", label: "HDSD Vai Trò" },
                { id: "social_reels", label: "Reels 30s" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Video Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPlaylist.map((v, idx) => {
                const isActive = v.id === currentVideoId;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVideoItem(v)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex gap-3 ${
                      isActive
                        ? "bg-indigo-950/80 border-indigo-500/80 text-white shadow-md shadow-indigo-950"
                        : "bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700"
                    }`}
                  >
                    {/* Thumbnail / Poster */}
                    <div className="relative w-24 h-16 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                      <img
                        src={v.poster}
                        alt={v.title}
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-bold text-white">
                        {v.durationStr}
                      </span>
                      {isActive && isVideoPlaying && (
                        <div className="absolute inset-0 bg-indigo-950/60 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${v.badgeColor}`}
                          >
                            {v.categoryLabel}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs leading-snug line-clamp-2 mt-0.5 text-white">
                          {v.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        {v.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Control Bar & Timeline ── */}
      <div className="relative z-30 p-4 bg-slate-900/95 border-t border-slate-800 flex flex-col gap-3">
        {/* Scrubber Timeline */}
        <div className="relative w-full flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {formatTime(playerMode === "mp4" ? videoCurrentTime : elapsedTime)}
          </span>

          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));

              if (playerMode === "mp4") {
                handleSeekVideo(ratio * (videoDuration || currentVideoItem.durationSec));
              } else {
                const targetTime = ratio * TOTAL_VIDEO_DURATION;
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
              }
            }}
            className="relative flex-1 h-3 rounded-full bg-slate-800 cursor-pointer overflow-hidden group"
          >
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-100"
              style={{
                width: `${
                  playerMode === "mp4"
                    ? ((videoCurrentTime / (videoDuration || currentVideoItem.durationSec)) * 100)
                    : ((elapsedTime / TOTAL_VIDEO_DURATION) * 100)
                }%`,
              }}
            />

            {/* Scene Markers for interactive mode */}
            {playerMode === "interactive" &&
              VIDEO_SCENES.map((s, idx) => {
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
            {formatTime(
              playerMode === "mp4"
                ? videoDuration || currentVideoItem.durationSec
                : TOTAL_VIDEO_DURATION
            )}
          </span>
        </div>

        {/* Buttons Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Controls: Play, Replay, Prev/Next or 10s skip */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={
                playerMode === "mp4"
                  ? handleTogglePlayVideo
                  : () => {
                      if (elapsedTime >= TOTAL_VIDEO_DURATION) {
                        goToScene(0);
                        setIsCanvasPlaying(true);
                        triggerSceneAudio(0);
                      } else {
                        const next = !isCanvasPlaying;
                        setIsCanvasPlaying(next);
                        if (next) triggerSceneAudio(currentSceneIndex);
                        else voiceEngineRef.current?.stop();
                      }
                    }
              }
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
              title={
                (playerMode === "mp4" ? isVideoPlaying : isCanvasPlaying)
                  ? "Tạm dừng"
                  : "Phát video"
              }
            >
              {(playerMode === "mp4" ? isVideoPlaying : isCanvasPlaying) ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
            </button>

            {/* 10s Skip Back / Replay */}
            <button
              onClick={
                playerMode === "mp4"
                  ? () => handleSkipVideo(-10)
                  : () => {
                      goToScene(0);
                      setIsCanvasPlaying(true);
                      triggerSceneAudio(0);
                    }
              }
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs font-bold"
              title={playerMode === "mp4" ? "Tua lại 10 giây" : "Phát lại từ đầu"}
            >
              {playerMode === "mp4" ? (
                <span className="flex items-center gap-0.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px]">10s</span>
                </span>
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </button>

            {/* 10s Skip Forward / Next Scene */}
            {playerMode === "mp4" ? (
              <button
                onClick={() => handleSkipVideo(10)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs font-bold"
                title="Tua tới 10 giây"
              >
                <span className="flex items-center gap-0.5">
                  <span className="text-[10px]">+10s</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Center: Interactive Scene Tabs (When in Canvas Mode) or Video Title (When in MP4 mode) */}
          {playerMode === "interactive" ? (
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
          ) : (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">{currentVideoItem.title}</span>
            </div>
          )}

          {/* Right Controls: Speed, Volume, Voiceover, Recorder, Fullscreen */}
          <div className="flex items-center gap-1.5">
            {/* Speed Selector */}
            <select
              value={playerMode === "mp4" ? videoPlaybackSpeed : canvasPlaybackSpeed}
              onChange={(e) => {
                const spd = parseFloat(e.target.value);
                if (playerMode === "mp4") handleSpeedChangeVideo(spd);
                else setCanvasPlaybackSpeed(spd);
              }}
              className="bg-slate-800 text-slate-200 text-xs font-semibold px-2 py-2 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1.0x (Chuẩn)</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>

            {/* Voiceover Speech Toggle (Interactive mode only) */}
            {playerMode === "interactive" && (
              <button
                onClick={() => {
                  const next = !isVoiceoverEnabled;
                  setIsVoiceoverEnabled(next);
                  if (!next) voiceEngineRef.current?.stop();
                  else if (isCanvasPlaying) triggerSceneAudio(currentSceneIndex);
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
            )}

            {/* Audio Mute Toggle */}
            <button
              onClick={
                playerMode === "mp4"
                  ? handleToggleMuteVideo
                  : () => setIsCanvasMuted(!isCanvasMuted)
              }
              className={`p-2.5 rounded-xl border transition-all ${
                (playerMode === "mp4" ? isVideoMuted : isCanvasMuted)
                  ? "bg-rose-950/80 border-rose-500/40 text-rose-300"
                  : "bg-slate-800 border-slate-700 text-slate-200"
              }`}
              title={
                (playerMode === "mp4" ? isVideoMuted : isCanvasMuted)
                  ? "Bật âm thanh"
                  : "Tắt âm thanh"
              }
            >
              {(playerMode === "mp4" ? isVideoMuted : isCanvasMuted) ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
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

      {/* ── Key Highlights of Current Video (6 Quantified Strengths) ── */}
      <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${currentVideoItem.badgeColor}`}
              >
                {currentVideoItem.badge}
              </span>
              <h3 className="text-sm sm:text-base font-black text-white">
                {currentVideoItem.title}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {currentVideoItem.description}
            </p>
          </div>

          <button
            onClick={() => setIsPlaylistOpen(true)}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-300 transition-all shrink-0"
          >
            <ListVideo className="w-3.5 h-3.5" />
            <span>Chọn video khác trong 10 video</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quantified Bullet Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {currentVideoItem.keyStrengths.map((point, pIdx) => (
            <div
              key={pIdx}
              className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs text-slate-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
