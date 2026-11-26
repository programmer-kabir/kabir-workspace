// frontend/components/content/MarkdownRenderer.tsx
'use client';

import React from 'react';
import { Link } from 'react-router-dom';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseMarkdown = (raw: string) => {
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTable: { headers: string[]; rows: string[][] } | null = null;
    let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushList = (keyPrefix: number) => {
      if (!currentList) return;
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`ul-${keyPrefix}`} className="my-4 space-y-2 list-disc list-inside text-slate-300">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(it)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${keyPrefix}`} className="my-4 space-y-2 list-decimal list-inside text-slate-300">
            {currentList.items.map((it, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(it)}
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    };

    const flushTable = (keyPrefix: number) => {
      if (!currentTable) return;
      elements.push(
        <div key={`table-${keyPrefix}`} className="my-6 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase font-semibold text-slate-200">
              <tr>
                {currentTable.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Code Block (```)
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="my-4 p-4 rounded-xl bg-[#0b0c13] border border-white/10 text-xs font-mono text-purple-300 overflow-x-auto">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          flushList(index);
          flushTable(index);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Table Row (| ... |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList(index);
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        // Check if separator line (e.g. | :--- | :--- |)
        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          return;
        }

        if (!currentTable) {
          currentTable = { headers: cells, rows: [] };
        } else {
          currentTable.rows.push(cells);
        }
        return;
      } else if (currentTable) {
        flushTable(index);
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        flushList(index);
        elements.push(
          <h3 key={`h3-${index}`} className="mt-8 mb-3 text-lg font-bold text-white tracking-tight">
            {renderInline(trimmed.replace('### ', ''))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushList(index);
        elements.push(
          <h2 key={`h2-${index}`} className="mt-10 mb-4 text-xl sm:text-2xl font-bold text-white tracking-tight border-b border-white/10 pb-2">
            {renderInline(trimmed.replace('## ', ''))}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        flushList(index);
        elements.push(
          <h1 key={`h1-${index}`} className="mt-8 mb-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {renderInline(trimmed.replace('# ', ''))}
          </h1>
        );
        return;
      }

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        flushList(index);
        elements.push(
          <blockquote key={`quote-${index}`} className="my-4 pl-4 border-l-2 border-purple-500 text-slate-300 italic bg-purple-500/5 py-2 pr-3 rounded-r-lg">
            {renderInline(trimmed.replace('> ', ''))}
          </blockquote>
        );
        return;
      }

      // Unordered Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        if (!currentList || currentList.type !== 'ul') {
          flushList(index);
          currentList = { type: 'ul', items: [itemText] };
        } else {
          currentList.items.push(itemText);
        }
        return;
      }

      // Ordered Lists
      if (/^\d+\.\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s+/, '');
        if (!currentList || currentList.type !== 'ol') {
          flushList(index);
          currentList = { type: 'ol', items: [itemText] };
        } else {
          currentList.items.push(itemText);
        }
        return;
      }

      // Blank line
      if (!trimmed) {
        flushList(index);
        return;
      }

      // Regular Paragraph
      flushList(index);
      elements.push(
        <p key={`p-${index}`} className="my-3 text-sm sm:text-base text-slate-300 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    });

    flushList(lines.length);
    flushTable(lines.length);

    return elements;
  };

  const renderInline = (text: string): React.ReactNode => {
    // Parse inline bold, links, and code
    // Regex matches [link](url), **bold**, `code`
    const parts: React.ReactNode[] = [];
    const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      const token = match[0];

      if (token.startsWith('[') && token.includes('](')) {
        const titleMatch = token.match(/\[(.*?)\]/);
        const urlMatch = token.match(/\((.*?)\)/);
        const title = titleMatch ? titleMatch[1] : '';
        const url = urlMatch ? urlMatch[1] : '#';
        const isExternal = url.startsWith('http');

        if (isExternal) {
          parts.push(
            <a
              key={match.index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline underline-offset-4 font-medium transition-colors"
            >
              {title}
            </a>
          );
        } else {
          parts.push(
            <Link
              key={match.index}
              to={url}
              className="text-purple-400 hover:text-purple-300 underline underline-offset-4 font-medium transition-colors"
            >
              {title}
            </Link>
          );
        }
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 rounded bg-white/10 text-purple-300 font-mono text-xs">
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  return <div className="prose-dark max-w-none">{parseMarkdown(content)}</div>;
}
