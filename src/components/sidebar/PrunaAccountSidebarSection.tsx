"use client";

import React, { useState } from 'react';
import { ChevronDown, KeyRound, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePrunaKey } from '@/hooks/usePrunaKey';
import { useLanguage } from '@/components/LanguageProvider';

const PrunaAccountSidebarSection: React.FC = () => {
  const { language } = useLanguage();
  const { prunaKey, isConnected, connect, disconnect } = usePrunaKey();
  const [isOpen, setIsOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [invalid, setInvalid] = useState(false);

  const labels = language === 'en'
    ? { header: 'Pruna API', placeholder: 'Paste Pruna API key', connect: 'Connect', disconnect: 'Disconnect', connected: 'Connected', invalid: 'Invalid API key' }
    : { header: 'Pruna API', placeholder: 'Pruna API-Key einfügen', connect: 'Verbinden', disconnect: 'Trennen', connected: 'Verbunden', invalid: 'Ungültiger API-Key' };

  const handleConnect = () => {
    const accepted = connect(keyInput);
    setInvalid(!accepted);
    if (accepted) setKeyInput('');
  };
  const maskedKey = prunaKey ? `${prunaKey.slice(0, 5)}…${prunaKey.slice(-4)}` : '';

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors uppercase tracking-wider"
      >
        <span className="flex items-center gap-2"><KeyRound className="h-3.5 w-3.5" />{labels.header}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-300', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="px-2 pb-3 space-y-3">
          {isConnected ? (
            <>
              <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-2 text-[10px]">
                <span className="font-semibold text-green-500">{labels.connected}</span>
                <span className="font-mono text-foreground/70">{maskedKey}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={disconnect} className="w-full h-8 text-xs rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-3.5 w-3.5 mr-2" />{labels.disconnect}
              </Button>
            </>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <Input
                  value={keyInput}
                  onChange={(event) => { setKeyInput(event.target.value); setInvalid(false); }}
                  onKeyDown={(event) => event.key === 'Enter' && handleConnect()}
                  placeholder={labels.placeholder}
                  type="password"
                  autoComplete="off"
                  className="h-8 text-xs rounded-lg flex-1 font-mono"
                />
                <Button onClick={handleConnect} size="sm" variant="outline" disabled={!keyInput.trim()} className="h-8 text-xs rounded-lg px-3">
                  {labels.connect}
                </Button>
              </div>
              {invalid && <p className="text-[10px] text-destructive">{labels.invalid}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrunaAccountSidebarSection;
