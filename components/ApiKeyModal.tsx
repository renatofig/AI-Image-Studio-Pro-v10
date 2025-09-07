
import React, { useState, useEffect, useRef } from 'react';

const useFocusTrap = (ref: React.RefObject<HTMLElement>, isOpen: boolean) => {
    useEffect(() => {
        if (!isOpen || !ref.current) return;

        const focusableElements = ref.current.querySelectorAll<HTMLElement>(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        const currentRef = ref.current;
        currentRef.addEventListener('keydown', handleTabKey);
        firstElement?.focus();

        return () => currentRef?.removeEventListener('keydown', handleTabKey);
    }, [isOpen, ref]);
};


interface ApiKeyModalProps {
  isOpen: boolean;
  onSubmit: (key: string) => void;
  t: (key: string, ...args: any[]) => string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSubmit, t }) => {
    const [key, setKey] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            onSubmit(key.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 max-w-md w-full text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-banana-400 mb-2">{t('apiKeyTitle')}</h2>
                <p className="text-slate-400 mb-6">{t('apiKeyDescription')}</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        ref={inputRef}
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder={t('apiKeyPlaceholder')}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-slate-200 focus:ring-2 focus:ring-banana-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="w-full bg-banana-500 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-banana-600 transition-colors"
                    >
                        {t('saveKey')}
                    </button>
                </form>
                 <p className="text-xs text-slate-400 mt-6 text-center">
                    {t('apiKeyDisclaimer')}{' '}
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-banana-400 hover:underline"
                    >
                        {t('getYourKey')}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default ApiKeyModal;
    