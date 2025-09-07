import React, { useEffect, useRef, useState, useCallback } from 'react';
import Gallery from './Gallery';
import { GalleryImage } from '../types';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  onUseAsBase: (base64: string) => void;
  onCreateVideo: (base64: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  setIsDraggingFromGallery: (isDragging: boolean) => void;
  t: (key: string, ...args: any[]) => string;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose, t, ...galleryProps }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: window.innerWidth * 0.7, height: window.innerHeight * 0.8 });
  
  const resizeData = useRef<{
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeData.current) return;

    e.preventDefault();
    const { handle, startX, startY, startWidth, startHeight } = resizeData.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newWidth = startWidth;
    let newHeight = startHeight;

    if (handle.includes('right')) newWidth += dx;
    if (handle.includes('left')) newWidth -= dx;
    if (handle.includes('bottom')) newHeight += dy;
    if (handle.includes('top')) newHeight -= dy;
    
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.95;
    newWidth = Math.max(400, Math.min(newWidth, maxWidth));
    newHeight = Math.max(300, Math.min(newHeight, maxHeight));

    setSize({ width: newWidth, height: newHeight });
  }, []);

  const handleMouseUp = useCallback(() => {
    resizeData.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (modalRef.current) {
        resizeData.current = {
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: modalRef.current.offsetWidth,
            startHeight: modalRef.current.offsetHeight,
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Ensure listeners are cleaned up if component unmounts mid-resize
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, onClose, handleMouseMove, handleMouseUp]);


  if (!isOpen) return null;

  const handles = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
  
  const getHandleClass = (handle: string) => {
    let base = 'absolute bg-banana-500/0 hover:bg-banana-500/50 transition-colors duration-200 z-50';
    switch (handle) {
      case 'top': return `${base} h-2 top-0 left-2 right-2 cursor-ns-resize`;
      case 'bottom': return `${base} h-2 bottom-0 left-2 right-2 cursor-ns-resize`;
      case 'left': return `${base} w-2 top-2 bottom-2 left-0 cursor-ew-resize`;
      case 'right': return `${base} w-2 top-2 bottom-2 right-0 cursor-ew-resize`;
      case 'top-left': return `${base} w-4 h-4 top-0 left-0 cursor-nwse-resize`;
      case 'top-right': return `${base} w-4 h-4 top-0 right-0 cursor-nesw-resize`;
      case 'bottom-left': return `${base} w-4 h-4 bottom-0 left-0 cursor-nesw-resize`;
      case 'bottom-right': return `${base} w-4 h-4 bottom-0 right-0 cursor-nwse-resize`;
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div 
        ref={modalRef} 
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl text-slate-200 flex flex-col relative"
        style={{ width: `${size.width}px`, height: `${size.height}px`, maxWidth: '95vw', maxHeight: '95vh' }}
        onClick={e => e.stopPropagation()}
      >
        {handles.map(handle => (
          <div
            key={handle}
            className={getHandleClass(handle)}
            onMouseDown={(e) => handleResizeMouseDown(e, handle)}
          />
        ))}

        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold">{t('myCreations')}</h2>
          <button onClick={onClose} className="text-slate-400 text-3xl hover:text-white" title={t('close')}>&times;</button>
        </header>
        <main className="p-4 overflow-y-auto flex-grow">
          <Gallery {...galleryProps} t={t} />
        </main>
      </div>
    </div>
  );
};

export default GalleryModal;