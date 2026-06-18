import { useState, useEffect } from 'react';
import { SupabaseAuth } from './components/SupabaseAuth';
import { ConfigForm } from './components/ConfigForm';
import { ResultsWorkspace } from './components/ResultsWorkspace';
import { useGenerateContent } from './hooks/useGenerateContent';
import type { GeneratedContent, GenerationHistoryItem } from './hooks/useGenerateContent';
import { Sparkles, History, Sun, Settings, LayoutGrid, Calendar, ArrowRight, Trash2, Moon, Eye, EyeOff, Key } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'config' | 'results' | 'history' | 'settings'>('config');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [session, setSession] = useState<any>(null);

  // Storage states for Theme & Settings
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [llmModel, setLlmModel] = useState<string>('gemini');
  const [globalRule, setGlobalRule] = useState<string>('');

  // API Key States
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [openaiKey, setOpenAIKey] = useState<string>('');
  const [deepseekKey, setDeepseekKey] = useState<string>('');

  // Temporary Settings states for form inputs
  const [tempLlmModel, setTempLlmModel] = useState<string>('gemini');
  const [tempGlobalRule, setTempGlobalRule] = useState<string>('');
  const [tempGeminiKey, setTempGeminiKey] = useState<string>('');
  const [tempOpenAIKey, setTempOpenAIKey] = useState<string>('');
  const [tempDeepseekKey, setTempDeepseekKey] = useState<string>('');

  // API Key visibility states
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState<boolean>(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState<boolean>(false);

  const { loading, error, history, generateContent, loadHistory, deleteHistoryItem } = useGenerateContent();

  // Load theme, model, global rule, and API keys on startup
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([
        'settings_theme', 
        'settings_llm_model', 
        'settings_global_rule',
        'settings_gemini_key',
        'settings_openai_key',
        'settings_deepseek_key'
      ], (result: any) => {
        if (result.settings_theme) {
          setTheme(result.settings_theme as 'dark' | 'light');
        }
        if (result.settings_llm_model) {
          setLlmModel(result.settings_llm_model);
          setTempLlmModel(result.settings_llm_model);
        }
        if (result.settings_global_rule) {
          setGlobalRule(result.settings_global_rule);
          setTempGlobalRule(result.settings_global_rule);
        }
        if (result.settings_gemini_key) {
          setGeminiKey(result.settings_gemini_key);
          setTempGeminiKey(result.settings_gemini_key);
        }
        if (result.settings_openai_key) {
          setOpenAIKey(result.settings_openai_key);
          setTempOpenAIKey(result.settings_openai_key);
        }
        if (result.settings_deepseek_key) {
          setDeepseekKey(result.settings_deepseek_key);
          setTempDeepseekKey(result.settings_deepseek_key);
        }
      });
    }
  }, []);

  // Sync temp settings state when navigating to settings panel
  useEffect(() => {
    if (activeTab === 'settings') {
      setTempLlmModel(llmModel);
      setTempGlobalRule(globalRule);
      setTempGeminiKey(geminiKey);
      setTempOpenAIKey(openaiKey);
      setTempDeepseekKey(deepseekKey);
    }
  }, [activeTab]);

  // Load history logs whenever the session changes
  useEffect(() => {
    loadHistory();
  }, [session]);

  const handleGenerate = async (formData: {
    url: string;
    title: string;
    text: string;
    extraInstructions: string;
    style: string;
    tone: string;
    formality: string;
    allowBuzzwords: boolean;
    allowUnfiltered: boolean;
  }) => {
    try {
      const result = await generateContent({
        ...formData,
        llmModel,
        globalRule,
        geminiKey,
        openaiKey,
        deepseekKey
      });
      setGeneratedContent(result);
      setActiveTab('results');
      loadHistory();
    } catch (err) {
      console.error("Erro ao gerar postagem:", err);
    }
  };

  const handleContentUpdate = (updated: GeneratedContent) => {
    setGeneratedContent(updated);
  };

  // Load a historic post back into the active resultados preview
  const handleLoadFromHistory = (item: GenerationHistoryItem) => {
    setGeneratedContent({
      postText: item.original_text,
      slides: item.metadata.slides
    });
    setActiveTab('results');
  };

  // Delete a history item
  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja remover esta postagem do histórico?")) {
      await deleteHistoryItem(id);
    }
  };

  // Toggle Theme between Dark and Light mode
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ settings_theme: nextTheme });
    }
  };

  // Save Settings modifications
  const handleSaveSettings = (model: string, rule: string, gKey: string, oKey: string, dKey: string) => {
    setLlmModel(model);
    setGlobalRule(rule);
    setGeminiKey(gKey);
    setOpenAIKey(oKey);
    setDeepseekKey(dKey);
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        settings_llm_model: model,
        settings_global_rule: rule,
        settings_gemini_key: gKey,
        settings_openai_key: oKey,
        settings_deepseek_key: dKey
      });
    }
    setActiveTab('config'); // Go back to content generation
  };

  // Check if active model has key configured
  const isActiveModelKeyConfigured = () => {
    if (llmModel === 'gemini') return Boolean(geminiKey);
    if (llmModel === 'openai') return Boolean(openaiKey);
    if (llmModel === 'deepseek') return Boolean(deepseekKey);
    return false;
  };

  return (
    <div className={`min-h-screen bg-[#080d19] text-slate-100 flex font-sans select-none antialiased ${theme === 'light' ? 'light' : ''}`}>
      {/* 1. Left Sidebar Navigation (56px Wide) */}
      <aside className="w-14 bg-[#050811] border-r border-[#132039] flex flex-col justify-between items-center py-4 shrink-0">
        
        {/* Top: Jobler Spark Logo */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow shadow-cyan-500/5 hover:scale-105 transition-all">
            <Sparkles size={20} className="animate-pulse-subtle" />
          </div>
        </div>

        {/* Center: Vertical Menu Links */}
        <nav className="flex flex-col gap-4">
          {/* Button: Gerar Conteúdo */}
          <button
            onClick={() => setActiveTab('config')}
            title="Gerar Conteúdo"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
            }`}
          >
            <Sparkles size={18} />
          </button>

          {/* Button: Histórico */}
          <button
            onClick={() => setActiveTab('history')}
            title="Histórico"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
            }`}
          >
            <History size={18} />
          </button>
        </nav>

        {/* Bottom: Utilities */}
        <div className="flex flex-col gap-3">
          {/* Active theme toggler */}
          <button
            onClick={handleToggleTheme}
            title="Alternar Tema (Sol/Lua)"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 cursor-pointer transition-all"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Settings icon */}
          <button
            onClick={() => setActiveTab('settings')}
            title="Configurações"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
            }`}
          >
            <Settings size={18} />
          </button>
        </div>
      </aside>

      {/* 2. Main Content Viewport (Remaining 344px) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sub-Header */}
        <header className="h-14 px-4 border-b border-[#132039] bg-[#080d19]/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <LayoutGrid size={15} className="text-cyan-400 shrink-0" />
            <div className="text-xs font-black tracking-wider truncate">
              JOBLER <span className="text-cyan-400">CONTENT CREATOR</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real LLM Status Indicator */}
            {isActiveModelKeyConfigured() ? (
              <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded">
                IA Conectada
              </span>
            ) : (
              <span className="text-[8px] bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold px-2 py-0.5 rounded">
                Simulação
              </span>
            )}
            <SupabaseAuth onSessionChange={setSession} />
          </div>
        </header>

        {/* Workspace Body Area */}
        <main className="flex-1 p-4 overflow-y-auto min-w-0">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-xs text-red-400 font-medium animate-float-up">
              ⚠️ {error}
            </div>
          )}

          {activeTab === 'config' && (
            <ConfigForm onGenerate={handleGenerate} loading={loading} />
          )}

          {activeTab === 'results' && (
            <div>
              {generatedContent ? (
                <ResultsWorkspace
                  content={generatedContent}
                  onContentUpdate={handleContentUpdate}
                />
              ) : (
                <div className="py-16 px-6 text-center space-y-4 animate-float-up">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-[#0c1424] border border-[#132039] flex items-center justify-center text-slate-500">
                    <Sparkles size={20} className="text-cyan-500/40" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-300">Sem resultados prontos</h3>
                    <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                      Preencha os dados e clique em "Gerar Conteúdo" para ver os resultados.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('config')}
                    className="text-[10px] text-cyan-400 font-bold bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                  >
                    Ir para Gerador
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 animate-float-up">
              <div>
                <h2 className="text-sm font-bold text-slate-200">Histórico de Criação</h2>
                <p className="text-[10px] text-slate-500">Acesse posts criados anteriormente por você.</p>
              </div>

              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadFromHistory(item)}
                      className="p-3 rounded-xl bg-[#0c1424] border border-[#132039] hover:border-cyan-500/40 transition-all cursor-pointer group text-left"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[9px] font-bold text-cyan-400 uppercase bg-cyan-500/5 px-2 py-0.5 rounded">
                          {item.metadata?.style || 'Geral'}
                        </span>
                        <span className="text-[8px] text-slate-500 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <h4 className="text-[11px] font-bold text-slate-200 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                        {item.source_title || 'Artigo sem título'}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal">
                        {item.original_text}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between text-[8px] text-slate-500 font-bold border-t border-[#132039]/50 pt-1.5">
                        <span className="truncate max-w-[140px] text-[8px]">{item.source_url || 'Link local'}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(e, item.id)}
                            className="text-slate-500 hover:text-red-400 flex items-center gap-0.5 cursor-pointer transition-colors p-1"
                            title="Deletar do histórico"
                          >
                            <Trash2 size={11} />
                          </button>
                          <span className="text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Carregar <ArrowRight size={10} />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <History size={24} className="mx-auto text-slate-600" />
                  <p className="text-xs">Nenhuma postagem no histórico.</p>
                  <p className="text-[10px] text-slate-600">Gere conteúdo para salvar registros.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5 animate-float-up text-left pb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-200">Configurações Gerais</h2>
                <p className="text-[10px] text-slate-500">Customize o modelo LLM, regras globais e chaves de API.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0c1424] border border-[#132039] space-y-5">
                
                {/* LLM Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    LLM Gratuita
                  </label>
                  <span className="text-[9px] text-slate-500 block -mt-1 leading-normal">
                    Selecione qual inteligência artificial gratuita será simulada nas gerações:
                  </span>
                  
                  <div className="space-y-2 pt-1">
                    {/* Gemini 2.5 Flash */}
                    <button
                      type="button"
                      onClick={() => setTempLlmModel('gemini')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        tempLlmModel === 'gemini'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-[#132039] bg-[#080d19] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold">1 - Google Gemini 2.5 Flash</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Modelo principal, equilibrado e veloz</span>
                      </div>
                      {tempLlmModel === 'gemini' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                    </button>

                    {/* GPT-4o mini */}
                    <button
                      type="button"
                      onClick={() => setTempLlmModel('openai')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        tempLlmModel === 'openai'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-[#132039] bg-[#080d19] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold">2 - OpenAI GPT-4.1 mini</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Foco em estruturação lógica refinada</span>
                      </div>
                      {tempLlmModel === 'openai' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                    </button>

                    {/* DeepSeek */}
                    <button
                      type="button"
                      onClick={() => setTempLlmModel('deepseek')}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        tempLlmModel === 'deepseek'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-[#132039] bg-[#080d19] text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold">3 - DeepSeek DeepSeek-R1</span>
                        <span className="text-[9px] text-slate-500 mt-0.5">Foco em raciocínio analítico profundo</span>
                      </div>
                      {tempLlmModel === 'deepseek' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                    </button>
                  </div>
                </div>

                {/* API Keys Configuration */}
                <div className="space-y-3 pt-1 border-t border-[#132039]/50">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Key size={11} className="text-cyan-400" />
                    <span>Chaves de API (Ativa Conexão Real)</span>
                  </label>
                  <span className="text-[9px] text-slate-500 block -mt-1 leading-normal">
                    Adicione suas chaves para habilitar chamadas reais às IAs. Se deixadas vazias, o Jobler roda em modo de simulação contextual.
                  </span>

                  {/* Gemini Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-bold">Google Gemini Key</span>
                      {geminiKey ? (
                        <span className="text-[7px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded font-black uppercase">Ativa</span>
                      ) : (
                        <span className="text-[7px] text-slate-600 bg-[#080d19] px-1.5 py-0.5 rounded font-black uppercase">Vazia</span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showGeminiKey ? "text" : "password"}
                        value={tempGeminiKey}
                        onChange={(e) => setTempGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showGeminiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* OpenAI Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-bold">OpenAI Key</span>
                      {openaiKey ? (
                        <span className="text-[7px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded font-black uppercase">Ativa</span>
                      ) : (
                        <span className="text-[7px] text-slate-600 bg-[#080d19] px-1.5 py-0.5 rounded font-black uppercase">Vazia</span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showOpenAIKey ? "text" : "password"}
                        value={tempOpenAIKey}
                        onChange={(e) => setTempOpenAIKey(e.target.value)}
                        placeholder="sk-proj-..."
                        className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                        className="absolute right-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showOpenAIKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* DeepSeek Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-bold">DeepSeek Key</span>
                      {deepseekKey ? (
                        <span className="text-[7px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded font-black uppercase">Ativa</span>
                      ) : (
                        <span className="text-[7px] text-slate-600 bg-[#080d19] px-1.5 py-0.5 rounded font-black uppercase">Vazia</span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showDeepseekKey ? "text" : "password"}
                        value={tempDeepseekKey}
                        onChange={(e) => setTempDeepseekKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                        className="absolute right-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showDeepseekKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Global Rules */}
                <div className="space-y-2 pt-1 border-t border-[#132039]/50">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Regra Global Prompt
                  </label>
                  <span className="text-[9px] text-slate-500 block -mt-1 leading-normal">
                    Defina regras que serão aplicadas de forma global e cumulativa nas criações:
                  </span>
                  
                  <textarea
                    value={tempGlobalRule}
                    onChange={(e) => setTempGlobalRule(e.target.value)}
                    placeholder="Ex.: Ao criar o texto proibido uso de emojis, o texto não pode ter indicadores de que foi escrito por uma IA."
                    rows={3}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Submit Settings */}
                <button
                  type="button"
                  onClick={() => handleSaveSettings(tempLlmModel, tempGlobalRule, tempGeminiKey, tempOpenAIKey, tempDeepseekKey)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-[#050811] text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow shadow-cyan-500/5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Salvar Configurações</span>
                </button>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
