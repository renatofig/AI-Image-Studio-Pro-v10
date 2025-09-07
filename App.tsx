import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppMode, CreateFunction, EditFunction, ImageFile, AspectRatio, ImageFilter, GalleryImage, RenderInputType, AppState } from './types';
import LeftPanel from './components/LeftPanel';
// FIX: Changed import to a named import as RightPanel is not a default export.
import { RightPanel } from './components/RightPanel';
import GalleryModal from './components/GalleryModal';
import { generateImageApi, generateVideoApi } from './services/geminiService';
import * as geminiService from './services/geminiService';
import { dbService } from './services/dbService';
import ApiKeyModal from './components/ApiKeyModal';
import HelpModal from './components/HelpModal';

type Language = 'pt' | 'en';

const translations = {
  pt: {
    // App/General
    loadingSession: 'Carregando sessão...',
    galleryCleaned: 'Galeria limpa.',
    imagesRemoved: 'imagens removidas',
    imageRemoved: 'Imagem removida.',
    undo: 'Desfazer',
    imageSaved: 'Imagem salva na galeria!',
    imagesSaved: (count: number) => `${count} imagens foram salvas na galeria!`,
    baseImagePrompt: 'Imagem Base',
    imageAlreadyInGallery: 'Esta imagem já está na galeria.',
    invalidApiKeyError: 'Erro: A chave da API não é válida. Por favor, verifique sua chave e tente novamente.',
    // Api Key Modal
    apiKeyTitle: 'Chave de API do Google Gemini',
    apiKeyDescription: 'Para usar este aplicativo, por favor, insira sua chave de API do Google Gemini. Sua chave é salva localmente no seu navegador e não é compartilhada.',
    apiKeyPlaceholder: 'Cole sua chave de API aqui',
    saveKey: 'Salvar Chave',
    getYourKey: 'Obtenha sua chave aqui.',
    apiKeyDisclaimer: 'Sua chave de API é armazenada localmente e nunca é compartilhada.',
    // Gallery
    myCreations: 'Minhas Criações',
    galleryDescription: 'Suas imagens salvas. Clique em uma para editar ou arraste-a para a área de upload.',
    searchByPrompt: 'Buscar por prompt...',
    sortBy: 'Ordenar por:',
    sortNewest: 'Mais Recentes',
    sortOldest: 'Mais Antigas',
    sortFavorites: 'Favoritos',
    clearGallery: 'Limpar galeria',
    confirmDeleteImage: 'Tem certeza de que deseja excluir esta imagem? Esta ação não pode ser desfeita.',
    confirmDeleteAllImages: (count: number) => `Tem certeza de que deseja excluir todas as ${count} imagens da galeria? Você poderá desfazer esta ação por um curto período.`,
    noImagesFound: 'Nenhuma imagem encontrada para sua busca.',
    favorite: 'Favorito',
    addFavorite: 'Adicionar favorito',
    removeFavorite: 'Remover favorito',
    createVideo: 'Criar Vídeo',
    delete: 'Excluir',
    close: 'Fechar',
    // LeftPanel
    panelSubtitle: 'Gerador profissional de imagens e vídeos',
    toggleLanguageTooltip: 'Alterar Idioma',
    helpTooltip: 'Ajuda',
    compareTooltip: 'Ativar/Desativar comparador antes/depois',
    undoTooltip: 'Desfazer (Ctrl+Z)',
    redoTooltip: 'Refazer (Ctrl+Y)',
    history: 'Histórico',
    historyTooltip: 'Mostrar/Ocultar painel de histórico visual',
    reset: 'Reiniciar',
    resetTooltip: 'Reiniciar e começar um novo projeto',
    stop: 'Parar',
    describeAnimation: '🎬 Descreva a animação',
    describeIdea: 'Descreva sua ideia',
    promptPlaceholderVideo: 'Ex: um close-up dramático, a câmera se afasta lentamente...',
    promptPlaceholderImage: 'Descreva a imagem que você deseja criar ou a edição que quer fazer...',
    enhancePrompt: 'Melhorar prompt com IA',
    translatePrompt: 'Traduzir PT-EN / EN-PT',
    favoritePrompt: 'Salvar prompt como favorito',
    negativePromptLabel: '🚫 Prompt Negativo (o que evitar)',
    negativePromptPlaceholder: 'Ex: estático, sem movimento, blur, baixa qualidade, deformado',
    expand: 'Expandir',
    saveAndClose: 'Salvar e Fechar',
    promptEditorTitle: 'Editor de Prompt',
    negativePromptEditorTitle: 'Editor de Prompt Negativo',
    describeVisionInDetail: 'Descreva sua visão em detalhes...',
    changeApiKey: 'Alterar Chave API',
    create: 'Criar',
    edit: 'Editar',
    render: 'Renderizar',
    video: 'Vídeo',
    createModeTooltip: 'Gerar imagens do zero a partir de texto (Alt+1)',
    editModeTooltip: 'Modificar uma imagem existente com IA (Alt+2)',
    renderModeTooltip: 'Transformar um esboço em uma imagem fotorrealista (Alt+3)',
    videoModeTooltip: 'Criar uma animação a partir de uma imagem/texto (Alt+4)',
    stylePresets: '🎨 Predefinições de Estilo',
    settings: 'Configurações',
    aspectRatio: '📏 Proporção',
    batchSizeImage: '🔢 Número de imagens',
    batchSizeRender: '🔢 Número de Renders',
    batchSizeVariation: '🔢 Número de variações',
    creationType: '✨ Tipo de Criação',
    // Creation Functions
    freePrompt: 'Prompt',
    stickers: 'Adesivos',
    logo: 'Logo',
    comic: 'HQ',
    sketch: 'Esboço',
    patterns: 'Padrões',
    // Edit Functions
    editFunction: '🛠️ Função de Edição',
    addRemove: 'Adicionar/Remover',
    addRemoveTooltip: "Adicione ou remova objetos da imagem usando um prompt de texto. Ex: 'adicione um gato no sofá'.",
    retouch: 'Retoque',
    retouchTooltip: "Faça melhorias e correções sutis na imagem. Ex: 'melhore a iluminação', 'remova pequenas manchas'.",
    style: 'Estilo',
    styleTooltip: "Transforme completamente o estilo artístico da imagem, mantendo a composição original. Ex: 'estilo de pintura a óleo'.",
    compose: 'Unir',
    composeTooltip: "Combine duas imagens para criar uma nova composição. Descreva no prompt como elas devem ser unidas.",
    text: 'Texto',
    textTooltip: "Adicione texto sobre a imagem. Controle a cor, o tamanho e a posição arrastando-o.",
    crop: 'Cortar',
    cropTooltip: "Recorte a imagem para focar em uma área específica. A ação é aplicada localmente, sem usar a IA.",
    quickEdits: 'Edições Rápidas',
    grayscale: 'Cinza',
    sepia: 'Sépia',
    invert: 'Inverter',
    vintage: 'Vintage',
    rotateLeft: 'Girar 90° ↺',
    rotateRight: 'Girar 90° ↻',
    imagesToCompose: '📸 Imagens para Unir',
    firstImage: 'Primeira Imagem',
    secondImage: 'Segunda Imagem',
    cropImageTitle: 'Recortar Imagem',
    cropImageDesc: 'Ajuste a caixa na imagem à direita para selecionar a área que deseja manter.',
    applyCrop: 'Aplicar Corte',
    addTextTitle: 'Adicionar Texto na Imagem',
    addTextPlaceholder: 'Digite seu texto aqui...',
    clearText: 'Limpar texto',
    colorLabel: 'Cor',
    sizeLabel: 'Tamanho (%)',
    applyText: 'Aplicar Texto',
    // Masking
    maskingTools: 'Ferramentas de Máscara',
    brushSize: 'Tamanho do Pincel',
    draw: 'Desenhar',
    erase: 'Apagar',
    drawMaskTooltip: 'Desenhar: Pinte as áreas que a IA deve modificar. A IA só afetará as áreas brancas.',
    eraseMaskTooltip: 'Apagar: Remova áreas da máscara para protegê-las de modificações da IA.',
    clearMask: 'Limpar Máscara',
    invertMask: 'Inverter Máscara',
    activateMask: 'Ativar Máscara',
    // Render
    baseImage: '🏗️ Imagem Base',
    uploadSketch: 'Cole, clique ou arraste o esboço',
    renderSettings: 'Configurações de Renderização',
    inputType: 'Tipo de Input',
    basicModel: 'Modelo 3D',
    floorPlan: 'Planta Baixa',
    renderPresets: 'Presets de Renderização',
    controlBalance: 'Balanço de Controle',
    maxCreativity: 'Criatividade Máxima',
    maxFidelity: 'Fidelidade Máxima',
    addWatermark: "Adicionar marca d'água",
    // Video
    startImage: '🎬 Imagem de Início (Opcional)',
    uploadImage: 'Cole, clique ou arraste a imagem',
    videoSettings: 'Configurações de Vídeo',
    includeSound: 'Incluir som',
    videoApiNote: 'A API atual não suporta a definição de proporção ou a geração de som para vídeos. O vídeo resultante terá a proporção da imagem de entrada (se fornecida) ou um padrão 16:9. Estas opções são para futuras atualizações.',
    videoOptionalImageNote: 'A imagem é opcional. Se nenhuma imagem for fornecida, o vídeo será gerado apenas a partir do texto.',
    // RightPanel
    imageWillAppear: 'Sua obra de arte aparecerá aqui',
    errorOccurred: 'Ocorreu um Erro',
    editWithAI: 'Editar com IA',
    useAsBase: 'Usar como Base',
    useAsBaseForAI: 'Usar como base para a IA',
    useAsBaseInEditor: 'Usar como base para IA ou edição rápida',
    useAsBaseTooltip: 'Usar esta imagem como base para uma nova geração ou edição',
    download: 'Download',
    saveToGallery: 'Salvar na Galeria',
    newImage: 'Nova Imagem',
    downloadVideo: 'Download do Vídeo',
    newProject: 'Novo Projeto',
    generatingImage: (current: number, total: number) => `Gerando imagem ${current} de ${total}...`,
    processingPrompt: 'Processando prompt:',
    // Download Modal
    exportOptions: 'Opções de Exportação',
    format: 'Formato',
    quality: 'Qualidade',
    resolution: 'Upscale',
    includeOriginal: 'Incluir imagem original (antes das edi��ões)',
    downloading: 'Baixando...',
    performDownload: 'Fazer Download',
    // UploadArea
    changeImage: '🔁 Trocar Imagem',
    removeImage: 'Remover imagem',
    dropOrClick: 'Cole, clique ou arraste uma imagem',
    filetypes: 'PNG, JPG, WebP (máx. 10MB)',
    uploadWatermark: "Carregar marca d'água",
    uploadWatermarkTypes: 'PNG com fundo transparente',
    dropHere: 'Solte a imagem aqui!',
    // Generate Button
    generate: 'Gerar',
    generateVideo: 'Gerar Vídeo',
    generating: 'Gerando...',
    clearAll: 'Limpar Tudo',
    // Tips Modal
    tipsAndFavorites: 'Dicas e Favoritos',
    promptHelperTitle: 'Assistente de Prompt',
    guide: 'Guia de Prompt',
    builder: 'Construtor de Prompt',
    imageType: 'Tipo de Imagem',
    mainSubject: 'Assunto Principal',
    styleMedia: 'Estilo/Mídia',
    extraDetails: 'Detalhes Extras (ex: iluminação, humor, cor)',
    generatePromptIdea: 'Gerar Ideia de Prompt',
    imageTypePlaceholder: 'ex: Retrato fotorrealista',
    mainSubjectPlaceholder: 'ex: um cavaleiro de armadura brilhante',
    styleMediaPlaceholder: 'ex: arte fantástica, cinematográfico',
    extraDetailsPlaceholder: 'ex: luz dramática, atmosfera sombria',
    editGuide: 'Guia de Edição',
    stylesKeywords: 'Estilos e Palavras-chave',
    negative: 'Prompts Negativos',
    favorites: 'Favoritos',
    useThisPrompt: 'Usar este prompt',
    generatingPrompt: 'Gerando...',
    noFavoritePrompts: 'Nenhum prompt favorito salvo.',
    promptSaved: 'Prompt salvo nos favoritos!',
    // History Panel
    historyPanelTitle: 'Histórico de Sessão',
    initialState: 'Estado Inicial',
    step: 'Passo',
    // Style & Render Presets
    photographic: 'Fotográfico',
    anime: 'Anime',
    fantasy: 'Fantasia',
    cyberpunk: 'Cyberpunk',
    watercolor: 'Aquarela',
    pixelArt: 'Pixel Art',
    threeDRender: '3D',
    wood: 'Madeira',
    marble: 'Mármore',
    concrete: 'Concreto',
    metal: 'Metal',
    glass: 'Vidro',
    mirror: 'Espelho',
    daylight: 'Luz do Dia',
    sunset: 'Pôr do Sol',
    night: 'Noturno',
    studio: 'Estúdio',
    extrudePlanPrompt: 'Extrusão de Planta Baixa',
    renderPrompt: 'Renderização de Modelo',
    imagePrompt: 'Renderização de Esboço',
    renderPresetWood: 'com piso de madeira de carvalho de alta qualidade, com veios naturais visíveis',
    renderPresetMarble: 'com bancadas de mármore carrara branco polido com veios cinza sutis',
    renderPresetConcrete: 'paredes de concreto polido com uma textura industrial e moderna',
    renderPresetMetal: 'detalhes em metal escovado de aço inoxidável com reflexos realistas',
    renderPresetGlass: 'incluindo painéis de vidro transparente e cristalino, como em janelas ou divisórias',
    renderPresetMirror: 'adicione um espelho grande com uma moldura fina, refletindo o ambiente de forma nítida e realista',
    renderPresetDaylight: 'iluminação natural suave vinda de uma grande janela, luz do meio-dia',
    renderPresetSunset: 'banhado pela luz quente e dourada do pôr do sol, criando sombras longas e suaves',
    renderPresetNight: 'iluminação noturna com luzes de led quentes e iluminação de destaque suave',
    renderPresetStudio: 'iluminação de estúdio difusa e uniforme, sem sombras fortes',
    renderActionExtrude: 'Crie uma renderização 3D fotorrealista a partir desta planta baixa. Use uma perspectiva de nível de olho, adicione móveis modernos e elegantes apropriados para cada cômodo. Implemente iluminação natural suave vinda de janelas grandes, com sombras realistas. Use materiais de alta qualidade.',
    actionRenderModel: "Renderize este modelo 3D básico com materiais fotorrealistas e de alta qualidade. Implemente iluminação avançada baseada em física, incluindo sombras suaves, reflexos e oclusão de ambiente para criar uma imagem final fotorrealista. Preste atenção aos detalhes descritos no prompt do usuário para texturas e ambiente.",
    renderActionRenderSketch: "Transforme este esboço em uma imagem fotorrealista. Adicione materiais, texturas, iluminação e sombras realistas com base no prompt de texto do usuário para dar vida à cena. Mantenha a composição e a perspectiva do esboço original.",
    // Help Modal
    helpTitle: 'Ajuda e Guia do Usuário',
    helpIntro: 'Bem-vindo ao AI Image Studio Pro! Este guia irá ajudá-lo a entender todas as ferramentas poderosas à sua disposição.',
    helpCreateTitle: '🎨 Modo Criar',
    helpCreateIntro: 'Este modo é para gerar imagens a partir do zero usando apenas descrições de texto (prompts).',
    helpCreatePromptingTitle: 'Escrevendo Prompts',
    helpCreatePromptingContent: "O coração deste modo. Descreva o que você quer ver. Seja específico! Use as ferramentas 'Melhorar' (✨) para adicionar detalhes automaticamente ou 'Traduzir' (🌍) para alternar entre inglês e português, já que modelos de IA geralmente entendem melhor o inglês.",
    helpCreatePresetsTitle: 'Predefinições de Estilo',
    helpCreatePresetsContent: 'Aplique rapidamente estilos de arte complexos como Fotográfico, Anime, Fantasia, etc., ao seu prompt com um único clique.',
    helpCreateTypesTitle: 'Tipos de Criação',
    helpCreateTypesContent: 'Use modelos de prompt especializados para criar Adesivos, Logos, Quadrinhos, Esboços ou Padrões contínuos (seamless).',
    helpEditTitle: '🛠️ Modo Editar',
    helpEditIntro: 'Use este modo para modificar uma imagem existente usando IA. Faça o upload de uma imagem para começar.',
    helpEditFunctionsTitle: 'Funções de Edição com IA',
    helpEditFunctionsContent: "Adicionar/Remover: Modifique partes de uma imagem. Você pode usar uma máscara para dizer à IA exatamente onde fazer a alteração. \nRetoque: Para melhorias sutis como iluminação ou correção de pequenas falhas. \nEstilo: Transforma o estilo artístico da sua imagem completamente. \nUnir: Combina duas imagens em uma única composição.",
    helpEditMaskingTitle: 'Ferramentas de Máscara',
    helpEditMaskingContent: "Ao usar 'Adicionar/Remover', ative a máscara para pintar (em branco) as áreas que a IA deve alterar. Isso dá a você controle preciso sobre a edição.",
    helpEditClientToolsTitle: 'Ferramentas Locais (Sem IA)',
    helpEditClientToolsContent: 'Adicionar Texto, Cortar, aplicar Filtros e Girar são edições rápidas feitas diretamente no seu navegador, sem usar a API.',
    helpRenderTitle: '🏗️ Modo Renderizar',
    helpRenderIntro: 'Uma suíte profissional para arquitetos e designers. Transforme esboços, modelos 3D básicos ou plantas baixas 2D em renders fotorrealistas.',
    helpRenderInputTitle: 'Tipos de Input',
    helpRenderInputContent: "Escolha se sua imagem base é um Esboço, um Modelo 3D ou uma Planta Baixa. A IA interpretará cada um de forma diferente para criar o melhor resultado.",
    helpRenderFidelityTitle: 'Balanço de Controle (Fidelidade vs. Criatividade)',
    helpRenderFidelityContent: 'Este slider controla o quão estritamente a IA deve seguir sua imagem base. Fidelidade alta mantém a estrutura original, enquanto criatividade baixa permite que a IA faça mais reinterpretações.',
    helpRenderPresetsTitle: 'Presets de Renderização',
    helpRenderPresetsContent: 'Adicione rapidamente prompts complexos para materiais (madeira, mármore), iluminação (luz do dia, noturno) e ações de renderização com um clique.',
    helpVideoTitle: '🎬 Modo Vídeo',
    helpVideoIntro: 'Crie pequenas animações a partir de uma imagem, texto ou uma combinação de ambos.',
    helpVideoImageTitle: 'Animação a partir de Imagem',
    helpVideoImageContent: 'Faça o upload de uma imagem inicial e descreva no prompt o movimento que você deseja. Ex: "um close-up dramático, a câmera se afasta lentamente".',
    helpVideoTextTitle: 'Animação a partir de Texto',
    helpVideoTextContent: 'Se nenhuma imagem for fornecida, a IA criará um vídeo inteiramente a partir da sua descrição de texto.',
    helpWorkflowTitle: '✨ Ferramentas de Fluxo de Trabalho',
    helpWorkflowGalleryTitle: 'Galeria',
    helpWorkflowGalleryContent: 'Salve suas criações favoritas na galeria. Você pode pesquisar, filtrar e reutilizar qualquer imagem salva como base para uma nova edição ou vídeo.',
    helpWorkflowHistoryTitle: 'Histórico e Desfazer/Refazer',
    helpWorkflowHistoryContent: 'Cada ação que você executa é salva no histórico da sessão. Use os botões de desfazer/refazer ou o painel de histórico visual para voltar a qualquer etapa anterior.',
    helpWorkflowComparatorTitle: 'Comparador Antes/Depois',
    helpWorkflowComparatorContent: 'Após uma edição, use o botão do comparador para ver um slider interativo mostrando a imagem original e a editada lado a lado.',
    helpWorkflowExportTitle: 'Exportação',
    helpWorkflowExportContent: 'Faça o download de suas imagens finais com opções para mudar o formato (PNG/JPEG), qualidade e até fazer um upscale da resolução para até 4x o tamanho original.',
  },
  en: {
    // App/General
    loadingSession: 'Loading session...',
    galleryCleaned: 'Gallery cleared.',
    imagesRemoved: 'images removed',
    imageRemoved: 'Image removed.',
    undo: 'Undo',
    imageSaved: 'Image saved to gallery!',
    imagesSaved: (count: number) => `${count} images saved to gallery!`,
    baseImagePrompt: 'Base Image',
    imageAlreadyInGallery: 'This image is already in the gallery.',
    invalidApiKeyError: 'Error: API key is not valid. Please check your key and try again.',
     // Api Key Modal
    apiKeyTitle: 'Google Gemini API Key',
    apiKeyDescription: 'To use this application, please enter your Google Gemini API key. Your key is saved locally in your browser and is not shared.',
    apiKeyPlaceholder: 'Paste your API key here',
    saveKey: 'Save Key',
    getYourKey: 'Get your key here.',
    apiKeyDisclaimer: 'Your API key is stored locally and is never shared.',
    // Gallery
    myCreations: 'My Creations',
    galleryDescription: 'Your saved images. Click one to edit or drag it to the upload area.',
    searchByPrompt: 'Search by prompt...',
    sortBy: 'Sort by:',
    sortNewest: 'Newest',
    sortOldest: 'Oldest',
    sortFavorites: 'Favorites',
    clearGallery: 'Clear gallery',
    confirmDeleteImage: 'Are you sure you want to delete this image? This action cannot be undone.',
    confirmDeleteAllImages: (count: number) => `Are you sure you want to delete all ${count} images from the gallery? You can undo this action for a short period.`,
    noImagesFound: 'No images found for your search.',
    favorite: 'Favorite',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
    createVideo: 'Create Video',
    delete: 'Delete',
    close: 'Close',
    // LeftPanel
    panelSubtitle: 'Professional image and video generator',
    toggleLanguageTooltip: 'Toggle Language',
    helpTooltip: 'Help',
    compareTooltip: 'Toggle before/after comparator',
    undoTooltip: 'Undo (Ctrl+Z)',
    redoTooltip: 'Redo (Ctrl+Y)',
    history: 'History',
    historyTooltip: 'Show/Hide visual history panel',
    reset: 'Reset',
    resetTooltip: 'Reset and start a new project',
    stop: 'Stop',
    describeAnimation: '🎬 Describe the animation',
    describeIdea: 'Describe your idea',
    promptPlaceholderVideo: 'E.g., a dramatic close-up, the camera slowly pans out...',
    promptPlaceholderImage: 'Describe the image you want to create or the edit you want to make...',
    enhancePrompt: 'Enhance prompt with AI',
    translatePrompt: 'Translate PT-EN / EN-PT',
    favoritePrompt: 'Save prompt as favorite',
    negativePromptLabel: '🚫 Negative Prompt (what to avoid)',
    negativePromptPlaceholder: 'E.g., static, no movement, blurry, low quality, deformed',
    expand: 'Expand',
    saveAndClose: 'Save and Close',
    promptEditorTitle: 'Prompt Editor',
    negativePromptEditorTitle: 'Negative Prompt Editor',
    describeVisionInDetail: 'Describe your vision in detail...',
    changeApiKey: 'Change API Key',
    create: 'Create',
    edit: 'Edit',
    render: 'Render',
    video: 'Video',
    createModeTooltip: 'Generate images from scratch using text (Alt+1)',
    editModeTooltip: 'Modify an existing image with AI (Alt+2)',
    renderModeTooltip: 'Transform a sketch into a photorealistic image (Alt+3)',
    videoModeTooltip: 'Create an animation from an image/text (Alt+4)',
    stylePresets: '🎨 Style Presets',
    settings: 'Settings',
    aspectRatio: '📏 Aspect Ratio',
    batchSizeImage: '🔢 Number of images',
    batchSizeRender: '🔢 Number of Renders',
    batchSizeVariation: '🔢 Number of variations',
    creationType: '✨ Creation Type',
    // Creation Functions
    freePrompt: 'Prompt',
    stickers: 'Stickers',
    logo: 'Logo',
    comic: 'Comic',
    sketch: 'Sketch',
    patterns: 'Patterns',
    // Edit Functions
    editFunction: '🛠️ Edit Function',
    addRemove: 'Add/Remove',
    addRemoveTooltip: "Add or remove objects from the image using a text prompt. E.g., 'add a cat on the sofa'.",
    retouch: 'Retouch',
    retouchTooltip: "Make subtle improvements and corrections to the image. E.g., 'improve the lighting', 'remove small blemishes'.",
    style: 'Style',
    styleTooltip: "Completely transform the artistic style of the image while keeping the original composition. E.g., 'oil painting style'.",
    compose: 'Compose',
    composeTooltip: "Combine two images to create a new composition. Describe in the prompt how they should be merged.",
    text: 'Text',
    textTooltip: "Add text over the image. Control its color, size, and position by dragging it.",
    crop: 'Crop',
    cropTooltip: "Crop the image to focus on a specific area. The action is applied locally, without using AI.",
    quickEdits: 'Quick Edits',
    grayscale: 'Grayscale',
    sepia: 'Sepia',
    invert: 'Invert',
    vintage: 'Vintage',
    rotateLeft: 'Rotate 90° ↺',
    rotateRight: 'Rotate 90° ↻',
    imagesToCompose: '📸 Images to Compose',
    firstImage: 'First Image',
    secondImage: 'Second Image',
    cropImageTitle: 'Crop Image',
    cropImageDesc: 'Adjust the box on the right image to select the area you want to keep.',
    applyCrop: 'Apply Crop',
    addTextTitle: 'Add Text to Image',
    addTextPlaceholder: 'Type your text here...',
    clearText: 'Clear text',
    colorLabel: 'Color',
    sizeLabel: 'Size (%)',
    applyText: 'Apply Text',
    // Masking
    maskingTools: 'Masking Tools',
    brushSize: 'Brush Size',
    draw: 'Draw',
    erase: 'Erase',
    drawMaskTooltip: 'Draw: Paint over the areas you want the AI to modify. The AI will only affect the white areas.',
    eraseMaskTooltip: 'Erase: Remove areas from the mask to protect them from AI modifications.',
    clearMask: 'Clear Mask',
    invertMask: 'Invert Mask',
    activateMask: 'Activate Mask',
    // Render
    baseImage: '🏗️ Base Image',
    uploadSketch: 'Paste, click, or drag a sketch',
    renderSettings: 'Render Settings',
    inputType: 'Input Type',
    basicModel: '3D Model',
    floorPlan: 'Floor Plan',
    renderPresets: 'Render Presets',
    controlBalance: 'Control Balance',
    maxCreativity: 'Maximum Creativity',
    maxFidelity: 'Maximum Fidelity',
    addWatermark: 'Add watermark',
    // Video
    startImage: '🎬 Start Image (Optional)',
    uploadImage: 'Paste, click, or drag an image',
    videoSettings: 'Video Settings',
    includeSound: 'Include sound',
    videoApiNote: 'The current API does not support setting aspect ratio or generating sound for videos. The resulting video will have the aspect ratio of the input image (if provided) or a default 16:9. These options are for future updates.',
    videoOptionalImageNote: 'The image is optional. If no image is provided, the video will be generated from text only.',
    // RightPanel
    imageWillAppear: 'Your masterpiece will appear here',
    errorOccurred: 'An Error Occurred',
    editWithAI: 'Edit with AI',
    useAsBase: 'Use as Base',
    useAsBaseForAI: 'Use as base for AI',
    useAsBaseInEditor: 'Use as base for AI or quick edit',
    useAsBaseTooltip: 'Use this image as a base for a new generation or edit',
    download: 'Download',
    saveToGallery: 'Save to Gallery',
    newImage: 'New Image',
    downloadVideo: 'Download Video',
    newProject: 'New Project',
    generatingImage: (current: number, total: number) => `Generating image ${current} of ${total}...`,
    processingPrompt: 'Processing prompt:',
    // Download Modal
    exportOptions: 'Export Options',
    format: 'Format',
    quality: 'Quality',
    resolution: 'Resolution (Upscale)',
    includeOriginal: 'Include original image (before edits)',
    downloading: 'Downloading...',
    performDownload: 'Download',
    // UploadArea
    changeImage: '🔁 Change Image',
    removeImage: 'Remove image',
    dropOrClick: 'Paste, click, or drag an image',
    filetypes: 'PNG, JPG, WebP (max 10MB)',
    uploadWatermark: 'Upload watermark',
    uploadWatermarkTypes: 'Transparent PNG',
    dropHere: 'Drop image here!',
    // Generate Button
    generate: 'Generate',
    generateVideo: 'Generate Video',
    generating: 'Generating...',
    clearAll: 'Clear All',
    // Tips Modal
    tipsAndFavorites: 'Tips & Favorites',
    promptHelperTitle: 'Prompt Helper',
    guide: 'Prompt Guide',
    builder: 'Prompt Builder',
    imageType: 'Image Type',
    mainSubject: 'Main Subject',
    styleMedia: 'Style/Media',
    extraDetails: 'Extra Details (e.g., lighting, mood, color)',
    generatePromptIdea: 'Generate Prompt Idea',
    imageTypePlaceholder: 'e.g., Photorealistic portrait',
    mainSubjectPlaceholder: 'e.g., a knight in shining armor',
    styleMediaPlaceholder: 'e.g., fantasy art, cinematic',
    extraDetailsPlaceholder: 'e.g., dramatic light, moody atmosphere',
    editGuide: 'Editing Guide',
    stylesKeywords: 'Styles & Keywords',
    negative: 'Negative Prompts',
    favorites: 'Favorites',
    useThisPrompt: 'Use this prompt',
    generatingPrompt: 'Generating...',
    noFavoritePrompts: 'No favorite prompts saved.',
    promptSaved: 'Prompt saved to favorites!',
    // History Panel
    historyPanelTitle: 'Session History',
    initialState: 'Initial State',
    step: 'Step',
    // Style & Render Presets
    photographic: 'Photographic',
    anime: 'Anime',
    fantasy: 'Fantasy',
    cyberpunk: 'Cyberpunk',
    watercolor: 'Watercolor',
    pixelArt: 'Pixel Art',
    threeDRender: '3D Render',
    wood: 'Wood',
    marble: 'Marble',
    concrete: 'Concrete',
    metal: 'Metal',
    glass: 'Glass',
    mirror: 'Mirror',
    daylight: 'Daylight',
    sunset: 'Sunset',
    night: 'Night',
    studio: 'Studio',
    extrudePlanPrompt: 'Extrude Floor Plan Prompt',
    renderPrompt: 'Render Prompt',
    imagePrompt: 'Image Prompt',
    renderPresetWood: 'with high-quality oak wood flooring, with visible natural grains',
    renderPresetMarble: 'with polished white Carrara marble countertops with subtle gray veins',
    renderPresetConcrete: 'polished concrete walls with a modern, industrial texture',
    renderPresetMetal: 'details in brushed stainless steel metal with realistic reflections',
    renderPresetGlass: 'including transparent and crystalline glass panels, as in windows or partitions',
    renderPresetMirror: 'add a large mirror with a thin frame, reflecting the environment sharply and realistically',
    renderPresetDaylight: 'soft natural lighting coming from a large window, midday light',
    renderPresetSunset: 'bathed in the warm, golden light of sunset, creating long, soft shadows',
    renderPresetNight: 'night lighting with warm LED lights and soft accent lighting',
    renderPresetStudio: 'diffuse and even studio lighting, without harsh shadows',
    renderActionExtrude: 'Create a photorealistic 3D rendering from this floor plan. Use an eye-level perspective, add modern and elegant furniture appropriate for each room. Implement soft natural lighting from large windows, with realistic shadows. Use high-quality materials.',
    actionRenderModel: "Render this basic 3D model with photorealistic, high-quality materials. Implement advanced physics-based lighting, including soft shadows, reflections, and ambient occlusion to create a photorealistic final image. Pay attention to the details described in the user's prompt for textures and environment.",
    renderActionRenderSketch: "Transform this sketch into a photorealistic image. Add realistic materials, textures, lighting, and shadows based on the user's text prompt to bring the scene to life. Maintain the composition and perspective of the original sketch.",
    // Help Modal
    helpTitle: 'Help & User Guide',
    helpIntro: 'Welcome to AI Image Studio Pro! This guide will help you understand all the powerful tools at your disposal.',
    helpCreateTitle: '🎨 Create Mode',
    helpCreateIntro: 'This mode is for generating images from scratch using only text descriptions (prompts).',
    helpCreatePromptingTitle: 'Writing Prompts',
    helpCreatePromptingContent: "The heart of this mode. Describe what you want to see. Be specific! Use the \'Enhance\' (✨) tool to automatically add detail or \'Translate\' (🌍) to switch between English and Portuguese, as AI models often understand English better.",
    helpCreatePresetsTitle: 'Style Presets',
    helpCreatePresetsContent: 'Quickly apply complex art styles like Photographic, Anime, Fantasy, etc., to your prompt with a single click.',
    helpCreateTypesTitle: 'Creation Types',
    helpCreateTypesContent: 'Use specialized prompt templates to create Stickers, Logos, Comics, Sketches, or seamlessly tileable Patterns.',
    helpEditTitle: '🛠️ Edit Mode',
    helpEditIntro: 'Use this mode to modify an existing image using AI. Upload an image to get started.',
    helpEditFunctionsTitle: 'AI Editing Functions',
    helpEditFunctionsContent: "Add/Remove: Modify parts of an image. You can use a mask to tell the AI exactly where to make the change. \nRetouch: For subtle improvements like lighting or fixing minor blemishes. \nStyle: Completely transforms the artistic style of your image. \nCompose: Combines two images into a single new composition.",
    helpEditMaskingTitle: 'Masking Tools',
    helpEditMaskingContent: "When using 'Add/Remove', activate the mask to paint (in white) the areas the AI should change. This gives you precise control over the edit.",
    helpEditClientToolsTitle: 'Local Tools (No AI)',
    helpEditClientToolsContent: 'Add Text, Crop, applying Filters, and Rotate are quick edits done directly in your browser, without using the API.',
    helpRenderTitle: '🏗️ Render Mode',
    helpRenderIntro: 'A professional suite for architects and designers. Turn sketches, basic 3D models, or 2D floor plans into photorealistic renders.',
    helpRenderInputTitle: 'Input Types',
    helpRenderInputContent: "Choose whether your base image is a Sketch, 3D Model, or Floor Plan. The AI will interpret each differently to create the best result.",
    helpRenderFidelityTitle: 'Control Balance (Fidelity vs. Creativity)',
    helpRenderFidelityContent: 'This slider controls how strictly the AI must follow your base image. High fidelity maintains the original structure, while low creativity allows the AI to make more reinterpretations.',
    helpRenderPresetsTitle: 'Render Presets',
    helpRenderPresetsContent: 'Quickly add complex prompts for materials (wood, marble), lighting (daylight, night), and rendering actions with one click.',
    helpVideoTitle: '🎬 Video Mode',
    helpVideoIntro: 'Create short animations from an image, text, or a combination of both.',
    helpVideoImageTitle: 'Animation from Image',
    helpVideoImageContent: 'Upload a starting image and describe the desired movement in the prompt. E.g., "a dramatic close-up, the camera slowly pans out".',
    helpVideoTextTitle: 'Animation from Text',
    helpVideoTextContent: 'If no image is provided, the AI will create a video entirely from your text description.',
    helpWorkflowTitle: '✨ Workflow Tools',
    helpWorkflowGalleryTitle: 'Gallery',
    helpWorkflowGalleryContent: 'Save your favorite creations to the gallery. You can search, filter, and reuse any saved image as a base for a new edit or video.',
    helpWorkflowHistoryTitle: 'History & Undo/Redo',
    helpWorkflowHistoryContent: 'Every action you take is saved in the session history. Use the undo/redo buttons or the visual history panel to jump back to any previous step.',
    helpWorkflowComparatorTitle: 'Before/After Comparator',
    helpWorkflowComparatorContent: 'After an edit, use the comparator button to see an interactive slider showing the original and edited image side-by-side.',
    helpWorkflowExportTitle: 'Exporting',
    helpWorkflowExportContent: 'Download your final images with options to change the format (PNG/JPEG), quality, and even upscale the resolution to 4x the original size.',
  }
};

