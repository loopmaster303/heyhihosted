import React from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { X, FileImage } from 'lucide-react';

interface VisualUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    uploadedImages: string[];
    maxImages: number;
    handleRemoveImage: (index: number) => void;
    onUploadClick: () => void;
    supportsReference: boolean;
}

export const VisualUploadModal: React.FC<VisualUploadModalProps> = ({
    isOpen,
    onClose,
    uploadedImages,
    maxImages,
    handleRemoveImage,
    onUploadClick,
    supportsReference
}) => {
    if (!isOpen || !supportsReference) return null;

    return (
        <div className="mb-4 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">Upload Images ({uploadedImages.length}/{maxImages})</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4 mr-1.5" />
                    Close
                </Button>
            </div>

            {uploadedImages.length < maxImages && (
                <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer mb-4"
                    onClick={onUploadClick}
                >
                    <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                </div>
            )}

            {/* Uploaded Images Grid */}
            {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {uploadedImages.map((img, index) => (
                        <div key={index} className="space-y-1">
                            <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border">
                                <NextImage src={img} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full"
                                    onClick={() => handleRemoveImage(index)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
