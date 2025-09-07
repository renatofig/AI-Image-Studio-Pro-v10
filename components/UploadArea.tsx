import React, { useCallback, useState } from 'react';
import { ImageFile } from '../types';

interface UploadAreaProps {
  id: string;
  imagePreview: string | null;
  setImage: (file: ImageFile | null) => void;
  title: string;
  subtitle?: string;
  t: (key: string) => string;
  isDraggingFromGallery: boolean;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const base64ToImageFile = (base64: string, filename: string = "dropped_image.png"): ImageFile => {
    // This is a simplified conversion as we can't reconstruct the original File object perfectly.
    // It's sufficient for the application's needs where the base64 is primary.
    const dummyFile = new File([], filename, { type: "image/png" });
    return { file: dummyFile, base64 };
};


const UploadArea: React.FC<UploadAreaProps> = ({ id, imagePreview, setImage, title, subtitle, t, isDraggingFromGallery }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert("O arquivo é muito grande. O limite é 10MB.");
        return;
      }
      const base64 = await fileToBase64(file);
      setImage({ file, base64 });
    }
  };
  
  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    // Handle gallery image drop
    const gallerySrc = event.dataTransfer.getData('application/x-aistudio-image-src');
    if (gallerySrc) {
        setImage(base64ToImageFile(gallerySrc));
        return;
    }
    
    // Handle file drop
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
       if (file.size > 10 * 1024 * 1024) {
        alert("O arquivo é muito grande. O limite é 10MB.");
        return;
      }
      const base64 = await fileToBase64(file);
      setImage({ file, base64 });
    }
  }, [setImage]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if the dragged item is a file or a gallery image
    if (event.dataTransfer.types.includes('Files') || event.dataTransfer.types.includes('application/x-aistudio-image-src')) {
        setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };
  
  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImage(null);
    // Also clear the file input value
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  }
  
  const borderColor = isDragOver || isDraggingFromGallery ? 'border-banana-500' : 'border-slate-700 hover:border-banana-500';

  return (
    <div
      className={`upload-area group w-full h-36 bg-slate-800 border-2 border-dashed ${borderColor} rounded-lg flex items-center justify-center text-center p-2 relative cursor-pointer transition-colors`}
      onClick={() => document.getElementById(id)?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        id={id}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      {imagePreview ? (
        <>
            <img src={`data:image/png;base64,${imagePreview}`} className="image-preview h-full w-full object-contain rounded-md" alt="Preview"/>
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                <span className="text-white font-bold text-lg">{t('changeImage')}</span>
            </div>
            <button onClick={clearImage} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-500 z-10" title={t('removeImage')}>X</button>
        </>
      ) : (
        <div className="text-slate-500">
            {isDragOver || isDraggingFromGallery ? (
                <>
                 <div className="text-4xl">✨</div>
                 <div className="font-semibold mt-2 text-banana-400">{t('dropHere')}</div>
                </>
            ) : (
                <>
                <div className="text-4xl">📁</div>
                <div className="font-semibold mt-2">{title}</div>
                {subtitle && <div className="upload-text text-xs mt-1">{subtitle}</div>}
                </>
            )}
        </div>
      )}
    </div>
  );
};

export default UploadArea;
