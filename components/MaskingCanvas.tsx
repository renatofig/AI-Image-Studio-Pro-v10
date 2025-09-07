import React, { useRef, useEffect } from 'react';
import { MaskState } from '../types';

interface MaskingCanvasProps {
    maskState: MaskState;
    setMaskState: (updater: React.SetStateAction<MaskState>) => void;
    wrapperRef: React.RefObject<HTMLDivElement>;
}

const MaskingCanvas: React.FC<MaskingCanvasProps> = ({ maskState, setMaskState, wrapperRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number, y: number } | null>(null);

    const getCanvasAndContext = () => {
        const canvas = canvasRef.current;
        if (!canvas) return { canvas: null, ctx: null };
        const ctx = canvas.getContext('2d');
        return { canvas, ctx };
    };

    // Effect to clear canvas when mask image is set to null
    useEffect(() => {
        if (maskState.image === null) {
            const { canvas, ctx } = getCanvasAndContext();
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [maskState.image]);

    // Effect to draw existing mask onto canvas if it exists
    useEffect(() => {
        const { canvas, ctx } = getCanvasAndContext();
        if (canvas && ctx && maskState.image) {
            const image = new Image();
            image.src = `data:image/png;base64,${maskState.image}`;
            image.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            };
        }
    }, [maskState.image]);


    const getCoords = (e: MouseEvent | TouchEvent): { x: number, y: number } | null => {
        const { canvas } = getCanvasAndContext();
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (maskState.mode === 'none') return;
        const coords = getCoords(e.nativeEvent);
        if (!coords) return;
        isDrawing.current = true;
        lastPoint.current = coords;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        const { ctx } = getCanvasAndContext();
        const currentPoint = getCoords(e.nativeEvent);
        if (!ctx || !currentPoint || !lastPoint.current) return;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = maskState.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = maskState.mode === 'draw' ? 'source-over' : 'destination-out';
        
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();

        lastPoint.current = currentPoint;
    };

    const stopDrawing = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        lastPoint.current = null;
        
        const { canvas } = getCanvasAndContext();
        if (canvas) {
            const newMaskBase64 = canvas.toDataURL('image/png').split(',')[1];
            setMaskState(prev => ({...prev, image: newMaskBase64}));
        }
    };
    
    // Set canvas dimensions based on the wrapper
    useEffect(() => {
        const wrapper = wrapperRef.current;
        const canvas = canvasRef.current;
        if (wrapper && canvas) {
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    canvas.width = entry.contentRect.width;
                    canvas.height = entry.contentRect.height;
                }
            });
            resizeObserver.observe(wrapper);
            return () => resizeObserver.disconnect();
        }
    }, [wrapperRef]);
    
    return (
        <canvas
            ref={canvasRef}
            className={`absolute top-0 left-0 w-full h-full ${maskState.mode !== 'none' ? 'cursor-crosshair' : 'cursor-default'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
    );
};

export default MaskingCanvas;