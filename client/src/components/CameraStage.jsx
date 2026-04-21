const CameraStage = ({
  videoRef,
  onVideoLoadedMetadata,
  overlayCanvasRef,
  overlayCanvasClassName = '',
  overlayCanvasProps = {},
  children,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-black p-3">
      <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="block h-full w-full select-none object-contain bg-black"
          onLoadedMetadata={onVideoLoadedMetadata}
        />

        {overlayCanvasRef && (
          <canvas
            ref={overlayCanvasRef}
            className={`absolute inset-0 z-10 h-full w-full ${overlayCanvasClassName}`.trim()}
            {...overlayCanvasProps}
          />
        )}
      </div>

      {children}
    </div>
  );
};

export default CameraStage;
