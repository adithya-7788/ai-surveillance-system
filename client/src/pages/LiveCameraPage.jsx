import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useVision } from '../context/VisionContext';
import CameraStage from '../components/CameraStage';
import { getAlertBadge, getAlertMetadata } from '../utils/alertUtils';

const TARGET_PROCESS_INTERVAL_MS = 90; // ~11 FPS
const MIN_LOOP_DELAY_MS = 10;

const getContainViewport = (containerWidth, containerHeight, frameWidth, frameHeight) => {
  if (!containerWidth || !containerHeight || !frameWidth || !frameHeight) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const containerRatio = containerWidth / containerHeight;
  const frameRatio = frameWidth / frameHeight;

  if (frameRatio > containerRatio) {
    const width = containerWidth;
    const height = width / frameRatio;
    return { x: 0, y: (containerHeight - height) / 2, width, height };
  }

  const height = containerHeight;
  const width = height * frameRatio;
  return { x: (containerWidth - width) / 2, y: 0, width, height };
};

const LiveCameraPage = () => {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopTimeoutRef = useRef(null);
  const inFlightRef = useRef(false);
  const loopRunningRef = useRef(false);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [detections, setDetections] = useState([]);

  const { stats, activeAlerts, updateFromFrame } = useVision();

  const drawDetections = useCallback((items) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = video.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    const frameWidth = video.videoWidth;
    const frameHeight = video.videoHeight;
    const viewport = getContainViewport(width, height, frameWidth, frameHeight);

    items.forEach((det) => {
      const x = viewport.x + det.x * viewport.width;
      const y = viewport.y + det.y * viewport.height;
      const w = det.w * viewport.width;
      const h = det.h * viewport.height;

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0ea5e9';
      ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);

      const label = `ID ${det.id}`;
      ctx.font = '12px Inter, system-ui, sans-serif';
      const textWidth = ctx.measureText(label).width + 10;
      const textX = x;
      const textY = Math.max(16, y - 6);

      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(textX, textY - 14, textWidth, 16);
      ctx.fillStyle = '#020617';
      ctx.fillText(label, textX + 5, textY - 2);
    });
  }, []);

  const stopFrameLoop = useCallback(() => {
    loopRunningRef.current = false;
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    inFlightRef.current = false;
    setProcessing(false);
  }, []);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !captureCanvasRef.current || inFlightRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      return;
    }

    inFlightRef.current = true;
    const startedAt = performance.now();

    try {
      const captureCanvas = captureCanvasRef.current;
      const captureCtx = captureCanvas.getContext('2d');
      if (!captureCtx) return;

      const targetWidth = 576;
      const targetHeight = Math.max(360, Math.round((video.videoHeight / video.videoWidth) * targetWidth));

      captureCanvas.width = targetWidth;
      captureCanvas.height = targetHeight;
      captureCtx.drawImage(video, 0, 0, targetWidth, targetHeight);

      const image = captureCanvas.toDataURL('image/jpeg', 0.7);

      const { data } = await api.post('/vision/frame', { image });
      const nextDetections = Array.isArray(data?.detections) ? data.detections : [];

      setDetections(nextDetections);
      updateFromFrame(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'AI processing failed. Check vision service status.');
    } finally {
      const elapsed = performance.now() - startedAt;
      const nextDelay = Math.max(MIN_LOOP_DELAY_MS, TARGET_PROCESS_INTERVAL_MS - Math.round(elapsed));
      inFlightRef.current = false;

      if (loopRunningRef.current) {
        loopTimeoutRef.current = setTimeout(() => {
          processFrame();
        }, nextDelay);
      }
    }
  }, [updateFromFrame]);

  const startCamera = async () => {
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
      setProcessing(true);

      stopFrameLoop();
      loopRunningRef.current = true;
      processFrame();
    } catch {
      setError('Unable to access camera. Please allow webcam permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    stopFrameLoop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
    setDetections([]);
    drawDetections([]);
  }, [drawDetections, stopFrameLoop]);

  // Future integration hook:
  // Capture and send frames from videoRef.current to backend for AI model processing.

  useEffect(() => {
    drawDetections(detections);
  }, [detections, drawDetections]);

  useEffect(() => {
    const onResize = () => drawDetections(detections);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [detections, drawDetections]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Live Camera</h2>
        <p className="mt-1 text-slate-400">
          Stream webcam frames to AI service at ~10–12 FPS with controlled sampling for stable tracking and counting.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={startCamera}
            disabled={isCameraOn}
            className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            Start Camera
          </button>
          <button
            onClick={stopCamera}
            disabled={!isCameraOn}
            className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
          >
            Stop Camera
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Total Entries</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.entries}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Total Exits</p>
            <p className="text-2xl font-bold text-amber-400">{stats.exits}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Current People</p>
            <p className="text-2xl font-bold text-brand-300">{stats.current}</p>
          </div>
        </div>

        <CameraStage
          videoRef={videoRef}
          overlayCanvasRef={overlayCanvasRef}
          overlayCanvasClassName="pointer-events-none"
          onVideoLoadedMetadata={() => drawDetections(detections)}
        >
          <canvas ref={captureCanvasRef} className="hidden" />
        </CameraStage>

        <p className="mt-3 text-xs text-slate-400">
          {processing ? 'Processing live stream...' : 'AI service idle'} · Tracking {detections.length} person(s)
        </p>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Live Alerts</h3>
            <span className="text-xs text-slate-400">Real-time</span>
          </div>

          <div className="mt-3 space-y-2">
            {activeAlerts.length === 0 ? (
              <p className="text-sm text-slate-400">No recent alerts.</p>
            ) : (
              activeAlerts.slice(0, 3).map((alert) => {
                const badge = getAlertBadge(alert.type, alert.status);
                const metadata = getAlertMetadata(alert);

                return (
                  <div key={alert.id} className={`rounded-xl border border-slate-800 bg-slate-900 p-3 ${alert.status === 'resolved' ? 'opacity-80' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">{alert.time}</p>
                        <p className="text-sm font-medium text-white">{alert.title}</p>
                        {metadata && <p className="text-xs text-slate-400">{metadata}</p>}
                        {alert.objectType && <p className="text-xs text-slate-500">Object: {alert.objectType}</p>}
                      </div>
                      <span
                        className={`ml-2 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${badge.bgColor} ${badge.textColor}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCameraPage;
