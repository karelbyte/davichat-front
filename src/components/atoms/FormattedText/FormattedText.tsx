import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  const formatText = (text: string) => {
    // Negritas: **texto**
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Cursiva: *texto*
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Código inline: `código`
    formattedText = formattedText.replace(/`(.*?)`/g, '<code class="px-1 rounded text-sm font-mono">$1</code>');
    
    // URLs: convertir en enlaces
    formattedText = formattedText.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>');
    
    return formattedText;
  };

  const renderFormattedText = () => {
    // Primero procesamos el código multilínea
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Agregar texto antes del bloque de código
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        parts.push({
          type: 'text',
          content: formatText(textBefore)
        });
      }

      // Agregar el bloque de código
      const language = match[1] || 'javascript';
      const code = match[2].trim();
      parts.push({
        type: 'code',
        language,
        content: code
      });

      lastIndex = match.index + match[0].length;
    }

    // Agregar texto restante
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push({
        type: 'text',
        content: formatText(remainingText)
      });
    }

    return parts;
  };

  const parts = renderFormattedText();

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <div key={index} className="my-2">
              <SyntaxHighlighter
                language={part.language}
                style={tomorrow}
                showLineNumbers={false}
                wrapLines={true}
              >
                {part.content}
              </SyntaxHighlighter>
            </div>
          );
        } else {
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: part.content }}
            />
          );
        }
      })}
    </div>
  );
}; 