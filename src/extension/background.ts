// Service worker for Jobler Content Creator extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension successfully installed.");
  
  // Set panel behavior so clicking the action icon opens the side panel
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error: any) => console.error("Error setting sidePanel behavior:", error));
  }
});

// Fallback in case openPanelOnActionClick behavior is not supported on some older Chrome versions
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
    if (tab.id !== undefined) {
      chrome.sidePanel.open({ tabId: tab.id })
        .catch((error: any) => console.error("Error opening sidePanel manually:", error));
    }
  }
});
