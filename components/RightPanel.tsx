import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppMode, EditFunction } from '../types';
import { TextOverlayState, CropState, MaskState } from '../types';
import MaskingCanvas from './MaskingCanvas';

// --- Draggable Text Component ---
interface DraggableTextProps {
  textOverlay: TextOverlayState;
  setTextOverlay: React.Dispatch<React.SetStateAction<TextOverlayState>>;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableText: React.FC<DraggableTextProps> = React.memo(({ textOverlay, setTextOverlay, containerRef }) => {
    const [isDragging, setIsDragging] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ x: 0, y: 0, textX: 0, textY: 0 });

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setTextOverlay(prev => ({ ...prev, text: '' }));
    };

    const handleDragStart = (clientX: number, clientY: number) => {
        if (!containerRef.current || !textRef.current) return;
        setIsDragging(true);

        const containerRect = containerRef.current.getBoundingClientRect();
        const textRect = textRef.current.getBoundingClientRect();

        dragStartPos.current = {
            x: clientX,
            y: clientY,
            textX: textRect.left - containerRect.left,
            textY: textRect.top - containerRect.top,
        };
    };
    
    const onMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX, e.clientY);
    };

    const onTouchStart = (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleDragMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const dx = clientX - dragStartPos.current.x;
        const dy = clientY - dragStartPos.current.y;
        
        const newX = dragStartPos.current.textX + dx;
        const newY = dragStartPos.current.textY + dy;
        
        const newXPercent = Math.max(0, Math.min(100, (newX / containerRect.width) * 100));
        const newYPercent = Math.max(0, Math.min(100, (newY / containerRect.height) * 100));

        setTextOverlay(prev => ({ ...prev, x: newXPercent, y: newYPercent }));
    }, [isDragging, containerRef, setTextOverlay]);
    
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', onTouchMove);
            window.addEventListener('touchend', handleDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    const fontSize = containerRef.current ? (textOverlay.size / 100) * containerRef.current.offsetWidth : '24px';

    return (
        <div
            ref={textRef}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="absolute p-2 cursor-move select-none group/text border-2 border-dashed border-blue-500 rounded-md bg-black/40 shadow-lg"
            style={{
                left: `${textOverlay.x}%`,
                top: `${textOverlay.y}%`,
                transform: 'translate(-50%, -50%)',
                color: textOverlay.color,
                fontSize: `${fontSize}px`,
                fontFamily: textOverlay.font,
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap',
                pointerEvents: 'auto',
            }}
        >
            {textOverlay.text}
             <button
                onClick={handleDelete}
                onMouseDown={e => e.stopPropagation()} // Prevent drag from starting
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover/text:opacity-100 transition-opacity"
                title="Remover texto"
            >
                &times;
            </button>
        </div>
    );
});

// --- Crop Box Component ---
interface CropBoxProps {
    cropState: CropState;
    setCropState: React.Dispatch<React.SetStateAction<CropState>>;
    containerRef: React.RefObject<HTMLDivElement>;
}

