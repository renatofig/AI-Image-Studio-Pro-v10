
import React, { useState } from 'react';
import { enhancePromptApi } from '../services/geminiService';
import { FavoritePrompt } from '../types';

type Language = 'pt' | 'en';
type Tab = 'guide' | 'builder' | 'editGuide' | 'styles' | 'negative' | 'favorites';

interface TipsModalProps {
    onClose: () => void;
    setPrompt: (updater: React.SetStateAction<string>) => void;
    setNegativePrompt: (updater: React.SetStateAction<string>) => void;
    t: (key: string, ...args: any[]) => string;
    language: Language;
    favoritePrompts: FavoritePrompt[];
    setFavoritePrompts: (prompts: FavoritePrompt[]) => void;
}

const tipsContent = {
    pt: {
      title: "Como Escrever um Ótimo Prompt",
      intro: "Um prompt bem estruturado é a chave para obter os melhores resultados. Pense nele como dar instruções claras a um artista criativo. Quanto mais detalhes você fornecer, mais próximo o resultado será da sua visão.",
      structure: {
        title: "Estrutura do Prompt:",
        points: [
          "Sujeito: O foco principal da imagem (ex: 'um leão majestoso').",
          "Ação/Cenário: O que o sujeito está fazendo e onde (ex: 'em um penhasco rochoso ao nascer do sol').",
          "Estilo: O estilo artístico (ex: 'fotorrealista, iluminação cinematográfica, épico').",
          "Detalhes: Específicos como cores, humor, ângulo da câmera (ex: 'luz da hora dourada, sombras dramáticas, foto em grande angular')."
        ],
      },
      example: {
        title: "Exemplo de Prompt:",
        prompt: "Um leão majestoso em um penhasco rochoso ao nascer do sol, fotorrealista, iluminação cinematográfica, épico, luz da hora dourada, sombras dramáticas, foto em grande angular, 8k.",
        explanation: "Este prompt define claramente o sujeito, cenário, estilo e detalhes específicos, levando a uma imagem poderosa e precisa."
      }
    },
    en: {
      title: "How to Write a Great Prompt",
      intro: "A well-structured prompt is key to getting the best results. Think of it as giving clear instructions to a creative artist. The more detail you provide, the closer the result will be to your vision.",
      structure: {
        title: "Prompt Structure:",
        points: [
            "Subject: The main focus of the image (e.g., 'a majestic lion').",
            "Action/Setting: What the subject is doing and where (e.g., 'standing on a rocky cliff at sunrise').",
            "Style: The artistic style (e.g., 'photorealistic, cinematic lighting, epic').",
            "Details: Specifics like colors, mood, camera angle (e.g., 'golden hour light, dramatic shadows, wide-angle shot')."
        ],
      },
      example: {
        title: "Example Prompt:",
        prompt: "A majestic lion standing on a rocky cliff at sunrise, photorealistic, cinematic lighting, epic, golden hour light, dramatic shadows, wide-angle shot, 8k.",
        explanation: "This prompt clearly defines the subject, setting, style, and specific details, leading to a powerful and precise image."
      }
    }
};

