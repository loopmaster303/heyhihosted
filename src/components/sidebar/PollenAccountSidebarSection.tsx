"use client";

import React, { useState } from 'react';
import { ChevronDown, Zap, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePollenKey } from '@/hooks/usePollenKey';
import { useLanguage } from '@/components/LanguageProvider';

const PollenAccountSidebarSection: React.FC = () => {
  const { language } = useLanguage();
  const {
    pollenKey,
    isConnected,
    accountInfo,
    isLoadingAccount,
    connectOAuth,
    connectManual,
    disconnect,
  } = usePollenKey();

  const [isOpen, setIsOpen] = useState(false);
  const [manualKeyInput, setManualKeyInput] = useState('');

  const labels = language === 'en'
    ? {
        header: 'Pollen Account',
        connectBtn: 'Connect with Pollinations',
        manualPlaceholder: 'Paste API Key (sk_...)',
        manualBtn: 'Connect',
        disconnectBtn: 'Disconnect',
        balance: 'Balance',
        pollen: 'Pollen',
        status: 'Status',
        connected: 'Connected',
        loading: 'Loading...',
        key: 'Key',
      }
    : {
        header: 'Pollen Konto',
        connectBtn: 'Mit Pollinations verbinden',
        manualPlaceholder: 'API-Key einfügen (sk_...)',
        manualBtn: 'Verbinden',
        disconnectBtn: 'Trennen',
        balance: 'Guthaben',
        pollen: 'Pollen',
        status: 'Status',
        connected: 'Verbunden',
        loading: 'Laden...',
        key: 'Key',
      };

  const maskedKey = pollenKey
    ? `${pollenKey.slice(0, 6)}...${pollenKey.slice(-4)}`
    : '';

  const handleManualConnect = () => {
    if (manualKeyInput.trim()) {
      connectManual(manualKeyInput.trim());
      setManualKeyInput('');
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors uppercase tracking-wider"
      >
        <span className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" />
          {labels.header}
        </span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="px-2 pb-3 space-y-3">
          {isConnected ? (
            <>
              {/* Connected State */}
              <div className="space-y-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    {labels.status}
                  </span>
                  <span className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {labels.connected}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    {labels.key}
                  </span>
                  <span className="text-[10px] text-foreground/70 font-mono">
                    {maskedKey}
                  </span>
                </div>

                {isLoadingAccount ? (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {labels.loading}
                  </div>
                ) : accountInfo && accountInfo.balance !== null ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {labels.balance}
                    </span>
                    <span className="text-xs text-foreground font-semibold">
                      {accountInfo.balance.toLocaleString()} {labels.pollen}
                    </span>
                  </div>
                ) : null}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="w-full h-8 text-xs rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                {labels.disconnectBtn}
              </Button>
            </>
          ) : (
            <>
              {/* Disconnected State */}
              <Button
                onClick={connectOAuth}
                size="sm"
                className="w-full h-8 text-xs rounded-lg bg-primary/80 hover:bg-primary text-primary-foreground"
              >
                <Zap className="h-3.5 w-3.5 mr-2" />
                {labels.connectBtn}
              </Button>

              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[9px] text-muted-foreground/50 uppercase">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex gap-1.5">
                <Input
                  value={manualKeyInput}
                  onChange={(e) => setManualKeyInput(e.target.value)}
                  placeholder={labels.manualPlaceholder}
                  className="h-8 text-xs rounded-lg flex-1 font-mono"
                  type="password"
                  onKeyDown={(e) => e.key === 'Enter' && handleManualConnect()}
                />
                <Button
                  onClick={handleManualConnect}
                  size="sm"
                  variant="outline"
                  disabled={!manualKeyInput.trim()}
                  className="h-8 text-xs rounded-lg px-3"
                >
                  {labels.manualBtn}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PollenAccountSidebarSection;
