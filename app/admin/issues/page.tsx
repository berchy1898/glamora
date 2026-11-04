'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { Article } from '@/lib/data';
import {
  formatFileSize,
  MAX_RAW_IMAGE_BYTES,
  optimizeEditorialImage,
} from '@/lib/media-optimizer';
import {
  DEFAULT_ISSUE_DESIGN,
  type CoverMastheadPalette,
  type IssueDesignConfig,
  type SpreadLayoutStyle,
} from '@/lib/issue-design-types';
import { InteractiveIssueReader } from '@/components/InteractiveIssueReader';
import { EditorialImageCropperModal } from '@/components/EditorialImageCropperModal';

const MAX_FILE_SIZE = MAX_RAW_IMAGE_BYTES;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const LAYOUT_OPTIONS: { value: SpreadLayoutStyle; label: string }[] = [
  { value: 'vogue-asymmetric', label: 'Glamora Signature Asimétrico (No Lineal · 2 Alturas + Capitular)' },
  { value: 'vogue-collage', label: 'Glamora Atelier Collage & Moodboard (1 Protagonista + 3 Flotantes)' },
  { value: 'vogue-classic', label: 'Glamora Clásico (Retrato Principal + Crónica)' },
  { value: 'cinema-bleed', label: 'Glamora Cinema Full Bleed (Pliego Oscuro)' },
  { value: 'social-mosaic', label: 'Glamora Social Mosaic (Photo Diary Desfasado)' },
  { value: 'editorial-quote', label: 'Glamora Pull-Quote (Cita Destacada + Crónica)' },
];

