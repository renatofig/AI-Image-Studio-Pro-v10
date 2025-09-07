# 🎨 AI Image Studio

AI Image Studio é uma suíte profissional, versátil e inteiramente baseada no navegador para geração e edição de imagens e vídeos, alimentada pela avançada API Gemini do Google. Ele transforma suas ideias em visuais impressionantes, seja criando do zero, editando imagens existentes ou renderizando projetos de arquitetura.

Este aplicativo foi projetado para ser executado inteiramente no navegador. Na primeira utilização, será solicitado que você insira sua própria chave de API do Google Gemini. Sua chave é armazenada de forma segura no seu navegador (`localStorage`) e nunca é enviada para nossos servidores.

> **⚠️ Aviso Importante sobre Custos:** O uso da API do Google Gemini pode incorrer em custos, dependendo do seu volume de uso. A geração de **vídeos**, em particular, é uma tarefa computacionalmente intensiva e pode consumir sua cota ou gerar custos mais rapidamente do que a geração de imagens. Monitore seu uso e seus limites de cobrança na sua conta do Google Cloud.

## ✨ Principais Funcionalidades

O estúdio é organizado em quatro modos poderosos, cada um com um conjunto de ferramentas especializadas.

### 1. 🎨 Modo Criar (Create Mode)

Dê vida às suas ideias com a geração de imagens a partir de texto.

*   **Prompt Livre:** Descreva qualquer cena ou conceito que você possa imaginar.
*   **Melhoria e Tradução de Prompt:**
    *   **Melhorar (✨):** Uma "varinha mágica" que enriquece seus prompts simples, adicionando detalhes de estilo de arte, iluminação e composição para resultados superiores.
    *   **Traduzir (🌍):** Traduza seu prompt entre português e inglês com um clique. Modelos de IA geralmente funcionam melhor com prompts em inglês.
*   **Tipos de Criação Especializados:** Use prompts otimizados para criar:
    *   **🏷️ Adesivos (Stickers):** Designs vibrantes com contornos nítidos.
    *   **📝 Logos:** Conceitos de logo limpos e modernos.
    *   **💭 HQ (Comics):** Painéis de quadrinhos com estilo dinâmico.
    *   **✏️ Esboços (Sketches):** Desenhos realistas a lápis.
    *   **⧉ Padrões (Patterns):** Texturas e fundos perfeitamente repetíveis (seamless).
*   **Predefinições de Estilo:** Aplique estilos complexos como Fotográfico, Anime, Fantasia, Cyberpunk e Aquarela com um único clique.
*   **Configurações de Geração:** Controle total sobre a **proporção** (1:1, 16:9, 9:16) e o **número de imagens** (até 4 por vez).

### 2. 🛠️ Modo Editar (Edit Mode)

Modifique e aprimore suas imagens com ferramentas inteligentes e de edição clássica.

*   **Edição com IA:**
    *   **Adicionar/Remover:** Adicione ou remova objetos de uma imagem de forma integrada.
    *   **Retoque:** Realize melhorias e correções sutis.
    *   **Mudar Estilo:** Transforme a estética de uma imagem completamente.
    *   **Unir Imagens:** Combine duas imagens para criar uma composição única.
*   **Ferramentas de Edição no Cliente:**
    *   **Adicionar Texto:** Sobreponha texto com controle de cor, tamanho e posição (arrastável).
    *   **Cortar (Crop):** Recorte suas imagens de forma não destrutiva.
    *   **Filtros e Rotação:** Aplique filtros rápidos (ex: Sépia, Vintage) e gire a imagem.

### 3. 🏗️ Modo Renderizar (Render Mode)

Uma suíte de ferramentas profissionais para arquitetos, designers de interiores e artistas conceituais.