const editGuideContent = {
    pt: [
        {
            title: "1. Adicionar e Remover Elementos",
            model: "Usando a imagem fornecida de [assunto], por favor [adicione/remova/modifique] [elemento] para/da cena. Garanta que a mudança seja [descrição de como a mudança deve se integrar].",
            example: "Usando a imagem fornecida do meu gato, por favor, adicione um pequeno chapéu de mago de tricô em sua cabeça. Faça com que pareça que está confortavelmente sentado e que combine com a iluminação suave da foto."
        },
        {
            title: "2. Retoque (Mascaramento Semântico)",
            model: "Usando a imagem fornecida, mude apenas o [elemento específico] para [novo elemento/descrição]. Mantenha todo o resto da imagem exatamente igual, preservando o estilo, iluminação e composição originais.",
            example: "Usando a imagem fornecida de uma sala de estar, mude apenas o sofá azul para um sofá chesterfield de couro marrom vintage. Mantenha o resto da sala, incluindo as almofadas no sofá e a iluminação, inalterados."
        },
        {
            title: "3. Transferência de Estilo",
            model: "Usando a imagem fornecida, mude seu estilo para [descrição do novo estilo]. Mantenha o conteúdo e a composição da imagem original.",
            example: "Usando a imagem fornecida de uma paisagem urbana, mude seu estilo para uma pintura a óleo de Van Gogh. Mantenha os edifícios e a rua reconhecíveis."
        },
        {
            title: "4. Composição de Imagem",
            model: "Usando a imagem A e a imagem B, [descreva como compor/mesclar/misturar].",
            example: "Usando a imagem de um astronauta e a imagem da lua, coloque o astronauta na superfície da lua. Faça com que a iluminação no astronauta corresponda à iluminação da lua."
        }
    ],
    en: [
        {
            title: "1. Add and Remove Elements",
            model: "Using the provided image of [subject], please [add/remove/modify] [element] to/from the scene. Ensure the change is [description of how the change should integrate].",
            example: "Using the provided image of my cat, please add a small knitted wizard hat on its head. Make it look like it's sitting comfortably and matches the soft lighting of the photo."
        },
        {
            title: "2. Retouch (Semantic Masking)",
            model: "Using the provided image, change only the [specific element] to [new element/description]. Keep everything else in the image exactly the same, preserving the original style, lighting, and composition.",
            example: "Using the provided image of a living room, change only the blue sofa to a vintage brown leather chesterfield sofa. Keep the rest of the room, including the pillows on the sofa and the lighting, unchanged."
        },
        {
            title: "3. Style Transfer",
            model: "Using the provided image, change its style to [description of new style]. Maintain the original image's content and composition.",
            example: "Using the provided image of a city landscape, change its style to a Van Gogh oil painting. Keep the buildings and street recognizable."
        },
        {
            title: "4. Image Composition",
            model: "Using image A and image B, [describe how to compose/merge/blend them].",
            example: "Using the image of an astronaut and the image of the moon, place the astronaut on the moon's surface. Make the lighting on the astronaut match the lighting from the moon."
        }
    ]
};

const styleKeywords = [
    { category: { pt: "Estilos de Fotografia", en: "Photography Styles" }, keywords: [ { pt: "Fotorrealista", en: "Photorealistic" }, { pt: "Cinematográfico", en: "Cinematic" }, { pt: "Retrato", en: "Portrait Photography" }, { pt: "Paisagem", en: "Landscape Photography" }, { pt: "Fotografia Macro", en: "Macro Photography" }, { pt: "Longa Exposição", en: "Long Exposure" }, { pt: "Preto e Branco", en: "Black and White" } ] },
    { category: { pt: "Estilos de Arte", en: "Art Styles" }, keywords: [ { pt: "Impressionismo", en: "Impressionism" }, { pt: "Surrealismo", en: "Surrealism" }, { pt: "Arte Pop", en: "Pop Art" }, { pt: "Cyberpunk", en: "Cyberpunk" }, { pt: "Steampunk", en: "Steampunk" }, { pt: "Minimalista", en: "Minimalist" }, { pt: "Aquarela", en: "Watercolor" } ] },
    { category: { pt: "Iluminação", en: "Lighting" }, keywords: [ { pt: "Iluminação Cinematográfica", en: "Cinematic Lighting" }, { pt: "Hora Dourada", en: "Golden Hour" }, { pt: "Hora Azul", en: "Blue Hour" }, { pt: "Iluminação Dramática", en: "Dramatic Lighting" }, { pt: "Luzes de Neon", en: "Neon Lighting" }, { pt: "Luz Suave", en: "Soft Light" } ] }
];

const negativePrompts = {
    pt: {
        title: "Prompts Negativos",
        explanation: "Use prompts negativos para excluir elementos que você não quer em sua imagem. Isso ajuda a refinar o resultado final, dizendo à IA o que evitar.",
        keywords: [ { pt: "feio", en: "ugly" }, { pt: "embaçado", en: "blurry" }, { pt: "anatomia ruim", en: "bad anatomy" }, { pt: "membros extras", en: "extra limbs" }, { pt: "mãos mal desenhadas", en: "poorly drawn hands" }, { pt: "marca d'água", en: "watermark" }, { pt: "texto", en: "text" }, { pt: "baixa qualidade", en: "low quality" } ]
    },
    en: {
        title: "Negative Prompts",
        explanation: "Use negative prompts to exclude elements you don't want in your image. This helps refine the final result by telling the AI what to avoid.",
        keywords: [ { pt: "feio", en: "ugly" }, { pt: "embaçado", en: "blurry" }, { pt: "anatomia ruim", en: "bad anatomy" }, { pt: "membros extras", en: "extra limbs" }, { pt: "mãos mal desenhadas", en: "poorly drawn hands" }, { pt: "marca d'água", en: "watermark" }, { pt: "texto", en: "text" }, { pt: "baixa qualidade", en: "low quality" } ]
    }
};

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