// --- Session Service Logic ---
const GALLERY_KEY_LEGACY = 'ai_image_studio_gallery';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const getCleanState = (): Omit<AppState, 'ui'> => ({
    mode: AppMode.CREATE,
    createFunction: CreateFunction.FREE,
    editFunction: EditFunction.ADD_REMOVE,
    renderInputType: RenderInputType.SKETCH,
    prompt: '',
    negativePrompt: 'cartoon, blurry, unrealistic, low quality, deformed',
    batchSize: 1,
    aspectRatio: '1:1',
    videoAspectRatio: '16:9',
    videoIncludeAudio: false,
    renderFidelity: 100,
    image1: null,
    originalImage1: null,
    image2: null,
    generatedImages: null,
    generatedVideoUrl: null,
    comparisonImage: null,
    addWatermark: false,
    customWatermark: null,
    textOverlay: { text: '', color: '#FFFFFF', size: 8, font: 'Arial', x: 50, y: 50 },
    cropState: { x: 25, y: 25, width: 50, height: 50 },
    mask: { image: null, brushSize: 10, mode: 'none' },
    isMaskingActive: false,
});

// Function to reconstruct File objects in a loaded state to prevent crashes
const reconstructStateFiles = (state: AppState): AppState => {
    const newState = { ...state };
    // We create dummy File objects because the original File cannot be stringified to JSON.
    // This ensures that subsequent operations that expect a File object don't crash.
    if (newState.image1 && !newState.image1.file) {
        newState.image1 = { ...newState.image1, file: new File([], "session_image1.png", { type: "image/png" }) };
    }
    if (newState.originalImage1 && !newState.originalImage1.file) {
        newState.originalImage1 = { ...newState.originalImage1, file: new File([], "session_original_image1.png", { type: "image/png" }) };
    }
    if (newState.image2 && !newState.image2.file) {
        newState.image2 = { ...newState.image2, file: new File([], "session_image2.png", { type: "image/png" }) };
    }
    if (newState.customWatermark && !newState.customWatermark.file) {
        newState.customWatermark = { ...newState.customWatermark, file: new File([], "session_watermark.png", { type: "image/png" }) };
    }
    return newState;
};

