import React, { useState } from 'react';
import { Copy, Check, Edit3, Save, Download, ChevronLeft, ChevronRight, FileText, LayoutGrid, Type, MessageSquare, CornerDownLeft } from 'lucide-react';
import type { CarouselSlide, GeneratedContent } from '../hooks/useGenerateContent';
import { exportCarouselToZip } from '../utils/carouselExporter';

interface ResultsWorkspaceProps {
  content: GeneratedContent;
  onContentUpdate: (updatedContent: GeneratedContent) => void;
}

export const ResultsWorkspace: React.FC<ResultsWorkspaceProps> = ({ content, onContentUpdate }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'carousel'>('text');
  
  // Post text state
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedPostText, setEditedPostText] = useState(content.postText);
  const [copied, setCopied] = useState(false);

  // Carousel state
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [editedSlides, setEditedSlides] = useState<CarouselSlide[]>(content.slides);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Floating Bar settings
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md'); // sm: 11px, md: 13px, lg: 15px
  const [showRefinementInput, setShowRefinementInput] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Sync edits when original content changes
  React.useEffect(() => {
    setEditedPostText(content.postText);
    setEditedSlides(content.slides);
    setActiveSlideIndex(0);
    setShowRefinementInput(false);
  }, [content]);

  // Copy copywriting clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(editedPostText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveText = () => {
    setIsEditingText(false);
    onContentUpdate({
      ...content,
      postText: editedPostText
    });
  };

  // Carousel slide updates
  const handleSlideChange = (field: 'title' | 'subtitle' | 'body', val: string) => {
    const updated = editedSlides.map((slide, idx) => {
      if (idx === activeSlideIndex) {
        return { ...slide, [field]: val };
      }
      return slide;
    });
    setEditedSlides(updated);
    onContentUpdate({
      ...content,
      slides: updated
    });
  };

  // ZIP export handler
  const handleExportZip = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const slideIds = editedSlides.map((_, idx) => `fullres-slide-${idx}`);
      const cleanName = editedSlides[0].title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
      await exportCarouselToZip(slideIds, `carrossel_${cleanName || 'jobler'}.zip`);
    } catch (err: any) {
      console.error(err);
      setExportError(err.message || "Erro ao baixar carrossel.");
    } finally {
      setIsExporting(false);
    }
  };

  // Cycle typography sizes
  const handleCycleFontSize = () => {
    if (fontSize === 'sm') setFontSize('md');
    else if (fontSize === 'md') setFontSize('lg');
    else setFontSize('sm');
  };

  // Submit AI refinement instruction
  const handleRefinementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementPrompt.trim()) return;

    setIsRefining(true);
    // Simulate AI update latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const promptText = refinementPrompt.toLowerCase();
    let refinedText = editedPostText;

    if (promptText.includes('hashtag')) {
      refinedText += "\n\n#Recrutamento #Lideranca #Recrutador #Tecnologia #Jobler";
    } else if (promptText.includes('curt') || promptText.includes('resum')) {
      refinedText = refinedText.substring(0, Math.floor(refinedText.length * 0.7)) + "\n\n👉 O que você acha disso? Comente abaixo.";
    } else {
      refinedText = `📝 [Ajustado por IA] ${refinedText}\n\n*(Refinado com base em: "${refinementPrompt}")*`;
    }

    // Refine active carousel slide title if in carousel tab
    if (activeTab === 'carousel') {
      const updated = editedSlides.map((slide, idx) => {
        if (idx === activeSlideIndex) {
          return {
            ...slide,
            title: `✨ ${slide.title}`.toUpperCase(),
            body: `${slide.body} [Ajustado conforme direcionamento: ${refinementPrompt}]`
          };
        }
        return slide;
      });
      setEditedSlides(updated);
      onContentUpdate({
        postText: refinedText,
        slides: updated
      });
    } else {
      onContentUpdate({
        ...content,
        postText: refinedText
      });
      setEditedPostText(refinedText);
    }

    setIsRefining(false);
    setRefinementPrompt('');
    setShowRefinementInput(false);
  };

  const getFontSizeClass = () => {
    if (fontSize === 'sm') return 'text-[11px]';
    if (fontSize === 'lg') return 'text-[15px]';
    return 'text-[13px]';
  };

  const charCount = editedPostText.length;
  const wordCount = editedPostText.trim() === "" ? 0 : editedPostText.trim().split(/\s+/).length;

  return (
    <div className="space-y-4 pb-20 relative animate-float-up">
      {/* Workspace Top Tabs */}
      <div className="flex border-b border-[#132039]">
        <button
          onClick={() => {
            setActiveTab('text');
            setIsEditingText(false);
          }}
          className={`flex-1 py-2.5 text-xs font-extrabold tracking-wider transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'text'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <FileText size={13} />
          <span>Texto Original</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('carousel');
            setIsEditingText(false);
          }}
          className={`flex-1 py-2.5 text-xs font-extrabold tracking-wider transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'carousel'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <LayoutGrid size={13} />
          <span>Carrossel Infinito</span>
        </button>
      </div>

      {/* Tab A: Post Copy Dashboard */}
      {activeTab === 'text' && (
        <div className="space-y-3">
          <div className="relative rounded-2xl bg-[#0c1424] border border-[#132039] overflow-hidden shadow-lg">
            
            {/* Header controls */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#132039]/80 bg-[#0c1424]/60">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold">Copiar & Adaptar</span>
              
              <div className="flex items-center gap-2">
                {/* Edit Toggle */}
                {isEditingText ? (
                  <button
                    onClick={handleSaveText}
                    className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded cursor-pointer"
                  >
                    <Save size={10} />
                    <span>Salvar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingText(true)}
                    className="flex items-center gap-1 text-[9px] text-cyan-400 font-bold bg-cyan-500/5 px-2 py-0.5 rounded cursor-pointer hover:bg-cyan-500/10"
                  >
                    <Edit3 size={10} />
                    <span>Editar</span>
                  </button>
                )}

                {/* Copy Clip Action */}
                <button
                  onClick={handleCopyText}
                  className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#080d19] border border-[#132039] text-slate-300 hover:bg-[#132039]'
                  }`}
                >
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Post Area Box */}
            <div className="p-4">
              {isEditingText ? (
                <textarea
                  value={editedPostText}
                  onChange={(e) => setEditedPostText(e.target.value)}
                  className="w-full min-h-[220px] bg-[#080d19] border border-[#132039] focus:border-cyan-500 text-slate-100 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-sans leading-relaxed text-[13px]"
                />
              ) : (
                <div className={`${getFontSizeClass()} text-slate-200 whitespace-pre-wrap leading-relaxed font-sans select-text max-h-[300px] overflow-y-auto pr-1 text-left`}>
                  {editedPostText}
                </div>
              )}
            </div>

            {/* Footer metrics */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-[#132039]/80 bg-[#0c1424]/20 text-[9px] text-slate-500 font-bold">
              <div>CARACTERES: <span className="text-cyan-400">{charCount}</span></div>
              <div>PALAVRAS: <span className="text-cyan-400">{wordCount}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab B: Infinite Carousel previewer */}
      {activeTab === 'carousel' && (
        <div className="space-y-4">
          <div className="relative flex items-center justify-center py-2 bg-[#0c1424]/30 rounded-2xl border border-[#132039]/50">
            
            {/* Left Nav */}
            <button
              onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={activeSlideIndex === 0}
              className="absolute left-1.5 z-10 w-8 h-8 rounded-full bg-[#0c1424]/90 border border-[#132039] flex items-center justify-center text-slate-400 hover:text-slate-100 disabled:opacity-20 disabled:pointer-events-none hover:bg-[#132039] transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Slide Box Preview */}
            <div className="w-[280px] h-[350px] rounded-2xl overflow-hidden shadow-2xl border border-[#132039] bg-[#080d19] flex flex-col justify-between p-5 relative select-none animate-float-up">
              
              {/* Cyan top gradient border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-500"></div>

              {/* Core Text body */}
              <div className="space-y-3 flex-1 flex flex-col justify-center py-3 text-left">
                <h3 className="text-[13px] font-black text-slate-100 leading-snug uppercase tracking-tight line-clamp-2">
                  {editedSlides[activeSlideIndex].title}
                </h3>
                <h4 className="text-[9px] font-extrabold text-cyan-400 tracking-wide line-clamp-1">
                  {editedSlides[activeSlideIndex].subtitle}
                </h4>
                <p className={`${getFontSizeClass()} text-slate-300 leading-relaxed font-semibold line-clamp-4 mt-1`}>
                  {editedSlides[activeSlideIndex].body}
                </p>
              </div>

              {/* Bottom footer */}
              <div className="flex items-center justify-end border-t border-[#0c1424] pt-2.5">
                <span className="text-[8px] font-bold text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded">
                  {editedSlides[activeSlideIndex].pageNumber}
                </span>
              </div>
            </div>

            {/* Right Nav */}
            <button
              onClick={() => setActiveSlideIndex(prev => Math.min(editedSlides.length - 1, prev + 1))}
              disabled={activeSlideIndex === editedSlides.length - 1}
              className="absolute right-1.5 z-10 w-8 h-8 rounded-full bg-[#0c1424]/90 border border-[#132039] flex items-center justify-center text-slate-400 hover:text-slate-100 disabled:opacity-20 disabled:pointer-events-none hover:bg-[#132039] transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dot counts */}
          <div className="flex justify-center gap-1.5">
            {editedSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlideIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeSlideIndex ? 'bg-cyan-500 w-3' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Form to Edit Selected Slide */}
          <div className="p-3.5 rounded-2xl bg-[#0c1424] border border-[#132039] space-y-3 text-left">
            <h4 className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Type size={11} className="text-cyan-400" />
              <span>Editar Conteúdo do Slide {activeSlideIndex + 1}</span>
            </h4>
            
            <div className="space-y-2.5">
              <div>
                <label className="block text-[8px] text-slate-500 font-bold mb-1">Título do Slide</label>
                <input
                  type="text"
                  value={editedSlides[activeSlideIndex].title}
                  onChange={(e) => handleSlideChange('title', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#080d19] border border-[#132039] text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[8px] text-slate-500 font-bold mb-1">Subtítulo / Categoria</label>
                <input
                  type="text"
                  value={editedSlides[activeSlideIndex].subtitle}
                  onChange={(e) => handleSlideChange('subtitle', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#080d19] border border-[#132039] text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[8px] text-slate-500 font-bold mb-1">Conteúdo Textual</label>
                <textarea
                  value={editedSlides[activeSlideIndex].body}
                  onChange={(e) => handleSlideChange('body', e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#080d19] border border-[#132039] text-slate-200 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Exporter Action Button */}
          <div className="space-y-2">
            <button
              onClick={handleExportZip}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-[#132039] text-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:bg-[#132039] cursor-pointer"
            >
              {isExporting ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Download size={14} className="text-cyan-400" />
              )}
              <span>{isExporting ? "Gerando Carrossel..." : "Baixar Carrossel (.ZIP)"}</span>
            </button>

            {exportError && (
              <p className="text-[10px] text-red-400 text-center font-semibold">
                ❌ {exportError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          REFINEMENT DRAWER / MOCK AI REFINEMENT LOOP
          ======================================================= */}
      {showRefinementInput && (
        <form onSubmit={handleRefinementSubmit} className="p-3.5 rounded-2xl bg-[#0c1424] border border-[#132039] animate-float-up space-y-2 text-left">
          <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
            Ajustar com Inteligência Artificial
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              placeholder="Ex.: adicione hashtags, faça um resumo mais curto..."
              className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-[#080d19] border border-[#132039] text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isRefining}
              className="absolute right-1 w-7 h-7 rounded-lg bg-cyan-500 text-[#050811] flex items-center justify-center cursor-pointer hover:bg-cyan-400 transition-colors"
            >
              {isRefining ? (
                <div className="w-3 h-3 border-2 border-[#050811] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CornerDownLeft size={13} />
              )}
            </button>
          </div>
        </form>
      )}

      {/* =======================================================
          3. FLOATING BOTTOM ACTION OVERLAY BAR
          Sticky positioning hovering over results
          ======================================================= */}
      <div className="sticky bottom-2 mx-auto z-45 bg-[#0c1424]/90 backdrop-blur border border-[#132039] rounded-full px-4 py-2 flex items-center justify-around shadow-2xl w-52 shadow-black/40">
        
        {/* Toggle Workspace View (Text vs Slideshow layout) */}
        <button
          type="button"
          onClick={() => setActiveTab(prev => prev === 'text' ? 'carousel' : 'text')}
          title="Alternar Visualização"
          className="text-slate-400 hover:text-cyan-400 cursor-pointer p-1.5 transition-colors"
        >
          {activeTab === 'text' ? <LayoutGrid size={15} /> : <FileText size={15} />}
        </button>

        {/* Dynamic Font/Typography Size Cycler */}
        <button
          type="button"
          onClick={handleCycleFontSize}
          title="Ajustar Tamanho da Fonte"
          className="text-slate-400 hover:text-cyan-400 cursor-pointer p-1.5 transition-colors"
        >
          <Type size={15} />
        </button>

        {/* Toggle Text Editing states */}
        <button
          type="button"
          onClick={() => {
            if (activeTab === 'text') {
              setIsEditingText(prev => !prev);
            } else {
              // Carousel active: scroll to slide edit area
              const container = document.querySelector('main');
              if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
              }
            }
          }}
          title="Editar Conteúdo"
          className={`cursor-pointer p-1.5 transition-colors ${
            isEditingText ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-400'
          }`}
        >
          <Edit3 size={15} />
        </button>

        {/* Refine / AI dialog trigger */}
        <button
          type="button"
          onClick={() => setShowRefinementInput(prev => !prev)}
          title="Ajustes com IA"
          className={`cursor-pointer p-1.5 transition-colors ${
            showRefinementInput ? 'text-cyan-400' : 'text-slate-400 hover:text-cyan-400'
          }`}
        >
          <MessageSquare size={15} />
        </button>
      </div>

      {/* =======================================================
          HIDDEN FULL-RESOLUTION CAPTURE DOM NODES (1080x1350)
          ======================================================= */}
      <div 
        style={{
          position: 'fixed',
          bottom: '-9999px',
          right: '-9999px',
          width: '1080px',
          height: '1350px',
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -1000
        }}
      >
        {editedSlides.map((slide, idx) => (
          <div
            key={`fullres-${idx}`}
            id={`fullres-slide-${idx}`}
            style={{
              width: '1080px',
              height: '1350px',
              backgroundColor: '#080d19', // Slate-blue main bg
              padding: '80px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {/* Top Cyan Gradient Stripe */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '16px',
                background: 'linear-gradient(to right, #0891b2, #06b6d4, #22d3ee)'
              }}
            ></div>

            {/* Core Body */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '40px 0' }}>
              <h1 
                style={{
                  fontSize: '56px',
                  fontWeight: '900',
                  color: '#ffffff',
                  lineHeight: '1.25',
                  textTransform: 'uppercase',
                  letterSpacing: '-1.5px',
                  margin: '0 0 20px 0'
                }}
              >
                {slide.title}
              </h1>
              <h2 
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#06b6d4',
                  letterSpacing: '1px',
                  margin: '0 0 48px 0'
                }}
              >
                {slide.subtitle}
              </h2>
              <p 
                style={{
                  fontSize: '36px',
                  color: '#cbd5e1',
                  lineHeight: '1.6',
                  fontWeight: '500',
                  margin: 0
                }}
              >
                {slide.body}
              </p>
            </div>

            {/* Slide Footer */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                borderTop: '3px solid #132039',
                paddingTop: '32px'
              }}
            >
              <span style={{ fontSize: '22px', color: '#06b6d4', fontWeight: '800', backgroundColor: 'rgba(6,182,212,0.08)', padding: '6px 20px', borderRadius: '6px' }}>
                {slide.pageNumber}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
