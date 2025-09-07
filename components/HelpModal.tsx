import React, { useEffect, useRef } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string, ...args: any[]) => string;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-banana-400 border-b-2 border-slate-700 pb-2 mb-3">{title}</h3>
    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

const HelpSubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-4">
      <h4 className="font-semibold text-slate-200">{title}</h4>
      <div className="whitespace-pre-line">{children}</div>
    </div>
  );

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, t }) => {
  const modalRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
      <div 
        ref={modalRef} 
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] text-slate-200 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 id="help-modal-title" className="text-2xl font-bold">{t('helpTitle')}</h2>
          <button onClick={onClose} className="text-slate-400 text-3xl hover:text-white" aria-label={t('close')}>&times;</button>
        </header>
        <main className="p-6 flex-grow overflow-y-auto">
            <p className="mb-6 text-slate-400">{t('helpIntro')}</p>

            <HelpSection title={t('helpCreateTitle')}>
                <p>{t('helpCreateIntro')}</p>
                <HelpSubSection title={t('helpCreatePromptingTitle')}>
                    <p>{t('helpCreatePromptingContent')}</p>
                </HelpSubSection>
                <HelpSubSection title={t('helpCreatePresetsTitle')}>
                    <p>{t('helpCreatePresetsContent')}</p>
                </HelpSubSection>
                 <HelpSubSection title={t('helpCreateTypesTitle')}>
                    <p>{t('helpCreateTypesContent')}</p>
                </HelpSubSection>
            </HelpSection>

            <HelpSection title={t('helpEditTitle')}>
                <p>{t('helpEditIntro')}</p>
                <HelpSubSection title={t('helpEditFunctionsTitle')}>
                    <p>{t('helpEditFunctionsContent')}</p>
                </HelpSubSection>
                 <HelpSubSection title={t('helpEditMaskingTitle')}>
                    <p>{t('helpEditMaskingContent')}</p>
                </HelpSubSection>
                <HelpSubSection title={t('helpEditClientToolsTitle')}>
                    <p>{t('helpEditClientToolsContent')}</p>
                </HelpSubSection>
            </HelpSection>

            <HelpSection title={t('helpRenderTitle')}>
                <p>{t('helpRenderIntro')}</p>
                <HelpSubSection title={t('helpRenderInputTitle')}>
                    <p>{t('helpRenderInputContent')}</p>
                </HelpSubSection>
                <HelpSubSection title={t('helpRenderFidelityTitle')}>
                    <p>{t('helpRenderFidelityContent')}</p>
                </HelpSubSection>
                <HelpSubSection title={t('helpRenderPresetsTitle')}>
                    <p>{t('helpRenderPresetsContent')}</p>
                </HelpSubSection>
            </HelpSection>

            <HelpSection title={t('helpVideoTitle')}>
                <p>{t('helpVideoIntro')}</p>
                <HelpSubSection title={t('helpVideoImageTitle')}>
                    <p>{t('helpVideoImageContent')}</p>
                </HelpSubSection>
                <HelpSubSection title={t('helpVideoTextTitle')}>
                    <p>{t('helpVideoTextContent')}</p>
                </HelpSubSection>
            </HelpSection>

             <HelpSection title={t('helpWorkflowTitle')}>
                <HelpSubSection title={t('helpWorkflowGalleryTitle')}>
                    <p>{t('helpWorkflowGalleryContent')}</p>
                </HelpSubSection>
                 <HelpSubSection title={t('helpWorkflowHistoryTitle')}>
                    <p>{t('helpWorkflowHistoryContent')}</p>
                </HelpSubSection>
                <HelpSubSection title={t('helpWorkflowComparatorTitle')}>
                    <p>{t('helpWorkflowComparatorContent')}</p>
                </HelpSubSection>
                <HelpSubSection title={t('helpWorkflowExportTitle')}>
                    <p>{t('helpWorkflowExportContent')}</p>
                </HelpSubSection>
            </HelpSection>
        </main>
      </div>
    </div>
  );
};

export default HelpModal;