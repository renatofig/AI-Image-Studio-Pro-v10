import React, { useMemo, useState } from 'react';
import { GalleryImage } from '../types';

interface GalleryProps {
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

const Gallery: React.FC<GalleryProps> = ({ images, onUseAsBase, onCreateVideo, onToggleFavorite, onDelete, onDeleteAll, searchQuery, onSearchChange, setIsDraggingFromGallery, t }) => {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'favorites'>('newest');

  const filteredImages = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return images;
    }
    const searchTerms = trimmedQuery.toLowerCase().split(' ').filter(term => term);
    return images.filter(img => {
      const prompt = img.prompt?.toLowerCase() || '';
      return searchTerms.every(term => prompt.includes(term));
    });
  }, [images, searchQuery]);

  const sortedImages = useMemo(() => {
    return [...filteredImages].sort((a, b) => {
      if (sortBy === 'favorites') {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.createdAt - a.createdAt; // Secondary sort by newest
      }
      if (sortBy === 'oldest') {
        return a.createdAt - b.createdAt;
      }
      // Default: newest
      return b.createdAt - a.createdAt;
    });
  }, [filteredImages, sortBy]);
  
  const handleUseAsBaseClick = (e: React.MouseEvent, src: string) => {
    e.stopPropagation();
    onUseAsBase(src);
  };
  
  const handleCreateVideoClick = (e: React.MouseEvent, src: string) => {
    e.stopPropagation();
    onCreateVideo(src);
  };

  const handleFavoriteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleFavorite(id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // No confirmation for single delete, user can undo.
    onDelete(id);
  };

  const handleDragStart = (e: React.DragEvent, src: string) => {
    e.dataTransfer.setData('application/x-aistudio-image-src', src);
    e.dataTransfer.effectAllowed = 'copy';
    setIsDraggingFromGallery(true);
  };
  
  const handleDragEnd = () => {
    setIsDraggingFromGallery(false);
  };


  const SortButton = ({ value, children }: { value: typeof sortBy, children: React.ReactNode }) => (
    <button
      onClick={() => setSortBy(value)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortBy === value ? 'bg-banana-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <div className="flex-shrink-0">
          <p className="text-slate-400">{t('galleryDescription')}</p>
        </div>
        <div className="flex-grow max-w-md min-w-[200px]">
          <input 
            type="search"
            placeholder={t('searchByPrompt')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-banana-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-sm font-medium">{t('sortBy')}</span>
          <SortButton value="newest">{t('sortNewest')}</SortButton>
          <SortButton value="oldest">{t('sortOldest')}</SortButton>
          <SortButton value="favorites">{t('sortFavorites')}</SortButton>
          <button
            onClick={onDeleteAll}
            className="p-2 rounded-md text-lg font-medium transition-colors bg-slate-700 text-red-400 hover:bg-red-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('clearGallery')}
            disabled={images.length === 0}
          >
            🗑️
          </button>
        </div>
      </div>

      {sortedImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedImages.map((img) => (
              <div 
                key={img.id}
                className="gallery-item group relative rounded-lg overflow-hidden aspect-square"
                title={img.prompt}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, img.src)}
                onDragEnd={handleDragEnd}
              >
                <img
                  src={`data:image/png;base64,${img.src}`}
                  alt={img.prompt || `Generated image at ${img.createdAt}`}
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={(e) => handleUseAsBaseClick(e, img.src)}
                />
                {img.isFavorite && (
                  <div className="absolute top-1.5 left-1.5 text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-xl" title={t('favorite')}>
                    ⭐
                  </div>
                )}
                <div className="absolute top-1 right-1 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                      onClick={(e) => handleUseAsBaseClick(e, img.src)}
                      className="bg-banana-500/90 text-slate-900 rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors hover:bg-banana-400"
                      title={t('useAsBaseForAI')}
                  >
                      ✏️
                  </button>
                   <button
                      onClick={(e) => handleCreateVideoClick(e, img.src)}
                      className="bg-purple-600/90 text-white rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors hover:bg-purple-500"
                      title={t('createVideo')}
                  >
                      🎬
                  </button>
                  <button
                    onClick={(e) => handleFavoriteClick(e, img.id)}
                    className={`bg-slate-700/80 rounded-full w-7 h-7 flex items-center justify-center text-lg font-bold transition-colors ${img.isFavorite ? 'text-yellow-400' : 'text-white hover:text-yellow-300'}`}
                    title={img.isFavorite ? t('removeFavorite') : t('addFavorite')}
                  >
                    ★
                  </button>
                   <button
                      onClick={(e) => handleDeleteClick(e, img.id)}
                      className="bg-red-600/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors hover:bg-red-500"
                      title={t('delete')}
                  >
                      X
                  </button>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">
          <p>{t('noImagesFound')}</p>
        </div>
      )}
    </div>
  );
};

export default Gallery;