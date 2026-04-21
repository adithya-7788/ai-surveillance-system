import { useCallback, useEffect, useRef, useState } from 'react';

const clamp = (value) => Math.min(1, Math.max(0, value));

const lineSide = (point, line) => {
  const ax = line.x1;
  const ay = line.y1;
  const bx = line.x2;
  const by = line.y2;

  return (bx - ax) * (point.y - ay) - (by - ay) * (point.x - ax);
};

const normalizeRectangle = (start, end) => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return {
    x: clamp(x),
    y: clamp(y),
    width: clamp(width),
    height: clamp(height),
  };
};

const toPixelLine = (line, width, height) => ({
  x1: line.x1 * width,
  y1: line.y1 * height,
  x2: line.x2 * width,
  y2: line.y2 * height,
});

const toPixelRect = (rect, width, height) => ({
  x: rect.x * width,
  y: rect.y * height,
  width: rect.width * width,
  height: rect.height * height,
});

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

export const useConfigCanvas = (videoRef, canvasRef) => {
  const [mode, setMode] = useState('line');
  const [config, setConfig] = useState({ entryLine: null, insideDirection: null, restrictedZones: [] });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const lineStartRef = useRef(null);
  const rectStartRef = useRef(null);
  const isRectDrawingRef = useRef(false);
  const previewRectRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const viewport = getContainViewport(canvas.width, canvas.height, videoRef.current?.videoWidth, videoRef.current?.videoHeight);

    if (config.entryLine) {
      const line = toPixelLine(config.entryLine, viewport.width, viewport.height);
      const offsetLine = {
        x1: line.x1 + viewport.x,
        y1: line.y1 + viewport.y,
        x2: line.x2 + viewport.x,
        y2: line.y2 + viewport.y,
      };
      context.beginPath();
      context.moveTo(offsetLine.x1, offsetLine.y1);
      context.lineTo(offsetLine.x2, offsetLine.y2);
      context.lineWidth = 3;
      context.strokeStyle = '#0ea5e9';
      context.shadowColor = 'rgba(14, 165, 233, 0.7)';
      context.shadowBlur = 8;
      context.stroke();
      context.shadowBlur = 0;

      if (config.insideDirection) {
        const midX = (offsetLine.x1 + offsetLine.x2) / 2;
        const midY = (offsetLine.y1 + offsetLine.y2) / 2;
        const dx = offsetLine.x2 - offsetLine.x1;
        const dy = offsetLine.y2 - offsetLine.y1;
        const length = Math.hypot(dx, dy) || 1;
        const offset = 20;
        const normalX = (-dy / length) * offset;
        const normalY = (dx / length) * offset;
        const labelX = config.insideDirection === 'positive' ? midX + normalX : midX - normalX;
        const labelY = config.insideDirection === 'positive' ? midY + normalY : midY - normalY;

        context.beginPath();
        context.fillStyle = '#22c55e';
        context.arc(labelX, labelY, 6, 0, Math.PI * 2);
        context.fill();

        context.font = '12px Inter, system-ui, sans-serif';
        context.fillStyle = '#bbf7d0';
        context.fillText('Inside', labelX + 10, labelY + 4);
      }
    }

    config.restrictedZones.forEach((zone) => {
      const rect = toPixelRect(zone, viewport.width, viewport.height);
      context.fillStyle = 'rgba(239, 68, 68, 0.22)';
      context.strokeStyle = '#ef4444';
      context.lineWidth = 2;
      context.fillRect(rect.x + viewport.x, rect.y + viewport.y, rect.width, rect.height);
      context.strokeRect(rect.x + viewport.x, rect.y + viewport.y, rect.width, rect.height);
    });

    if (previewRectRef.current) {
      const preview = toPixelRect(previewRectRef.current, viewport.width, viewport.height);
      context.fillStyle = 'rgba(59, 130, 246, 0.15)';
      context.strokeStyle = '#3b82f6';
      context.lineWidth = 2;
      context.setLineDash([6, 4]);
      context.fillRect(preview.x + viewport.x, preview.y + viewport.y, preview.width, preview.height);
      context.strokeRect(preview.x + viewport.x, preview.y + viewport.y, preview.width, preview.height);
      context.setLineDash([]);
    }
  }, [canvasRef, config]);

  const syncCanvasToVideo = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const { width, height } = video.getBoundingClientRect();
    const nextWidth = Math.max(0, Math.round(width));
    const nextHeight = Math.max(0, Math.round(height));

    if (nextWidth === 0 || nextHeight === 0) return;

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      setCanvasSize({ width: nextWidth, height: nextHeight });
    }
  }, [canvasRef, videoRef]);

  const toRelativePoint = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

      const rect = canvas.getBoundingClientRect();
      const viewport = getContainViewport(rect.width, rect.height, videoRef.current?.videoWidth, videoRef.current?.videoHeight);
      const localX = event.clientX - rect.left - viewport.x;
      const localY = event.clientY - rect.top - viewport.y;

      if (localX < 0 || localY < 0 || localX > viewport.width || localY > viewport.height) {
        return null;
      }

      const x = clamp(localX / viewport.width);
      const y = clamp(localY / viewport.height);

      return { x, y };
    },
    [canvasRef]
  );

  const clearAll = useCallback(() => {
    lineStartRef.current = null;
    rectStartRef.current = null;
    isRectDrawingRef.current = false;
    previewRectRef.current = null;
    setConfig({ entryLine: null, insideDirection: null, restrictedZones: [] });
  }, []);

  const handleCanvasClick = useCallback(
    (event) => {
      if (mode !== 'line') return;

      const point = toRelativePoint(event);
      if (!point) return;

      if (config.entryLine && !config.insideDirection) {
        const side = lineSide(point, config.entryLine);
        if (Math.abs(side) <= 0.003) {
          return;
        }

        setConfig((prev) => ({
          ...prev,
          insideDirection: side > 0 ? 'positive' : 'negative',
        }));
        return;
      }

      if (!lineStartRef.current) {
        lineStartRef.current = point;
        return;
      }

      const start = lineStartRef.current;
      lineStartRef.current = null;

      setConfig((prev) => ({
        ...prev,
        entryLine: {
          x1: start.x,
          y1: start.y,
          x2: point.x,
          y2: point.y,
        },
        insideDirection: null,
      }));
    },
    [config.entryLine, config.insideDirection, mode, toRelativePoint]
  );

  const handleMouseDown = useCallback(
    (event) => {
      if (mode !== 'rectangle') return;

      const point = toRelativePoint(event);
      if (!point) return;

      rectStartRef.current = point;
      isRectDrawingRef.current = true;
      previewRectRef.current = null;
      draw();
    },
    [draw, mode, toRelativePoint]
  );

  const handleMouseMove = useCallback(
    (event) => {
      if (mode !== 'rectangle' || !isRectDrawingRef.current || !rectStartRef.current) return;

      const currentPoint = toRelativePoint(event);
      if (!currentPoint) return;

      previewRectRef.current = normalizeRectangle(rectStartRef.current, currentPoint);
      draw();
    },
    [draw, mode, toRelativePoint]
  );

  const finalizeRectangle = useCallback(
    (event) => {
      if (mode !== 'rectangle' || !isRectDrawingRef.current || !rectStartRef.current) return;

      const endPoint = toRelativePoint(event);

      if (endPoint) {
        const nextRect = normalizeRectangle(rectStartRef.current, endPoint);

        if (nextRect.width > 0.002 && nextRect.height > 0.002) {
          setConfig((prev) => ({
            ...prev,
            restrictedZones: [...prev.restrictedZones, nextRect],
          }));
        }
      }

      rectStartRef.current = null;
      isRectDrawingRef.current = false;
      previewRectRef.current = null;
      draw();
    },
    [draw, mode, toRelativePoint]
  );

  const cancelRectanglePreview = useCallback(() => {
    if (mode !== 'rectangle') return;

    rectStartRef.current = null;
    isRectDrawingRef.current = false;
    previewRectRef.current = null;
    draw();
  }, [draw, mode]);

  useEffect(() => {
    draw();
  }, [draw, canvasSize, mode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const handleLoadedMetadata = () => {
      syncCanvasToVideo();
      draw();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    const resizeHandler = () => {
      syncCanvasToVideo();
      draw();
    };

    window.addEventListener('resize', resizeHandler);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        syncCanvasToVideo();
        draw();
      });
      resizeObserver.observe(video);
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      window.removeEventListener('resize', resizeHandler);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [draw, syncCanvasToVideo, videoRef]);

  return {
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
    handleMouseUp: finalizeRectangle,
    handleMouseLeave: cancelRectanglePreview,
  };
};