const LoadingSpinner = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin h-5 w-5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);
  
const CloseIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const InputField = ({ name, label, value, onChange, placeholder }: { name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) => (
    <div className="flex flex-col gap-1">
        <label htmlFor={name} className="text-sm font-medium text-slate-400">{label}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-slate-700/50 border border-slate-600 rounded-md p-2 text-sm text-white focus:ring-2 focus:ring-banana-500 focus:outline-none"
        />
    </div>
);

const TipsModal: React.FC<TipsModalProps> = ({ onClose, setPrompt, setNegativePrompt, t, language, favoritePrompts, setFavoritePrompts }) => {
    const [activeTab, setActiveTab] = useState<Tab>('guide');
    
    const [builderInputs, setBuilderInputs] = useState({
        imageType: '',
        mainSubject: '',
        styleMedia: '',
        extraDetails: ''
    });
    const [builderOutput, setBuilderOutput] = useState('');
    const [isBuilding, setIsBuilding] = useState(false);

    const handleBuilderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBuilderInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleAddToPrompt = (text: string) => {
      setPrompt(prev => prev ? `${prev}, ${text}` : text);
    };

    const handleAddToNegativePrompt = (text: string) => {
        setNegativePrompt(prev => prev ? `${prev}, ${text}` : text);
    };

    const handleGenerateBuilderPrompt = async () => {
        const keywords = [
            builderInputs.imageType,
            builderInputs.mainSubject,
            builderInputs.styleMedia,
            builderInputs.extraDetails
        ].filter(Boolean).join(', ');

        if (!keywords.trim()) return;
        
        setIsBuilding(true);
        setBuilderOutput('');
        try {
            const result = await enhancePromptApi(keywords);
            setBuilderOutput(result);
        } catch (error) {
            setBuilderOutput(error instanceof Error ? error.message : t('errorOccurred'));
        } finally {
            setIsBuilding(false);
        }
    };
    
    const handleDeleteFavorite = (id: string) => {
        const updatedFavorites = favoritePrompts.filter(p => p.id !== id);
        setFavoritePrompts(updatedFavorites);
        localStorage.setItem('favoritePrompts', JSON.stringify(updatedFavorites));
    };

    const handleUseFavorite = (prompt: FavoritePrompt) => {
        if (prompt.type === 'positive') {
            setPrompt(prompt.text);
        } else {
            setNegativePrompt(prompt.text);
        }
        onClose();
    };

    const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-700'}`}
        >
            {label}
        </button>
    );

    const renderContent = () => {
        const guideData = tipsContent[language] || tipsContent.pt;
        const negativeData = negativePrompts[language] || negativePrompts.pt;

        switch (activeTab) {
            case 'guide':
                return (
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                        <h3 className="text-banana-400">{guideData.title}</h3>
                        <p>{guideData.intro}</p>
                        <h4 className="text-slate-200">{guideData.structure.title}</h4>
                        <ul>
                            {guideData.structure.points.map((point, index) => <li key={`guide-point-${index}`}>{point}</li>)}
                        </ul>
                        <h4 className="text-slate-200">{guideData.example.title}</h4>
                        <p><code>{guideData.example.prompt}</code></p>
                        <p>{guideData.example.explanation}</p>
                    </div>
                );
            case 'editGuide': {
                const editData = editGuideContent[language] || editGuideContent.pt;
                return (
                    <div className="space-y-6">
                        {editData.map((item, index) => (
                            <div key={`edit-guide-${index}`} className="prose prose-invert prose-sm max-w-none text-slate-300">
                                <h4 className="text-banana-400 font-bold not-prose">{item.title}</h4>
                                <h5 className="text-slate-200 font-semibold mt-2 not-prose">Modelo:</h5>
                                <p className="bg-slate-900 p-2 rounded-md font-mono text-xs"><code>{item.model}</code></p>
                                <h5 className="text-slate-200 font-semibold mt-2 not-prose">Exemplo:</h5>
                                <p className="italic">{item.example}</p>
                            </div>
                        ))}
                    </div>
                );
            }
            case 'builder':
                return (
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <InputField name="imageType" label={t('imageType')} placeholder={t('imageTypePlaceholder')} value={builderInputs.imageType} onChange={handleBuilderInputChange} />
                            <InputField name="mainSubject" label={t('mainSubject')} placeholder={t('mainSubjectPlaceholder')} value={builderInputs.mainSubject} onChange={handleBuilderInputChange} />
                            <InputField name="styleMedia" label={t('styleMedia')} placeholder={t('styleMediaPlaceholder')} value={builderInputs.styleMedia} onChange={handleBuilderInputChange} />
                            <InputField name="extraDetails" label={t('extraDetails')} placeholder={t('extraDetailsPlaceholder')} value={builderInputs.extraDetails} onChange={handleBuilderInputChange} />
                        </div>
            
                        <button
                            onClick={handleGenerateBuilderPrompt}
                            disabled={isBuilding}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-3 rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                        >
                            {isBuilding ? <LoadingSpinner /> : <SparklesIcon className="text-white" />}
                            <span>{isBuilding ? t('generatingPrompt') : t('generatePromptIdea')}</span>
                        </button>
                        
                        {builderOutput && (
                            <div className="mt-4 p-3 bg-slate-900 rounded-md text-sm flex-grow flex flex-col">
                                <p className="whitespace-pre-wrap flex-grow">{builderOutput}</p>
                                <button
                                    onClick={() => { setPrompt(builderOutput); onClose(); }}
                                    className="mt-2 text-sm bg-slate-700 px-3 py-1.5 rounded hover:bg-slate-600 self-start"
                                >
                                    {t('useThisPrompt')}
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'styles':
                return (
                    <div>
                        {styleKeywords.map(section => (
                            <div key={section.category.en} className="mb-4">
                                <h4 className="text-banana-400 font-semibold text-sm mb-2">{section.category[language] || section.category.pt}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {section.keywords.map(kw => (
                                        <button key={kw.en} onClick={() => handleAddToPrompt(kw.en)} className="bg-slate-700 text-xs px-2 py-1 rounded-md hover:bg-slate-600">
                                            {kw[language] || kw.pt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'negative':
                 return (
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                        <h3 className="text-banana-400">{negativeData.title}</h3>
                        <p>{negativeData.explanation}</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {negativeData.keywords.map(kw => (
                                <button key={kw.en} onClick={() => handleAddToNegativePrompt(kw.en)} className="bg-slate-700 text-xs px-2 py-1 rounded-md hover:bg-slate-600 not-prose">
                                    {kw[language] || kw.pt}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'favorites':
                return (
                    <div>
                        {favoritePrompts.length === 0 ? (
                            <p className="text-slate-400 text-sm">{t('noFavoritePrompts')}</p>
                        ) : (
                            <div className="space-y-3">
                                {favoritePrompts.map(prompt => (
                                    <div key={prompt.id} className="bg-slate-800 p-2 rounded-md flex justify-between items-center gap-2">
                                        <p className="text-xs text-slate-300 flex-grow">
                                            <span className={`font-bold ${prompt.type === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                                                {prompt.type === 'positive' ? 'P' : 'N'}:
                                            </span> {prompt.text}
                                        </p>
                                        <div className="flex-shrink-0 flex gap-1">
                                            <button onClick={() => handleUseFavorite(prompt)} className="text-xs bg-slate-700 px-2 py-1 rounded hover:bg-slate-600">{t('useThisPrompt')}</button>
                                            <button onClick={() => handleDeleteFavorite(prompt.id)} className="text-xs bg-red-800/50 text-red-300 px-2 py-1 rounded hover:bg-red-700">X</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] text-slate-200 flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span>{t('promptHelperTitle')}</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <CloseIcon />
                        </button>
                    </div>
                </header>
                <div className="flex-grow flex flex-col p-4 gap-4 overflow-hidden">
                    <nav className="flex-shrink-0 border-b border-slate-700 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <TabButton tab="guide" label={t('guide')} />
                            <TabButton tab="editGuide" label={t('editGuide')} />
                            <TabButton tab="builder" label={t('builder')} />
                            <TabButton tab="styles" label={t('stylesKeywords')} />
                            <TabButton tab="negative" label={t('negative')} />
                            <TabButton tab="favorites" label={t('favorites')} />
                        </div>
                    </nav>
                    <main className="flex-grow bg-slate-800/50 rounded-md p-4 overflow-y-auto">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default TipsModal;
