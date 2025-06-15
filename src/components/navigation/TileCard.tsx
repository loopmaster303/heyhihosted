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
      className="w-full h-36 flex flex-col items-center justify-center text-center p-4 bg-card hover:bg-card/80 transition-all duration-200 ease-in-out cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
        <IconComponent className="w-10 h-10 text-primary mx-auto mb-2" />
        <CardTitle className="font-headline text-md font-semibold text-card-foreground">{item.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">{item.description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default TileCard;
