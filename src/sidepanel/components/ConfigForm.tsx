import React, { useState, useEffect } from 'react';
import { RefreshCw, Link2, Sparkles, ChevronDown } from 'lucide-react';

interface ConfigFormProps {
  onGenerate: (data: {
    url: string;
    title: string;
    text: string;
    extraInstructions: string;
    style: string;
    tone: string;
    formality: string;
    allowBuzzwords: boolean;
    allowUnfiltered: boolean;
  }) => void;
  loading: boolean;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ onGenerate, loading }) => {
  // Page Scraper states
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [scrapedText, setScrapedText] = useState('');
  const [scrapingError, setScrapingError] = useState<string | null>(null);

  // Form selections
  const [extraInstructions, setExtraInstructions] = useState('');
  const [style, setStyle] = useState('journalistic');
  const [tone, setTone] = useState('provocative');

  // "Palavreado" Interactive Pills
  const [isInformal, setIsInformal] = useState(true); // true = Informal, false = Formal
  const [allowBuzzwords, setAllowBuzzwords] = useState(false); // "Permitido Buzzwords"

  // Fetch active tab info
  const scrapeActiveTab = () => {
    setScrapingError(null);
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) {
          setScrapingError("Nenhuma aba ativa identificada.");
          setDefaultMockValues();
          return;
        }

        setUrl(activeTab.url || '');
        setTitle(activeTab.title || 'Aba Ativa');

        chrome.tabs.sendMessage(activeTab.id, { type: "SCRAPE_PAGE" }, (response) => {
          if (chrome.runtime.lastError) {
            injectAndScrape(activeTab.id!);
          } else if (response && response.success) {
            setScrapedText(response.text);
          } else {
            setScrapingError(response?.error || "Falha ao ler conteúdo.");
          }
        });
      });
    } else {
      setDefaultMockValues();
    }
  };

  const injectAndScrape = (tabId: number) => {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        setScrapingError("Erro de injeção: " + chrome.runtime.lastError.message);
        return;
      }
      chrome.tabs.sendMessage(tabId, { type: "SCRAPE_PAGE" }, (response) => {
        if (response && response.success) {
          setScrapedText(response.text);
        } else {
          setScrapingError(response?.error || "Falha ao processar.");
        }
      });
    });
  };

  const setDefaultMockValues = () => {
    setUrl('https://www.linkedin.com/pulse/revolu%C3%A7%C3%A3o-do-rh-intelig%C3%AAncia-artificial-no-recrutamento/');
    setTitle('A Revolução do RH: Inteligência Artificial no Recrutamento');
    setScrapedText(
      `O processo de Recrutamento e Seleção de talentos está passando por uma revolução impulsionada por novos algoritmos de inteligência artificial. ` +
      `Líderes de RH afirmam que a triagem de candidatos se tornou 70% mais rápida. No entanto, existe a preocupação crescente sobre a perda do toque humano e o aumento do "ghosting" em feedbacks automáticos.`
    );
  };

  useEffect(() => {
    scrapeActiveTab();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      url,
      title,
      text: scrapedText,
      extraInstructions,
      style,
      tone,
      formality: isInformal ? 'casual' : 'formal',
      allowBuzzwords,
      allowUnfiltered: false
    });
  };

  return (
    <div className="space-y-5 animate-float-up">
      {/* Intro Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-100 leading-tight text-left">
          Crie posts que <span className="text-cyan-400 font-black">convertem</span>
        </h2>
        <p className="text-[10px] text-slate-400 text-left font-medium leading-relaxed">
          Cole o link do artigo, ajuste o estilo e gere texto + carrossel em segundos.
        </p>
      </div>

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-[#0c1424] border border-[#132039] space-y-4 text-left shadow-lg">
        
        {/* Link input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Link do artigo
            </label>
            <button
              type="button"
              onClick={scrapeActiveTab}
              className="text-[9px] font-extrabold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors bg-cyan-500/5 px-2 py-0.5 rounded"
            >
              <RefreshCw size={9} className={loading ? "animate-spin" : ""} />
              <span>Recarregar URL</span>
            </button>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-500">
              <Link2 size={13} />
            </span>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                const val = e.target.value;
                setUrl(val);
                if (!val.trim()) {
                  setTitle('');
                  setScrapedText('');
                  setScrapingError(null);
                }
              }}
              placeholder="https://exemplo.com/artigo"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
          {title && (
            <div className="text-[9px] text-slate-500 font-semibold truncate px-1">
              📖 {title}
            </div>
          )}
          {scrapingError && (
            <div className="text-[9px] text-amber-500 font-semibold px-1 mt-1">
              ⚠️ {scrapingError} (Modo de Simulação Ativo)
            </div>
          )}
        </div>

        {/* Extra instructions */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            O que quer que eu crie?
          </label>
          <textarea
            value={extraInstructions}
            onChange={(e) => setExtraInstructions(e.target.value)}
            placeholder="O que quer que eu crie para você?"
            rows={3}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Style & Tone selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Estilo de Escrita
            </label>
            <div className="relative">
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-2.5 pr-8 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none"
              >
                <option value="journalistic">Jornalístico (Informativo e Neutro)</option>
                <option value="opinion">Opinião Pessoal (Autoral e Crítico)</option>
                <option value="technical">Técnico e Acadêmico</option>
                <option value="creative">Criativo e Literário</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                <ChevronDown size={12} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Tom de Voz
            </label>
            <div className="relative">
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-2.5 pr-8 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none"
              >
                <option value="provocative">Direto e Provocativo</option>
                <option value="emotional">Storytelling e Emocional</option>
                <option value="educational">Autoridade e Educativo</option>
                <option value="friendly">Conversacional e Amigável</option>
              </select>
              <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                <ChevronDown size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* Interactive "Palavreado" Pills */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Palavreado
          </label>
          <div className="flex flex-wrap gap-1.5">
            {/* Pill: Formal */}
            <button
              type="button"
              onClick={() => setIsInformal(false)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                !isInformal
                  ? 'bg-cyan-500 border-cyan-500 text-[#050811]'
                  : 'bg-transparent border-[#132039] text-slate-400 hover:border-slate-700'
              }`}
            >
              Formal
            </button>

            {/* Pill: Informal */}
            <button
              type="button"
              onClick={() => setIsInformal(true)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                isInformal
                  ? 'bg-cyan-500 border-cyan-500 text-[#050811]'
                  : 'bg-transparent border-[#132039] text-slate-400 hover:border-slate-700'
              }`}
            >
              Informal
            </button>

            {/* Pill: Permitido Buzzwords */}
            <button
              type="button"
              onClick={() => setAllowBuzzwords(!allowBuzzwords)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                allowBuzzwords
                  ? 'bg-cyan-500 border-cyan-500 text-[#050811]'
                  : 'bg-transparent border-[#132039] text-slate-400 hover:border-slate-700'
              }`}
            >
              Permitido Buzzwords
            </button>
          </div>
        </div>

        {/* Submit CTA button */}
        <button
          type="submit"
          disabled={loading || (!title && !extraInstructions.trim())}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-[#050811] text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2"
        >
          <Sparkles size={13} />
          <span>{loading ? "Gerando Conteúdo..." : "Gerar Conteúdo"}</span>
        </button>
      </form>
    </div>
  );
};
