import React from 'react';
import { splitEditorialParagraphs } from '@/lib/editorial-utils';
import { EditorialVideoPlayer } from '@/components/EditorialVideoPlayer';

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Soporta **negrita**, *cursiva* y [texto](url)
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="editorial-inline-link"
        >
          {linkMatch[1]} ↗
        </a>
      );
    }
    return part;
  });
}

type EditorialBodyRendererProps = {
  body: string;
  articleTitle?: string;
};

export function EditorialBodyRenderer({
  body,
  articleTitle,
}: EditorialBodyRendererProps) {
  const paragraphs = splitEditorialParagraphs(body || '');

  return (
    <div className="editorial-article-text">
      {paragraphs.map((p, i) => {
        const trimmed = p.trim();

        // Divisor editorial
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={i} className="editorial-divider" />;
        }

        // Imagen intercalada [IMAGEN: https://... | Pie de foto opcional]
        const inlineImageMatch = trimmed.match(/^\[IMAGEN:\s*([^|\]]+?)(?:\s*\|\s*([^\]]*))?\]$/i);
        if (inlineImageMatch) {
          const imgUrl = inlineImageMatch[1].trim();
          const imgCaption = (inlineImageMatch[2] || '').trim();
          return (
            <figure key={i} className="editorial-inline-figure">
              <div className="editorial-inline-image-wrap">
                <img
                  src={imgUrl}
                  alt={imgCaption || articleTitle || 'Fotografía editorial GLAMORA'}
                  loading="lazy"
                />
              </div>
              {imgCaption && (
                <figcaption>
                  <span>GLAMORA</span>
                  <p>{imgCaption}</p>
                </figcaption>
              )}
            </figure>
          );
        }

        // Video intercalado [VIDEO: https://...]
        const inlineVideoMatch = trimmed.match(/^\[VIDEO:\s*(.+?)\s*\]$/i);
        if (inlineVideoMatch) {
          const url = inlineVideoMatch[1].trim();
          const isVertical =
            url.includes('/shorts/') || url.includes('/reel/');
          return (
            <div key={i} className="editorial-inline-video">
              <EditorialVideoPlayer
                video={{
                  url,
                  aspect: isVertical ? '9:16' : '16:9',
                }}
                title={articleTitle}
              />
            </div>
          );
        }

        // Cita destacada (Pull Quote): empieza con "> "
        if (trimmed.startsWith('> ')) {
          const quoteRaw = trimmed.slice(2).trim();
          const [quoteText, quoteAuthor] = quoteRaw.split(/\s+—\s+/);
          return (
            <blockquote key={i} className="editorial-pullquote">
              <p>{renderInlineFormatting(quoteText)}</p>
              {quoteAuthor && <cite>— {quoteAuthor}</cite>}
            </blockquote>
          );
        }

        // Subtítulo editorial: empieza con "## " o es MAYÚSCULAS < 70 caracteres
        if (
          trimmed.startsWith('## ') ||
          (trimmed === trimmed.toUpperCase() &&
            trimmed.length > 2 &&
            trimmed.length < 70 &&
            /[A-ZÁÉÍÓÚÑ]/.test(trimmed))
        ) {
          const subheadText = trimmed.replace(/^##\s+/, '');
          return (
            <p key={i} className="article-subhead">
              {subheadText}
            </p>
          );
        }

        return <p key={i}>{renderInlineFormatting(trimmed)}</p>;
      })}
    </div>
  );
}
