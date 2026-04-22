import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useConfigCanvas } from '../hooks/useConfigCanvas';
import CameraStage from '../components/CameraStage';

const ConfigurationPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [apiStatus, setApiStatus] = useState({ type: '', message: '' });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const {
    brushMode,
    setBrushMode,
    brushSize,
    setBrushSize,
    config,
    setConfig,
    clearAll,
    clearInsideMask,
    clearRoiMask,
    syncCanvasToVideo,
    draw,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useConfigCanvas(videoRef, canvasRef);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      syncCanvasToVideo();
      draw();
      setIsCameraOn(true);
    } catch {
      setCameraError('Unable to access webcam. Please allow camera permissions and try again.');
      setIsCameraOn(false);
    }
  }, [draw, syncCanvasToVideo]);

  const loadConfig = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const { data } = await api.get('/config');
      setConfig({
        entryLine: null,
        insideDirection: null,
        restrictedZones: [],
        zoneMask: null,
        insideMask: data?.insideMask ?? data?.zoneMask ?? null,
        roiMask: data?.roiMask ?? null,
      });
    } catch (error) {
      setApiStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to load saved configuration.',
      });
    } finally {
      setLoadingConfig(false);
    }
  }, [setConfig]);

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      setApiStatus({ type: '', message: '' });

      const payload = {
        entryLine: null,
        insideDirection: null,
        restrictedZones: [],
        zoneMask: null,
        insideMask: config.insideMask,
        roiMask: config.roiMask,
      };

      const { data } = await api.post('/config', payload);

      setConfig({
        entryLine: null,
        insideDirection: null,
        restrictedZones: [],
        zoneMask: null,
        insideMask: data?.config?.insideMask ?? data?.config?.zoneMask ?? null,
        roiMask: data?.config?.roiMask ?? null,
      });

      setApiStatus({ type: 'success', message: 'Configuration saved successfully.' });
    } catch (error) {
      setApiStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save configuration.',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleClearAll = () => {
    clearAll();
    setApiStatus({ type: '', message: '' });
  };

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Configuration Mode</h2>
        <p className="mt-1 text-slate-400">
          Paint two zone types: Inside Zone (green) for entry/exit and ROI Zone (red) for suspicious activity.
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

          <button
            onClick={() => setBrushMode('inside')}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              brushMode === 'inside'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Paint Inside Zone
          </button>

          <button
            onClick={() => setBrushMode('roi')}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              brushMode === 'roi' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Paint ROI Zone
          </button>

          <button
            onClick={() => setBrushMode('erase')}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              brushMode === 'erase'
                ? 'bg-slate-500 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Erase Zone
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
            <span className="text-xs text-slate-400">Brush</span>
            <input
              type="range"
              min={2}
              max={16}
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
              className="h-2 w-28 accent-sky-500"
            />
            <span className="w-6 text-xs text-slate-200">{brushSize}</span>
          </div>

          <button
            onClick={clearInsideMask}
            className="rounded-xl bg-emerald-900/70 px-4 py-2 font-medium text-emerald-100 transition hover:bg-emerald-800"
          >
            Clear Inside Zone
          </button>

          <button
            onClick={clearRoiMask}
            className="rounded-xl bg-rose-900/70 px-4 py-2 font-medium text-rose-100 transition hover:bg-rose-800"
          >
            Clear ROI Zones
          </button>

          <button
            onClick={handleClearAll}
            className="rounded-xl bg-slate-800 px-4 py-2 font-medium text-slate-100 transition hover:bg-slate-700"
          >
            Clear All
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-500 disabled:opacity-60"
          >
            {savingConfig ? 'Saving...' : 'Save Config'}
          </button>
        </div>

        {cameraError && <p className="mb-3 text-sm text-red-400">{cameraError}</p>}

        {apiStatus.message && (
          <p className={`mb-3 text-sm ${apiStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {apiStatus.message}
          </p>
        )}

        {loadingConfig && <p className="mb-3 text-sm text-slate-400">Loading existing configuration...</p>}

        <CameraStage
          videoRef={videoRef}
          overlayCanvasRef={canvasRef}
          overlayCanvasClassName="cursor-crosshair"
          overlayCanvasProps={{
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseLeave,
          }}
          onVideoLoadedMetadata={() => {
            syncCanvasToVideo();
            draw();
          }}
        />

        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-slate-400">Brush Mode</p>
            <p className="font-medium text-white">
              {brushMode === 'inside'
                ? 'Painting Inside Zone'
                : brushMode === 'roi'
                  ? 'Painting ROI Zone'
                  : 'Erasing Both Zones'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-slate-400">Inside Zone</p>
            <p className="font-medium text-white">{config.insideMask ? 'Configured' : 'Empty'}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-slate-400">ROI Zone</p>
            <p className="font-medium text-white">{config.roiMask ? 'Configured' : 'Empty'}</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
          Mask Resolution: {config.insideMask?.width || config.roiMask?.width || 0} ×{' '}
          {config.insideMask?.height || config.roiMask?.height || 0}
        </div>

        <div className="mt-4 rounded-xl border border-sky-900/40 bg-sky-950/30 p-4 text-sm text-sky-200">
          Green = <span className="font-semibold">Inside Zone</span> (entry/exit). Red =
          <span className="font-semibold"> ROI Zone</span> (suspicious activity). Erase removes from both zones.
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;
