'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { imageModelIcons } from '@/config/ui-constants';

/**
 * Das Logo des Anbieters, nicht ein Symbol fuer die Funktion "Modell".
 *
 * Vorher stand hier ein generisches Stapel-Icon — dasselbe Bild fuer Flux,
 * GPT-Image und Seedream. Es trug keine Information und war genau die Art von
 * Piktogramm, die aus der Leiste verschwinden sollte. Ein Anbieterlogo dagegen
 * ist Information: man erkennt es wieder, ohne es zu lernen.
 *
 * Kein Logo hinterlegt heisst: nichts rendern. Der Modellname steht ohnehin
 * daneben und traegt den Chip allein.
 */
export const ModelLogo: React.FC<{ modelId: string; className?: string }> = ({ modelId, className }) => {
  const icon = imageModelIcons[modelId];
  if (!icon) return null;

  if (typeof icon === 'string') {
    return <span aria-hidden="true" className={cn('text-xs leading-none', className)}>{icon}</span>;
  }

  return (
    <Image
      src={icon}
      alt=""
      aria-hidden="true"
      width={14}
      height={14}
      className={cn('h-3.5 w-3.5 shrink-0 rounded-sm', className)}
    />
  );
};