const getInitialState = (): AppState => ({
    ...getCleanState(),
    ui: {
        openSections: {
            create_style: true, create_settings: true, create_type: true,
            edit_function: true, edit_quick: false, edit_compose: true,
            render_base: true, render_settings: true, render_presets: true, render_controls: false,
            video_start: true, video_settings: false,
            edit_masking: true,
        },
        isHistoryPanelOpen: false,
        isMasking: false,
        showComparator: false,
    }
});

const adjustImageAspectRatio = (base64Image: string, targetRatioStr: AspectRatio): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64Image}`;
        image.onload = () => {
            const wOrig = image.naturalWidth;
            const hOrig = image.naturalHeight;
            const rOrig = wOrig / hOrig;

            const [wTargetRatio, hTargetRatio] = targetRatioStr.split(':').map(Number);
            const rTarget = wTargetRatio / hTargetRatio;

            // Allow for a small tolerance
            if (Math.abs(rOrig - rTarget) < 0.01) {
                resolve(base64Image);
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Canvas context not available');

            let wNew: number, hNew: number, xOffset: number, yOffset: number;

            if (rOrig > rTarget) { // Original is wider, add padding top/bottom
                wNew = wOrig;
                hNew = wOrig / rTarget;
                canvas.width = wNew;
                canvas.height = hNew;
                xOffset = 0;
                yOffset = (hNew - hOrig) / 2;
            } else { // Original is taller, add padding left/right
                hNew = hOrig;
                wNew = hOrig * rTarget;
                canvas.width = wNew;
                canvas.height = hNew;
                yOffset = 0;
                xOffset = (wNew - wOrig) / 2;
            }

            ctx.fillStyle = '#000000'; // Black background for padding
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, xOffset, yOffset);

            resolve(canvas.toDataURL('image/png').split(',')[1]);
        };
        image.onerror = () => reject('Failed to load image for aspect ratio adjustment.');
    });
};

const HistoryPanel: React.FC<{
    history: AppState[],
    historyIndex: number,
    onJump: (index: number) => void,
    onClose: () => void,
    t: (key: string, ...args: any[]) => string
}> = ({ history, historyIndex, onJump, onClose, t }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={panelRef} className="fixed top-0 left-0 h-full w-48 bg-slate-900/90 backdrop-blur-sm border-r border-slate-700 shadow-2xl z-40 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center p-3 border-b border-slate-700">
                <h3 className="font-bold text-slate-100">{t('historyPanelTitle')}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <div className="flex-grow overflow-y-auto p-2 space-y-2">
                {history.map((state, index) => {
                    const thumbnailSrc = state.generatedImages?.[0] || state.image1?.base64;
                    const label = index === 0 ? t('initialState') : `${t('step')} ${index}`;
                    const isActive = index === historyIndex;
                    return (
                        <button
                            key={index}
                            onClick={() => onJump(index)}
                            className={`w-full text-left p-2 rounded-md transition-colors flex items-center gap-3 ${isActive ? 'bg-banana-500/20 ring-2 ring-banana-500' : 'hover:bg-slate-700'}`}
                        >
                            <div className="w-12 h-12 bg-slate-800 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {thumbnailSrc ? (
                                    <img src={`data:image/png;base64,${thumbnailSrc}`} alt={label} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl text-slate-500">🎨</span>
                                )}
                            </div>
                            <span className={`text-sm font-medium ${isActive ? 'text-banana-400' : 'text-slate-300'}`}>{label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(getInitialState);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [lastDeletedImages, setLastDeletedImages] = useState<GalleryImage[] | null>(null);
  const undoDeleteTimeoutRef = useRef<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  
  const [history, setHistory] = useState<AppState[]>([getInitialState()]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isRestoringHistory = useRef(false);
  const generationCancelled = useRef(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });
  const [isDraggingFromGallery, setIsDraggingFromGallery] = useState(false);

  // --- API Key State ---
  const [, setApiKey] = useState<string | null>(geminiService.getApiKey());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // --- Language State ---
  const [language, setLanguage] = useState<Language>('pt');
  const t = useCallback((key: string, ...args: any[]): string => {
    const string = (translations[language] as any)[key] || key;
    if (typeof string === 'function') {
      return string.apply(null, args);
    }
    return string as string;
  }, [language]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Effect to show and hide toast notifications
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000); // Increased duration for important messages
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // Effect to load session and check for API key on startup
  useEffect(() => {
    const key = geminiService.getApiKey();
    setApiKey(key);
    if (!key) {
        setIsApiKeyModalOpen(true);
    }

    const loadSession = async () => {
      try {
        const savedState = await dbService.loadSessionState();
        if (savedState) {
          const reconstructedState = reconstructStateFiles(savedState);
          // Merge saved state with default UI state
          const mergedState = { ...getInitialState(), ...reconstructedState };
          setAppState(mergedState);
          setHistory([mergedState]);
          setHistoryIndex(0);
        }
      } catch (e) {
        console.error("Failed to load session from IndexedDB:", e);
      } finally {
        setIsSessionLoaded(true);
      }
    };
    loadSession();
  }, []); // Run only once on mount

  const updateStateAndHistory = useCallback((newState: AppState | ((prevState: AppState) => AppState)) => {
        const resolvedState = typeof newState === 'function' ? newState(appState) : newState;
        setAppState(resolvedState);

        if (isRestoringHistory.current) {
            isRestoringHistory.current = false;
            return;
        }
        
        // Only add to history if it's a meaningful change, not just a UI toggle
        const currentCoreState = { ...history[historyIndex], ui: {} };
        const newCoreState = { ...resolvedState, ui: {} };

        if (JSON.stringify(currentCoreState) !== JSON.stringify(newCoreState)) {
            const newHistory = [...history.slice(0, historyIndex + 1), resolvedState];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    }, [appState, history, historyIndex]);
  

  // Load gallery images from IndexedDB on startup and perform one-time migration
  useEffect(() => {
    const initGallery = async () => {
        // One-time migration from legacy localStorage key
        const oldGalleryJson = localStorage.getItem(GALLERY_KEY_LEGACY);
        if (oldGalleryJson) {
            try {
                const oldImages = JSON.parse(oldGalleryJson);
                const currentDBImages = await dbService.getImages();
                if (Array.isArray(oldImages) && oldImages.length > 0 && currentDBImages.length === 0) {
                    const migrationPromises = oldImages.map((img: any, index: number) => {
                        const src = typeof img === 'string' ? img : img.src;
                        const newImage: GalleryImage = {
                            id: `${(img.createdAt || Date.now())}-${index}-${Math.random().toString(36).substring(2, 9)}`,
                            src: src,
                            createdAt: img.createdAt || Date.now() - index * 1000,
                            isFavorite: img.isFavorite || false,
                            prompt: '', // Add empty prompt for old images
                        };
                        return dbService.addImage(newImage);
                    });
                    await Promise.all(migrationPromises);
                }
            } catch (e) {
                console.error('Failed to migrate gallery from legacy localStorage', e);
            } finally {
                localStorage.removeItem(GALLERY_KEY_LEGACY);
            }
        }
        
        const imagesFromDb = await dbService.getImages();
        setGalleryImages(imagesFromDb);
    };

    initGallery();
  }, []);


  useEffect(() => {
    if (appState.editFunction === EditFunction.CROP) {
      updateStateAndHistory(s => ({...s, cropState: { x: 25, y: 25, width: 50, height: 50 }}));
    }
  }, [appState.editFunction]);

  // Auto-save session state to IndexedDB to avoid quota errors from localStorage
  useEffect(() => {
      // Don't save until the initial session is loaded to prevent overwriting it.
      if (!isSessionLoaded) return;
      
      const handler = setTimeout(() => {
          // Exclude UI state from saving
          const { ui, ...stateToSave } = appState;
          dbService.saveSessionState(stateToSave as AppState).catch(e => {
            console.error("Failed to auto-save session to IndexedDB:", e);
          });
      }, 500);

      return () => clearTimeout(handler);
  }, [appState, isSessionLoaded]);

  useEffect(() => {
    const previousUrl = appState.generatedVideoUrl;
    return () => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
    };
  }, [appState.generatedVideoUrl]);

  const handleSetImage = useCallback((imageSlot: 'image1' | 'image2' | 'customWatermark', file: ImageFile | null) => {
      updateStateAndHistory(s => {
          const nextState: AppState = { ...s, [imageSlot]: file };
          if (imageSlot === 'image1' && file) {
              // When a new base image is uploaded, it also becomes the "original" for download purposes
              // and the visible "result" for immediate editing.
              nextState.originalImage1 = file;
              nextState.generatedImages = [file.base64];
              nextState.comparisonImage = null; // No "before" image for a fresh upload
              nextState.ui = { ...s.ui, showComparator: false };
          } else if (imageSlot === 'image1' && !file) {
              // If image is cleared, clear original as well
              nextState.originalImage1 = null;
              nextState.generatedImages = null;
              nextState.comparisonImage = null;
          }
          return nextState;
      });
  }, [updateStateAndHistory]);

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (!event.clipboardData) return;

    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                event.preventDefault();
                const base64 = await fileToBase64(file);
                const newImageFile: ImageFile = { file, base64 };

                if (appState.mode === AppMode.EDIT && appState.editFunction === EditFunction.COMPOSE) {
                    if (!appState.image1) {
                       handleSetImage('image1', newImageFile);
                    } else if (!appState.image2) {
                        handleSetImage('image2', newImageFile);
                    }
                } else if (appState.mode === AppMode.EDIT || appState.mode === AppMode.RENDER || appState.mode === AppMode.VIDEO) {
                    handleSetImage('image1', newImageFile);
                }
                return; // Stop after handling the first image
            }
        }
    }
  }, [appState, handleSetImage]);

  const handleModeChange = useCallback((newMode: AppMode) => {
    if (appState.mode === newMode) return;

    const nextState: AppState = {
        ...appState,
        mode: newMode,
        isMaskingActive: false,
        ui: { ...appState.ui, showComparator: false },
    };

    if ((newMode === AppMode.EDIT || newMode === AppMode.RENDER || newMode === AppMode.VIDEO) && appState.generatedImages && appState.generatedImages.length > 0) {
        const imageToUse = appState.generatedImages[selectedIndex] ?? appState.generatedImages[0];
        const newImageFile: ImageFile = {
            file: new File([], "generated_image.png", { type: "image/png" }),
            base64: imageToUse,
        };
        nextState.image1 = newImageFile;
        // When using a generated image as a base for a new mode, it starts a new edit chain.
        nextState.originalImage1 = newImageFile;
        nextState.image2 = null;
        setSelectedIndex(0);
    }

    if (newMode !== AppMode.VIDEO) {
        nextState.generatedVideoUrl = null;
    }
    
    updateStateAndHistory(nextState);
}, [appState, selectedIndex, updateStateAndHistory]);
  
  const handleUndo = useCallback(() => {
    if (canUndo) {
        isRestoringHistory.current = true;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setAppState(history[newIndex]);
    }
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
        isRestoringHistory.current = true;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setAppState(history[newIndex]);
    }
  }, [canRedo, history, historyIndex]);
  
  const handleToggleComparator = useCallback(() => {
    if (!appState.comparisonImage) return;
    
    // This is a UI-only action and should not create a history state.
    // We use setAppState directly to bypass updateStateAndHistory.
    setAppState(s => {
        // If masking is active, the primary action is to disable masking and enable the comparator.
        // This forces the comparator ON, avoiding the toggle issue where its previous state was also ON.
        if (s.isMaskingActive) {
            return {
                ...s,
                isMaskingActive: false,
                mask: { ...s.mask, mode: 'none' },
                ui: { ...s.ui, showComparator: true }
            };
        }

        // Otherwise, if masking is not active, simply toggle the comparator.
        const newShowComparatorState = !s.ui.showComparator;
        return {
            ...s,
            ui: { ...s.ui, showComparator: newShowComparatorState }
        };
    });
  }, [appState.comparisonImage]);

  // Effect to handle Escape key for canceling client-side tools and Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow escape from inputs
        if (e.key === 'Escape') {
            target.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (appState.editFunction === EditFunction.CROP || appState.editFunction === EditFunction.TEXT_OVERLAY) {
          updateStateAndHistory(s => ({ ...s, editFunction: EditFunction.ADD_REMOVE }));
        } else if (appState.ui.showComparator) {
            setAppState(s => ({ ...s, ui: { ...s.ui, showComparator: false } }));
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      } else if (e.altKey) {
          switch(e.key) {
              case '1': e.preventDefault(); handleModeChange(AppMode.CREATE); break;
              case '2': e.preventDefault(); handleModeChange(AppMode.EDIT); break;
              case '3': e.preventDefault(); handleModeChange(AppMode.RENDER); break;
              case '4': e.preventDefault(); handleModeChange(AppMode.VIDEO); break;
          }
      } else if (e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setIsGalleryModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);

    const handleDragEnd = () => setIsDraggingFromGallery(false);
    window.addEventListener('dragend', handleDragEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, [appState.editFunction, appState.ui.showComparator, historyIndex, history, handlePaste, handleUndo, handleRedo, handleModeChange]);
  

  const applyWatermark = (base64Image: string, watermarkFile: ImageFile | null): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64Image}`;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Canvas context not available'));
            }

            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            if (watermarkFile) {
              const watermarkImg = new Image();
              watermarkImg.src = `data:image/png;base64,${watermarkFile.base64}`;
              watermarkImg.onload = () => {
                const watermarkMaxSize = image.width * 0.20; 
                const scale = Math.min(1, watermarkMaxSize / watermarkImg.width, watermarkMaxSize / watermarkImg.height);
                const w = watermarkImg.width * scale;
                const h = watermarkImg.height * scale;
                const x = canvas.width - w - (canvas.width * 0.02); 
                const y = canvas.height - h - (canvas.height * 0.02); 

                ctx.globalAlpha = 0.8;
                ctx.drawImage(watermarkImg, x, y, w, h);
                ctx.globalAlpha = 1.0; 

                resolve(canvas.toDataURL('image/png').split(',')[1]);
              };
               watermarkImg.onerror = () => reject(new Error('Failed to load watermark image.'));

            } else {
              const watermarkText = 'AI Image Studio';
              ctx.font = `bold ${Math.max(16, canvas.width / 40)}px Arial`;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'bottom';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
              ctx.shadowBlur = 5;
              ctx.fillText(watermarkText, canvas.width - 15, canvas.height - 15);
              resolve(canvas.toDataURL('image/png').split(',')[1]);
            }
        };
        image.onerror = () => {
            reject(new Error('Failed to load image for watermarking.'));
        };
    });
  };
  
  const handleStopGeneration = () => {
    generationCancelled.current = true;
    setIsLoading(false);
    setError("Geração cancelada pelo usuário.");
    setGenerationProgress({ current: 0, total: 0 });
  };

  const handleGenerate = useCallback(async () => {
    generationCancelled.current = false;
    setIsLoading(true);
    setError(null);
    setGenerationProgress({ current: 0, total: appState.batchSize });
    
    let nextState: AppState = { ...appState, generatedVideoUrl: null, generatedImages: null, mask: {...appState.mask, image: null}, ui: {...appState.ui, showComparator: false} };

    // Set comparison image for edits, but NOT for compose, as it's ambiguous.
    if (appState.mode === AppMode.EDIT || appState.mode === AppMode.RENDER) {
        if (appState.editFunction === EditFunction.COMPOSE) {
            nextState.comparisonImage = null;
        } else if (appState.image1) {
            nextState.comparisonImage = appState.image1.base64;
        }
    } else {
        nextState.comparisonImage = null;
    }

    try {
      let image1ForApi = appState.image1;
      if (appState.mode === AppMode.RENDER && appState.image1) {
          const adjustedBase64 = await adjustImageAspectRatio(appState.image1.base64, appState.aspectRatio);
          image1ForApi = { ...appState.image1, base64: adjustedBase64 };
          nextState.comparisonImage = adjustedBase64;
      }

      let resultsBase64 = await generateImageApi({
        prompt: appState.prompt,
        negativePrompt: appState.negativePrompt,
        mode: appState.mode,
        createFn: appState.createFunction,
        editFn: appState.editFunction,
        renderInputType: appState.renderInputType,
        renderFidelity: appState.renderFidelity,
        image1: image1ForApi,
        image2: appState.image2,
        maskImage: appState.isMaskingActive ? appState.mask.image : null,
        batchSize: appState.batchSize,
        aspectRatio: appState.aspectRatio,
        onProgress: (current, total) => {
            if (!generationCancelled.current) {
                setGenerationProgress({ current, total });
            }
        },
      });

      if (generationCancelled.current) return; 

      if (appState.addWatermark) {
        resultsBase64 = await Promise.all(
          resultsBase64.map(img => applyWatermark(img, appState.customWatermark))
        );
      }
      
      if (generationCancelled.current) return; 
      
      const newBaseImageFile: ImageFile | null = resultsBase64[0] ? {
          file: new File([], "generated_image.png", { type: "image/png" }),
          base64: resultsBase64[0],
      } : null;

      if ((appState.mode === AppMode.EDIT || appState.mode === AppMode.RENDER) && newBaseImageFile) {
        nextState.image1 = newBaseImageFile;
        // For COMPOSE, the result starts a new editing chain. It becomes the new original,
        // and we clear the second image slot and any comparison data.
        if (appState.editFunction === EditFunction.COMPOSE) {
            nextState.originalImage1 = newBaseImageFile;
            nextState.image2 = null;
        }
      }

      nextState.generatedImages = resultsBase64;
      if (nextState.comparisonImage) {
        nextState.ui = {...nextState.ui, showComparator: true};
      }
      setSelectedIndex(0);
      updateStateAndHistory(nextState);

    } catch (e) {
      const err = e as Error;
      const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
      
      if (errorMessage.includes('API key not valid')) {
        setError(t('invalidApiKeyError'));
        setIsApiKeyModalOpen(true);
      } else {
        setError(errorMessage);
      }
      
      updateStateAndHistory(s => ({ ...s, comparisonImage: null, generatedImages: null }));
      console.error(e);
    } finally {
      setIsLoading(false);
      setGenerationProgress({ current: 0, total: 0 });
    }
  }, [appState, t, updateStateAndHistory]);
  
  const handleGenerateVideo = useCallback(async () => {
    if (!appState.image1 && !appState.prompt.trim()) return;

    generationCancelled.current = false;
    setIsLoading(true);
    setError(null);
    
    const nextState: AppState = { ...appState, generatedVideoUrl: null, comparisonImage: null, ui: { ...appState.ui, showComparator: false } };
    
    try {
        const videoUrl = await generateVideoApi({
            prompt: appState.prompt,
            negativePrompt: appState.negativePrompt,
            image: appState.image1,
        });
        
        if (generationCancelled.current) {
            URL.revokeObjectURL(videoUrl); // Clean up the created object URL
            return;
        }

        nextState.generatedVideoUrl = videoUrl;
        updateStateAndHistory(nextState);

    } catch (e) {
        const err = e as Error;
        const errorMessage = err.message || 'Ocorreu um erro desconhecido na geração de vídeo.';
        if (errorMessage.includes('API key not valid')) {
            setError(t('invalidApiKeyError'));
            setIsApiKeyModalOpen(true);
        } else {
            setError(errorMessage);
        }
        updateStateAndHistory(nextState);
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }, [appState, t, updateStateAndHistory]);

  const handleApplyText = useCallback(() => {
    const currentImage = appState.generatedImages?.[selectedIndex]; 
    if (!currentImage || !appState.textOverlay.text.trim()) return;

    setIsLoading(true);
    setError(null);

    const image = new Image();
    image.src = `data:image/png;base64,${currentImage}`;
    image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Canvas context not available');
          setIsLoading(false);
          return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const fontSize = (appState.textOverlay.size / 100) * canvas.width;
        ctx.font = `bold ${fontSize}px ${appState.textOverlay.font}`;
        ctx.fillStyle = appState.textOverlay.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = Math.max(2, fontSize / 20);
        
        const xPos = (appState.textOverlay.x / 100) * canvas.width;
        const yPos = (appState.textOverlay.y / 100) * canvas.height;

        ctx.fillText(appState.textOverlay.text, xPos, yPos);
        
        const newImageBase64 = canvas.toDataURL('image/png').split(',')[1];
        const newGeneratedImages = [...(appState.generatedImages || [])];
        newGeneratedImages[selectedIndex] = newImageBase64;

        updateStateAndHistory({
            ...appState, 
            comparisonImage: currentImage,
            generatedImages: newGeneratedImages, 
            textOverlay: {...appState.textOverlay, text: '' },
            editFunction: EditFunction.ADD_REMOVE, // Return to a neutral edit state
            ui: { ...appState.ui, showComparator: true },
        });
        
        setIsLoading(false);
    };
    image.onerror = () => {
      setError('Failed to load image for text application.');
      setIsLoading(false);
    };
  }, [appState, selectedIndex, updateStateAndHistory]);

  const handleApplyCrop = useCallback(() => {
    const currentImage = appState.generatedImages?.[selectedIndex];
    if (!currentImage) return;

    setIsLoading(true);
    setError(null);

    const image = new Image();
    image.src = `data:image/png;base64,${currentImage}`;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Canvas context not available');
        setIsLoading(false);
        return;
      }
      
      const sourceX = (appState.cropState.x / 100) * image.naturalWidth;
      const sourceY = (appState.cropState.y / 100) * image.naturalHeight;
      const sourceWidth = (appState.cropState.width / 100) * image.naturalWidth;
      const sourceHeight = (appState.cropState.height / 100) * image.naturalHeight;

      if (sourceWidth < 1 || sourceHeight < 1) {
        setError('A área de corte é muito pequena.');
        setIsLoading(false);
        return;
      }
      
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      ctx.drawImage(
        image,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, sourceWidth, sourceHeight
      );

      const newImageBase64 = canvas.toDataURL('image/png').split(',')[1];
      const newGeneratedImages = [...(appState.generatedImages || [])];
      newGeneratedImages[selectedIndex] = newImageBase64;

      updateStateAndHistory({
          ...appState, 
          generatedImages: newGeneratedImages, 
          comparisonImage: appState.comparisonImage || currentImage,
          editFunction: EditFunction.ADD_REMOVE, // Return to a neutral edit state
          ui: { ...appState.ui, showComparator: true },
      });
      setIsLoading(false);
    };
    image.onerror = () => {
      setError('Falha ao carregar a imagem para recortar.');
      setIsLoading(false);
    };
  }, [appState, selectedIndex, updateStateAndHistory]);

  const handleApplyFilter = useCallback((filter: ImageFilter) => {
    const sourceImage = appState.generatedImages?.[selectedIndex];
    if (!sourceImage) return;

    setIsLoading(true);
    setError(null);

    const image = new Image();
    image.src = `data:image/png;base64,${sourceImage}`;
    image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Canvas context not available');
            setIsLoading(false);
            return;
        }

        canvas.width = image.width;
        canvas.height = image.height;

        switch (filter) {
            case ImageFilter.GRAYSCALE:
                ctx.filter = 'grayscale(100%)';
                break;
            case ImageFilter.SEPIA:
                ctx.filter = 'sepia(100%)';
                break;
            case ImageFilter.INVERT:
                ctx.filter = 'invert(100%)';
                break;
            case ImageFilter.VINTAGE:
                ctx.filter = 'sepia(60%) contrast(90%) brightness(90%)';
                break;
        }

        ctx.drawImage(image, 0, 0);

        const newImageBase64 = canvas.toDataURL('image/png').split(',')[1];
        const newGeneratedImages = [...(appState.generatedImages || [])];
        newGeneratedImages[selectedIndex] = newImageBase64;

        updateStateAndHistory({
            ...appState,
            comparisonImage: appState.comparisonImage || sourceImage,
            generatedImages: newGeneratedImages,
            ui: { ...appState.ui, showComparator: true },
        });
        setIsLoading(false);
    };
    image.onerror = () => {
      setError('Failed to load image for filtering.');
      setIsLoading(false);
    };
  }, [appState.generatedImages, appState.comparisonImage, selectedIndex, updateStateAndHistory]);

  const handleApplyRotation = useCallback((degrees: 90 | -90) => {
    const sourceImage = appState.generatedImages?.[selectedIndex];
    if (!sourceImage) return;

    setIsLoading(true);
    setError(null);

    const image = new Image();
    image.src = `data:image/png;base64,${sourceImage}`;
    image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Canvas context not available');
            setIsLoading(false);
            return;
        }

        canvas.width = image.height;
        canvas.height = image.width;

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(degrees * Math.PI / 180);
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        
        const newImageBase64 = canvas.toDataURL('image/png').split(',')[1];
        
        const newGeneratedImages = [...(appState.generatedImages || [])];
        newGeneratedImages[selectedIndex] = newImageBase64;

        updateStateAndHistory({
            ...appState,
            comparisonImage: appState.comparisonImage || sourceImage,
            generatedImages: newGeneratedImages,
            ui: { ...appState.ui, showComparator: true },
        });
        setIsLoading(false);
    };
    image.onerror = () => {
      setError('Failed to load image for rotation.');
      setIsLoading(false);
    };
}, [appState.generatedImages, appState.comparisonImage, selectedIndex, updateStateAndHistory]);

  const handleUseAsBaseForAI = useCallback((imageToEdit: string) => {
    if (imageToEdit) {
      const newImageFile: ImageFile = {
        file: new File([], "generated_image.png", { type: "image/png" }),
        base64: imageToEdit,
      };
      updateStateAndHistory({
          ...appState,
          mode: AppMode.EDIT,
          editFunction: EditFunction.ADD_REMOVE,
          image1: newImageFile,
          originalImage1: newImageFile, // This starts a new editing chain, so it's the new "original"
          image2: null,
          generatedImages: [imageToEdit],
          generatedVideoUrl: null,
          comparisonImage: null,
          ui: { ...appState.ui, showComparator: false },
      });
      setSelectedIndex(0);
      window.scrollTo(0, 0);
    }
  }, [appState, updateStateAndHistory]);

  const handleNewImage = () => {
    const freshState = getInitialState();
    setAppState(freshState);
    setHistory([freshState]);
    setHistoryIndex(0);
    dbService.clearSessionState().catch(e => console.error("Failed to clear session state:", e));
  };

  const handleSaveToGallery = useCallback(async (imageToSave: string) => {
    if (!imageToSave) return;

    const existingImageSrcs = new Set(galleryImages.map(img => img.src));
    const imagesToSave: { src: string, prompt: string }[] = [];

    // 1. Check and add the "before" image (comparison image) if it exists and is not already in the gallery
    if (appState.comparisonImage && !existingImageSrcs.has(appState.comparisonImage)) {
        imagesToSave.push({ src: appState.comparisonImage, prompt: t('baseImagePrompt') });
        existingImageSrcs.add(appState.comparisonImage); // Add to set to prevent duplicate additions in this same operation
    }

    // 2. Check and add the "after" image (the one the user clicked save on) if it's not already in the gallery
    if (!existingImageSrcs.has(imageToSave)) {
        imagesToSave.push({ src: imageToSave, prompt: appState.prompt });
    }

    // If both were already in the gallery, show an info message
    if (imagesToSave.length === 0) {
        setToast({ message: t('imageAlreadyInGallery'), type: 'info' });
        return;
    }
    
    // Create new gallery items
    const newGalleryImages: GalleryImage[] = imagesToSave.map((imgInfo, index) => ({
        id: `${Date.now() + index}-${Math.random().toString(36).substring(2, 9)}`,
        src: imgInfo.src,
        createdAt: Date.now() + index,
        isFavorite: false,
        prompt: imgInfo.prompt,
    }));

    // Add them to DB and state
    await Promise.all(newGalleryImages.map(img => dbService.addImage(img)));
    setGalleryImages(prevImages => [...newGalleryImages, ...prevImages]);
    
    // Show a more informative toast
    const message = newGalleryImages.length > 1 
        ? t('imagesSaved', newGalleryImages.length) 
        : t('imageSaved');
    setToast({ message, type: 'success' });

}, [galleryImages, appState.prompt, appState.comparisonImage, t]);


  const handleDeleteAllFromGallery = useCallback(async () => {
    if (galleryImages.length === 0) return;

    if (window.confirm(t('confirmDeleteAllImages', galleryImages.length))) {
        if (undoDeleteTimeoutRef.current) {
            clearTimeout(undoDeleteTimeoutRef.current);
        }
        setLastDeletedImages([...galleryImages]);
        await dbService.clearImages();
        setGalleryImages([]);

        undoDeleteTimeoutRef.current = window.setTimeout(() => {
            setLastDeletedImages(null);
        }, 7000); // 7 seconds to undo
    }
  }, [galleryImages, t]);

  const handleUndoDelete = useCallback(async () => {
      if (!lastDeletedImages) return;

      const restorePromises = lastDeletedImages.map(img => dbService.addImage(img));
      await Promise.all(restorePromises);
      
      setGalleryImages(prevImages => [...prevImages, ...lastDeletedImages].sort((a,b) => b.createdAt - a.createdAt));
      setLastDeletedImages(null);
      if (undoDeleteTimeoutRef.current) {
          clearTimeout(undoDeleteTimeoutRef.current);
          undoDeleteTimeoutRef.current = null;
      }
  }, [lastDeletedImages]);

  const handleDeleteFromGallery = async (id: string) => {
    const imageToDelete = galleryImages.find(img => img.id === id);
    if (!imageToDelete) return;

    if (undoDeleteTimeoutRef.current) {
        clearTimeout(undoDeleteTimeoutRef.current);
    }
    
    setLastDeletedImages([imageToDelete]);
    await dbService.deleteImage(id);
    setGalleryImages(prevImages => prevImages.filter(image => image.id !== id));

    undoDeleteTimeoutRef.current = window.setTimeout(() => {
        setLastDeletedImages(null);
    }, 7000);
  };

  const handleToggleFavorite = useCallback(async (id: string) => {
    const image = galleryImages.find(img => img.id === id);
    if (image) {
        const updatedImage = { ...image, isFavorite: !image.isFavorite };
        await dbService.updateImage(updatedImage);
        setGalleryImages(prevImages =>
            prevImages.map(img => (img.id === id ? updatedImage : img))
        );
    }
  }, [galleryImages]);

  const handleUseAsBaseFromGallery = useCallback((base64Image: string) => {
    const newImageFile: ImageFile = {
      file: new File([], "gallery_selection.png", { type: "image/png" }),
      base64: base64Image,
    };
    const newState = {
      ...getInitialState(),
      mode: AppMode.EDIT,
      image1: newImageFile,
      originalImage1: newImageFile,
      generatedImages: [base64Image],
    };
    setAppState(newState);
    setHistory([newState]);
    setHistoryIndex(0);
    setIsGalleryModalOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const handleCreateVideoFromGalleryImage = useCallback((base64Image: string) => {
    const newImageFile: ImageFile = {
      file: new File([], "gallery_selection.png", { type: "image/png" }),
      base64: base64Image,
    };
    const newState = {
      ...getInitialState(),
      mode: AppMode.VIDEO,
      image1: newImageFile,
      originalImage1: newImageFile,
      generatedImages: [base64Image] // Keep the image visible
    };
    setAppState(newState);
    setHistory([newState]);
    setHistoryIndex(0);
    setIsGalleryModalOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const handleJumpToHistory = useCallback((index: number) => {
      if (index >= 0 && index < history.length) {
          isRestoringHistory.current = true;
          setHistoryIndex(index);
          setAppState(history[index]);
      }
  }, [history]);
  
  const handleInvertMask = useCallback((maskToInvert?: string) => {
    const image = appState.generatedImages?.[selectedIndex];
    if (!image) return;

    const img = new Image();
    img.src = `data:image/png;base64,${image}`;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const maskSrc = maskToInvert ?? appState.mask.image;

        if (maskSrc) {
            const maskImg = new Image();
            maskImg.src = `data:image/png;base64,${maskSrc}`;
            maskImg.onload = () => {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
                const invertedMaskBase64 = canvas.toDataURL('image/png').split(',')[1];
                updateStateAndHistory(s => ({ ...s, mask: { ...s.mask, image: invertedMaskBase64 } }));
            };
        } else {
            const invertedMaskBase64 = canvas.toDataURL('image/png').split(',')[1];
            updateStateAndHistory(s => ({ ...s, mask: { ...s.mask, image: invertedMaskBase64 } }));
        }
    };
  }, [appState, selectedIndex, updateStateAndHistory]);

  const handleSelectedIndexChange = (index: number) => {
    setSelectedIndex(index);
  };
  
  const handleApiKeySubmit = (key: string) => {
    geminiService.setApiKey(key);
    setApiKey(key);
    setIsApiKeyModalOpen(false);
  };

  if (!isSessionLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-banana-400 mx-auto mb-4"></div>
          <p>{t('loadingSession')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950/50">
       <ApiKeyModal isOpen={isApiKeyModalOpen} onSubmit={handleApiKeySubmit} t={t} />
       <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} t={t} />
       {appState.ui.isHistoryPanelOpen && <HistoryPanel history={history} historyIndex={historyIndex} onJump={handleJumpToHistory} onClose={() => setAppState(s => ({ ...s, ui: { ...s.ui, isHistoryPanelOpen: false }}))} t={t} />}
      <GalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        images={galleryImages}
        onUseAsBase={handleUseAsBaseFromGallery}
        onCreateVideo={handleCreateVideoFromGalleryImage}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteFromGallery}
        onDeleteAll={handleDeleteAllFromGallery}
        searchQuery={gallerySearchQuery}
        onSearchChange={setGallerySearchQuery}
        setIsDraggingFromGallery={setIsDraggingFromGallery}
        t={t}
      />
      
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-screen-2xl mx-auto p-4 lg:p-8">
        <div className="lg:col-span-1">
          <LeftPanel
            appState={appState}
            setAppState={updateStateAndHistory}
            onModeChange={handleModeChange}
            isLoading={isLoading}
            onGenerate={handleGenerate}
            onGenerateVideo={handleGenerateVideo}
            onStop={handleStopGeneration}
            onApplyText={handleApplyText}
            onApplyCrop={handleApplyCrop}
            onApplyFilter={handleApplyFilter}
            onApplyRotation={handleApplyRotation}
            onInvertMask={handleInvertMask}
            hasGeneratedImage={!!appState.generatedImages && appState.generatedImages.length > 0}
            onNewImage={handleNewImage}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onToggleComparator={handleToggleComparator}
            t={t}
            language={language}
            setLanguage={setLanguage}
            setIsApiKeyModalOpen={setIsApiKeyModalOpen}
            setIsHelpModalOpen={setIsHelpModalOpen}
            isDraggingFromGallery={isDraggingFromGallery}
            setToast={setToast}
            handleSetImage={handleSetImage}
          />
        </div>
        <div className="lg:col-span-1">
          <RightPanel
            isLoading={isLoading}
            generatedImages={appState.generatedImages}
            generatedVideoUrl={appState.generatedVideoUrl}
            comparisonImage={appState.comparisonImage}
            error={error}
            onUseAsBaseForAI={handleUseAsBaseForAI}
            onNewImage={handleNewImage}
            onSave={handleSaveToGallery}
            onOpenGallery={() => setIsGalleryModalOpen(true)}
            setIsDraggingFromGallery={setIsDraggingFromGallery}
            mode={appState.mode}
            editFunction={appState.editFunction}
            textOverlay={appState.textOverlay}
            setTextOverlay={(updater) => updateStateAndHistory(s => ({ ...s, textOverlay: typeof updater === 'function' ? updater(s.textOverlay) : updater }))}
            cropState={appState.cropState}
            setCropState={(updater) => updateStateAndHistory(s => ({ ...s, cropState: typeof updater === 'function' ? updater(s.cropState) : updater }))}
            maskState={appState.mask}
            setMaskState={(updater) => updateStateAndHistory(s => ({ ...s, mask: typeof updater === 'function' ? updater(s.mask) : updater }))}
            isMaskingActive={appState.isMaskingActive}
            selectedIndex={selectedIndex}
            onSelectIndex={handleSelectedIndexChange}
            generationProgress={generationProgress}
            prompt={appState.prompt}
            showComparator={appState.ui.showComparator}
            t={t}
          />
        </div>
      </main>

      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg text-white animate-fade-in ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {lastDeletedImages && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-slate-200 py-3 px-5 rounded-lg shadow-lg flex items-center gap-4 animate-fade-in z-50">
            <p>
              {lastDeletedImages.length === 1
                ? t('imageRemoved')
                : `${t('galleryCleaned')} (${lastDeletedImages.length} ${t('imagesRemoved')})`}
            </p>
            <button
                onClick={handleUndoDelete}
                className="font-bold text-banana-400 hover:text-banana-300 transition-colors"
            >
                {t('undo')}
            </button>
        </div>
      )}
      <footer className="text-center text-slate-500 mt-2 pb-4">
        <p>
          Desenvolvido por{' '}
          <a 
            href="https://renatofigueiredo.me/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-banana-400 hover:underline"
          >
            Renato Figueiredo
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;