*   **Tipos de Input Profissionais:** Faça o upload de suas bases e a IA as transformará em renders fotorrealistas.
    *   **✏️ Esboço:** Converta desenhos de linha em imagens detalhadas.
    *   **🧊 Modelo 3D Básico:** Adicione texturas e iluminação realistas a modelos com cores simples.
    *   **📐 Planta Baixa 2D:** "Extrude" uma planta baixa em uma visualização 3D em perspectiva.
*   **Controle Fino de Renderização:**
    *   **Slider de Fidelidade vs. Criatividade:** Diga à IA o quão estritamente ela deve seguir sua imagem base.
    *   **Presets Contextuais:** Adicione rapidamente descrições de Materiais (Madeira, Mármore, Vidro), Iluminação (Luz do Dia, Pôr do Sol) e Ações (Extrudar Planta, Prompt de Renderização).

### 4. 🎬 Modo Vídeo (Video Mode)

Crie pequenas animações a partir de uma imagem ou de uma ideia.

*   **Animação a partir de Imagem:** Forneça uma imagem inicial e descreva o movimento ou a transformação que você deseja ver.
*   **Animação a partir de Texto:** Crie um vídeo diretamente de uma descrição textual, sem precisar de uma imagem inicial.
*   **Combinação:** Use uma imagem inicial e um prompt de texto para guiar a animação com precisão.

## ✨ Ferramentas Inteligentes e de Fluxo de Trabalho

*   **Upload Flexível:** Carregue imagens clicando, arrastando e soltando, ou colando diretamente da sua área de transferência (Ctrl+V).
*   **Prompt Negativo:** Especifique o que você quer evitar na imagem ou vídeo para refinar os resultados.
*   **Galeria Integrada:**
    *   Salva suas criações favoritas.
    *   Busca por prompt e ordenação (data, favoritos) para encontrar facilmente imagens antigas.
    *   Crie um vídeo diretamente de uma imagem salva na galeria.
*   **Desfazer/Refazer (Undo/Redo):** Histórico completo de ações para que você nunca perca uma boa ideia.
*   **Comparador de Imagens:** Um slider de "antes e depois" para visualizar o impacto das suas edições.
*   **Exportação Avançada:** Faça o download de suas imagens com opções de formato (PNG/JPEG), qualidade e upscaling (até 4x).
*   **Sessão Persistente:** Seu trabalho atual é salvo automaticamente no navegador, para que você possa continuar de onde parou.

## 🚀 Tecnologias Utilizadas

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **API de IA:** Google Gemini (gemini-2.5-flash, imagen-4.0-generate-001, veo-2.0-generate-001)
*   **Armazenamento no Cliente:** IndexedDB para a galeria e o estado da sessão, `localStorage` para a chave de API.
*   **Build Tool:** Vite

## ⚙️ Como Usar (Para Desenvolvedores)

### 1. Pré-requisitos

*   Node.js (versão 18 ou superior) instalado.

### 2. Configuração Local

*   **Instale as Dependências:**
    ```bash
    npm install
    ```
*   **Execute o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
*   **Abra o aplicativo no navegador:**
    O aplicativo será aberto em `http://localhost:5173` (ou uma porta similar). Ao carregar, ele solicitará sua chave de API do Google Gemini para funcionar.

### 3. Como Obter sua Chave de API do Gemini

1.  Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Clique em "Create API key" para gerar uma nova chave.
3.  Copie a chave gerada.

## 📦 Como Publicar

*   **Construa o Aplicativo (Build):**
    ```bash
    npm run build
    ```
    Este comando criará uma pasta chamada `dist` na raiz do seu projeto. Esta pasta contém todos os arquivos estáticos (.html, .js, .css) otimizados para produção.
*   **Implantação (Deploy):**
    Faça o upload do conteúdo da pasta `dist` para o diretório público do seu servidor de hospedagem (por exemplo, `public_html`, `www`, etc.). O aplicativo funcionará sem configuração adicional no servidor, pois ele solicitará a chave de API diretamente ao usuário no navegador.
