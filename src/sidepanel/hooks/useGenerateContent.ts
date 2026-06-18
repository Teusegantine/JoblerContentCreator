import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export interface CarouselSlide {
  title: string;
  subtitle: string;
  body: string;
  pageNumber: string;
}

export interface GeneratedContent {
  postText: string;
  slides: CarouselSlide[];
}

export interface GenerationHistoryItem {
  id: string;
  source_url: string;
  source_title: string;
  original_text: string;
  metadata: {
    style: string;
    tone: string;
    formality: string;
    allowBuzzwords: boolean;
    allowUnfiltered: boolean;
    extraInstructions: string;
    slides: CarouselSlide[];
    llmModel?: string;
    globalRule?: string;
  };
  created_at: string;
}

interface GenerateParams {
  url: string;
  title: string;
  text: string;
  extraInstructions: string;
  style: string;
  tone: string;
  formality: string;
  allowBuzzwords: boolean;
  allowUnfiltered: boolean;
  llmModel?: string;
  globalRule?: string;
  geminiKey?: string;
  openaiKey?: string;
  deepseekKey?: string;
}

// Helper to build the unified prompt for live LLM requests
function buildUnifiedPrompt(params: {
  title: string;
  url: string;
  text: string;
  extraInstructions: string;
  style: string;
  tone: string;
  formality: string;
  allowBuzzwords: boolean;
  allowUnfiltered: boolean;
  globalRule: string;
}): string {
  const { title, url, text, extraInstructions, style, tone, formality, allowBuzzwords, allowUnfiltered, globalRule } = params;

  const styleInstructions = {
    journalistic: "Jornalístico (Informativo e Neutro): Focado na objetividade, imparcialidade e nos fatos brutos. Usa a estrutura da pirâmide invertida (as informações mais importantes vêm primeiro) e responde de cara ao quem, o quê, onde, quando e por quê. Não há espaço para achismos. Indicado para notícias, relatórios de mercado, press releases e portais de informação.",
    opinion: "Opinião Pessoal (Autoral e Crítico): Focado na perspectiva e na bagagem do autor. Escrito geralmente em primeira pessoa, defende um ponto de vista claro sobre um acontecimento ou tendência, misturando argumentos lógicos com impressões subjetivas. Indicado para posts de posicionamento no LinkedIn, ensaios e newsletters reflexivas.",
    technical: "Técnico e Acadêmico: Focado na precisão cirúrgica, rigor e profundidade científica. Usa terminologia especializada do setor, cita fontes validadas se disponíveis e segue uma estrutura lógica rígida (introdução, metodologia, análise de dados e conclusão), sem margem para duplas interpretações. Indicado para documentações de software, manuais, artigos científicos e whitepapers.",
    creative: "Criativo e Literário: Focado na estética da linguagem, no ritmo e na experiência sensorial do leitor. Explora figuras de linguagem, jogos de palavras, metáforas e subtextos para provocar sentimentos ou reflexões profundas, sem a obrigação de seguir uma estrutura linear ou factual. Indicado para crônicas, roteiros, branding conceitual de luxo e biografias."
  }[style] || "Geral";

  const toneInstructions = {
    provocative: "Direto e Provocativo: Focado em urgência. Usa frases curtas, imperativos fortes e apela fortemente para a dor ou para o desejo de ganho rápido. Perfeito para lançamentos e promoções relâmpago.",
    emotional: "Storytelling e Emocional: Focado em criar conexão e empatia. Use narrativas, metáforas, analogias e a jornada do herói para engajar contando histórias impactantes. Excelente para branding e marketing de conteúdo.",
    educational: "Autoridade e Educativo: Focado em dados, pesquisas e lógica. Posicione-se como um especialista do setor, quebrando objeções através de provas sociais e fatos. Ideal para mercado B2B e produtos de alto valor.",
    friendly: "Conversacional e Amigável: Linguagem informal, como se um amigo estivesse recomendando algo em um tom leve. Sem jargões técnicos excessivos, com parágrafos curtos e tom descontraído."
  }[tone] || "Profissional";

  const articleSection = title || text
    ? `### Artigo para leitura:
- Título: ${title}
- URL: ${url || 'Não informado'}
- Texto do Artigo:
${text}
`
    : `### Instrução de Geração:
Não há artigo de referência. Gere o conteúdo inteiramente com base nas instruções de criação fornecidas abaixo.
`;

  return `Você é um criador de conteúdo sênior especializado em Recrutamento, Seleção e desenvolvimento de talentos (Headhunter). Sua tarefa é gerar uma postagem rica para o LinkedIn/Instagram e um carrossel de exatamente 5 slides.

${articleSection}

### Instruções de Configuração e Filtros:
- Estilo de Escrita: ${styleInstructions}
- Tom de Voz: ${toneInstructions}
- Formalidade: Nível ${formality === 'casual' ? 'Casual / Espontâneo (use emojis moderados e linguagem direta)' : 'Corporativo / Formal (linguagem polida e profissional)'}
- Corporate English & Buzzwords (ex: Match, Ghosting, Fit Cultural): ${allowBuzzwords ? 'Permitido usar termos do meio de RH e contratação tech' : 'Evitar jargões, priorizar português claro'}
- Linguagem Descontraída/Sem Filtros: ${allowUnfiltered ? 'Permitido usar papo reto, na real, e termos espontâneos.' : 'Manter escrita profissional e equilibrada.'}
- O que quer que eu crie para você: ${extraInstructions || 'Gere um conteúdo de altíssimo valor sobre as tendências do mercado de talentos e RH.'}

### Regra Global a ser seguida à risca (MUITO IMPORTANTE):
${globalRule || 'Nenhuma.'}

### Requisitos do JSON de Saída:
Retorne estritamente o JSON contendo:
- "postText": O texto completo do post a ser copiado.
- "slides": Array com exatamente 5 elementos. Cada elemento contendo:
  - "title": Título curto do slide (limite de 45 caracteres)
  - "subtitle": Subtítulo ou tag superior do slide (limite de 35 caracteres)
  - "body": O conteúdo textual do slide (limite de 145 caracteres)
  - "pageNumber": A numeração da página no formato "01 de 05", "02 de 05", etc. (o slide 5 deve ser um CTA focado em conexão).

Retorne estritamente o JSON cru, sem marcações markdown como \`\`\`json.`;
}

