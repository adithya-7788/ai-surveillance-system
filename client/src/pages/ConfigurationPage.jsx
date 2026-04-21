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
    mode,
    setMode,
    config,
    setConfig,
    clearAll,
    syncCanvasToVideo,
    draw,
    handleCanvasClick,
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
        entryLine: data?.entryLine ?? null,
        insideDirection: data?.insideDirection ?? null,
        restrictedZones: Array.isArray(data?.restrictedZones) ? data.restrictedZones : [],
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
        entryLine: config.entryLine,
        insideDirection: config.insideDirection,
        restrictedZones: config.restrictedZones,
      };

      const { data } = await api.post('/config', payload);

      setConfig({
        entryLine: data?.config?.entryLine ?? null,
        insideDirection: data?.config?.insideDirection ?? null,
        restrictedZones: Array.isArray(data?.config?.restrictedZones) ? data.config.restrictedZones : [],
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
          Draw one Entry/Exit line and multiple restricted zones over the live feed.
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
            onClick={() => setMode('line')}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              mode === 'line'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Draw Line
          </button>

          <button
            onClick={() => setMode('rectangle')}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              mode === 'rectangle'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Draw Rectangle
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
            onClick: handleCanvasClick,
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
            <p className="text-slate-400">Mode</p>
            <p className="font-medium text-white">{mode === 'line' ? 'Entry/Exit Line' : 'Restricted Zone'}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-slate-400">Entry Line</p>
            <p className="font-medium text-white">{config.entryLine ? 'Configured' : 'Not set'}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-slate-400">Restricted Zones</p>
            <p className="font-medium text-white">{config.restrictedZones.length}</p>
          </div>
        </div>

        {config.entryLine && !config.insideDirection && (
          <div className="mt-4 rounded-xl border border-amber-900/40 bg-amber-950/40 p-4 text-sm text-amber-200">
            Click the side of the line that should be treated as <span className="font-semibold">Inside</span>.
          </div>
        )}

        {config.entryLine && config.insideDirection && (
          <div className="mt-4 rounded-xl border border-emerald-900/40 bg-emerald-950/40 p-4 text-sm text-emerald-200">
            Inside direction is set. Click the line again only if you want to redraw it.
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPage;
