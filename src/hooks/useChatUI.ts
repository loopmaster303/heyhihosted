import { useState } from 'react';

/**
 * Hook for managing Chat UI state (Toggles, Panels, Dialogs)
 */
export function useChatUI() {
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isAdvancedPanelOpen, setIsAdvancedPanelOpen] = useState(false);

  return {
    isAiResponding,
    setIsAiResponding,
    isHistoryPanelOpen,
    setIsHistoryPanelOpen,
    isAdvancedPanelOpen,
    setIsAdvancedPanelOpen,
  };
}
