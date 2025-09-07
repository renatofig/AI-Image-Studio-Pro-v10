import React, { useMemo, useState, useEffect } from 'react';
import { AppMode, CreateFunction, EditFunction, ImageFile, AspectRatio, ImageFilter, RenderInputType } from '../types';
import { AppState, MaskState, FavoritePrompt } from '../types';
import FunctionCard from './FunctionCard';
import UploadArea from './UploadArea';
import { enhancePromptApi, translatePromptApi } from '../services/geminiService';
import PromptEditorModal from './PromptEditorModal';
import TipsModal from './TipsModal';

type Language = 'pt' | 'en';

interface LeftPanelProps {
  appState: AppState;
  setAppState: (updater: React.SetStateAction<AppState> | ((prevState: AppState) => AppState)) => void;
  onModeChange: (mode: AppMode) => void;
  isLoading: boolean;
  onGenerate: () => void;
  onGenerateVideo: () => void;
  onStop: () => void;
  onApplyText: () => void;
  onApplyCrop: () => void;
  onApplyFilter: (filter: ImageFilter) => void;
  onApplyRotation: (degrees: 90 | -90) => void;
  onInvertMask: () => void;
  hasGeneratedImage: boolean;
  onNewImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onToggleComparator: () => void;
  t: (key: string, ...args: any[]) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  setIsApiKeyModalOpen: (isOpen: boolean) => void;
  setIsHelpModalOpen: (isOpen: boolean) => void;
  isDraggingFromGallery: boolean;
  setToast: (toast: { message: string; type: 'success' | 'info' } | null) => void;
  handleSetImage: (slot: 'image1' | 'image2' | 'customWatermark', file: ImageFile | null) => void;
}

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
    >
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
        <path d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z"/>
        <path d="M5 6L5.5 8L7 8.5L5.5 9L5 11L4.5 9L3 8.5L4.5 8L5 6Z"/>
    </svg>
);

const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );
  
const HelpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

const ExpandIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </svg>
);

const CompareIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M12 2a10 10 0 1 0 0 20" />
    </svg>
);


