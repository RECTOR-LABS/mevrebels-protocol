'use client';

import { useState } from 'react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Enhanced syntax highlighting for common tokens
  const highlightCode = (code: string, lang: string) => {
    let highlighted = code;

    if (lang === 'json') {
      highlighted = highlighted
        // Property keys
        .replace(/"([^"]+)"(\s*):/g, '<span class="text-trust-blue">"$1"</span>$2:')
        // String values
        .replace(/:\s*"([^"]+)"/g, ': <span class="text-profit-green">"$1"</span>')
        // Numbers (including decimals)
        .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="text-warning-orange">$1</span>')
        // Booleans and null
        .replace(/:\s*(true|false|null)/g, ': <span class="text-rebellious">$1</span>')
        // Brackets and braces
        .replace(/([{}\[\]])/g, '<span class="text-white">$1</span>');
    }

    if (lang === 'javascript' || lang === 'typescript') {
      highlighted = highlighted
        // Comments first (to avoid highlighting keywords in comments)
        .replace(/\/\/(.+)$/gm, '<span class="text-neutral-gray italic">//$1</span>')
        // Keywords
        .replace(/\b(const|let|var|function|async|await|return|if|else|for|while|import|export|from|class|new|try|catch|switch|case|break|continue|typeof|instanceof)\b/g, '<span class="text-rebellious font-semibold">$1</span>')
        // Built-in objects and functions
        .replace(/\b(fetch|console|JSON|WebSocket|document|window|Math|Date|Array|Object|Promise|Error)\b/g, '<span class="text-trust-blue">$1</span>')
        // Function calls
        .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="text-warning-orange">$1</span>(')
        // Template literals (backticks)
        .replace(/`([^`]*)`/g, '<span class="text-profit-green">`$1`</span>')
        // Strings (single quotes)
        .replace(/'([^']+)'/g, '<span class="text-profit-green">\'$1\'</span>')
        // Strings (double quotes)
        .replace(/"([^"]+)"/g, '<span class="text-profit-green">"$1"</span>')
        // Numbers
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-warning-orange">$1</span>');
    }

    if (lang === 'python') {
      highlighted = highlighted
        // Comments first
        .replace(/#(.+)$/gm, '<span class="text-neutral-gray italic">#$1</span>')
        // Keywords
        .replace(/\b(import|from|def|class|return|if|else|elif|for|while|try|except|with|as|pass|break|continue|lambda|yield|raise|assert|finally)\b/g, '<span class="text-rebellious font-semibold">$1</span>')
        // Built-in functions and modules
        .replace(/\b(requests|json|print|len|str|int|float|list|dict|set|tuple|range)\b/g, '<span class="text-trust-blue">$1</span>')
        // Function calls
        .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="text-warning-orange">$1</span>(')
        // Strings (single quotes)
        .replace(/'([^']+)'/g, '<span class="text-profit-green">\'$1\'</span>')
        // Strings (double quotes)
        .replace(/"([^"]+)"/g, '<span class="text-profit-green">"$1"</span>')
        // Numbers
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-warning-orange">$1</span>');
    }

    if (lang === 'bash' || lang === 'curl') {
      highlighted = highlighted
        // Comments first
        .replace(/#(.+)$/gm, '<span class="text-neutral-gray italic">#$1</span>')
        // Strings BEFORE other replacements (to avoid matching HTML attribute quotes)
        // Single quotes
        .replace(/'([^']+)'/g, '<span class="text-profit-green">\'$1\'</span>')
        // Double quotes
        .replace(/"([^"]+)"/g, '<span class="text-profit-green">"$1"</span>')
        // Commands at start of line
        .replace(/^(curl|npm|git|docker|cd|ls|mkdir|cat|echo|chmod|chown|grep|find|sed|awk|tar|zip|unzip|wget)\b/gm, '<span class="text-rebellious font-semibold">$1</span>')
        // Flags and options
        .replace(/\s(-[a-zA-Z0-9-]+)/g, ' <span class="text-warning-orange">$1</span>')
        // URLs (after strings, so URLs in quotes stay green)
        .replace(/(https?:\/\/[^\s'"<]+)/g, '<span class="text-trust-blue underline">$1</span>');
    }

    return highlighted;
  };

  const languageLabels: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    bash: 'Bash',
    curl: 'cURL',
    json: 'JSON',
  };

  return (
    <div className="relative group">
      {/* Header */}
      <div className="flex items-center justify-between bg-midnight-black border border-border border-b-0 rounded-t-lg px-4 py-2">
        <span className="text-xs font-mono text-neutral-gray uppercase">
          {languageLabels[language] || language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1 text-xs font-mono text-neutral-gray hover:text-white bg-midnight-black/50 hover:bg-midnight-black border border-border rounded transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <CheckIcon />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <div className="bg-midnight-black border border-border rounded-b-lg overflow-x-auto">
        <pre className="p-4">
          <code
            className="text-sm font-mono text-white leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
          />
        </pre>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
