import React from 'react';
import { Camera, FileText, ImageIcon, VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

export type AttachmentActionKind = 'image' | 'document' | 'camera' | 'reference' | 'start-frame' | 'end-frame' | 'source-video';

export interface AttachmentAction {
    kind: AttachmentActionKind;
    disabled?: boolean;
    count?: number;
    maxCount?: number;
}

interface CapabilityUploadBadgesProps {
    actions: AttachmentAction[];
    onActionSelect: (kind: AttachmentActionKind) => void;
    onAfterActionSelect?: () => void;
}

const actionIcon: Record<AttachmentActionKind, React.ReactNode> = {
    image: <ImageIcon className="h-4 w-4" />,
    document: <FileText className="h-4 w-4" />,
    camera: <Camera className="h-4 w-4" />,
    reference: <ImageIcon className="h-4 w-4" />,
    'start-frame': <ImageIcon className="h-4 w-4" />,
    'end-frame': <ImageIcon className="h-4 w-4" />,
    'source-video': <VideoIcon className="h-4 w-4" />,
};

const actionLabelKey: Record<AttachmentActionKind, string> = {
    image: 'action.uploadImage',
    document: 'action.uploadDocument',
    camera: 'action.camera',
    reference: 'chat.attachment.referenceImage',
    'start-frame': 'chat.attachment.startFrame',
    'end-frame': 'chat.attachment.endFrame',
    'source-video': 'chat.attachment.sourceVideo',
};

export const CapabilityUploadBadges: React.FC<CapabilityUploadBadgesProps> = ({ actions, onActionSelect, onAfterActionSelect }) => {
    const { t } = useLanguage();
    if (actions.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {actions.map((action) => {
                const label = t(actionLabelKey[action.kind]);
                const count = action.count != null && action.maxCount != null ? ` ${action.count}/${action.maxCount}` : '';
                return (
                    <button
                        key={action.kind}
                        type="button"
                        onClick={() => {
                            onActionSelect(action.kind);
                            onAfterActionSelect?.();
                        }}
                        disabled={action.disabled}
                        className={cn(
                            'inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs transition-all',
                            action.disabled ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md',
                        )}
                        aria-label={label}
                    >
                        {actionIcon[action.kind]}
                        <span>{label}{count}</span>
                    </button>
                );
            })}
        </div>
    );
};