const CropBox: React.FC<CropBoxProps> = ({ cropState, setCropState, containerRef }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const dragStart = useRef({ mouseX: 0, mouseY: 0, ...cropState });

    const handleMouseDown = (e: React.MouseEvent, handle: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setResizeHandle(handle);
        setIsDragging(!handle); 
        dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, ...cropState };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const dx = ((e.clientX - dragStart.current.mouseX) / rect.width) * 100;
        const dy = ((e.clientY - dragStart.current.mouseY) / rect.height) * 100;

        let { x, y, width, height } = dragStart.current;

        if (isDragging) { // Move
            x += dx;
            y += dy;
        } else if (resizeHandle) { // Resize
            if (resizeHandle.includes('right')) width += dx;
            if (resizeHandle.includes('left')) { width -= dx; x += dx; }
            if (resizeHandle.includes('bottom')) height += dy;
            if (resizeHandle.includes('top')) { height -= dy; y += dy; }
        }

        // Clamp values to stay within bounds [0, 100]
        width = Math.max(5, Math.min(100, width));
        height = Math.max(5, Math.min(100, height));
        
        x = Math.max(0, Math.min(100 - width, x));
        y = Math.max(0, Math.min(100 - height, y));


        setCropState({ x, y, width, height });
    }, [isDragging, resizeHandle, containerRef, setCropState]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setResizeHandle(null);
    }, []);

    useEffect(() => {
        if (isDragging || resizeHandle) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, resizeHandle, handleMouseMove, handleMouseUp]);

    const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'];

    return (
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        >
            <div
                onMouseDown={(e) => handleMouseDown(e, null)}
                className="absolute border-4 border-dashed border-white cursor-move pointer-events-auto"
                style={{
                    left: `${cropState.x}%`,
                    top: `${cropState.y}%`,
                    width: `${cropState.width}%`,
                    height: `${cropState.height}%`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                }}
            >
                {handles.map(handle => (
                    <div
                        key={handle}
                        onMouseDown={(e) => handleMouseDown(e, handle)}
                        className={`absolute w-3 h-3 bg-white rounded-full border-2 border-blue-500 ${
                            handle.includes('left') ? '-left-1.5' : ''
                        } ${handle.includes('right') ? '-right-1.5' : ''} ${
                            handle.includes('top') ? '-top-1.5' : ''
                        } ${handle.includes('bottom') ? '-bottom-1.5' : ''} ${
                            !handle.includes('-') && (handle === 'top' || handle === 'bottom') ? 'left-1/2 -translate-x-1/2' : ''
                        } ${
                            !handle.includes('-') && (handle === 'left' || handle === 'right') ? 'top-1/2 -translate-y-1/2' : ''
                        } ${handle.includes('-') ? '' : (handle === 'top' || handle === 'bottom' ? 'cursor-ns-resize' : 'cursor-ew-resize')}
                        ${(handle === 'top-left' || handle === 'bottom-right') ? 'cursor-nwse-resize' : ''}
                        ${(handle === 'top-right' || handle === 'bottom-left') ? 'cursor-nesw-resize' : ''}
                        `}
                    />
                ))}
            </div>
        </div>
    );
};


// --- Image Comparator Component ---
interface ImageComparatorProps {
  beforeSrc: string;
  afterSrc: string;
}

const ImageComparator: React.FC<ImageComparatorProps> = React.memo(({ beforeSrc, afterSrc }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [aspectRatio, setAspectRatio] = useState('1 / 1');
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const afterImgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const img = afterImgRef.current;
        const updateAspectRatio = () => {
            if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
                setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
            }
        };
        if (img?.complete) {
            updateAspectRatio();
        } else if (img) {
            img.onload = updateAspectRatio;
        }
    }, [afterSrc]);

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDragging.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        moveSlider(clientX);
    };

    const moveSlider = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPosition(percent);
    };

    useEffect(() => {
        const handleInteractionMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging.current) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            moveSlider(clientX);
        };

        const handleInteractionEnd = () => {
            isDragging.current = false;
        };

        window.addEventListener('mousemove', handleInteractionMove);
        window.addEventListener('touchmove', handleInteractionMove);
        window.addEventListener('mouseup', handleInteractionEnd);
        window.addEventListener('touchend', handleInteractionEnd);

        return () => {
            window.removeEventListener('mousemove', handleInteractionMove);
            window.removeEventListener('touchmove', handleInteractionMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative max-w-full max-h-full select-none overflow-hidden rounded-md cursor-ew-resize"
            onMouseDown={handleInteractionStart}
            onTouchStart={handleInteractionStart}
            style={{ aspectRatio }}
        >
            <img
                ref={afterImgRef}
                src={`data:image/png;base64,${afterSrc}`}
                alt="After"
                className="block w-full h-full object-contain pointer-events-none"
                loading="lazy"
            />
            <div
                className="absolute top-0 left-0 h-full w-full pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img
                    src={`data:image/png;base64,${beforeSrc}`}
                    alt="Before"
                    className="block absolute top-0 left-0 w-full h-full object-contain"
                    loading="lazy"
                />
            </div>
            <div
                className="absolute top-0 bottom-0 w-1 bg-white/70 pointer-events-none"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 bg-white/70 text-gray-900 rounded-full h-10 w-10 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            </div>
        </div>
    );
});