export default function IssueBuilder() {
  const db = supabaseBrowser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [articles, setArticles] = useState<Article[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [coverStoryId, setCoverStoryId] = useState('');
  const [number, setNumber] = useState('1');
  const [title, setTitle] = useState('The Issue');
  const [slug, setSlug] = useState('the-issue');
  const [cover, setCover] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [message, setMessage] = useState('');
  const [issues, setIssues] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Configuración avanzada de maquetación (GLAMORA ISSUE DESIGN STUDIO)
  const [allDesigns, setAllDesigns] = useState<Record<string, IssueDesignConfig>>({});
  const [design, setDesign] = useState<IssueDesignConfig>(DEFAULT_ISSUE_DESIGN);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview('');
      return;
    }

    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [coverFile]);

  async function refreshIssues() {
    const { data, error } = await db
      .from('magazine_issues')
      .select('*')
      .order('issue_number', { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setIssues(data || []);
  }

  async function loadStudioConfigs() {
    try {
      const res = await fetch('/api/studio-config');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.issueDesigns) {
        setAllDesigns(data.issueDesigns);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await db.auth.getUser();

      if (!user || user.email?.toLowerCase() !== 'legarage1014@gmail.com') {
        router.replace('/admin/login');
        return;
      }

      const [{ data, error }, { data: sponsorData }] = await Promise.all([
        db
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false }),
        db.from('sponsors').select('*').eq('active', true).limit(3),
      ]);

      if (error) {
        setMessage(error.message);
      } else {
        setArticles((data || []) as Article[]);
      }

      setSponsors(sponsorData || []);
      await Promise.all([refreshIssues(), loadStudioConfigs()]);
    })();
  }, []);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const validType =
      ALLOWED_TYPES.includes(file.type) ||
      ['jpg', 'jpeg', 'png', 'webp'].includes(extension);

    if (!validType) {
      setMessage('Formato no permitido. Utiliza JPG, PNG o WEBP.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage('La fotografía de origen supera el límite de 25 MB.');
      e.target.value = '';
      return;
    }

    setPendingCropFile(file);
  }

  function moveChosenArticle(index: number, direction: -1 | 1) {
    setChosen((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setArticleSpreadLayout(articleId: string, layout: SpreadLayoutStyle) {
    setDesign((prev) => ({
      ...prev,
      articleLayouts: {
        ...prev.articleLayouts,
        [articleId]: layout,
      },
    }));
  }

  function removeSelectedCover() {
    setCoverFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMessage('Se conservó la portada anterior.');
  }

  function resetForm() {
    setEditingId(null);
    setNumber('1');
    setTitle('The Issue');
    setSlug('the-issue');
    setCover('');
    setCoverFile(null);
    setChosen([]);
    setCoverStoryId('');
    setDesign(DEFAULT_ISSUE_DESIGN);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function editIssue(issue: any) {
    setEditingId(issue.id);
    setNumber(String(issue.issue_number));
    setTitle(issue.title || '');
    setSlug(issue.slug || '');
    setCover(issue.cover_image || '');
    setCoverFile(null);

    setChosen(Array.isArray(issue.article_ids) ? issue.article_ids : []);
    setCoverStoryId(issue.cover_story_id || '');

    const savedDesign =
      allDesigns[issue.slug] ||
      allDesigns[String(issue.id)] ||
      DEFAULT_ISSUE_DESIGN;
    setDesign({
      ...DEFAULT_ISSUE_DESIGN,
      ...savedDesign,
      articleLayouts: savedDesign.articleLayouts || {},
    });

    setMessage('Editando maquetación de: ' + issue.title);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function cancelEdit() {
    resetForm();
    setMessage('Edición cancelada.');
  }

  async function saveIssue(e: React.FormEvent) {
    e.preventDefault();

    if (!chosen.length) {
      setMessage('Selecciona al menos un artículo para las páginas de la revista.');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    setMessage('Guardando edición y maquetación en GLAMORA Studio...');

    try {
      let finalCoverUrl = cover.trim();

      if (coverFile) {
        const extension = coverFile.name.split('.').pop()?.toLowerCase() || '';
        const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}.${normalizedExtension}`;

        const { error: uploadError } = await db.storage
          .from('covers')
          .upload(fileName, coverFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: MIME_TYPES[extension] || coverFile.type,
          });

        if (uploadError) {
          setMessage('Error al subir la portada: ' + uploadError.message);
          return;
        }

        const { data: publicData } = db.storage
          .from('covers')
          .getPublicUrl(fileName);

        finalCoverUrl = publicData.publicUrl;
      }

      const issueData = {
        issue_number: Number(number),
        title,
        slug,
        cover_image: finalCoverUrl || null,
        article_ids: chosen,
        cover_story_id: chosen.includes(coverStoryId) ? coverStoryId : chosen[0],
      };

      // Guardar diseño editorial avanzado en /api/studio-config
      await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_issue_design',
          issueKey: slug.trim(),
          design,
        }),
      });

      if (editingId) {
        const { data: currentIssue, error: currentIssueError } = await db
          .from('magazine_issues')
          .select('slug')
          .eq('id', editingId)
          .maybeSingle();

        if (currentIssueError) {
          setMessage(
            'No se pudo comprobar la dirección anterior: ' +
              currentIssueError.message
          );
          return;
        }

        const previousSlug = currentIssue?.slug?.trim();

        const { error } = await db
          .from('magazine_issues')
          .update(issueData)
          .eq('id', editingId);

        if (error) {
          setMessage('Error al actualizar: ' + error.message);
          return;
        }

        if (previousSlug && previousSlug !== slug.trim()) {
          await db
            .from('magazine_issue_redirects')
            .update({ new_slug: slug.trim() })
            .eq('new_slug', previousSlug);

          await db
            .from('magazine_issue_redirects')
            .upsert(
              { old_slug: previousSlug, new_slug: slug.trim() },
              { onConflict: 'old_slug' }
            );
        }

        setMessage('Edición y maquetación actualizadas correctamente ✓');
      } else {
        const { error } = await db.from('magazine_issues').insert({
          ...issueData,
          status: 'draft',
        });

        if (error) {
          setMessage('Error al crear: ' + error.message);
          return;
        }

        setMessage('Borrador de edición y maquetación creados correctamente ✓');
      }

      await Promise.all([refreshIssues(), loadStudioConfigs()]);
      resetForm();
    } catch (error: any) {
      setMessage('Error inesperado: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function publish(id: string, status: string) {
    const newStatus = status === 'published' ? 'draft' : 'published';

    const { error } = await db
      .from('magazine_issues')
      .update({
        status: newStatus,
        published_at:
          newStatus === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      newStatus === 'published'
        ? 'Edición publicada correctamente.'
        : 'Edición retirada correctamente.'
    );

    await refreshIssues();
  }

  const displayedCover = coverPreview || cover;
  const chosenArticleObjects = chosen
    .map((id) => articles.find((a) => a.id === id))
    .filter(Boolean) as Article[];

  return (
    <main className="admin-shell">
      <EditorialImageCropperModal
        file={pendingCropFile}
        defaultPreset="vertical"
        title="Encuadre Editorial de Portada de Edición (Vertical 3:4)"
        onConfirm={(standardized) => {
          setCoverFile(standardized);
          setPendingCropFile(null);
          setMessage(
            `Portada estandarizada en alta definición (${formatFileSize(standardized.size)}) ✓`
          );
        }}
        onCancel={() => {
          setPendingCropFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />
      <div className="admin-top">
        <strong className="admin-wordmark">
          GLAMORA <span>STUDIO</span>
        </strong>
        <nav className="admin-top-nav" aria-label="Navegación del estudio">
          <a href="/admin">DASHBOARD</a>
          <a href="/admin/issues" aria-current="page">
            THE ISSUES (REVISTA)
          </a>
          <a href="/admin/social-studio">SOCIAL STUDIO</a>
          <a href="/admin/agenda">AGENDA</a>
          <a href="/admin/produccion">PRODUCCIÓN</a>
          <a href="/admin/sponsors">PATROCINIOS</a>
        </nav>

        <button
          type="button"
          className="button-primary"
          onClick={() => router.push('/admin')}
        >
          VOLVER AL PANEL
        </button>
      </div>

      <div className="admin-content">
        <div className="eyebrow">GLAMORA ISSUE DESIGN STUDIO</div>

        <h1 style={{ font: '42px Georgia', fontWeight: 400 }}>
          {editingId
            ? 'Estudio de maquetación · Editar edición'
            : 'Estudio de maquetación · Crear edición digital'}
        </h1>

        <p>
          Diseña la portada con titulares en vivo, redacta la Carta Editorial, elige la plantilla visual de cada doble página y prueba el pasado de hojas interactivo sin salir de GLAMORA Studio.
        </p>

        <section className="admin-panel">
          <form className="admin-form" onSubmit={saveIssue}>
            {/* 1. DATOS PRINCIPALES DE LA EDICIÓN */}
            <div className="wide" style={{ borderBottom: '1px solid #e7ded5', paddingBottom: 10 }}>
              <div className="eyebrow">PASO 1 · IDENTIDAD DE LA EDICIÓN</div>
            </div>

            <label>
              NÚMERO DE EDICIÓN
              <input
                type="number"
                min="1"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </label>

            <label>
              TÍTULO DE LA EDICIÓN
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="wide">
              SLUG (URL EN /EDICIONES/...)
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '')
                  )
                }
                required
              />
            </label>

            {/* 2. DIRECCIÓN DE ARTE DE PORTADA + VISTA PREVIA INTERACTIVA */}
            <div className="wide" style={{ borderBottom: '1px solid #e7ded5', paddingBottom: 10, marginTop: 14 }}>
              <div className="eyebrow">PASO 2 · DIRECCIÓN DE ARTE DE PORTADA &amp; PREVISUALIZACIÓN EN VIVO</div>
            </div>

            <div
              className="wide"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 24,
                alignItems: 'start',
              }}
            >
              {/* Controles de Portada */}
              <div style={{ display: 'grid', gap: 14 }}>
                <div
                  style={{
                    border: '1px dashed #c8bbb0',
                    padding: 18,
                    background: '#faf9f7',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    id="issue-cover"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label
                      htmlFor="issue-cover"
                      className="button-primary"
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      SUBIR FOTO DE PORTADA
                    </label>
                    {coverFile && (
                      <button
                        type="button"
                        className="text-link"
                        onClick={removeSelectedCover}
                      >
                        CANCELAR CAMBIO
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#777', marginTop: 8, marginBottom: 0 }}>
                    JPG, PNG o WEBP hasta 25 MB (optimización HD sin recorte).
                  </p>
                </div>

                <label>
                  COLOR DEL LOGO GLAMORA EN PORTADA
                  <select
                    value={design.mastheadPalette}
                    onChange={(e) =>
                      setDesign((prev) => ({
                        ...prev,
                        mastheadPalette: e.target.value as CoverMastheadPalette,
                      }))
                    }
                  >
                    <option value="champagne">Champagne Dorado (Firma Glamora)</option>
                    <option value="ivory">Blanco Marfil Editorial</option>
                    <option value="obsidian">Negro Obsidiana</option>
                    <option value="burgundy">Rojo Burdeos Vogue</option>
                  </select>
                </label>

                <label>
                  SELLO SUPERIOR DE PORTADA
                  <input
                    value={design.editionBadge}
                    onChange={(e) =>
                      setDesign((prev) => ({ ...prev, editionBadge: e.target.value }))
                    }
                    placeholder="THE DIGITAL ISSUE · NOVIEMBRE"
                  />
                </label>

                <label>
                  TITULAR PRINCIPAL EN PORTADA (COVER LINE)
                  <input
                    value={design.coverHeadline}
                    onChange={(e) =>
                      setDesign((prev) => ({ ...prev, coverHeadline: e.target.value }))
                    }
                    placeholder="Ej: La nueva era de la elegancia en Bolivia"
                  />
                </label>

                <label>
                  SUBTÍTULO DE PORTADA
                  <input
                    value={design.coverSubhead}
                    onChange={(e) =>
                      setDesign((prev) => ({ ...prev, coverSubhead: e.target.value }))
                    }
                    placeholder="Ej: Moda, arquitectura, gastronomía y las grandes noches de sociedad"
                  />
                </label>

                <label>
                  LLAMADOS LATERALES EN PORTADA (1 POR LÍNEA, MÁX. 3)
                  <textarea
                    rows={3}
                    value={design.coverCallouts}
                    onChange={(e) =>
                      setDesign((prev) => ({ ...prev, coverCallouts: e.target.value }))
                    }
                    placeholder={'ESPECIAL ALTA MODA\nLOS ROSTROS DEL AÑO\nGUÍA PRIVADA'}
                  />
                </label>
              </div>

              {/* Vista Previa Interactiva de la Revista en Vivo */}
              <div
                style={{
                  padding: 18,
                  border: '1px solid #e7ded5',
                  background: '#f6f2ec',
                  textAlign: 'center',
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  VISTA PREVIA INTERACTIVA (HAZ CLIC EN LA PORTADA PARA HOJEAR)
                </div>
                <InteractiveIssueReader
                  issueNumber={number || '1'}
                  issueTitle={title || 'The Issue'}
                  coverImage={displayedCover}
                  coverStoryId={coverStoryId}
                  articles={chosenArticleObjects}
                  sponsors={sponsors}
                  design={design}
                />
              </div>
            </div>

            {/* 3. CARTA EDITORIAL DEL DIRECTOR */}
            <div className="wide" style={{ borderBottom: '1px solid #e7ded5', paddingBottom: 10, marginTop: 18 }}>
              <div className="eyebrow">PASO 3 · CARTA EDITORIAL DEL DIRECTOR (PÁGINA 01)</div>
            </div>

            <label>
              TÍTULO DE LA CARTA EDITORIAL
              <input
                value={design.editorLetterTitle}
                onChange={(e) =>
                  setDesign((prev) => ({ ...prev, editorLetterTitle: e.target.value }))
                }
                placeholder="Mirada propia desde Bolivia hacia el mundo."
              />
            </label>

            <label>
              FIRMA EDITORIAL
              <input
                value={design.editorSignature}
                onChange={(e) =>
                  setDesign((prev) => ({ ...prev, editorSignature: e.target.value }))
                }
                placeholder="DIRECCIÓN EDITORIAL · GLAMORA"
              />
            </label>

            <label className="wide">
              TEXTO DE LA CARTA EDITORIAL
              <textarea
                rows={3}
                value={design.editorLetterBody}
                onChange={(e) =>
                  setDesign((prev) => ({ ...prev, editorLetterBody: e.target.value }))
                }
              />
            </label>

            {/* 4. SELECCIÓN Y MAQUETACIÓN PÁGINA POR PÁGINA */}
            <div className="wide" style={{ borderBottom: '1px solid #e7ded5', paddingBottom: 10, marginTop: 18 }}>
              <div className="eyebrow">
                PASO 4 · PÁGINAS DE LA EDICIÓN, ORDEN Y PLANTILLAS VISUALES ({chosen.length} SELECCIONADAS)
              </div>
            </div>

            <div className="wide">
              <p style={{ marginTop: 0, color: '#6e645f', fontSize: 13 }}>
                Marca las notas y coberturas que formarán parte del número y elige abajo el diseño de doble página de cada una:
              </p>

              <div
                style={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  border: '1px solid #e7ded5',
                  padding: '8px 14px',
                  background: '#fffdfa',
                }}
              >
                {articles.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f0eae2',
                      flexWrap: 'wrap',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        flex: 1,
                        margin: 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={chosen.includes(a.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setChosen((old) => [...old, a.id]);
                            if (!coverStoryId) setCoverStoryId(a.id);
                          } else {
                            setChosen((old) => old.filter((id) => id !== a.id));
                            if (coverStoryId === a.id) {
                              setCoverStoryId(
                                chosen.find((id) => id !== a.id) || ''
                              );
                            }
                          }
                        }}
                      />
                      <span>
                        {a.title}{' '}
                        <small style={{ color: '#8a7c73' }}>
                          · {a.category} {a.city ? `(${a.city})` : ''}
                        </small>
                      </span>
                    </label>

                    {chosen.includes(a.id) && (
                      <label
                        style={{
                          display: 'flex',
                          gap: 7,
                          alignItems: 'center',
                          fontSize: 10,
                          letterSpacing: 1,
                          margin: 0,
                        }}
                      >
                        <input
                          type="radio"
                          name="cover-story"
                          checked={coverStoryId === a.id}
                          onChange={() => setCoverStoryId(a.id)}
                        />
                        COVER STORY
                      </label>
                    )}
                  </div>
                ))}
              </div>

              {chosen.length > 0 && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 18,
                    border: '1px solid #e7ded5',
                    background: '#faf7f2',
                  }}
                >
                  <div className="eyebrow" style={{ marginBottom: 12 }}>
                    ESCALETA DE PLIEGOS Y PLANTILLA VISUAL POR ARTÍCULO ({chosen.length})
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {chosen.map((articleId, idx) => {
                      const art = articles.find((item) => item.id === articleId);
                      if (!art) return null;
                      const pageStart = (idx + 1) * 2 + 2;
                      const currentStyle =
                        design.articleLayouts[articleId] || 'vogue-classic';
                      return (
                        <div
                          key={articleId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                            padding: '10px 14px',
                            background: '#fffdfa',
                            border: '1px solid #e7ded5',
                          }}
                        >
                          <div style={{ flex: '1 1 240px' }}>
                            <span style={{ fontSize: 13 }}>
                              <strong style={{ color: '#711c32', marginRight: 8 }}>
                                PÁG. {String(pageStart).padStart(2, '0')}–{String(pageStart + 1).padStart(2, '0')}
                              </strong>
                              {art.title}
                              {coverStoryId === art.id && (
                                <small
                                  style={{
                                    marginLeft: 8,
                                    color: '#711c32',
                                    letterSpacing: '.1em',
                                  }}
                                >
                                  · COVER STORY
                                </small>
                              )}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              flexWrap: 'wrap',
                            }}
                          >
                            <select
                              aria-label={`Plantilla visual para ${art.title}`}
                              value={currentStyle}
                              onChange={(e) =>
                                setArticleSpreadLayout(
                                  articleId,
                                  e.target.value as SpreadLayoutStyle
                                )
                              }
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #d8cec4',
                                background: '#fbf9f5',
                                fontSize: 11,
                              }}
                            >
                              {LAYOUT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="text-link"
                              disabled={idx === 0 || isSaving}
                              onClick={() => moveChosenArticle(idx, -1)}
                            >
                              ↑ SUBIR
                            </button>
                            <button
                              type="button"
                              className="text-link"
                              disabled={idx === chosen.length - 1 || isSaving}
                              onClick={() => moveChosenArticle(idx, 1)}
                            >
                              ↓ BAJAR
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BOTONES DE GUARDADO */}
            <div
              className="wide"
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 12,
              }}
            >
              <button
                className="button-primary"
                type="submit"
                disabled={!chosen.length || isSaving}
              >
                {isSaving
                  ? 'GUARDANDO MAQUETACIÓN...'
                  : editingId
                    ? 'GUARDAR CAMBIOS Y MAQUETACIÓN ↗'
                    : 'GUARDAR EDICIÓN EN STUDIO ↗'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="button-primary"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  CANCELAR EDICIÓN
                </button>
              )}
            </div>
          </form>

          {message && <p className="status">{message}</p>}
        </section>

        {/* EDICIONES CREADAS */}
        <section className="admin-panel">
          <h2 style={{ font: '25px Georgia' }}>Ediciones creadas</h2>

          <table className="admin-list">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Edición</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {issues.map((i) => (
                <tr key={i.id}>
                  <td>{i.issue_number}</td>
                  <td>{i.title}</td>
                  <td>{i.status}</td>
                  <td>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => editIssue(i)}
                    >
                      DISEÑAR / EDITAR
                    </button>

                    {' · '}

                    <button
                      type="button"
                      className="text-link"
                      onClick={() => publish(i.id, i.status)}
                    >
                      {i.status === 'published' ? 'RETIRAR' : 'PUBLICAR'}
                    </button>

                    {i.status === 'published' && i.slug && (
                      <>
                        {' · '}
                        <a
                          href={`/ediciones/${i.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link"
                        >
                          ABRIR EDICIÓN ↗
                        </a>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
