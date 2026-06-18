// Content script to read the active tab's page content
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (message.type === "SCRAPE_PAGE") {
    try {
      const title = document.title || "";
      const url = window.location.href || "";
      
      // Extract text content from key elements
      const selector = "article, p, h1, h2, h3, li";
      const elements = document.querySelectorAll(selector);
      const textBlocks: string[] = [];
      
      elements.forEach((el) => {
        // Avoid extracting navigation menu items, footer links, etc.
        const parentTagName = el.parentElement?.tagName.toLowerCase();
        if (parentTagName === 'nav' || parentTagName === 'footer' || parentTagName === 'header') {
          return;
        }
        
        const text = el.textContent?.trim();
        if (text && text.length > 15) {
          textBlocks.push(text);
        }
      });
      
      // Combine blocks and restrict total size to avoid massive payloads
      let rawText = textBlocks.join("\n\n");
      if (rawText.length > 12000) {
        rawText = rawText.substring(0, 12000) + "\n\n...[Texto truncado para processamento]";
      }
      
      sendResponse({
        success: true,
        url,
        title,
        text: rawText || "Nenhum conteúdo textual legível encontrado na página."
      });
    } catch (error: any) {
      console.error("Erro no content script de raspagem:", error);
      sendResponse({
        success: false,
        error: error.message || "Erro desconhecido ao raspar a página."
      });
    }
  }
  // Keep the message port open for async response
  return true;
});
