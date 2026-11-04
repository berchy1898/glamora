'use client';

import { useEffect, useState } from 'react';
import { SocialIcon } from '@/components/SocialIcons';

export function ReadingTracker({ slug }: { slug?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!slug) return;
    fetch('/api/studio-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'track_view', slug }),
    }).catch(() => {});
  }, [slug]);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setProgress(0);
        return;
      }
      const pct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      setProgress(pct);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="reading-progress-track" aria-hidden="true">
      <div
        className="reading-progress-fill"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function ArticleShareBarWidget({
  slug,
  title,
  category,
}: {
  slug: string;
  title: string;
  category?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState('');

  function getArticleUrl() {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `/articulo/${slug}`;
  }

  function handleWhatsAppShare() {
    const url = getArticleUrl();
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function handleFacebookShare() {
    const url = getArticleUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  function handleXShare() {
    const url = getArticleUrl();
    const text = `${title} — GLAMORA`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  async function handleInstagramShare() {
    const url = getArticleUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFeedback('Enlace copiado para Instagram Stories / DM ✓');
      setTimeout(() => {
        setCopied(false);
        setFeedback('');
      }, 2600);
    } catch {
      setFeedback('Comparte en Instagram: ' + url);
      setTimeout(() => setFeedback(''), 2600);
    }
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  }

  async function handleCopyLink() {
    const url = getArticleUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFeedback('Enlace copiado al portapapeles ✓');
      setTimeout(() => {
        setCopied(false);
        setFeedback('');
      }, 2600);
    } catch {
      setFeedback(url);
      setTimeout(() => setFeedback(''), 2600);
    }
  }

  const categoryLabel = (category || 'EDITORIAL').toUpperCase();

  return (
    <aside className="article-share-bar" aria-label="Compartir esta historia">
      <div className="article-share-meta">
        <span className="article-share-kicker">COMPARTIR</span>
        <span className="article-share-dot" aria-hidden="true">·</span>
        <span className="article-share-subtitle">{categoryLabel}</span>
      </div>

      <div className="article-share-actions">
        <div className="article-share-buttons">
          <button
            type="button"
            className="article-share-icon-link"
            onClick={handleWhatsAppShare}
            aria-label="Compartir en WhatsApp"
            title="Compartir en WhatsApp"
          >
            <SocialIcon platform="whatsapp" size={16} />
          </button>

          <button
            type="button"
            className="article-share-icon-link"
            onClick={handleInstagramShare}
            aria-label="Compartir en Instagram"
            title="Compartir en Instagram"
          >
            <SocialIcon platform="instagram" size={16} />
          </button>

          <button
            type="button"
            className="article-share-icon-link"
            onClick={handleFacebookShare}
            aria-label="Compartir en Facebook"
            title="Compartir en Facebook"
          >
            <SocialIcon platform="facebook" size={16} />
          </button>

          <button
            type="button"
            className="article-share-icon-link"
            onClick={handleXShare}
            aria-label="Compartir en X"
            title="Compartir en X"
          >
            <SocialIcon platform="x" size={15} />
          </button>

          <span className="article-share-divider" aria-hidden="true" />

          <button
            type="button"
            className={`article-share-copy-link-btn ${copied ? 'is-copied' : ''}`}
            onClick={handleCopyLink}
            aria-label="Copiar enlace"
            title="Copiar enlace directo"
          >
            <span>{copied ? 'ENLACE COPIADO ✓' : 'COPIAR ENLACE'}</span>
            {!copied && <span aria-hidden="true" className="article-share-arrow">↗</span>}
          </button>
        </div>

        {feedback && (
          <span className="article-share-toast" role="status">
            {feedback}
          </span>
        )}
      </div>
    </aside>
  );
}