// --- Download Modal Component ---
interface DownloadOptions {
  scale: number;
  format: 'png' | 'jpeg';
  quality: number;
}
interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (options: DownloadOptions) => void;
  isDownloading: boolean;
  t: (key: string) => string;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onDownload, isDownloading, t }) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(90);
  const [scale, setScale] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadClick = () => {
    if (isDownloading) return;
    onDownload({ format, scale, quality });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div ref={modalRef} className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 max-w-sm w-full text-white flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('exportOptions')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-300">{t('format')}</label>
          <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-md">
            <button onClick={() => setFormat('png')} className={`p-2 rounded transition-colors ${format === 'png' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>PNG</button>
            <button onClick={() => setFormat('jpeg')} className={`p-2 rounded transition-colors ${format === 'jpeg' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>JPEG</button>
          </div>
        </div>

        {format === 'jpeg' && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex justify-between items-center">
              <label htmlFor="quality" className="font-semibold text-gray-300">{t('quality')}</label>
              <span className="text-gray-400 bg-gray-700 px-2 py-0.5 rounded-md text-sm">{quality}%</span>
            </div>
            <input 
              id="quality" 
              type="range" 
              min="10" 
              max="100" 
              step="5"
              value={quality}
              onChange={e => setQuality(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-300">{t('resolution')}</label>
          <div className="grid grid-cols-3 gap-2 bg-gray-900 p-1 rounded-md">
            {[1, 2, 4].map(s => (
              <button key={s} onClick={() => setScale(s)} className={`p-2 rounded transition-colors ${scale === s ? 'bg-blue-600' : 'hover:bg-gray-700'}`}>{s}x</button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleDownloadClick} 
          disabled={isDownloading}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center"
        >
          {isDownloading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div> : '💾'}
          {isDownloading ? t('downloading') : t('performDownload')}
        </button>
      </div>
    </div>
  );
};

const videoLoadingMessages = [
    "Aquecendo os motores de renderização...",
    "Coreografando os pixels...",
    "Compilando a animação...",
    "Adicionando os toques finais...",
    "Um momento, a magia está acontecendo...",
];

const FitScreenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );

interface RightPanelProps {
  isLoading: boolean;
  generatedImages: string[] | null;
  generatedVideoUrl: string | null;
  comparisonImage: string | null;
  error: string | null;
  onUseAsBaseForAI: (image: string) => void;
  onNewImage: () => void;
  onSave: (image: string) => void;
  onOpenGallery: () => void;
  setIsDraggingFromGallery: (isDragging: boolean) => void;
  mode: AppMode;
  editFunction: EditFunction;
  textOverlay: TextOverlayState;
  setTextOverlay: React.Dispatch<React.SetStateAction<TextOverlayState>>;
  cropState: CropState;
  setCropState: React.Dispatch<React.SetStateAction<CropState>>;
  maskState: MaskState;
  setMaskState: React.Dispatch<React.SetStateAction<MaskState>>;
  isMaskingActive: boolean;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  generationProgress: { current: number; total: number };
  prompt: string;
  showComparator: boolean;
  t: (key: string, ...args: any[]) => string;
}

export const RightPanel: React.FC<RightPanelProps> = ({ 
  isLoading, generatedImages, generatedVideoUrl, comparisonImage, error, onUseAsBaseForAI, onNewImage, onSave, onOpenGallery, setIsDraggingFromGallery,
  mode, editFunction, textOverlay, setTextOverlay, cropState, setCropState, maskState, setMaskState, isMaskingActive,
  selectedIndex, onSelectIndex, generationProgress, prompt, showComparator: showComparatorProp, t
}) => {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const toolWrapperRef = useRef<HTMLDivElement>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(videoLoadingMessages[0]);
  
  // State for zoom and pan
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [initialImageMetrics, setInitialImageMetrics] = useState({ width: 0, height: 0, initialX: 0, initialY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const currentImage = generatedImages?.[selectedIndex] ?? null;
  const hasResult = currentImage || generatedVideoUrl;
  
  const isClientSideToolActive = editFunction === EditFunction.TEXT_OVERLAY || editFunction === EditFunction.CROP;
  const showComparator = showComparatorProp && comparisonImage && currentImage && !isClientSideToolActive && !isMaskingActive;
  const showTextOverlay = mode === AppMode.EDIT && editFunction === EditFunction.TEXT_OVERLAY && textOverlay.text && currentImage;
  const showCropBox = mode === AppMode.EDIT && editFunction === EditFunction.CROP && currentImage;
  const showMaskingCanvas = mode === AppMode.EDIT && editFunction === EditFunction.ADD_REMOVE && currentImage && isMaskingActive;
  const canZoomPan = hasResult && !generatedVideoUrl && !showComparator;

  const isTransformed = canZoomPan && (transform.scale !== 1 || transform.x !== initialImageMetrics.initialX || transform.y !== initialImageMetrics.initialY);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isLoading && mode === AppMode.VIDEO) {
      intervalId = window.setInterval(() => {
        setCurrentLoadingMessage(prevMessage => {
          const currentIndex = videoLoadingMessages.indexOf(prevMessage);
          const nextIndex = (currentIndex + 1) % videoLoadingMessages.length;
          return videoLoadingMessages[nextIndex];
        });
      }, 3000);
    }
    return () => {
      clearInterval(intervalId);
      setCurrentLoadingMessage(videoLoadingMessages[0]);
    };
  }, [isLoading, mode]);


  // Effect to calculate initial image fit and reset transform on image change or container resize
  useEffect(() => {
    const img = imageRef.current;
    const container = imageContainerRef.current;

    const updateFit = () => {
        if (!img || !container || !img.complete || img.naturalWidth === 0) return;

        const cRatio = container.clientWidth / container.clientHeight;
        const iRatio = img.naturalWidth / img.naturalHeight;
        let width: number, height: number;

        if (cRatio > iRatio) {
            height = container.clientHeight;
            width = height * iRatio;
        } else {
            width = container.clientWidth;
            height = width / iRatio;
        }
        
        const left = (container.clientWidth - width) / 2;
        const top = 0; // Aligns image to the top

        setInitialImageMetrics({ width, height, initialX: left, initialY: top });
        setTransform({ scale: 1, x: left, y: top });
    };

    if (img) {
      if (img.complete) {
        updateFit();
      } else {
        img.onload = updateFit;
      }
    }

    const resizeObserver = new ResizeObserver(updateFit);
    if(container) {
      resizeObserver.observe(container);
    }

    return () => resizeObserver.disconnect();

  }, [currentImage]);

  const handleResetTransform = useCallback(() => {
    setTransform({
        scale: 1,
        x: initialImageMetrics.initialX,
        y: initialImageMetrics.initialY,
    });
  }, [initialImageMetrics]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!canZoomPan) return;
    e.preventDefault();
    if (!imageContainerRef.current) return;

    const rectContainer = imageContainerRef.current.getBoundingClientRect();
    const { scale, x, y } = transform;
    const zoomIntensity = 0.001;

    const mouseX = e.clientX - rectContainer.left;
    const mouseY = e.clientY - rectContainer.top;

    const imageX = (mouseX - x) / scale;
    const imageY = (mouseY - y) / scale;

    const newScale = Math.max(0.5, Math.min(10, scale - e.deltaY * zoomIntensity));

    const newX = mouseX - imageX * newScale;
    const newY = mouseY - imageY * newScale;

    setTransform({ scale: newScale, x: newX, y: newY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!canZoomPan || e.button !== 0) return;
      const target = e.target as HTMLElement;
      // Prevent panning when interacting with a specific tool handle inside the canvas
      if (target.closest('.draggable-text, .crop-handle, .text-delete-button')) return;
      
      e.preventDefault();
      setIsPanning(true);
      panStart.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialX: transform.x,
          initialY: transform.y,
      };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isPanning) return;
        const dx = e.clientX - panStart.current.startX;
        const dy = e.clientY - panStart.current.startY;
        setTransform(prev => ({
            ...prev,
            x: panStart.current.initialX + dx,
            y: panStart.current.initialY + dy,
        }));
    };
    const handleMouseUp = () => {
        setIsPanning(false);
    };

    if (isPanning) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isPanning]);


  const handleDownloadImage = useCallback(async (options: DownloadOptions) => {
    if (isProcessingDownload || !currentImage) return;

    setIsProcessingDownload(true);
    
    try {
        const { scale, format, quality } = options;
        const mimeType = `image/${format}`;
        const image = new Image();
        image.src = `data:image/png;base64,${currentImage}`;
        
        await new Promise<void>((resolve, reject) => {
            image.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Canvas context could not be created.'));

                    canvas.width = image.naturalWidth * scale;
                    canvas.height = image.naturalHeight * scale;
                    
                    if (format === 'jpeg') {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    
                    const dataUrl = canvas.toDataURL(mimeType, quality / 100);
                    
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `ai_image_studio_download.${format}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            image.onerror = (error) => reject(new Error(`Failed to load image for processing: ${error}`));
        });
    } catch (err) {
        console.error("Download failed:", err);
        alert(`${t('errorOccurred')}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
        setIsProcessingDownload(false);
        // Do not close the modal to allow consecutive downloads
        // setIsDownloadModalOpen(false);
    }
}, [currentImage, t, isProcessingDownload]);


  const handleDownloadVideo = () => {
    if (!generatedVideoUrl) return;
    const link = document.createElement('a');
    link.href = generatedVideoUrl;
    const randomString = Math.random().toString(36).substring(2, 15);
    link.download = `ai_video_${Date.now()}_${randomString}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleThumbnailDragStart = (e: React.DragEvent, src: string) => {
    e.dataTransfer.setData('application/x-aistudio-image-src', src);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDraggingFromGallery(true);
  };


  return (
    <>
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownloadImage}
        isDownloading={isProcessingDownload}
        t={t}
      />
      <div className="bg-gray-900 p-4 rounded-lg shadow-lg flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
        {hasResult && !isLoading && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                 {isTransformed && (
                    <button
                        onClick={handleResetTransform}
                        className="bg-gray-700/80 backdrop-blur-sm hover:bg-blue-600 text-white font-semibold p-2 rounded-lg transition-colors shadow-lg flex items-center justify-center animate-fade-in"
                        title="Fit to Screen"
                        aria-label="Fit to Screen"
                    >
                        <FitScreenIcon />
                    </button>
                )}
                <button
                    onClick={onOpenGallery}
                    className="bg-gray-700/80 backdrop-blur-sm hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg flex items-center gap-2"
                    title={`${t('myCreations')} (G)`}
                    aria-label={`${t('myCreations')} (G)`}
                >
                    <span className="text-lg">🖼️</span>
                    <span className="hidden sm:inline">{t('myCreations')}</span>
                </button>
            </div>
        )}

        {isLoading && (
          <div id="loadingContainer" className="loading-container text-center text-gray-400">
            <div className="loading-spinner w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto animate-spin"></div>
            <div className="loading-text mt-4 text-lg">
                {mode === AppMode.VIDEO 
                    ? currentLoadingMessage
                    : generationProgress.total > 1 
                        ? t('generatingImage', generationProgress.current, generationProgress.total)
                        : t('generating')}
            </div>
            {mode !== AppMode.VIDEO && prompt && (
                <div className="mt-2 text-sm text-gray-500 max-w-md mx-auto truncate">
                    <span className="font-semibold">{t('processingPrompt')}</span> "{prompt}"
                </div>
            )}
            {mode === AppMode.VIDEO && (
                <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns minutos. Por favor, aguarde.</p>
            )}
          </div>
        )}

        {!isLoading && !hasResult && (
          <div id="resultPlaceholder" className="result-placeholder text-center text-gray-500 w-full px-4">
            <div className="result-placeholder-icon text-7xl mb-4">🎨</div>
            <div className="text-xl">{t('imageWillAppear')}</div>
            {error && (
              <div className="mt-4 text-red-300 bg-red-900/50 p-4 rounded-lg border border-red-700 w-full max-w-md mx-auto">
                  <div className="flex items-center">
                      <div className="text-2xl mr-3">⚠️</div>
                      <div className="text-left">
                          <h3 className="font-bold text-red-200">{t('errorOccurred')}</h3>
                          <p className="text-sm">{error}</p>
                      </div>
                  </div>
              </div>
            )}
          </div>
        )}

        {hasResult && !isLoading && (
          <div className="flex flex-col w-full h-full">
              <div id="imageContainer" ref={imageContainerRef} className="image-container flex-grow w-full h-full group relative flex items-start justify-center overflow-hidden">
                  {generatedVideoUrl ? (
                     <video 
                        src={generatedVideoUrl} 
                        controls 
                        autoPlay 
                        loop 
                        className="max-w-full max-h-full object-contain rounded-md"
                      />
                  ) : showComparator ? (
                    <ImageComparator beforeSrc={comparisonImage as string} afterSrc={currentImage as string} />
                  ) : currentImage ? (
                    <div
                        className="absolute"
                        style={{
                            width: initialImageMetrics.width,
                            height: initialImageMetrics.height,
                            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                            transformOrigin: 'top left',
                            cursor: isPanning ? 'grabbing' : (canZoomPan && isTransformed ? 'grab' : 'default'),
                        }}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                    >
                        <img ref={imageRef} id="generatedImage" src={`data:image/png;base64,${currentImage}`} alt="Generated Art" className="generated-image w-full h-full object-contain rounded-md" loading="lazy" />
                        
                        {(showTextOverlay || showCropBox || showMaskingCanvas) && (
                            <div ref={toolWrapperRef} className="absolute top-0 left-0 w-full h-full">
                                {showTextOverlay && (
                                    <DraggableText 
                                    textOverlay={textOverlay} 
                                    setTextOverlay={setTextOverlay} 
                                    containerRef={toolWrapperRef} 
                                    />
                                )}
                                {showCropBox && (
                                    <CropBox 
                                        cropState={cropState}
                                        setCropState={setCropState}
                                        containerRef={toolWrapperRef}
                                    />
                                )}
                                {showMaskingCanvas && (
                                    <>
                                    {maskState.image && (
                                        <div
                                        className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                        style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.5)', 
                                            maskImage: `url(data:image/png;base64,${maskState.image})`,
                                            maskSize: '100% 100%',
                                            WebkitMaskImage: `url(data:image/png;base64,${maskState.image})`,
                                            WebkitMaskSize: '100% 100%',
                                        }}
                                        />
                                    )}
                                    <MaskingCanvas
                                        maskState={maskState}
                                        setMaskState={setMaskState}
                                        wrapperRef={toolWrapperRef}
                                    />
                                    </>
                                )}
                            </div>
                        )}

                        <div className="image-actions absolute bottom-4 right-4 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                            <button className="action-btn bg-gray-800/80 p-3 rounded-full text-white hover:bg-blue-600 text-lg" onClick={() => onUseAsBaseForAI(currentImage)} title={t('useAsBaseInEditor')}>✏️</button>
                            <button 
                                className="action-btn bg-gray-800/80 p-3 rounded-full text-white hover:bg-green-600" 
                                onClick={() => setIsDownloadModalOpen(true)}
                                title={t('download')}
                            >
                                💾
                            </button>
                            <button className="action-btn bg-gray-800/80 p-3 rounded-full text-white hover:bg-yellow-600" onClick={() => onSave(currentImage)} title={t('saveToGallery')}>⭐</button>
                            <button className="action-btn bg-gray-800/80 p-3 rounded-full text-white hover:bg-purple-600" onClick={onNewImage} title={t('newImage')}>✨</button>
                        </div>
                    </div>
                  ) : null}
                  
                   {generatedVideoUrl && (
                     <div className="image-actions absolute bottom-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                        <button 
                            className="action-btn bg-gray-800/80 p-3 rounded-full text-white hover:bg-green-600" 
                            onClick={handleDownloadVideo}
                            title={t('downloadVideo')}
                        >
                            💾
                        </button>
                         <button className="action-btn bg-gray-800/80 p-3 rounded-full text-white hover:bg-purple-600" onClick={onNewImage} title={t('newProject')}>✨</button>
                    </div>
                   )}
              </div>
              {generatedImages && generatedImages.length > 1 && (
                  <div className="thumbnail-strip flex justify-center gap-2 p-2 mt-2 bg-gray-900/50 rounded-b-lg overflow-x-auto">
                      {generatedImages.map((img, index) => (
                          <img 
                              key={index}
                              src={`data:image/png;base64,${img}`}
                              alt={`Thumbnail ${index + 1}`}
                              className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 transition-all ${selectedIndex === index ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-600'}`}
                              onClick={() => onSelectIndex(index)}
                              loading="lazy"
                              draggable="true"
                              onDragStart={(e) => handleThumbnailDragStart(e, img)}
                          />
                      ))}
                  </div>
              )}
          </div>
        )}
      </div>
    </>
  );
};

export default RightPanel;