export function useGenerateContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  const generateContent = async (params: GenerateParams): Promise<GeneratedContent> => {
    setLoading(true);
    setError(null);

    const { url, title, text, extraInstructions, style, tone, formality, allowBuzzwords, allowUnfiltered, llmModel, globalRule, geminiKey, openaiKey, deepseekKey } = params;
    const activeModel = llmModel || 'gemini';

    // Helper to persist history data locally or in Supabase database
    const finalizeAndPersist = async (parsed: { postText: string; slides: CarouselSlide[] }) => {
      const userSession = isSupabaseConfigured ? (await supabase?.auth.getSession())?.data.session : null;
      
      const newPostData = {
        source_url: url,
        source_title: title,
        original_text: parsed.postText,
        metadata: {
          style,
          tone,
          formality,
          allowBuzzwords,
          allowUnfiltered,
          extraInstructions,
          slides: parsed.slides,
          llmModel: activeModel,
          globalRule
        }
      };

      if (isSupabaseConfigured && supabase && userSession?.user) {
        const { error: insertError } = await supabase
          .from('posts')
          .insert([{ user_id: userSession.user.id, ...newPostData }]);
        if (insertError) console.error("Erro ao salvar no Supabase:", insertError);
      } else {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const result = await chrome.storage.local.get(['generation_history']) as any;
          const localHistory: GenerationHistoryItem[] = result.generation_history || [];
          
          const historyItem: GenerationHistoryItem = {
            id: crypto.randomUUID(),
            ...newPostData,
            created_at: new Date().toISOString()
          };

          const updatedHistory = [historyItem, ...localHistory].slice(0, 20);
          await chrome.storage.local.set({ generation_history: updatedHistory });
          setHistory(updatedHistory);
        }
      }
      return parsed;
    };

    try {
      const prompt = buildUnifiedPrompt({
        title,
        url,
        text,
        extraInstructions,
        style,
        tone,
        formality,
        allowBuzzwords,
        allowUnfiltered,
        globalRule: globalRule || ""
      });

      // ==========================================
      // CASE A: Live Google Gemini 2.5 Flash Call
      // ==========================================
      if (activeModel === 'gemini' && geminiKey) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  postText: { type: "STRING" },
                  slides: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        title: { type: "STRING" },
                        subtitle: { type: "STRING" },
                        body: { type: "STRING" },
                        pageNumber: { type: "STRING" }
                      },
                      required: ["title", "subtitle", "body", "pageNumber"]
                    }
                  }
                },
                required: ["postText", "slides"]
              }
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Erro no Gemini (${response.status})`);
        }

        const data = await response.json();
        const rawResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawResponseText) throw new Error("O Gemini retornou um corpo de texto vazio.");

        const parsed = JSON.parse(rawResponseText);
        parsed.postText = `🤖 [Google Gemini 2.5 Flash]\n\n` + parsed.postText;
        return await finalizeAndPersist(parsed);
      }

      // ==========================================
      // CASE B: Live OpenAI GPT-4o-mini Call
      // ==========================================
      if (activeModel === 'openai' && openaiKey) {
        const endpoint = 'https://api.openai.com/v1/chat/completions';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "Você é um gerador de conteúdo estruturado. Retorne estritamente um JSON no formato: { \"postText\": \"LinkedIn copy string\", \"slides\": [ { \"title\": \"slide title\", \"subtitle\": \"slide subtitle\", \"body\": \"slide text content\", \"pageNumber\": \"01 de 05\" } ] }. Devem ser gerados exatamente 5 slides."
              },
              {
                role: "user",
                content: prompt
              }
            ]
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Erro no OpenAI (${response.status})`);
        }

        const data = await response.json();
        const rawResponseText = data.choices?.[0]?.message?.content;
        if (!rawResponseText) throw new Error("A OpenAI retornou uma resposta sem conteúdo.");

        const parsed = JSON.parse(rawResponseText);
        parsed.postText = `🤖 [OpenAI GPT-4.1 mini]\n\n` + parsed.postText;
        return await finalizeAndPersist(parsed);
      }

      // ==========================================
      // CASE C: Live DeepSeek Call
      // ==========================================
      if (activeModel === 'deepseek' && deepseekKey) {
        const endpoint = 'https://api.deepseek.com/chat/completions';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "Você é um gerador de conteúdo estruturado. Retorne estritamente um JSON no formato: { \"postText\": \"LinkedIn copy string\", \"slides\": [ { \"title\": \"slide title\", \"subtitle\": \"slide subtitle\", \"body\": \"slide text content\", \"pageNumber\": \"01 de 05\" } ] }. Devem ser gerados exatamente 5 slides."
              },
              {
                role: "user",
                content: prompt
              }
            ]
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Erro na DeepSeek (${response.status})`);
        }

        const data = await response.json();
        const rawResponseText = data.choices?.[0]?.message?.content;
        if (!rawResponseText) throw new Error("A DeepSeek retornou uma resposta vazia.");

        const parsed = JSON.parse(rawResponseText);
        parsed.postText = `🤖 [DeepSeek DeepSeek-R1]\n\n` + parsed.postText;
        return await finalizeAndPersist(parsed);
      }

      // ==========================================
      // CASE D: Simulation / Mock Fallback Mode
      // ==========================================
      // Triggered if the active model does not have a key configured
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulating network latency

      const cleanTitle = title || (extraInstructions.trim() ? extraInstructions.trim() : "o Mercado de Trabalho e Tecnologia");
      const topic = title 
        ? cleanTitle.replace(/ - .*/, "").trim()
        : (extraInstructions.trim() 
            ? (extraInstructions.length > 50 ? extraInstructions.substring(0, 47) + "..." : extraInstructions)
            : "o Mercado de Trabalho e Tecnologia");

      const cleanText = text || "";
      const paragraphs = cleanText
        .split('\n\n')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 30 && !p.includes('[Texto truncado'));
      
      let articleInsight = "a rápida transformação e os novos rumos do mercado.";
      if (paragraphs.length > 0) {
        const goodPara = paragraphs.find((p: string) => p.length > 80 && p.length < 300) || paragraphs[0];
        articleInsight = goodPara;
      } else if (extraInstructions.trim()) {
        articleInsight = extraInstructions.trim();
      }
      
      let secondaryDetail = "Esta evolução exige um posicionamento ágil e adaptável dos profissionais e líderes.";
      if (paragraphs.length > 1) {
        const remainingParas = paragraphs.filter((p: string) => p !== articleInsight);
        const secondPara = remainingParas.find((p: string) => p.length > 60 && p.length < 250) || remainingParas[0];
        if (secondPara) {
          secondaryDetail = secondPara;
        }
      } else if (extraInstructions.trim()) {
        secondaryDetail = "Criação baseada inteiramente nas diretrizes estratégicas indicadas pelo usuário.";
      }
      
      if (articleInsight.length > 200) {
        articleInsight = articleInsight.substring(0, 197) + "...";
      }
      if (secondaryDetail.length > 180) {
        secondaryDetail = secondaryDetail.substring(0, 177) + "...";
      }

      const buzzwordList = allowBuzzwords 
        ? ["Fit Cultural", "Ghosting em entrevistas", "Match de habilidades", "Sourcing estratégico", "Candidate Experience", "Talent Acquisition", "Hard vs Soft Skills"]
        : [];
      
      const buzzWordStr = buzzwordList.length > 0 
        ? ` (Garantindo o ${buzzwordList[0]}, evitando ${buzzwordList[1]} e fortalecendo o ${buzzwordList[4]}!)` 
        : "";

      const rawPhrases = allowUnfiltered
        ? ["papo reto", "na real", "vamos ser sinceros", "a verdade nua e crua", "sem blá-blá-blá"]
        : [];
      
      const filterStr = rawPhrases.length > 0 ? `, ${rawPhrases[0]},` : "";

      let extraInstructionsParagraph = "";
      if (extraInstructions.trim()) {
        const extraText = extraInstructions.trim();
        const formattedExtra = extraText.endsWith('.') || extraText.endsWith('!') || extraText.endsWith('?') 
          ? extraText 
          : extraText + '.';
        extraInstructionsParagraph = `\n\n🎯 **Direcionamento Estratégico:** Focando no direcionamento recebido: ${formattedExtra}`;
      }

      let postText = "";
      let slides: CarouselSlide[] = [];
      const styleLabel = {
        journalistic: "Jornalístico (Informativo e Neutro)",
        opinion: "Opinião Pessoal (Autoral e Crítico)",
        technical: "Técnico e Acadêmico",
        creative: "Criativo e Literário"
      }[style] || "Reflexão Geral";

      const toneLabel = {
        provocative: "Direto e Provocativo",
        emotional: "Storytelling e Emocional",
        educational: "Autoridade e Educativo",
        friendly: "Conversacional e Amigável"
      }[tone] || "Profissional";

      if (style === 'journalistic') {
        postText = `📰 ANÁLISE DE MERCADO: ${topic.toUpperCase()}\n\n` +
          `O debate em torno de ${topic} ganhou novos contornos. O artigo "${cleanTitle}" destaca uma mudança crucial: "${articleInsight}"\n\n` +
          `Essa tendência afeta diretamente as contratações e o planejamento estratégico das empresas do setor. Como observado no texto, ${secondaryDetail}${extraInstructionsParagraph}\n\n` +
          `Pontos de destaque:\n` +
          `• Adequação rápida dos modelos de negócios ao novo cenário.\n` +
          `• Foco em ${allowBuzzwords ? 'Fit Cultural e atração de talentos' : 'sinergia de equipe'}.\n\n` +
          `🔗 Fonte original: ${url || 'Link do artigo'}\n\n` +
          `Como sua organização tem respondido a este cenário? Comente abaixo.`;
      } else if (style === 'opinion') {
        postText = `🔥 OPINIÃO PESSOAL: ${topic.toUpperCase()} EXIGE MUDANÇA JÁ!\n\n` +
          `O artigo "${cleanTitle}" expõe um fato inegável. Não dá mais para ignorar que: "${articleInsight}"\n\n` +
          `Como atuante no mercado de talentos${filterStr}, vejo muitas empresas insistindo em modelos ultrapassados. ${allowUnfiltered ? 'Vamos ser sinceros: o mercado mudou, mas tem gente agindo como se estivesse em 2015.' : 'A burocratização afasta as mentes mais brilhantes.'}\n\n` +
          `Como destacado, a diretriz é clara: "${secondaryDetail}"${extraInstructionsParagraph}\n\n` +
          `Eu escolho liderar essa mudança focado em ${allowBuzzwords ? 'Candidate Experience' : 'um recrutamento mais humano'}${buzzWordStr}. E você? Compartilhe e apoie essa causa ✊`;
      } else if (style === 'technical') {
        postText = `📊 PARECER TÉCNICO E ACADÊMICO: ${topic.toUpperCase()}\n\n` +
          `Com base na análise metodológica do artigo "${cleanTitle}", avalia-se o impacto estrutural sobre ${topic}.\n\n` +
          `1. Ponto Central (Hipótese de Impacto): "${articleInsight}"\n` +
          `2. Evidência e Metodologia: O estudo indica que ${secondaryDetail}\n` +
          `3. Conclusão Analítica: O alinhamento das competências técnicas é imperativo.${extraInstructionsParagraph}\n\n` +
          `${allowUnfiltered ? 'Na real, a falta de precisão e dados validados invalida qualquer processo de transição organizacional.' : 'Desse modo, a precisão e o rigor acadêmico devem balizar as decisões de contratação e capacitação.'}\n\n` +
          `Recomenda-se a adoção de metodologias ágeis e mapeamento técnico. Qual o seu posicionamento sobre essa metodologia?`;
      } else {
        // creative
        postText = `✨ ENTRE LINHAS: O SOPRO DE MUDANÇA EM ${topic.toUpperCase()}\n\n` +
          `Feche os olhos por um segundo e imagine o futuro do trabalho. Ele não é feito de baias frias, mas sim da faísca entre o talento e o propósito.\n\n` +
          `O artigo sobre "${cleanTitle}" nos conta uma história silenciosa sobre como o mundo se move: "${articleInsight}"\n\n` +
          `Como um farol no nevoeiro, a mensagem é nítida: "${secondaryDetail}"${extraInstructionsParagraph}\n\n` +
          `${allowUnfiltered ? 'O papo reto? Não adianta pintar a parede com cores alegres se a alma da empresa continua cinza.' : 'A verdadeira inovação nasce quando permitimos que a sensibilidade e o ritmo humano liderem as decisões.'}\n\n` +
          `Que possamos escrever juntos o próximo capítulo dessa jornada. 🍃 Compartilhe a sua reflexão!`;
      }

      slides = [
        {
          title: topic.length > 35 ? topic.substring(0, 35) + "..." : topic,
          subtitle: `Um guia prático sobre ${styleLabel}`,
          body: `Como otimizar seus resultados com base na análise: "${articleInsight.length > 100 ? articleInsight.substring(0, 100) + '...' : articleInsight}"`,
          pageNumber: "01 de 05"
        },
        {
          title: "O Ponto Crítico",
          subtitle: `Cenário de Recrutamento & ${toneLabel}`,
          body: `Conforme apontado no texto: "${secondaryDetail.length > 100 ? secondaryDetail.substring(0, 100) + '...' : secondaryDetail}"`,
          pageNumber: "02 de 05"
        },
        {
          title: "A Solução na Prática",
          subtitle: "Adequação de Processos",
          body: allowBuzzwords 
            ? `Focar no Candidate Experience e garantir o Fit Cultural desde o primeiro contato.`
            : `Aumentar a transparência das etapas de seleção e melhorar a assertividade das decisões.`,
          pageNumber: "03 de 05"
        },
        {
          title: "Foco Estratégico",
          subtitle: "Diretriz de Sucesso",
          body: extraInstructions.trim() 
            ? extraInstructions.trim() 
            : `Alinhamento rápido com as mudanças do mercado para obter um diferencial competitivo sustentável.`,
          pageNumber: "04 de 05"
        },
        {
          title: "E Agora?",
          subtitle: "Conecte-se",
          body: `Gostou desse conteúdo? Salve para consultar depois e me siga para insights diários sobre o mercado!`,
          pageNumber: "05 de 05"
        }
      ];

      // Process global rules (like stripping emojis) in mock mode too
      let activePostText = postText;
      let activeSlides = slides;
      
      const hasEmojiRule = globalRule && (
        globalRule.toLowerCase().includes('emoji') || 
        globalRule.toLowerCase().includes('sem figurinha')
      );
      if (hasEmojiRule) {
        const customEmojis = /[💡📰📊🏆🔥🚀🎯👉🔗📝🛠🤖✨✊]/g;
        const surrogatePairs = /[\uD800-\uDFFF]./g;
        activePostText = activePostText.replace(customEmojis, '').replace(surrogatePairs, '').trim();
        activeSlides = activeSlides.map(slide => ({
          ...slide,
          title: slide.title.replace(customEmojis, '').replace(surrogatePairs, '').trim(),
          body: slide.body.replace(customEmojis, '').replace(surrogatePairs, '').trim()
        }));
      }

      // Prepend selected LLM Name with a [Simulação] warning
      const simulatedLabel = activeModel === 'openai' ? 'OpenAI GPT-4.1 mini' : activeModel === 'deepseek' ? 'DeepSeek DeepSeek-R1' : 'Google Gemini 2.5 Flash';
      activePostText = `🤖 [${simulatedLabel} - Simulação]\n\n` + activePostText;

      const contentResult: GeneratedContent = { postText: activePostText, slides: activeSlides };
      return await finalizeAndPersist(contentResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar conteúdo.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (fetchError) throw fetchError;
        if (data) {
          setHistory(data as GenerationHistoryItem[]);
        }
      } catch (err: any) {
        console.error("Erro ao carregar histórico do Supabase:", err);
      }
    } else {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(['generation_history']) as any;
        if (result.generation_history) {
          setHistory(result.generation_history);
        }
      }
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const userSession = isSupabaseConfigured ? (await supabase?.auth.getSession())?.data.session : null;
      
      if (isSupabaseConfigured && supabase && userSession?.user) {
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', id);
        if (deleteError) throw deleteError;
      } else {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const result = await chrome.storage.local.get(['generation_history']) as any;
          const localHistory: GenerationHistoryItem[] = result.generation_history || [];
          const updated = localHistory.filter(item => item.id !== id);
          await chrome.storage.local.set({ generation_history: updated });
        }
      }
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error("Erro ao deletar item do histórico:", err);
      setError(err.message || "Falha ao deletar item.");
    }
  };

  return {
    loading,
    error,
    history,
    generateContent,
    loadHistory,
    deleteHistoryItem
  };
}
