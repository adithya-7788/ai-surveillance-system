import { useCallback, useEffect, useRef, useState } from 'react';

const MASK_WIDTH = 160;
const MASK_HEIGHT = 90;
const DEFAULT_BRUSH_SIZE = 6;

const clamp = (value) => Math.min(1, Math.max(0, value));
const createEmptyMask = () => new Uint8Array(MASK_WIDTH * MASK_HEIGHT);

const encodeMaskData = (maskArray) => {
  let binary = '';
  for (let i = 0; i < maskArray.length; i += 1) binary += String.fromCharCode(maskArray[i]);
  return btoa(binary);
};

const decodeMaskData = (base64, width, height) => {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i) ? 1 : 0;
    return bytes.length === width * height ? bytes : null;
  } catch {
    return null;
  }
};

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

const toMaskPayload = (maskData) => ({
  width: MASK_WIDTH,
  height: MASK_HEIGHT,
  data: encodeMaskData(maskData),
});

export const useConfigCanvas = (videoRef, canvasRef) => {
  const [config, setConfigState] = useState({
    entryLine: null,
    insideDirection: null,
    restrictedZones: [],
    zoneMask: null,
    insideMask: toMaskPayload(createEmptyMask()),
    roiMask: toMaskPayload(createEmptyMask()),
  });

  const [brushMode, setBrushMode] = useState('inside'); // inside | roi | erase
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cursorPoint, setCursorPoint] = useState(null);

  const isDrawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const insideMaskRef = useRef(createEmptyMask());
  const roiMaskRef = useRef(createEmptyMask());

  const setConfig = useCallback((nextConfigOrUpdater) => {
    setConfigState((previous) => {
      const nextConfig = typeof nextConfigOrUpdater === 'function' ? nextConfigOrUpdater(previous) : nextConfigOrUpdater;
      const nextInsideMask = nextConfig?.insideMask || nextConfig?.zoneMask;
      const nextRoiMask = nextConfig?.roiMask;

      if (nextInsideMask && typeof nextInsideMask === 'object') {
        const width = Number(nextInsideMask.width) || MASK_WIDTH;
        const height = Number(nextInsideMask.height) || MASK_HEIGHT;
        const decoded = decodeMaskData(String(nextInsideMask.data || ''), width, height);
        if (decoded && width === MASK_WIDTH && height === MASK_HEIGHT) insideMaskRef.current = decoded;
      }

      if (nextRoiMask && typeof nextRoiMask === 'object') {
        const width = Number(nextRoiMask.width) || MASK_WIDTH;
        const height = Number(nextRoiMask.height) || MASK_HEIGHT;
        const decoded = decodeMaskData(String(nextRoiMask.data || ''), width, height);
        if (decoded && width === MASK_WIDTH && height === MASK_HEIGHT) roiMaskRef.current = decoded;
      }

      return {
        entryLine: null,
        insideDirection: null,
        restrictedZones: [],
        zoneMask: null,
        insideMask: toMaskPayload(insideMaskRef.current),
        roiMask: toMaskPayload(roiMaskRef.current),
      };
    });
  }, []);

  const commitMasksToConfig = useCallback(() => {
    setConfigState((prev) => ({
      ...prev,
      zoneMask: null,
      insideMask: toMaskPayload(insideMaskRef.current),
      roiMask: toMaskPayload(roiMaskRef.current),
    }));
  }, []);

  const applyBrushToMask = useCallback((maskRef, point, value) => {
    const x = Math.max(0, Math.min(MASK_WIDTH - 1, Math.floor(point.x * MASK_WIDTH)));
    const y = Math.max(0, Math.min(MASK_HEIGHT - 1, Math.floor(point.y * MASK_HEIGHT)));
    const radius = Math.max(1, Math.round(brushSize));
    const radiusSq = radius * radius;

    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy > radiusSq) continue;
        const px = x + dx;
        const py = y + dy;
        if (px < 0 || py < 0 || px >= MASK_WIDTH || py >= MASK_HEIGHT) continue;
        maskRef.current[py * MASK_WIDTH + px] = value;
      }
    }
  }, [brushSize]);

  const paintLine = useCallback((fromPoint, toPoint) => {
    const fromX = fromPoint.x * MASK_WIDTH;
    const fromY = fromPoint.y * MASK_HEIGHT;
    const toX = toPoint.x * MASK_WIDTH;
    const toY = toPoint.y * MASK_HEIGHT;

    const distance = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));
    const steps = Math.max(1, Math.ceil(distance));

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const x = clamp((fromX + (toX - fromX) * t) / MASK_WIDTH);
      const y = clamp((fromY + (toY - fromY) * t) / MASK_HEIGHT);

      if (brushMode === 'inside') {
        applyBrushToMask(insideMaskRef, { x, y }, 1);
      } else if (brushMode === 'roi') {
        applyBrushToMask(roiMaskRef, { x, y }, 1);
      } else {
        applyBrushToMask(insideMaskRef, { x, y }, 0);
        applyBrushToMask(roiMaskRef, { x, y }, 0);
      }
    }
  }, [applyBrushToMask, brushMode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const viewport = getContainViewport(canvas.width, canvas.height, videoRef.current?.videoWidth, videoRef.current?.videoHeight);
    const cellW = viewport.width / MASK_WIDTH;
    const cellH = viewport.height / MASK_HEIGHT;

    for (let y = 0; y < MASK_HEIGHT; y += 1) {
      for (let x = 0; x < MASK_WIDTH; x += 1) {
        const idx = y * MASK_WIDTH + x;
        const inInside = insideMaskRef.current[idx] === 1;
        const inRoi = roiMaskRef.current[idx] === 1;
        if (!inInside && !inRoi) continue;
        context.fillStyle = inInside && inRoi ? 'rgba(250, 204, 21, 0.34)' : inInside ? 'rgba(34, 197, 94, 0.30)' : 'rgba(239, 68, 68, 0.30)';
        context.fillRect(viewport.x + x * cellW, viewport.y + y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    if (cursorPoint) {
      context.beginPath();
      context.lineWidth = 2;
      context.strokeStyle = brushMode === 'inside' ? '#22c55e' : brushMode === 'roi' ? '#ef4444' : '#f8fafc';
      context.arc(
        viewport.x + cursorPoint.x * viewport.width,
        viewport.y + cursorPoint.y * viewport.height,
        Math.max(4, brushSize * (viewport.width / MASK_WIDTH)),
        0,
        Math.PI * 2
      );
      context.stroke();
    }
  }, [brushMode, brushSize, canvasRef, cursorPoint, videoRef]);

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

  const toRelativePoint = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const viewport = getContainViewport(rect.width, rect.height, videoRef.current?.videoWidth, videoRef.current?.videoHeight);

    const localX = event.clientX - rect.left - viewport.x;
    const localY = event.clientY - rect.top - viewport.y;
    if (localX < 0 || localY < 0 || localX > viewport.width || localY > viewport.height) return null;

    return { x: clamp(localX / viewport.width), y: clamp(localY / viewport.height) };
  }, [canvasRef, videoRef]);

  const clearInsideMask = useCallback(() => {
    insideMaskRef.current = createEmptyMask();
    commitMasksToConfig();
    draw();
  }, [commitMasksToConfig, draw]);

  const clearRoiMask = useCallback(() => {
    roiMaskRef.current = createEmptyMask();
    commitMasksToConfig();
    draw();
  }, [commitMasksToConfig, draw]);

  const clearAll = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setCursorPoint(null);
    insideMaskRef.current = createEmptyMask();
    roiMaskRef.current = createEmptyMask();
    commitMasksToConfig();
    draw();
  }, [commitMasksToConfig, draw]);

  const handleMouseDown = useCallback((event) => {
    const point = toRelativePoint(event);
    if (!point) return;
    isDrawingRef.current = true;
    lastPointRef.current = point;
    paintLine(point, point);
    commitMasksToConfig();
    draw();
  }, [commitMasksToConfig, draw, paintLine, toRelativePoint]);

  const handleMouseMove = useCallback((event) => {
    const point = toRelativePoint(event);
    if (!point) return;
    setCursorPoint(point);

    if (!isDrawingRef.current || !lastPointRef.current) {
      draw();
      return;
    }

    paintLine(lastPointRef.current, point);
    lastPointRef.current = point;
    commitMasksToConfig();
    draw();
  }, [commitMasksToConfig, draw, paintLine, toRelativePoint]);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    commitMasksToConfig();
    draw();
  }, [commitMasksToConfig, draw]);

  const handleMouseLeave = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setCursorPoint(null);
    commitMasksToConfig();
    draw();
  }, [commitMasksToConfig, draw]);

  useEffect(() => {
    draw();
  }, [draw, canvasSize, brushMode, brushSize, config.insideMask, config.roiMask]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const onLoadedMetadata = () => {
      syncCanvasToVideo();
      draw();
    };

    const onResize = () => {
      syncCanvasToVideo();
      draw();
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    window.addEventListener('resize', onResize);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(video);
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      window.removeEventListener('resize', onResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [draw, syncCanvasToVideo, videoRef]);

  return {
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
  };
};
