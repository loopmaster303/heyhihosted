import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface ReferenceImage {
  id: string;
  file: File;
  preview: string;
  tag: string;
}

interface ReferenceImageTagManagerProps {
  images: ReferenceImage[];
  onImagesChange: (images: ReferenceImage[]) => void;
  maxImages?: number;
}

export const ReferenceImageTagManager: React.FC<ReferenceImageTagManagerProps> = ({
  images,
  onImagesChange,
  maxImages = 3
}) => {
  const { t } = useLanguage();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback((files: FileList) => {
    const newImages: ReferenceImage[] = [];
    
    Array.from(files).forEach((file, index) => {
      if (images.length + newImages.length >= maxImages) return;
      
      if (file.type.startsWith('image/')) {
        const id = `ref-${Date.now()}-${index}`;
        const preview = URL.createObjectURL(file);
        newImages.push({
          id,
          file,
          preview,
          tag: `ref${images.length + newImages.length + 1}`
        });
      }
    });

    onImagesChange([...images, ...newImages]);
  }, [images, onImagesChange, maxImages]);

  const handleTagChange = useCallback((imageId: string, newTag: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, tag: newTag } : img
    );
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const removeImage = useCallback((imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = images.filter(img => img.id !== imageId);
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        {t('field.referenceImages')} ({images.length}/{maxImages})
      </Label>
      
      {/* Upload Area */}
      {images.length < maxImages && (
        <Card 
          className={`border-2 border-dashed transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                {t('imageGen.dragDropImages') || 'Drag & drop images here or click to select'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFileSelect(files);
                  };
                  input.click();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('imageGen.selectImages') || 'Select Images'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image List */}
      <div className="space-y-3">
        {images.map((image, index) => (
          <Card key={image.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Image Preview */}
                <div className="relative">
                  <img
                    src={image.preview}
                    alt={`Reference ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs px-1 rounded-full min-w-[20px] text-center">
                    {index + 1}
                  </div>
                </div>

                {/* Tag Input */}
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {t('imageGen.tagForImage') || 'Tag for this image'}:
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-primary">@</span>
                    <Input
                      value={image.tag}
                      onChange={(e) => handleTagChange(image.id, e.target.value)}
                      placeholder="woman"
                      className="flex-1"
                      maxLength={15}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('imageGen.useInPrompt') || 'Use @'}{image.tag} {t('imageGen.inYourPrompt') || 'in your prompt'}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(image.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Example */}
      {images.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <Label className="text-sm font-medium mb-2 block">
              {t('imageGen.usageExample') || 'Usage Example'}:
            </Label>
            <div className="text-sm font-mono bg-background p-2 rounded border">
              {t('imageGen.examplePrompt') || 'A close up portrait of @'}{images[0]?.tag || 'woman'} {t('imageGen.inStyle') || 'in the style of @'}{images[1]?.tag || 'artist'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
