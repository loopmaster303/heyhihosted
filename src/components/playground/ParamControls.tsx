"use client";

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ModelParamSchema, ParamValues, ParamField } from '@/lib/playground/param-schema';

interface Props {
  schema: ModelParamSchema;
  values: ParamValues;
  onChange: (patch: ParamValues) => void;
  uploadCount: number;
}

function isFieldVisible(field: ParamField, vals: ParamValues): boolean {
  if (!field.showIf) return true;
  return field.showIf(vals);
}

export function ParamControls({ schema, values, onChange, uploadCount }: Props) {
  const [openAdvanced, setOpenAdvanced] = useState<Record<number, boolean>>({});

  // Ein Zustand aus einer älteren Fassung kann das Feld noch gar nicht haben.
  // Ohne diesen Rückfall riss die Seite mit
  // "undefined is not an object (evaluating 'values.image')" ab.
  const vals = values ?? {};

  const setValue = (name: string, value: string | number | boolean) => {
    onChange({ ...vals, [name]: value });
  };

  const allImages = (vals.image ? (Array.isArray(vals.image) ? vals.image : [vals.image]) : []) as string[];
  const effectiveValues: ParamValues = { ...vals, image: allImages as unknown as string };

  return (
    <div className="flex flex-col gap-3">
      {schema.groups.map((group, groupIdx) => {
        const isAdvanced = group.advanced ?? false;
        const isOpen = isAdvanced ? (openAdvanced[groupIdx] ?? false) : true;
        const visibleFields = group.fields.filter((f) => isFieldVisible(f, effectiveValues));

        if (visibleFields.length === 0) return null;

        return (
          <div key={groupIdx} className="flex flex-col gap-2">
            {isAdvanced && (
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpenAdvanced((prev) => ({ ...prev, [groupIdx]: !prev[groupIdx] }))
                }
                className="flex w-full items-center justify-between border-t border-border py-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/75 transition-colors hover:text-foreground"
              >
                <span>{group.label}</span>
                <ChevronRight
                  className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-90')}
                />
              </button>
            )}
            {!isAdvanced && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/75">
                {group.label}
              </span>
            )}
            {isOpen && (
              <div className="flex flex-col gap-2.5">
                {visibleFields.map((field) => {
                  const val = vals[field.name];

                  if (field.kind === 'number') {
                    return (
                      <div key={field.name} className="flex flex-col gap-1">
                        <label htmlFor={`pf-${field.name}`} className="text-[10.5px] text-muted-foreground">
                          {field.label}
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`pf-${field.name}`}
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step ?? 1}
                            value={val !== undefined ? String(val) : ''}
                            onChange={(e) => {
                              const num = e.target.value === '' ? undefined : Number(e.target.value);
                              if (num !== undefined) setValue(field.name, num);
                            }}
                            className="h-8 text-xs"
                          />
                          {field.unit && (
                            <span className="text-[10.5px] text-muted-foreground">{field.unit}</span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (field.kind === 'enum') {
                    const current = String(val ?? field.default ?? '');
                    const selected = field.options.find((o) => o.value === current);
                    return (
                      <div key={field.name} className="flex flex-col gap-1">
                        <span className="text-[10.5px] text-muted-foreground">{field.label}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-xs hover:bg-accent"
                            >
                              <span>{selected?.label ?? current}</span>
                              <ChevronRight className="h-3 w-3 rotate-90 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                            {field.options.map((opt) => (
                              <DropdownMenuItem
                                key={opt.value}
                                onSelect={() => setValue(field.name, opt.value)}
                                className={cn(opt.value === current && 'bg-accent')}
                              >
                                {opt.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  }

                  if (field.kind === 'boolean') {
                    const checked = Boolean(val ?? field.default ?? false);
                    return (
                      <div key={field.name} className="flex items-center justify-between">
                        <span className="text-[10.5px] text-muted-foreground">{field.label}</span>
                        <Switch
                          checked={checked}
                          onCheckedChange={(v) => setValue(field.name, v)}
                        />
                      </div>
                    );
                  }

                  if (field.kind === 'text') {
                    return (
                      <div key={field.name} className="flex flex-col gap-1">
                        <label htmlFor={`pf-${field.name}`} className="text-[10.5px] text-muted-foreground">
                          {field.label}
                        </label>
                        {field.multiline ? (
                          <Textarea
                            id={`pf-${field.name}`}
                            rows={2}
                            value={String(val ?? '')}
                            placeholder={field.placeholder ?? ''}
                            onChange={(e) => setValue(field.name, e.target.value)}
                            className="resize-y text-xs"
                          />
                        ) : (
                          <Input
                            id={`pf-${field.name}`}
                            type="text"
                            value={String(val ?? '')}
                            placeholder={field.placeholder ?? ''}
                            onChange={(e) => setValue(field.name, e.target.value)}
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                    );
                  }

                  if (field.kind === 'seconds') {
                    const opts = field.options;
                    const currentIdx = opts.indexOf(Number(val ?? field.default ?? opts[0]));
                    const currentVal = opts[currentIdx >= 0 ? currentIdx : 0] ?? opts[0];
                    return (
                      <div key={field.name} className="flex flex-col gap-1">
                        <span className="text-[10.5px] text-muted-foreground">{field.label}</span>
                        <div className="flex items-center gap-3">
                          <Slider
                            min={0}
                            max={opts.length - 1}
                            step={1}
                            value={[currentIdx >= 0 ? currentIdx : 0]}
                            onValueChange={([idx]) => {
                              const selected = opts[idx];
                              if (selected !== undefined) setValue(field.name, selected);
                            }}
                            className="flex-1"
                          />
                          <span className="min-w-[34px] text-right text-xs tabular-nums text-foreground">
                            {currentVal}s
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
