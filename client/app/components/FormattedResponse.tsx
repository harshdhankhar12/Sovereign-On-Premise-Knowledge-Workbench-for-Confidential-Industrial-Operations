import React from 'react';

interface FormattedResponseProps {
  content: string;
}

export default function FormattedResponse({ content }: FormattedResponseProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushList = () => {
    if (currentList) {
      const isOrdered = currentList.type === 'ol';
      renderedElements.push(
        <div key={`list-${renderedElements.length}`} className="my-2 space-y-1">
          {currentList.items.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
              <span className={`shrink-0 font-mono text-[11px] font-bold ${isOrdered ? 'text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200' : 'text-slate-500 mt-1'}`}>
                {isOrdered ? `${idx + 1}.` : '•'}
              </span>
              <div className="flex-1">
                {parseInlineFormatting(item)}
              </div>
            </div>
          ))}
        </div>
      );
      currentList = null;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockLines.length > 0) {
      renderedElements.push(
        <div key={`code-${renderedElements.length}`} className="my-3 rounded-lg overflow-hidden border border-slate-200 shadow-2xs bg-slate-900">
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-[11px] font-mono text-slate-300">
            <span>Terminal / Code Snippet</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Offline Safe</span>
          </div>
          <pre className="p-3 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        </div>
      );
      codeBlockLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      renderedElements.push(
        <h4 key={`h4-${i}`} className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mt-3 mb-1 border-b border-slate-100 pb-1">
          {parseInlineFormatting(trimmed.slice(4))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      renderedElements.push(
        <h3 key={`h3-${i}`} className="text-sm sm:text-base font-bold text-slate-900 mt-3.5 mb-1.5 border-b border-slate-200 pb-1">
          {parseInlineFormatting(trimmed.slice(3))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-base sm:text-lg font-black text-slate-950 mt-4 mb-2">
          {parseInlineFormatting(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(trimmed.slice(2));
      continue;
    }

    const isFormulaLine =
      (trimmed.includes('=') || trimmed.includes('Δ') || trimmed.includes('±') || trimmed.includes('kJ/mol') || trimmed.includes('m³/h') || trimmed.includes('mm/s')) &&
      !trimmed.includes(' ') && trimmed.length < 90 ||
      trimmed.startsWith('Formula:') ||
      trimmed.startsWith('Equation:');

    if (isFormulaLine) {
      flushList();
      renderedElements.push(
        <div key={`formula-${i}`} className="my-2.5 p-3 rounded-lg bg-blue-50/50 border border-blue-200/70 font-mono text-xs sm:text-sm text-slate-900 font-bold flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <span className="text-blue-950 font-mono">{trimmed}</span>
          <span className="text-[10px] bg-white border border-blue-200 text-blue-700 font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs">Formula</span>
        </div>
      );
      continue;
    }

    flushList();
    renderedElements.push(
      <p key={`p-${i}`} className="my-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
        {parseInlineFormatting(trimmed)}
      </p>
    );
  }

  flushList();
  flushCodeBlock();

  return <div className="space-y-1">{renderedElements}</div>;
}

function parseInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\(Page \d+\)\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${match.index}`} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`c-${match.index}`} className="font-mono bg-slate-100 text-slate-900 text-xs px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.endsWith(']')) {
      parts.push(
        <span key={`cite-${match.index}`} className="inline-flex items-center font-mono font-semibold text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/80 mx-1 shadow-2xs hover:bg-blue-100/70 transition-colors">
          {token.slice(1, -1)}
        </span>
      );
    } else {
      parts.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

