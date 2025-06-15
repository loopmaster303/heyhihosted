"use client";

import type React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { TileItem } from '@/types';

interface TileCardProps {
  item: TileItem;
  onSelect: (id: TileItem['id']) => void;
}

const TileCard: React.FC<TileCardProps> = ({ item, onSelect }) => {
  const IconComponent = item.icon;
  return (
    <Card
      className="w-full h-48 md:h-56 flex flex-col items-center justify-center text-center p-6 bg-card hover:bg-card/80 transition-all duration-200 ease-in-out cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      onClick={() => onSelect(item.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(item.id);
        }
      }}
      aria-label={`Start chat with ${item.title}`}
    >
      <CardHeader className="p-0">
        <IconComponent className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-3" />
        <CardTitle className="font-headline text-lg md:text-xl font-semibold text-card-foreground">{item.title}</CardTitle>
        <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">{item.description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default TileCard;