const Accordion: React.FC<{
  title: string;
  id: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ title, id, isOpen, onToggle, children }) => {
  return (
    <div className="bg-slate-800/50 p-3 rounded-lg">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex justify-between items-center text-left font-semibold text-slate-300"
        aria-expanded={isOpen}
        aria-controls={`content-${id}`}
      >
        <span>{title}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div id={`content-${id}`} className="mt-3 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};


const getStylePresets = (t: (key: string) => string) => [
  { name: t('photographic'), prompt: 'fotorealista, hiperdetalhado, 8k, qualidade profissional, photorealistic, hyperdetailed, 8k, professional quality' },
  { name: t('anime'), prompt: 'estilo anime, arte de estúdio de animação, Ghibli, key visual, anime style, animation studio art, Ghibli, key visual' },
  { name: t('fantasy'), prompt: 'arte de fantasia, pintura digital, épico, detalhado, concept art, fantasy art, digital painting, epic, detailed, concept art' },
  { name: t('cyberpunk'), prompt: 'cyberpunk, neon, futurista, cidade distópica, high-tech, cyberpunk, neon, futuristic, dystopian city, high-tech' },
  { name: t('watercolor'), prompt: 'pintura em aquarela, traços suaves, cores vibrantes, orgânico, watercolor painting, soft strokes, vibrant colors, organic' },
  { name: t('pixelArt'), prompt: 'pixel art, 16 bits, estilo de videogame retrô, isométrico, pixel art, 16-bit, retro videogame style, isometric' },
  { name: t('threeDRender'), prompt: 'renderização 3D, Octane render, cinematic, iluminação dramática, 3D render, Octane render, cinematic, dramatic lighting' },
];

const getRenderPresets = (t: (key: string) => string) => ({
  materials: [
    { name: t('wood'), prompt: t('renderPresetWood') },
    { name: t('marble'), prompt: t('renderPresetMarble') },
    { name: t('concrete'), prompt: t('renderPresetConcrete') },
    { name: t('metal'), prompt: t('renderPresetMetal') },
    { name: t('glass'), prompt: t('renderPresetGlass') },
    { name: t('mirror'), prompt: t('renderPresetMirror') },
  ],
  lighting: [
    { name: t('daylight'), prompt: t('renderPresetDaylight') },
    { name: t('sunset'), prompt: t('renderPresetSunset') },
    { name: t('night'), prompt: t('renderPresetNight') },
    { name: t('studio'), prompt: t('renderPresetStudio') },
  ],
  actions: [
    { name: t('extrudePlanPrompt'), prompt: t('renderActionExtrude'), type: RenderInputType.FLOOR_PLAN },
    { name: t('renderPrompt'), prompt: t('actionRenderModel'), type: RenderInputType.BASIC_MODEL },
    { name: t('imagePrompt'), prompt: t('renderActionRenderSketch'), type: RenderInputType.SKETCH },
  ]
});


const LeftPanel: React.FC<LeftPanelProps> = ({
  appState, setAppState, onModeChange,
  isLoading, onGenerate, onGenerateVideo, onStop, onApplyText, onApplyCrop, onApplyFilter, onApplyRotation, onInvertMask, hasGeneratedImage,
  onNewImage, onUndo, onRedo, canUndo, canRedo, onToggleComparator,
  t, language, setLanguage, setIsApiKeyModalOpen, setIsHelpModalOpen,
  isDraggingFromGallery, setToast, handleSetImage,
}) => {
  
  const { 
    mode, createFunction, editFunction, renderInputType, prompt, negativePrompt, batchSize, aspectRatio, 
    videoAspectRatio, videoIncludeAudio,
    image1, image2, addWatermark, customWatermark, textOverlay, renderFidelity, mask, ui, isMaskingActive,
    comparisonImage
  } = appState;
  
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEnhancingNegative, setIsEnhancingNegative] = useState(false);
  const [isTranslatingNegative, setIsTranslatingNegative] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<'positive' | 'negative' | null>(null);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [favoritePrompts, setFavoritePrompts] = useState<FavoritePrompt[]>([]);

  useEffect(() => {
    // Load favorites from localStorage on initial component mount
    const storedPrompts = JSON.parse(localStorage.getItem('favoritePrompts') || '[]');
    setFavoritePrompts(storedPrompts);
  }, []);

  const stylePresets = useMemo(() => getStylePresets(t), [t]);
  const renderPresets = useMemo(() => getRenderPresets(t), [t]);

  // Generic setter functions to update parts of the state
  const setCreateFunction = (fn: CreateFunction) => setAppState(s => ({ ...s, createFunction: fn }));
  const setEditFunction = (fn: EditFunction) => setAppState(s => ({ ...s, editFunction: fn, isMaskingActive: false, ui: { ...s.ui, showComparator: false } }));
  const setRenderInputType = (type: RenderInputType) => setAppState(s => ({ ...s, renderInputType: type }));
  const setPrompt = (p: React.SetStateAction<string>) => setAppState(s => ({ ...s, prompt: typeof p === 'function' ? p(s.prompt) : p }));
  const setNegativePrompt = (p: React.SetStateAction<string>) => setAppState(s => ({ ...s, negativePrompt: typeof p === 'function' ? p(s.negativePrompt) : p }));
  const setBatchSize = (size: number) => setAppState(s => ({ ...s, batchSize: size }));
  const setAspectRatio = (ratio: AspectRatio) => setAppState(s => ({ ...s, aspectRatio: ratio }));
  const setVideoAspectRatio = (ratio: AspectRatio) => setAppState(s => ({ ...s, videoAspectRatio: ratio }));
  const setVideoIncludeAudio = (include: boolean) => setAppState(s => ({ ...s, videoIncludeAudio: include }));
  const setRenderFidelity = (value: number) => setAppState(s => ({...s, renderFidelity: value}));
  const setAddWatermark = (add: boolean) => setAppState(s => ({ ...s, addWatermark: add }));
  const setMask = (updater: React.SetStateAction<MaskState>) => setAppState(s => ({ ...s, mask: typeof updater === 'function' ? updater(s.mask) : updater }));
  const setUiState = (key: keyof AppState['ui'], value: any) => setAppState(s => ({...s, ui: {...s.ui, [key]: value}}));
  const setIsMaskingActive = (isActive: boolean) => setAppState(s => ({ ...s, isMaskingActive: isActive, mask: {...s.mask, mode: 'none'} }));

  const handleOpenPromptEditor = (type: 'positive' | 'negative') => {
    setEditingPrompt(type);
  };

  const handleClosePromptEditor = () => {
      setEditingPrompt(null);
  };

  const handleSavePrompt = (newValue: string) => {
      if (editingPrompt === 'positive') {
        setPrompt(newValue);
      } else if (editingPrompt === 'negative') {
        setNegativePrompt(newValue);
      }
  };

  const handleToggleSection = (id: string) => {
    setAppState(s => ({...s, ui: {...s.ui, openSections: {...s.ui.openSections, [id]: !s.ui.openSections[id]}}}));
  }


  const isGenerateDisabled = useMemo(() => {
    if (isLoading || ui.isMasking) return true;
    if (mode === AppMode.CREATE) {
      return !prompt.trim();
    }
    if (mode === AppMode.EDIT) {
      if (!prompt.trim()) return true;
      if (editFunction === EditFunction.COMPOSE) {
        return !image1 || !image2;
      }
      return !image1;
    }
     if (mode === AppMode.RENDER) {
      return !image1 || !prompt.trim();
    }
    if (mode === AppMode.VIDEO) {
      return !image1 && !prompt.trim();
    }
    return false;
  }, [isLoading, ui.isMasking, prompt, mode, editFunction, image1, image2]);

  const handlePresetClick = (presetPrompt: string) => {
    setPrompt(prev => {
        if (!prev.trim()) return presetPrompt;
        if (prev.trim().endsWith(',')) return `${prev} ${presetPrompt}`;
        return `${prev}, ${presetPrompt}`;
    });
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing || isTranslating || isLoading) return;
    setIsEnhancing(true);
    try {
      const enhancedPrompt = await enhancePromptApi(prompt);
      setPrompt(enhancedPrompt);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao aprimorar o prompt.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleTranslatePrompt = async () => {
    if (!prompt.trim() || isTranslating || isEnhancing || isLoading) return;
    setIsTranslating(true);
    try {
      const translatedPrompt = await translatePromptApi(prompt);
      setPrompt(translatedPrompt);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao traduzir o prompt.');
    } finally {
      setIsTranslating(false);
    }
  };
  
  const handleEnhanceNegativePrompt = async () => {
    if (!negativePrompt.trim() || isEnhancingNegative || isTranslatingNegative || isLoading) return;
    setIsEnhancingNegative(true);
    try {
      const enhancedPrompt = await enhancePromptApi(negativePrompt);
      setNegativePrompt(enhancedPrompt);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao aprimorar o prompt negativo.');
    } finally {
      setIsEnhancingNegative(false);
    }
  };
  
  const handleTranslateNegativePrompt = async () => {
    if (!negativePrompt.trim() || isTranslatingNegative || isEnhancingNegative || isLoading) return;
    setIsTranslatingNegative(true);
    try {
      const translatedPrompt = await translatePromptApi(negativePrompt);
      setNegativePrompt(translatedPrompt);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao traduzir o prompt negativo.');
    } finally {
      setIsTranslatingNegative(false);
    }
  };

  const handleFavoritePrompt = (type: 'positive' | 'negative') => {
      const text = type === 'positive' ? prompt : negativePrompt;
      if (!text.trim()) return;

      const newFavorite: FavoritePrompt = {
          id: `${Date.now()}`,
          text,
          type,
          createdAt: Date.now(),
      };
      
      // Avoid duplicates
      if (favoritePrompts.some(p => p.text === text && p.type === type)) {
        setToast({ message: 'Este prompt já está nos favoritos.', type: 'info' });
        return;
      }
      
      const updatedFavorites = [newFavorite, ...favoritePrompts];
      setFavoritePrompts(updatedFavorites);
      localStorage.setItem('favoritePrompts', JSON.stringify(updatedFavorites));
      setToast({ message: t('promptSaved'), type: 'success' });
  };


  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerateDisabled) {
        if (mode === AppMode.VIDEO) {
          onGenerateVideo();
        } else {
          onGenerate();
        }
      }
    }
  };

  const showBatchSelector = useMemo(() => {
    if (mode === AppMode.CREATE) return true;
    if (mode === AppMode.RENDER) return true;
    if (mode === AppMode.EDIT) {
      return [
        EditFunction.ADD_REMOVE,
        EditFunction.RETOUCH,
        EditFunction.STYLE
      ].includes(editFunction);
    }
    return false;
  }, [mode, editFunction]);

  const batchLabel = useMemo(() => {
    if (mode === AppMode.CREATE) return t('batchSizeImage');
    if (mode === AppMode.RENDER) return t('batchSizeRender');
    return t('batchSizeVariation');
  }, [mode, t]);

  const isClientSideEdit = mode === AppMode.EDIT && (editFunction === EditFunction.TEXT_OVERLAY || editFunction === EditFunction.CROP);
  const isNegativePromptVisible = (mode === AppMode.CREATE || mode === AppMode.RENDER || mode === AppMode.VIDEO || mode === AppMode.EDIT) && !isClientSideEdit;
  
  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-6">
      {editingPrompt && <PromptEditorModal
          isOpen={!!editingPrompt}
          onClose={handleClosePromptEditor}
          onSave={handleSavePrompt}
          initialValue={editingPrompt === 'positive' ? prompt : negativePrompt}
          title={editingPrompt === 'positive' ? t('promptEditorTitle') : t('negativePromptEditorTitle')}
          t={t}
      />}
      {isTipsModalOpen && <TipsModal 
            onClose={() => setIsTipsModalOpen(false)} 
            setPrompt={setPrompt} 
            setNegativePrompt={setNegativePrompt} 
            t={t}
            language={language}
            favoritePrompts={favoritePrompts}
            setFavoritePrompts={setFavoritePrompts}
        />}
      <header className="flex justify-between items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <a href="https://bossanovainteriores.com.br/" target="_blank" rel="noopener noreferrer" aria-label="Bossa Nova Website">
              <img src="https://bossanovainteriores.com.br/Logo%20Bossa%20Nova%20small.png" alt="Bossa Nova Logo" className="h-10"/>
            </a>
            <span className="text-banana-400">AI Image Studio Pro</span>
          </h1>
          <p className="text-slate-400 mt-1">{t('panelSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button onClick={() => setIsHelpModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold p-2 rounded-lg transition-colors" title={t('helpTooltip')} aria-label={t('helpTooltip')}>
                <HelpIcon />
            </button>
            <button onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-3 rounded-lg transition-colors text-sm w-12" title={t('toggleLanguageTooltip')} aria-label={t('toggleLanguageTooltip')}>
                {language.toUpperCase()}
            </button>
            <button onClick={() => setIsApiKeyModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold p-2 rounded-lg transition-colors" title={t('changeApiKey')} aria-label={t('changeApiKey')}>
                🔑
            </button>
             <button onClick={onToggleComparator} disabled={!comparisonImage} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 font-semibold p-2 rounded-lg transition-colors" title={t('compareTooltip')} aria-label={t('compareTooltip')}>
                <CompareIcon />
            </button>
            <button onClick={() => setUiState('isHistoryPanelOpen', !ui.isHistoryPanelOpen)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold p-2 rounded-lg transition-colors" title={t('historyTooltip')} aria-label={t('historyTooltip')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </button>
            <button onClick={onUndo} disabled={!canUndo || isLoading} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 font-semibold p-2 rounded-lg transition-colors" title={t('undoTooltip')} aria-label={t('undoTooltip')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
            </button>
            <button onClick={onRedo} disabled={!canRedo || isLoading} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 font-semibold p-2 rounded-lg transition-colors" title={t('redoTooltip')} aria-label={t('redoTooltip')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"/><path d="M19.5 9H9a5.5 5.5 0 0 0-5.5 5.5v0a5.5 5.5 0 0 0 5.5 5.5h1.5"/></svg>
            </button>
            {isLoading && (
              <button onClick={onStop} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm animate-fade-in">
                {t('stop')}
              </button>
            )}
        </div>
      </header>
      
      <div className="mode-toggle grid grid-cols-4 gap-2 bg-slate-800 p-1 rounded-md">
        <button
          className={`mode-btn p-2 rounded transition-colors duration-200 ${mode === AppMode.CREATE ? 'bg-banana-500 text-slate-900 font-semibold' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
          onClick={() => onModeChange(AppMode.CREATE)}
          title={t('createModeTooltip')}
        >
          {t('create')}
        </button>
        <button
          className={`mode-btn p-2 rounded transition-colors duration-200 ${mode === AppMode.EDIT ? 'bg-banana-500 text-slate-900 font-semibold' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
          onClick={() => onModeChange(AppMode.EDIT)}
          title={t('editModeTooltip')}
        >
          {t('edit')}
        </button>
         <button
          className={`mode-btn p-2 rounded transition-colors duration-200 ${mode === AppMode.RENDER ? 'bg-banana-500 text-slate-900 font-semibold' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
          onClick={() => onModeChange(AppMode.RENDER)}
          title={t('renderModeTooltip')}
        >
          {t('render')}
        </button>
        <button
          className={`mode-btn p-2 rounded transition-colors duration-200 ${mode === AppMode.VIDEO ? 'bg-banana-500 text-slate-900 font-semibold' : 'bg-transparent text-slate-300 hover:bg-slate-700'}`}
          onClick={() => onModeChange(AppMode.VIDEO)}
          title={t('videoModeTooltip')}
        >
          {t('video')}
        </button>
      </div>

      {!isClientSideEdit && (
        <div className={`grid grid-cols-1 ${isNegativePromptVisible ? 'md:grid-cols-2' : ''} gap-4`}>
          <div className="prompt-section">
            <div className="flex justify-between items-center mb-2">
                <label htmlFor="prompt" className="font-semibold text-slate-300">
                  {mode === AppMode.VIDEO ? t('describeAnimation') : t('describeIdea')}
                </label>
                <div className="flex items-center space-x-3">
                    <button onClick={() => setIsTipsModalOpen(true)} className="text-slate-400 hover:text-banana-400 flex items-center gap-1 text-sm transition-colors">
                        <InfoIcon className="h-4 w-4" />
                        <span>{t('tips')}</span>
                    </button>
                </div>
            </div>
            <div className="relative">
              <textarea
                id="prompt"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pr-36 text-slate-200 focus:ring-2 focus:ring-banana-500 focus:outline-none transition duration-200 h-28 resize-y"
                placeholder={
                    mode === AppMode.VIDEO
                    ? t('promptPlaceholderVideo')
                    : t('promptPlaceholderImage')
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handlePromptKeyDown}
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                 <button onClick={() => handleOpenPromptEditor('positive')} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8" title={t('expand')} aria-label={t('expand')}>
                    <ExpandIcon />
                 </button>
                 <button onClick={() => handleFavoritePrompt('positive')} className="bg-slate-700 hover:bg-yellow-500 text-white font-semibold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8" title={t('favoritePrompt')} aria-label={t('favoritePrompt')}>
                    ⭐
                 </button>
                <button 
                  onClick={handleEnhancePrompt} 
                  disabled={isEnhancing || isTranslating || isLoading || !prompt.trim()}
                  className="bg-slate-700 hover:bg-purple-600 text-white font-semibold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8" 
                  title={t('enhancePrompt')} aria-label={t('enhancePrompt')}>
                  {isEnhancing ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : '✨'}
                </button>
                <button 
                  onClick={handleTranslatePrompt} 
                  disabled={isTranslating || isEnhancing || isLoading || !prompt.trim()}
                  className="bg-slate-700 hover:bg-green-600 text-white font-semibold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8" 
                  title={t('translatePrompt')} aria-label={t('translatePrompt')}>
                  {isTranslating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : '🌍'}
                </button>
              </div>
            </div>
          </div>
       
          {isNegativePromptVisible && (
            <div className="prompt-section animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="negative-prompt" className="font-semibold text-slate-300 block">{t('negativePromptLabel')}</label>
                </div>
              <div className="relative">
                <textarea
                  id="negative-prompt"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pr-36 text-slate-200 focus:ring-2 focus:ring-banana-500 focus:outline-none transition duration-200 h-28 resize-y"
                  placeholder={t('negativePromptPlaceholder')}
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                     <button onClick={() => handleOpenPromptEditor('negative')} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8" title={t('expand')} aria-label={t('expand')}>
                        <ExpandIcon />
                    </button>
                    <button onClick={() => handleFavoritePrompt('negative')} className="bg-slate-700 hover:bg-yellow-500 text-white font-semibold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8" title={t('favoritePrompt')} aria-label={t('favoritePrompt')}>
                        ⭐
                    </button>
                    <button 
                      onClick={handleEnhanceNegativePrompt} 
                      disabled={isEnhancingNegative || isTranslatingNegative || isLoading || !negativePrompt.trim()}
                      className="bg-slate-700 hover:bg-purple-600 text-white font-semibold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8" 
                      title={t('enhancePrompt')} aria-label={t('enhancePrompt')}>
                      {isEnhancingNegative ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : '✨'}
                    </button>
                    <button 
                      onClick={handleTranslateNegativePrompt} 
                      disabled={isTranslatingNegative || isEnhancingNegative || isLoading || !negativePrompt.trim()}
                      className="bg-slate-700 hover:bg-green-600 text-white font-semibold p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8" 
                      title={t('translatePrompt')} aria-label={t('translatePrompt')}>
                      {isTranslatingNegative ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : '🌍'}
                    </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {mode === AppMode.CREATE && (
        <div className="animate-fade-in flex flex-col gap-5">
            <Accordion title={t('stylePresets')} id="create_style" isOpen={ui.openSections.create_style} onToggle={handleToggleSection}>
                <div className="flex gap-2 flex-wrap">
                    {stylePresets.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => handlePresetClick(preset.prompt)}
                            className="flex-shrink-0 bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors duration-200 whitespace-nowrap"
                            title={`Add: "${preset.prompt}"`}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
            </Accordion>

            <Accordion title={t('settings')} id="create_settings" isOpen={ui.openSections.create_settings} onToggle={handleToggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="flex flex-col gap-2">
                      <label className="font-semibold text-slate-400 text-sm">{t('aspectRatio')}</label>
                      <div className="bg-slate-900/70 p-2 rounded-lg">
                        <div className="grid grid-cols-5 gap-2">
                           {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => {
                              const ratios: {[key: string]: string} = { '1:1': 'w-8 h-8', '16:9': 'w-10 h-[22.5px]', '9:16': 'w-[22.5px] h-10', '4:3': 'w-9 h-[27px]', '3:4': 'w-[27px] h-9' };
                              return (
                                <button key={ratio} onClick={() => setAspectRatio(ratio as AspectRatio)} title={ratio} className={`flex flex-col items-center justify-center rounded-lg p-1 transition-colors ${aspectRatio === ratio ? 'bg-banana-400' : 'hover:bg-slate-700'}`}>
                                    <div className={`bg-slate-600 rounded-sm ${ratios[ratio]} ${aspectRatio === ratio ? 'bg-slate-800' : ''}`} />
                                    <span className={`mt-1 text-xs font-mono ${aspectRatio === ratio ? 'text-slate-900 font-bold':'text-slate-400'}`}>{ratio}</span>
                                </button>
                              )
                           })}
                        </div>
                      </div>
                  </div>
                   {showBatchSelector && (
                    <div className="flex flex-col gap-2">
                        <label htmlFor="batchSize" className="font-semibold text-slate-400 text-sm">{batchLabel}</label>
                        <select
                        id="batchSize"
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-banana-500 focus:outline-none h-10"
                        >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        </select>
                    </div>
                  )}
              </div>
            </Accordion>
          
            <Accordion title={t('creationType')} id="create_type" isOpen={ui.openSections.create_type} onToggle={handleToggleSection}>
              <div className="functions-grid grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FunctionCard icon="✨" name={t('freePrompt')} isActive={createFunction === CreateFunction.FREE} onClick={() => setCreateFunction(CreateFunction.FREE)} />
                <FunctionCard icon="🏷️" name={t('stickers')} isActive={createFunction === CreateFunction.STICKER} onClick={() => setCreateFunction(CreateFunction.STICKER)} />
                <FunctionCard icon="📝" name={t('logo')} isActive={createFunction === CreateFunction.LOGO} onClick={() => setCreateFunction(CreateFunction.LOGO)} />
                <FunctionCard icon="💭" name={t('comic')} isActive={createFunction === CreateFunction.COMIC} onClick={() => setCreateFunction(CreateFunction.COMIC)} />
                <FunctionCard icon="✏️" name={t('sketch')} isActive={createFunction === CreateFunction.SKETCH} onClick={() => setCreateFunction(CreateFunction.SKETCH)} />
                <FunctionCard icon="⧉" name={t('patterns')} isActive={createFunction === CreateFunction.PATTERN} onClick={() => setCreateFunction(CreateFunction.PATTERN)} />
              </div>
            </Accordion>
        </div>
      )}

      {mode === AppMode.EDIT && (
        <div className="animate-fade-in flex flex-col gap-4">
          <Accordion title={t('editFunction')} id="edit_function" isOpen={ui.openSections.edit_function} onToggle={handleToggleSection}>
             <div className="functions-grid grid grid-cols-3 gap-3">
               <FunctionCard icon="➕" name={t('addRemove')} isActive={editFunction === EditFunction.ADD_REMOVE} onClick={() => setEditFunction(EditFunction.ADD_REMOVE)} title={t('addRemoveTooltip')} />
               <FunctionCard icon="🎯" name={t('retouch')} isActive={editFunction === EditFunction.RETOUCH} onClick={() => setEditFunction(EditFunction.RETOUCH)} title={t('retouchTooltip')} />
               <FunctionCard icon="🎨" name={t('style')} isActive={editFunction === EditFunction.STYLE} onClick={() => setEditFunction(EditFunction.STYLE)} title={t('styleTooltip')} />
               <FunctionCard icon="🖼️" name={t('compose')} isActive={editFunction === EditFunction.COMPOSE} onClick={() => setEditFunction(EditFunction.COMPOSE)} title={t('composeTooltip')} />
               <FunctionCard icon="T" name={t('text')} isActive={editFunction === EditFunction.TEXT_OVERLAY} onClick={() => setEditFunction(EditFunction.TEXT_OVERLAY)} title={t('textTooltip')} />
               <FunctionCard icon="✂️" name={t('crop')} isActive={editFunction === EditFunction.CROP} onClick={() => setEditFunction(EditFunction.CROP)} title={t('cropTooltip')} />
             </div>
           </Accordion>

          {hasGeneratedImage && !isClientSideEdit && (
              <Accordion title={t('quickEdits')} id="edit_quick" isOpen={ui.openSections.edit_quick} onToggle={handleToggleSection}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       <button onClick={() => onApplyFilter(ImageFilter.GRAYSCALE)} className="p-2 bg-slate-800 border-slate-700 border rounded-lg text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors">{t('grayscale')}</button>
                       <button onClick={() => onApplyFilter(ImageFilter.SEPIA)} className="p-2 bg-slate-800 border-slate-700 border rounded-lg text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors">{t('sepia')}</button>
                       <button onClick={() => onApplyFilter(ImageFilter.INVERT)} className="p-2 bg-slate-800 border-slate-700 border rounded-lg text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors">{t('invert')}</button>
                       <button onClick={() => onApplyFilter(ImageFilter.VINTAGE)} className="p-2 bg-slate-800 border-slate-700 border rounded-lg text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors">{t('vintage')}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50 mt-2">
                       <button onClick={() => onApplyRotation(-90)} className="p-2 bg-slate-800 border-slate-700 border rounded-lg text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors">{t('rotateLeft')}</button>
                       <button onClick={() => onApplyRotation(90)} className="p-2 bg-slate-800 border-slate-700 border rounded-lg text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors">{t('rotateRight')}</button>
                  </div>
              </Accordion>
          )}

        {editFunction === EditFunction.COMPOSE ? (
          <Accordion title={t('imagesToCompose')} id="edit_compose" isOpen={ui.openSections.edit_compose} onToggle={handleToggleSection}>
             <div className="grid grid-cols-2 gap-4">
                <UploadArea 
                  id="imageUpload1" 
                  imagePreview={image1?.base64 || null}
                  setImage={(file) => handleSetImage('image1', file)}
                  title={t('firstImage')}
                  t={t}
                  isDraggingFromGallery={isDraggingFromGallery}
                />
                 <UploadArea 
                  id="imageUpload2" 
                  imagePreview={image2?.base64 || null}
                  setImage={(file) => handleSetImage('image2', file)}
                  title={t('secondImage')}
                  t={t}
                  isDraggingFromGallery={isDraggingFromGallery}
                />
             </div>
          </Accordion>
        ) : (
          <div id="uploadArea" className="dynamic-content">
             <UploadArea 
                id="imageUpload" 
                imagePreview={image1?.base64 || null}
                setImage={(file) => handleSetImage('image1', file)}
                title={t('dropOrClick')}
                subtitle={t('filetypes')}
                t={t}
                isDraggingFromGallery={isDraggingFromGallery}
              />
          </div>
        )}
        
        {editFunction === EditFunction.ADD_REMOVE && image1 && (
            <div className="bg-slate-800/50 p-3 rounded-lg flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <label htmlFor="activate-mask-toggle" className="font-semibold text-slate-300 cursor-pointer">{t('activateMask')}</label>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="activate-mask-toggle"
                            id="activate-mask-toggle"
                            className="sr-only peer"
                            checked={isMaskingActive}
                            onChange={(e) => setIsMaskingActive(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-banana-300 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-banana-500"></div>
                    </label>
                </div>

                {isMaskingActive && (
                <Accordion title={t('maskingTools')} id="edit_masking" isOpen={ui.openSections.edit_masking} onToggle={handleToggleSection}>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="brushSize" className="font-medium text-slate-400 text-sm">{t('brushSize')}</label>
                                <span className="text-slate-400 bg-slate-700 px-2 py-0.5 rounded-md text-sm font-mono">{mask.brushSize}px</span>
                            </div>
                            <input
                                id="brushSize"
                                type="range"
                                min="5"
                                max="100"
                                step="1"
                                value={mask.brushSize}
                                onChange={e => setMask(m => ({ ...m, brushSize: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setMask(m => ({...m, mode: 'draw'}))} className={`p-2 rounded-lg text-sm transition-colors ${mask.mode === 'draw' ? 'bg-banana-500 text-slate-900' : 'bg-slate-700 hover:bg-slate-600'}`} title={t('drawMaskTooltip')}>{t('draw')}</button>
                            <button onClick={() => setMask(m => ({...m, mode: 'erase'}))} className={`p-2 rounded-lg text-sm transition-colors ${mask.mode === 'erase' ? 'bg-banana-500 text-slate-900' : 'bg-slate-700 hover:bg-slate-600'}`} title={t('eraseMaskTooltip')}>{t('erase')}</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setMask(m => ({...m, image: null}))} className="p-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg">{t('clearMask')}</button>
                            <button onClick={() => onInvertMask()} className="p-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg">{t('invertMask')}</button>
                        </div>
                    </div>
                </Accordion>
                )}
            </div>
        )}
        </div>
      )}

       {mode === AppMode.RENDER && (
        <div className="animate-fade-in flex flex-col gap-3">
            <Accordion title={t('baseImage')} id="render_base" isOpen={ui.openSections.render_base} onToggle={handleToggleSection}>
                <UploadArea 
                    id="renderUpload" 
                    imagePreview={image1?.base64 || null}
                    setImage={(file) => handleSetImage('image1', file)}
                    title={t('uploadSketch')}
                    subtitle={t('filetypes')}
                    t={t}
                    isDraggingFromGallery={isDraggingFromGallery}
                />
            </Accordion>
            <Accordion title={t('renderSettings')} id="render_settings" isOpen={ui.openSections.render_settings} onToggle={handleToggleSection}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-400 text-sm">{t('inputType')}</label>
                    <div className="grid grid-cols-3 gap-3">
                        <FunctionCard icon="✏️" name={t('sketch')} isActive={renderInputType === RenderInputType.SKETCH} onClick={() => setRenderInputType(RenderInputType.SKETCH)} />
                        <FunctionCard icon="🧊" name={t('basicModel')} isActive={renderInputType === RenderInputType.BASIC_MODEL} onClick={() => setRenderInputType(RenderInputType.BASIC_MODEL)} />
                        <FunctionCard icon="📐" name={t('floorPlan')} isActive={renderInputType === RenderInputType.FLOOR_PLAN} onClick={() => setRenderInputType(RenderInputType.FLOOR_PLAN)} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-slate-400 text-sm">{t('aspectRatio')}</label>
                        <div className="bg-slate-900/70 p-2 rounded-lg">
                            <div className="grid grid-cols-5 gap-2">
                            {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => {
                                const ratios: {[key: string]: string} = { '1:1': 'w-8 h-8', '16:9': 'w-10 h-[22.5px]', '9:16': 'w-[22.5px] h-10', '4:3': 'w-9 h-[27px]', '3:4': 'w-[27px] h-9' };
                                return (
                                    <button key={ratio} onClick={() => setAspectRatio(ratio as AspectRatio)} title={ratio} className={`flex flex-col items-center justify-center rounded-lg p-1 transition-colors ${aspectRatio === ratio ? 'bg-banana-400' : 'hover:bg-slate-700'}`}>
                                        <div className={`bg-slate-600 rounded-sm ${ratios[ratio]} ${aspectRatio === ratio ? 'bg-slate-800' : ''}`} />
                                        <span className={`mt-1 text-xs font-mono ${aspectRatio === ratio ? 'text-slate-900 font-bold':'text-slate-400'}`}>{ratio}</span>
                                    </button>
                                )
                            })}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="batchSize" className="font-semibold text-slate-400 text-sm">{batchLabel}</label>
                        <select
                        id="batchSize"
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-banana-500 focus:outline-none h-10"
                        >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        </select>
                    </div>
                </div>
              </div>
            </Accordion>
            
            <Accordion title={t('renderPresets')} id="render_presets" isOpen={ui.openSections.render_presets} onToggle={handleToggleSection}>
              <div className="flex flex-col gap-3">
                  {renderPresets.actions.filter(action => action.type === renderInputType).length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {renderPresets.actions
                        .filter(action => action.type === renderInputType)
                        .map((preset) => (
                          <button key={preset.name} onClick={() => handlePresetClick(preset.prompt)} className="flex-grow bg-indigo-600 border border-indigo-500 rounded-md px-3 py-1.5 text-sm text-white hover:bg-indigo-500 transition-colors" title={`Add: "${preset.prompt}"`}>
                              {preset.name}
                          </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                      {renderPresets.materials.map((preset) => (
                          <button key={preset.name} onClick={() => handlePresetClick(preset.prompt)} className="flex-shrink-0 bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors" title={`Add: "${preset.prompt}"`}>
                              {preset.name}
                          </button>
                      ))}
                  </div>
                    <div className="flex gap-2 flex-wrap">
                      {renderPresets.lighting.map((preset) => (
                          <button key={preset.name} onClick={() => handlePresetClick(preset.prompt)} className="flex-shrink-0 bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-banana-500 hover:border-banana-500 hover:text-slate-900 transition-colors" title={`Add: "${preset.prompt}"`}>
                              {preset.name}
                          </button>
                      ))}
                  </div>
              </div>
            </Accordion>

            <Accordion title={t('controlBalance')} id="render_controls" isOpen={ui.openSections.render_controls} onToggle={handleToggleSection}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2 justify-center">
                        <div className="flex justify-between items-center">
                            <label htmlFor="fidelity" className="font-semibold text-slate-300 text-base">{t('controlBalance')}</label>
                            <span className="text-slate-400 bg-slate-700 px-2 py-0.5 rounded-md text-sm font-mono">{renderFidelity}%</span>
                        </div>
                        <input 
                        id="fidelity" 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        value={renderFidelity}
                        onChange={e => setRenderFidelity(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" 
                    />
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>{t('maxCreativity')}</span>
                            <span>{t('maxFidelity')}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="addWatermarkRender" className="text-slate-300 font-medium cursor-pointer flex items-center gap-2">
                            💧
                            <span>{t('addWatermark')}</span>
                            </label>
                            <input
                            type="checkbox"
                            id="addWatermarkRender"
                            checked={addWatermark}
                            onChange={(e) => setAddWatermark(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-banana-600 bg-slate-700 border-slate-600 rounded focus:ring-banana-500 cursor-pointer"
                            />
                        </div>
                        {addWatermark && (
                            <div className="animate-fade-in">
                                <UploadArea 
                                    id="watermarkUploadRender" 
                                    imagePreview={customWatermark?.base64 || null}
                                    setImage={(file) => handleSetImage('customWatermark', file)}
                                    title={t('uploadWatermark')}
                                    subtitle={t('uploadWatermarkTypes')}
                                    t={t}
                                    isDraggingFromGallery={isDraggingFromGallery}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Accordion>
        </div>
      )}

      {mode === AppMode.VIDEO && (
        <div className="animate-fade-in flex flex-col gap-3">
           <Accordion title={t('startImage')} id="video_start" isOpen={ui.openSections.video_start} onToggle={handleToggleSection}>
                <UploadArea 
                    id="videoUpload" 
                    imagePreview={image1?.base64 || null}
                    setImage={(file) => handleSetImage('image1', file)}
                    title={t('uploadImage')}
                    subtitle={t('filetypes')}
                    t={t}
                    isDraggingFromGallery={isDraggingFromGallery}
                />
                 <p className="text-sm text-center text-slate-400 mt-2">{t('videoOptionalImageNote')}</p>
            </Accordion>
            <Accordion title={t('videoSettings')} id="video_settings" isOpen={ui.openSections.video_settings} onToggle={handleToggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="flex flex-col gap-2">
                      <label className="font-semibold text-slate-400 text-sm">{t('aspectRatio')}</label>
                      <div className="bg-slate-900/70 p-2 rounded-lg">
                        <div className="grid grid-cols-5 gap-2">
                            {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => {
                                const ratios: {[key: string]: string} = { '1:1': 'w-8 h-8', '16:9': 'w-10 h-[22.5px]', '9:16': 'w-[22.5px] h-10', '4:3': 'w-9 h-[27px]', '3:4': 'w-[27px] h-9' };
                                const currentRatio = videoAspectRatio;
                                return (
                                    <button key={ratio} onClick={() => setVideoAspectRatio(ratio as AspectRatio)} title={ratio} disabled={true} className={`flex flex-col items-center justify-center rounded-lg p-1 transition-colors ${currentRatio === ratio ? 'bg-banana-400' : ''} opacity-50 cursor-not-allowed`}>
                                        <div className={`bg-slate-600 rounded-sm ${ratios[ratio]} ${currentRatio === ratio ? 'bg-slate-800' : ''}`} />
                                        <span className={`mt-1 text-xs font-mono ${currentRatio === ratio ? 'text-slate-900 font-bold':'text-slate-400'}`}>{ratio}</span>
                                    </button>
                                )
                            })}
                        </div>
                      </div>
                  </div>
                   <div className="flex flex-col gap-3 p-3 rounded-lg bg-slate-800/50 h-full justify-center">
                    <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                        <label htmlFor="includeAudio" className="text-slate-300 font-medium flex items-center gap-2">
                        🔊
                        <span>{t('includeSound')}</span>
                        </label>
                        <input
                        type="checkbox"
                        id="includeAudio"
                        checked={videoIncludeAudio}
                        onChange={(e) => setVideoIncludeAudio(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-banana-600 bg-slate-700 border-slate-600 rounded focus:ring-banana-500 cursor-not-allowed"
                        disabled={true}
                        />
                    </div>
                  </div>
              </div>
              <div className="text-sm text-slate-500 mt-2 p-2 bg-slate-900/50 border border-slate-700 rounded-md">
                <p><span className="font-bold">Note:</span> {t('videoApiNote')}</p>
              </div>
            </Accordion>
        </div>
      )}

      {showBatchSelector && mode === AppMode.EDIT && (
        <Accordion title={t('settings')} id="edit_settings" isOpen={ui.openSections.edit_settings} onToggle={handleToggleSection}>
            <div className="flex flex-col gap-2">
                <label htmlFor="batchSize" className="font-semibold text-slate-300">{batchLabel}</label>
                <select
                id="batchSize"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-banana-500 focus:outline-none"
                >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                </select>
            </div>
        </Accordion>
      )}
      
      {mode === AppMode.EDIT && editFunction === EditFunction.CROP && (
        <div className="animate-fade-in flex flex-col gap-4 p-3 rounded-lg bg-slate-800 border border-slate-700">
           <h3 className="font-semibold text-slate-300">✂️ {t('cropImageTitle')}</h3>
           <p className="text-sm text-slate-400">{t('cropImageDesc')}</p>
           <button
            onClick={onApplyCrop}
            disabled={!hasGeneratedImage || isLoading}
            className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {t('applyCrop')}
            </button>
        </div>
      )}

      {mode === AppMode.EDIT && editFunction === EditFunction.TEXT_OVERLAY && (
        <div className="animate-fade-in flex flex-col gap-4 p-3 rounded-lg bg-slate-800 border border-slate-700">
            <h3 className="font-semibold text-slate-300">✏️ {t('addTextTitle')}</h3>
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('addTextPlaceholder')}
                value={textOverlay.text}
                onChange={(e) => setAppState(s => ({ ...s, textOverlay: {...s.textOverlay, text: e.target.value}}))}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 pr-8 text-white focus:ring-2 focus:ring-banana-500"
              />
              {textOverlay.text && (
                <button
                  onClick={() => setAppState(s => ({ ...s, textOverlay: { ...s.textOverlay, text: '' }}))}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  title={t('clearText')}
                  aria-label={t('clearText')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-sm text-slate-400 block mb-1">{t('colorLabel')}</label>
                <input
                type="color"
                value={textOverlay.color}
                onChange={(e) => setAppState(s => ({ ...s, textOverlay: {...s.textOverlay, color: e.target.value}}))}
                className="w-full h-10 p-1 bg-slate-700 border border-slate-600 rounded-md cursor-pointer"
                />
            </div>
            <div>
                <label className="text-sm text-slate-400 block mb-1">{t('sizeLabel')}</label>
                <input
                type="number"
                min="1"
                max="50"
                value={textOverlay.size}
                onChange={(e) => setAppState(s => ({ ...s, textOverlay: {...s.textOverlay, size: Number(e.target.value)}}))}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-banana-500"
                />
            </div>
            </div>
            <button
            onClick={onApplyText}
            disabled={!textOverlay.text.trim() || !hasGeneratedImage || isLoading}
            className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {t('applyText')}
            </button>
        </div>
        )}
      
      {mode !== AppMode.RENDER && mode !== AppMode.VIDEO && (
        <div className="flex flex-col gap-3 p-3 rounded-lg bg-slate-800/50">
          <div className="flex items-center justify-between">
              <label htmlFor="addWatermark" className="text-slate-300 font-medium cursor-pointer flex items-center gap-2">
              💧
              <span>{t('addWatermark')}</span>
              </label>
              <input
              type="checkbox"
              id="addWatermark"
              checked={addWatermark}
              onChange={(e) => setAddWatermark(e.target.checked)}
              className="form-checkbox h-5 w-5 text-banana-600 bg-slate-700 border-slate-600 rounded focus:ring-banana-500 cursor-pointer"
              />
          </div>
          {addWatermark && (
              <div className="animate-fade-in mt-2">
                  <UploadArea 
                      id="watermarkUpload" 
                      imagePreview={customWatermark?.base64 || null}
                      setImage={(file) => handleSetImage('customWatermark', file)}
                      title={t('uploadWatermark')}
                      subtitle={t('uploadWatermarkTypes')}
                      t={t}
                      isDraggingFromGallery={isDraggingFromGallery}
                    />
              </div>
          )}
        </div>
      )}
      
      {!isClientSideEdit && (
        <div className="flex items-stretch gap-3 mt-4 pt-2">
          <button id="generateBtn" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-banana-500 text-slate-900 font-bold rounded-lg hover:bg-banana-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            onClick={mode === AppMode.VIDEO ? onGenerateVideo : onGenerate} 
            disabled={isGenerateDisabled}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
            ) : (
                mode === AppMode.VIDEO ? <span role="img" aria-label="video camera" className="text-xl">🎬</span> : <SparklesIcon className="text-blue-600" />
            )}
            <span>{isLoading ? t('generating') : (mode === AppMode.VIDEO ? t('generateVideo') : t('generate'))}</span>
          </button>
          <button id="clearBtn" onClick={onNewImage} disabled={isLoading} className="flex-shrink-0 flex items-center justify-center px-4 py-3 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors text-sm">
            {t('clearAll')}
          </button>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;