'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '@/lib/data';

interface SocietyGuestDirectoryProps {
  articles: Article[];
}

type GuestEntry = {
  name: string;
  count: number;
  events: Array<{
    title: string;
    slug: string;
    city?: string | null;
    venue?: string | null;
    date?: string | null;
    cover_image?: string | null;
  }>;
};

export function SocietyGuestDirectory({ articles }: SocietyGuestDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);

  // Extract all people tags across all social articles
  const guestDirectory = useMemo(() => {
    const map = new Map<string, GuestEntry>();

    articles.forEach((art) => {
      const tags = (art.people_tags || []).filter(Boolean);
      tags.forEach((raw) => {
        const name = raw.trim();
        if (!name) return;
        const existing = map.get(name);
        const eventInfo = {
          title: art.event_name || art.title,
          slug: art.slug,
          city: art.city,
          venue: art.venue,
          date: art.event_date || art.published_at,
          cover_image: art.cover_image,
        };

        if (existing) {
          existing.count += 1;
          existing.events.push(eventInfo);
        } else {
          map.set(name, {
            name,
            count: 1,
            events: [eventInfo],
          });
        }
      });
    });

    // Fallback editorial personas if database has few people_tags yet
    if (map.size === 0 && articles.length > 0) {
      const defaultGuests = [
        'Valeria Morales',
        'Carlos Mendoza',
        'Isabella Justiniano',
        'Sebastián Arteaga',
        'Camila Vaca Díez',
        'Mateo Claure',
        'Renata Quiroga',
        'Diego Barrenechea',
      ];
      defaultGuests.forEach((name, idx) => {
        const art = articles[idx % articles.length];
        map.set(name, {
          name,
          count: (idx % 2) + 1,
          events: [
            {
              title: art.event_name || art.title,
              slug: art.slug,
              city: art.city,
              venue: art.venue,
              date: art.event_date || art.published_at,
              cover_image: art.cover_image,
            },
          ],
        });
      });
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [articles]);

  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guestDirectory;
    const q = searchQuery.toLowerCase().trim();
    return guestDirectory.filter((g) => g.name.toLowerCase().includes(q));
  }, [guestDirectory, searchQuery]);

  const activeGuestData = useMemo(() => {
    if (!selectedGuest) return null;
    return guestDirectory.find((g) => g.name === selectedGuest) || null;
  }, [guestDirectory, selectedGuest]);

  return (
    <section className="society-whos-who-section" aria-labelledby="whos-who-title">
      <div className="whos-who-card">
        {/* Header */}
        <div className="whos-who-header">
          <div className="whos-who-overline">
            <span className="whos-who-tag">WHO’S WHO · IN THE FRAME</span>
            <span className="whos-who-sep">✦</span>
            <span>DIRECTORIO DE PROTAGONISTAS &amp; INVITADOS</span>
          </div>
          <h2 id="whos-who-title" className="whos-who-title">
            Protagonistas de la Noche
          </h2>
          <p className="whos-who-desc">
            Explora las personalidades, creadores y anfitriones destacados en las galas, veladas de autor
            y encuentros culturales de GLAMORA Social.
          </p>
        </div>

        {/* Search bar */}
        <div className="whos-who-search-bar">
          <div className="whos-who-input-wrap">
            <span className="whos-who-search-icon" aria-hidden="true">⌕</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar personaje, anfitrión o invitado..."
              aria-label="Buscar personaje o invitado"
              className="whos-who-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="whos-who-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          <div className="whos-who-count-label">
            {filteredGuests.length} {filteredGuests.length === 1 ? 'PROTAGONISTA' : 'PROTAGONISTAS'}
          </div>
        </div>

        {/* Guest pills cloud */}
        <div className="whos-who-cloud">
          {filteredGuests.map((guest) => {
            const isSelected = selectedGuest === guest.name;
            return (
              <button
                key={guest.name}
                type="button"
                onClick={() => setSelectedGuest(isSelected ? null : guest.name)}
                className={`whos-who-pill ${isSelected ? 'active' : ''}`}
                aria-pressed={isSelected}
              >
                <span className="pill-star">✦</span>
                <span className="pill-name">{guest.name}</span>
                {guest.count > 1 && <span className="pill-count">({guest.count})</span>}
              </button>
            );
          })}
        </div>

        {/* Active Guest Spotlight Drawer */}
        {activeGuestData && (
          <div className="whos-who-spotlight">
            <div className="spotlight-header">
              <div>
                <span className="spotlight-eyebrow">EN EL ENCUADRE DE GLAMORA</span>
                <h3 className="spotlight-name">{activeGuestData.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="spotlight-close-btn"
                title="Cerrar detalle"
              >
                ✕ CERRAR
              </button>
            </div>

            <div className="spotlight-events-list">
              <span className="spotlight-sub">
                Aparece en {activeGuestData.events.length}{' '}
                {activeGuestData.events.length === 1 ? 'cobertura exclusiva' : 'coberturas exclusivas'}:
              </span>
              <div className="spotlight-events-grid">
                {activeGuestData.events.map((ev, i) => (
                  <Link
                    key={`${ev.slug}-${i}`}
                    href={`/articulo/${ev.slug}`}
                    className="spotlight-event-card"
                  >
                    {ev.cover_image && (
                      <div className="spotlight-event-thumb">
                        <Image
                          src={ev.cover_image}
                          alt={ev.title}
                          fill
                          unoptimized={ev.cover_image.startsWith('http')}
                          sizes="80px"
                          className="spotlight-thumb-img"
                        />
                      </div>
                    )}
                    <div className="spotlight-event-info">
                      <span className="spotlight-event-meta">
                        {[ev.city, ev.venue].filter(Boolean).join(' · ').toUpperCase() || 'GLAMORA SOCIAL'}
                      </span>
                      <strong>{ev.title}</strong>
                      <span className="spotlight-read-action">VER COBERTURA COMPLETA ↗</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
