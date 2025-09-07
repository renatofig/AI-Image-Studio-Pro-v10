import React, { useState, useEffect, useRef } from 'react';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  initialValue: string;
  title: string;
  t: (key: string, ...args: any[]) => string;
}

const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValue,
  title,
  t,
}) => {
  const [value, setValue] = useState(initialValue);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        ref={modalRef} 
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl h-[70vh] text-slate-200 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 text-3xl hover:text-white" title={t('close')}>&times;</button>
        </header>
        <main className="p-4 flex-grow flex flex-col">
          <textarea
            className="w-full h-full bg-slate-800 border border-slate-700 rounded-md p-3 text-slate-200 focus:ring-2 focus:ring-banana-500 focus:outline-none resize-none"
            placeholder={t('describeVisionInDetail')}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </main>
        <footer className="p-4 border-t border-slate-700 flex-shrink-0 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-banana-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-banana-600 transition-colors"
          >
            {t('saveAndClose')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PromptEditorModal;
