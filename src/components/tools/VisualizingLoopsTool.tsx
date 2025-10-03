
"use client";

import { useState, useEffect, useMemo, FC, FormEvent, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import type { ImageHistoryItem } from '@/types';
import ImageHistoryGallery from './ImageHistoryGallery';
import { cn } from '@/lib/utils';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useLanguage } from '../LanguageProvider';
import { generateUUID } from '@/lib/uuid';
import useEscapeKey from '@/hooks/useEscapeKey';


const FALLBACK_MODELS = ['flux', 'turbo', 'kontext'];
const DEFAULT_MODEL = 'flux';
const LOCAL_STORAGE_KEY = 'visualizingLoopsToolSettings';
const HISTORY_STORAGE_KEY = 'visualizingLoopsHistory';

const VisualizingLoopsTool: FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState('A beautiful landscape painting, trending on artstation');
  const [imageModels, setImageModels] = useState<string[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [seed, setSeed] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [upsampling, setUpsampling] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [batchSize, setBatchSize] = useState<number>(1);
  
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isAdvancedPanelOpen, setIsAdvancedPanelOpen] = useState(false);

  const historyPanelRef = useRef<HTMLDivElement>(null);
  const advancedPanelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useOnClickOutside([historyPanelRef], () => setIsHistoryPanelOpen(false), 'radix-select-content');
  useOnClickOutside([advancedPanelRef], () => setIsAdvancedPanelOpen(false), 'radix-select-content');

  // ESC Key handlers for panels
  useEscapeKey(() => setIsHistoryPanelOpen(false), isHistoryPanelOpen);
  useEscapeKey(() => setIsAdvancedPanelOpen(false), isAdvancedPanelOpen);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 84), 220);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  const widthValue = useMemo(() => [width], [width]);
  const heightValue = useMemo(() => [height], [height]);
  const batchSizeValue = useMemo(() => [batchSize], [batchSize]);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/image/models');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const availableModels = Array.isArray(data.models) && data.models.length > 0 ? data.models : FALLBACK_MODELS;
        setImageModels(availableModels);
        
        // Restore settings after getting models
        const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          if (settings.model !== undefined && availableModels.includes(settings.model)) {
            setModel(settings.model);
          } else if (!availableModels.includes(model)) {
            setModel(availableModels.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : availableModels[0]);
          }
        }
      } catch (err) {
        console.error('Error loading image models:', err);
        toast({ title: "Model Loading Error", description: "Could not fetch models. Using defaults.", variant: "destructive" });
        setImageModels(FALLBACK_MODELS);
        setModel(DEFAULT_MODEL);
      }
    };

    fetchModels();

    try {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        if (settings.prompt !== undefined) setPrompt(settings.prompt);
        if (settings.width !== undefined) setWidth(settings.width);
        if (settings.height !== undefined) setHeight(settings.height);
        if (settings.seed !== undefined) setSeed(settings.seed);
        if (settings.isPrivate !== undefined) setIsPrivate(settings.isPrivate);
        if (settings.upsampling !== undefined) setUpsampling(settings.upsampling);
        if (settings.aspectRatio !== undefined) setAspectRatio(settings.aspectRatio);
        if (settings.batchSize !== undefined) setBatchSize(settings.batchSize);
      }
    } catch (e) {
      console.error("Failed to parse settings from localStorage", e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            if(Array.isArray(parsedHistory)) {
                setHistory(parsedHistory);
                if (parsedHistory.length > 0) {
                    setSelectedImage(parsedHistory[0]);
                }
            }
        }
    } catch (e) {
        console.error("Failed to parse history from localStorage", e);
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
    setIsInitialLoadComplete(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]); // Run when mounted changes

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    const settingsToSave = {
      prompt, model, width, height, seed, isPrivate, upsampling, aspectRatio, batchSize,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
  }, [prompt, model, width, height, seed, isPrivate, upsampling, aspectRatio, batchSize, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;
    try {
        if (history.length > 0) {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } else {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        }
    } catch (e) {
        console.error("Failed to save history to localStorage. It might be full.", e);
        toast({
            title: "Could Not Save History",
            description: "Browser storage is full. Please clear some history or site data.",
            variant: "destructive"
        });
    }
  }, [history, toast, isInitialLoadComplete]);
  
  const handleSelectHistoryItem = useCallback((item: ImageHistoryItem) => {
    setSelectedImage(item);
    setPrompt(item.prompt);
    setIsHistoryPanelOpen(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt Missing", description: "Please enter a prompt.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError('');
    
    const endpoint = '/api/generate';
    const newHistoryItems: ImageHistoryItem[] = [];

    for (let i = 0; i < batchSize; i++) {
      let currentSeedForIteration: string | undefined = seed.trim() || undefined;
      if (currentSeedForIteration && batchSize > 1) {
        const baseSeed = Number(currentSeedForIteration);
        if (!isNaN(baseSeed)) currentSeedForIteration = String(baseSeed + i);
      } else if (batchSize > 1 && !currentSeedForIteration) {
        currentSeedForIteration = String(Math.floor(Math.random() * 99999999));
      }

      const payload: Record<string, any> = {
        prompt: prompt.trim(),
        model,
        width,
        height,
        nologo: true,
        private: isPrivate,
        enhance: upsampling,
      };
      // Removed gptimage-specific transparent option
      
      if (currentSeedForIteration) {
        const seedNum = parseInt(currentSeedForIteration, 10);
        if (!isNaN(seedNum)) payload.seed = seedNum;
      }

      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await resp.json();

        if (!resp.ok) {
          const displayErrorMsg = data.error || `Error generating image (Model: ${model}, Status: ${resp.status})`;
          toast({ title: "Image Generation Error", description: displayErrorMsg, variant: "destructive", duration: 7000 });
          setError(displayErrorMsg);
          break;
        }

        if (data.imageUrl) {
          const newItem: ImageHistoryItem = {
            id: generateUUID(),
            imageUrl: data.imageUrl,
            prompt: prompt.trim(),
            model,
            timestamp: new Date().toISOString(),
            toolType: 'nocost imagination',
          };
          newHistoryItems.push(newItem);
        } else {
          const displayError = `API returned no image URL (Model: ${model})`;
          setError(displayError);
          toast({ title: "API Response Error", description: displayError, variant: "destructive" });
          break;
        }

      } catch (err: any) {
        const displayError = err.message || `Network error during image request for model ${model}.`;
        setError(displayError);
        toast({ title: "Network Error", description: displayError, variant: "destructive" });
        break;
      }
    }

    if (newHistoryItems.length > 0) {
      setSelectedImage(newHistoryItems[0]);
      setHistory(prev => [...newHistoryItems, ...prev]);
      setPrompt(newHistoryItems[0].prompt);
    }
    setLoading(false);
  }, [prompt, toast, model, batchSize, seed, width, height, isPrivate, upsampling]);

  const handleAspectRatioChange = useCallback((val: string) => {
    setAspectRatio(val);
    const [wStr, hStr] = val.split(':');
    const wRatio = Number(wStr);
    const hRatio = Number(hStr);
    if (!isNaN(wRatio) && !isNaN(hRatio) && wRatio > 0 && hRatio > 0) {
      const currentWidthVal = width;
      
      let newHeight = Math.round((currentWidthVal * hRatio) / wRatio);
      
      // Ensure dimensions are divisible by 8
      newHeight = Math.round(newHeight / 8) * 8;
      let newWidth = Math.round(currentWidthVal / 8) * 8;
      
      newWidth = Math.max(256, Math.min(2048, newWidth));
      newHeight = Math.max(256, Math.min(2048, newHeight));
      
      setWidth(newWidth);
      setHeight(newHeight);
    }
  }, [width]);
  
  const handleGenerateEvent = useCallback((e: FormEvent) => {
    e.preventDefault();
    handleGenerate();
  }, [handleGenerate]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setSelectedImage(null);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    toast({ title: "History Cleared", description: "Your image generation history has been removed." });
  }, [toast]);

  const toggleAdvancedPanel = useCallback(() => {
    if (isHistoryPanelOpen) setIsHistoryPanelOpen(false);
    setIsAdvancedPanelOpen(prev => !prev);
  }, [isHistoryPanelOpen]);

  const toggleHistoryPanel = useCallback(() => {
    if (isAdvancedPanelOpen) setIsAdvancedPanelOpen(false);
    setIsHistoryPanelOpen(prev => !prev);
  }, [isAdvancedPanelOpen]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <main className="flex-grow flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto no-scrollbar">
        <Card className="flex-grow flex flex-col border-0 shadow-none">
          <CardHeader className="py-3 px-4 flex flex-col">
          </CardHeader>
          <CardContent className="p-2 md:p-4 flex-grow bg-card rounded-b-lg flex items-center justify-center">
            {loading && <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />}
            {error && !loading && (
              <div className="w-full flex flex-col items-center justify-center text-destructive space-y-2 max-w-md mx-auto text-center">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:w-10 mb-2" />
                <p className="font-semibold text-md sm:text-lg">{t('imageGen.generationError') || 'Generation Error'}</p>
                <p className="text-xs sm:text-sm leading-relaxed">{error}</p>
              </div>
            )}
            {!loading && !error && selectedImage && (
              <div className="relative w-full aspect-square max-h-[calc(100vh-450px)]">
                <a href={selectedImage.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full group">
                  <Image
                    src={selectedImage.imageUrl}
                    alt={`Generated image for: ${selectedImage.prompt}`}
                    fill
                    sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'contain' }}
                    className="rounded-md"
                    data-ai-hint="ai generated digital art"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                    <p className="text-white text-sm p-2 bg-black/80 rounded-md">{t('imageGen.viewFullImage') || 'View Full Image'}</p>

                  </div>
                </a>
              </div>
            )}
            {!loading && !error && !selectedImage && (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-code">
                <p className="text-lg">{`</export>`}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="px-4 pt-2 pb-4 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          
          {isAdvancedPanelOpen && (
            <div 
              ref={advancedPanelRef}
              className="mb-4 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold">{t('imageGen.configurations')}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsAdvancedPanelOpen(false)}>
                        <X className="w-4 h-4 mr-1.5" />
                        {t('imageGen.close')}
                    </Button>
                </div>
              <div className="grid gap-x-6 gap-y-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="width-slider-tool" className="text-xs font-medium">{t('imageGen.width') || 'Width'} ({width}px)</Label>
                    <Slider id="width-slider-tool" value={widthValue} onValueChange={(val) => setWidth(val[0])} min={256} max={2048} step={64} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="height-slider-tool" className="text-xs font-medium">{t('imageGen.height') || 'Height'} ({height}px)</Label>
                    <Slider id="height-slider-tool" value={heightValue} onValueChange={(val) => setHeight(val[0])} min={256} max={2048} step={64} />
                  </div>
                   <div className="space-y-1.5">
                      <Label htmlFor="aspect-ratio-tool" className="text-xs font-medium">{t('imageGen.aspectRatio')}</Label>
                      <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
                        <SelectTrigger id="aspect-ratio-tool" className="h-9 bg-tool-input-bg border-border text-xs">
                          <SelectValue placeholder={t('imageGen.aspectRatio')} />
                        </SelectTrigger>
                        <SelectContent>
                          {['1:1', '4:3', '3:2', '16:9', '21:9', '3:4', '2:3', '9:16'].map(r => (
                            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="space-y-1.5">
                      <Label htmlFor="batch-size-tool" className="text-xs font-medium">{t('imageGen.batchSize') || 'Batch Size'} ({batchSize})</Label>
                      <Slider id="batch-size-tool" value={batchSizeValue} onValueChange={(val) => setBatchSize(val[0])} min={1} max={5} step={1} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="seed-input-tool" className="text-xs font-medium">{t('field.seed') || 'Seed'}</Label>
                      <div className='flex gap-2'>
                        <Input id="seed-input-tool" type="number" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder={t('imageGen.random') || 'Random'} className="h-9 bg-tool-input-bg border-border text-xs" />
                        <Button variant="outline" size="sm" onClick={() => setSeed(String(Math.floor(Math.random() * 99999999)))} className="text-xs h-9">
                          {t('imageGen.random') || 'Random'}
                        </Button>
                      </div>
                    </div>
                    <div className='grid grid-cols-3 gap-4 items-center pt-2'>
                       <div className="flex items-center space-x-2">
                        <Checkbox checked={isPrivate} onCheckedChange={(checked) => setIsPrivate(!!checked)} id="private-check-tool" />
                        <Label htmlFor="private-check-tool" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('imageGen.private') || 'Private'}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={upsampling} onCheckedChange={(checked) => setUpsampling(!!checked)} id="upsampling-check-tool" />
                        <Label htmlFor="upsampling-check-tool" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('imageGen.upsample') || 'Upsample'}</Label>
                      </div>
                      {/* Transparent option removed (was gptimage-specific) */}
                    </div>
              </div>
            </div>
          )}

          <form onSubmit={handleGenerateEvent}>
            <div className="bg-pink-100 dark:bg-[#252525] text-gray-800 dark:text-white rounded-2xl p-3 shadow-lg flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="w-full sm:flex-1">
                <Textarea
                  ref={textareaRef}
                  id="prompt-pollinations-tool"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('imageGen.placeholderLite')}
                  className="flex-grow w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none px-3 py-2 m-0 leading-tight resize-none overflow-y-auto font-medium min-h-[84px]"
                  rows={1}
                  disabled={loading}
                  aria-label="Image prompt for Pollinations models"
                  style={{ lineHeight: '1.5rem', fontSize: '19px' }}
                />
              </div>
              <div className="flex w-full sm:w-auto items-center justify-end gap-2 mt-2 sm:mt-0 sm:ml-2">
                 <Select value={model} onValueChange={setModel} disabled={loading}>
                  <SelectTrigger className="bg-muted/20 border border-border/30 h-12 w-auto px-3 rounded-lg text-base hover:bg-muted/40 focus-visible:ring-primary text-foreground">
                    <SelectValue placeholder={t('imageGen.selectModel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels.map(m => (
                      <SelectItem key={m} value={m} className="text-base text-foreground">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={loading || !prompt.trim()} className="h-12 px-4 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 text-foreground text-base">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('imageGen.execute')}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-3 flex justify-between items-center px-1">
            <button
              onClick={toggleHistoryPanel}
              className={cn(
                "text-left text-foreground text-xl font-bold font-code select-none truncate",
                "hover:text-foreground/80 transition-colors duration-200 px-2 py-1 rounded-md"
              )}
              aria-label="Open image generation history"
            >
              <p>{t('imageGen.gallery')}</p>
            </button>
            <button
              onClick={toggleAdvancedPanel}
              className={cn(
                "text-right text-xl font-bold font-code select-none truncate",
                "text-foreground hover:text-foreground/80 transition-colors duration-200 px-2 py-1 rounded-md"
              )}
              aria-label="Open advanced settings"
            >
              <p>{t('imageGen.configuration')}</p>
            </button>
          </div>
          
          {isHistoryPanelOpen && (
            <div 
              ref={historyPanelRef}
              className="absolute bottom-full mb-2 left-0 w-full bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-2 z-30 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
            >
              <ImageHistoryGallery
                history={history}
                onSelectImage={handleSelectHistoryItem}
                onClearHistory={handleClearHistory}
                onClose={() => setIsHistoryPanelOpen(false)}
              />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default VisualizingLoopsTool;
