'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { GlamoraLogo } from '@/components/GlamoraLogo';
import { SocialIcon, useGlamoraSocialChannels } from '@/components/SocialIcons';

const cities = [
  ['COCHABAMBA', '/ciudad/cochabamba'],
  ['LA PAZ', '/ciudad/la-paz'],
  ['ORURO', '/ciudad/oruro'],
  ['POTOSÍ', '/ciudad/potosi'],
  ['SANTA CRUZ', '/ciudad/santa-cruz'],
  ['THE WORLD', '/categoria/mundo'],
];

const links = [
  ['MODA', '/categoria/moda'],
  ['BELLEZA', '/categoria/belleza'],
  ['PEOPLE', '/categoria/people'],
  ['SOCIALES', '/social'],
  ['VIAJES', '/categoria/viajes'],
  ['CULTURA', '/categoria/cultura'],
  ['GASTRONOMÍA', '/categoria/gastronomia'],
];

type SearchResultItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  city: string | null;
  cover_image: string | null;
  event_name: string | null;
  published_at: string | null;
  matchedPeople: string[];
};

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const socialChannels = useGlamoraSocialChannels();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearchOpen(false);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    let active = true;
    setLoading(true);

    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        if (active) {
          setResults(Array.isArray(data.results) ? data.results : []);
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [query, searchOpen]);

  return (
    <header className="site-header">
      <div className="city-topline" aria-label="Ediciones por ciudad">
        <span className="city-topline-label">
          GLAMORA <i>·</i> BOLIVIA
        </span>

        <div className="city-topline-links">
          {cities.map(([name, href]) => (
            <Link
              key={name}
              href={href}
              aria-current={isCurrentPath(pathname, href) ? 'page' : undefined}
            >
              {name}
            </Link>
          ))}
        </div>

        <div className="city-topline-socials" aria-label="Redes sociales de GLAMORA">
          {socialChannels.map((ch) => (
            <a
              key={ch.id}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="city-topline-social-icon"
              aria-label={ch.name}
              title={ch.name}
            >
              <SocialIcon platform={ch.id} size={13} />
            </a>
          ))}
        </div>
      </div>

      <div className="brand-row">
        <button
          type="button"
          className="mobile-header-icon-btn"
          onClick={() => {
            setSearchOpen(false);
            setMobileMenuOpen((prev) => !prev);
          }}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú de ciudades y secciones"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <Link href="/" aria-label="Glamora, inicio" className="glamora-brand">
          <GlamoraLogo variant="header" tone="dark-bg" />
        </Link>

        <button
          type="button"
          className="mobile-header-icon-btn"
          onClick={() => {
            setMobileMenuOpen(false);
            setSearchOpen((prev) => !prev);
          }}
          aria-expanded={searchOpen}
          aria-label="Buscar en GLAMORA"
        >
          ⌕
        </button>
      </div>

      <nav className="main-nav" aria-label="Navegación principal">
        <div className="nav-inner">
          {links.map(([name, href]) => (
            <Link
              key={name}
              href={href}
              aria-current={isCurrentPath(pathname, href) ? 'page' : undefined}
            >
              {name}
            </Link>
          ))}
          <Link
            href="/ediciones"
            aria-current={
              isCurrentPath(pathname, '/ediciones') ? 'page' : undefined
            }
          >
            THE ISSUES
          </Link>
          <Link
            href="/publicidad"
            aria-current={
              isCurrentPath(pathname, '/publicidad') ? 'page' : undefined
            }
          >
            PUBLICIDAD
          </Link>
          <button
            type="button"
            className="header-search-trigger desktop-only-search"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-expanded={searchOpen}
            aria-label="Buscar en GLAMORA"
          >
            BUSCAR ⌕
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="mobile-editorial-drawer"
          role="dialog"
          aria-label="Menú editorial GLAMORA"
        >
          <div className="mobile-drawer-section">
            <span className="mobile-drawer-kicker">EDICIONES POR CIUDAD</span>
            <div className="mobile-drawer-cities">
              {cities.map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mobile-drawer-section">
            <span className="mobile-drawer-kicker">SECCIONES</span>
            <div className="mobile-drawer-links">
              {links.map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {name}
                </Link>
              ))}
              <Link href="/ediciones" onClick={() => setMobileMenuOpen(false)}>
                THE ISSUES
              </Link>
              <Link href="/publicidad" onClick={() => setMobileMenuOpen(false)}>
                PUBLICIDAD
              </Link>
              <Link href="/contacto" onClick={() => setMobileMenuOpen(false)}>
                CONTACTO
              </Link>
            </div>
          </div>

          <div className="mobile-drawer-section">
            <span className="mobile-drawer-kicker">REDES OFICIALES</span>
            <div className="mobile-drawer-socials">
              {socialChannels.map((ch) => (
                <a
                  key={ch.id}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-drawer-social-btn"
                  aria-label={ch.name}
                  title={ch.name}
                >
                  <SocialIcon platform={ch.id} size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div
          className="editorial-search-drawer"
          role="dialog"
          aria-label="Buscador editorial GLAMORA"
        >
          <div className="editorial-search-inner">
            <div className="editorial-search-header">
              <span className="editorial-search-kicker">
                THE GLAMORA ARCHIVE · PEOPLE, EVENTS &amp; STORIES
              </span>
              <button
                type="button"
                className="editorial-search-close"
                onClick={() => setSearchOpen(false)}
              >
                CERRAR ✕
              </button>
            </div>

            <div className="editorial-search-input-wrap">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca por nombre de persona, evento social, ciudad o tema…"
                aria-label="Buscar en el archivo de GLAMORA"
              />
            </div>

            <div className="editorial-search-meta">
              <span>
                {loading
                  ? 'BUSCANDO EN EL ARCHIVO…'
                  : query.trim()
                    ? `${results.length} ${results.length === 1 ? 'RESULTADO ENCONTRADO' : 'RESULTADOS ENCONTRADOS'}`
                    : 'HISTORIAS RECIENTES EN GLAMORA'}
              </span>
            </div>

            {results.length > 0 ? (
              <div className="editorial-search-results">
                {results.map((item) => (
                  <Link
                    href={`/articulo/${item.slug}`}
                    key={item.id}
                    className="editorial-search-card"
                    onClick={() => setSearchOpen(false)}
                  >
                    <div className="editorial-search-thumb">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt={item.title} />
                      ) : (
                        <span>G</span>
                      )}
                    </div>
                    <div className="editorial-search-copy">
                      <span className="editorial-search-card-meta">
                        {[item.category, item.city, item.event_name]
                          .filter(Boolean)
                          .join(' · ')
                          .toUpperCase()}
                      </span>
                      <strong>{item.title}</strong>
                      {item.matchedPeople.length > 0 && (
                        <small className="editorial-search-person-badge">
                          IN THE FRAME: {item.matchedPeople.join(' · ')}
                        </small>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              !loading && (
                <p className="editorial-search-empty">
                  No se encontraron historias o personas para &ldquo;{query}&rdquo;.
                </p>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
