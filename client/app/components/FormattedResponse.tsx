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
        <pre key={`code-${renderedElements.length}`} className="my-2.5 p-3 rounded-md bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
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
        <div key={`formula-${i}`} className="my-2 p-2.5 rounded bg-slate-50 border border-slate-300 font-mono text-xs sm:text-sm text-slate-900 font-bold flex items-center justify-between">
          <span>{trimmed}</span>
          <span className="text-[10px] text-slate-400 font-sans font-normal uppercase tracking-wider">Formula</span>
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
        <span key={`cite-${match.index}`} className="inline-flex items-center font-mono font-bold text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-300 mx-1">
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
