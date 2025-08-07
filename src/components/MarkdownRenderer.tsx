
"use client";

import React, { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from './ui/button';
import { Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: FC<MarkdownRendererProps> = ({ content }) => {
    const { toast } = useToast();

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            toast({ title: 'Copied to clipboard!' });
        }).catch(err => {
            toast({ title: 'Failed to copy', description: err.message, variant: 'destructive' });
        });
    };

    return (
        <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none font-code"
            components={{
                code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    return match ? (
                        <div className="relative my-4 rounded-md">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                                onClick={() => handleCopy(codeString)}
                            >
                                <Clipboard className="h-4 w-4" />
                            </Button>
                            <SyntaxHighlighter
                                style={vscDarkPlus as any}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {codeString}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code className="px-1 py-0.5 rounded bg-muted text-muted-foreground" {...props}>
                            {children}
                        </code>
                    );
                },
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold border-b pb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold" {...props} />,
                p: ({node, ...props}) => <p className="leading-7 mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4" {...props} />,
                li: ({node, ...props}) => <li className="mb-2" {...props} />,
                a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;
