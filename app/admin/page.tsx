'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { Article } from '@/lib/data';
import {
  CoverSelectionError,
  isCurrentlyPublished,
  selectManualCover,
} from '@/lib/cover-selection';
import {
  EDITORIAL_STATUS_LABELS,
  getBoliviaCalendarDate,
  getBoliviaDateKey,
  getCalendarDateKey,
  getCoverageStatusLabel,
  getEditorialStatus,
  getEditorialStatusLabel,
  formatBoliviaCalendarDate,
  formatBoliviaCalendarMonth,
  getLocalCalendarDateKey,
  splitEditorialParagraphs,
} from '@/lib/editorial-utils';
import {
  formatFileSize,
  MAX_GALLERY_BATCH_COUNT,
  MAX_RAW_IMAGE_BYTES,
  optimizeEditorialImage,
} from '@/lib/media-optimizer';
import {
  extractEditorialVideo,
  injectEditorialVideo,
  type EditorialVideoAspect,
} from '@/lib/editorial-video';
import { AdminStudioSettingsPanel } from '@/components/AdminStudioSettingsPanel';
import { EditorialImageCropperModal } from '@/components/EditorialImageCropperModal';
import { EditorialBodyRenderer } from '@/components/EditorialBodyRenderer';
import { EditorialVideoPlayer } from '@/components/EditorialVideoPlayer';

const empty = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  category: 'People',
  city: 'Cochabamba',
  cover_image: '',
  author: 'Glamora Editorial',
  is_published: false,
  editorial_status: 'draft' as 'draft' | 'review' | 'approved' | 'scheduled' | 'published',
  is_social: false,
  event_name: '',
  venue: '',
  event_date: '',
  gallery_urls: '',
  people_names: '',
  publish_at: '',
  video_url: '',
  video_aspect: '16:9' as EditorialVideoAspect,
  video_caption: '',
};

function toLocalDateTime(value: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

export default function Admin() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Article[]>([]);
  const [coverageItems, setCoverageItems] = useState<Array<{
    id: string; title: string; event_date: string; event_time: string | null;
    city: string; venue: string | null; status: string;
  }>>([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);
  const [coverBusyId, setCoverBusyId] = useState<string | null>(null);
  const coverActionLock = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pendingCropCoverFile, setPendingCropCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [newGalleryCaptions, setNewGalleryCaptions] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('TODAS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [unpublishDemoBusy, setUnpublishDemoBusy] = useState(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = getBoliviaCalendarDate();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => getBoliviaDateKey());

  const router = useRouter();
  const db = supabaseBrowser();

  useEffect(() => {
    (async () => {
      try {
        const { data: { user }, error } = await db.auth.getUser();
        if (error) throw error;
        if (!user || user.email?.toLowerCase() !== 'legarage1014@gmail.com') {
          router.replace('/admin/login');
          return;
        }

        setReady(true);
        await load();
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'No se pudo verificar el acceso.');
        setReady(true);
      }
    })();
  }, []);

  async function load() {
    setLoading(true);
    setLoadError('');
    try {
      const [articleResult, coverageResult] = await Promise.all([
        db.from('articles').select('*').order('created_at', { ascending: false }),
        db.from('coverage_assignments')
          .select('id,title,event_date,event_time,city,venue,status')
          .order('event_date', { ascending: true }),
      ]);

      const errors: string[] = [];
      if (articleResult.error) errors.push(`Publicaciones: ${articleResult.error.message}`);
      else setItems((articleResult.data || []) as Article[]);

      if (coverageResult.error) {
        errors.push(`Coberturas: ${coverageResult.error.message}`);
      } else {
        setCoverageItems((coverageResult.data || []) as Array<{
        id: string; title: string; event_date: string; event_time: string | null;
        city: string; venue: string | null; status: string;
        }>);
      }
      setLoadError(errors.join(' · '));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los datos editoriales.');
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof typeof empty>(
    key: K,
    value: (typeof empty)[K]
  ) {
    setForm((old) => {
      const next = { ...old, [key]: value };

      if (key === 'title' && typeof value === 'string' && !editingId) {
        next.slug = value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      return next;
    });
  }

  function edit(article: Article) {
    const a = article as any;
    const { cleanBody, video } = extractEditorialVideo(a.body);

    setEditingId(a.id);
    setCoverFile(null);
    setCoverPreview(a.cover_image || '');
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setVideoFile(null);
    setUploadProgress('');

    setForm({
      title: a.title || '',
      slug: a.slug || '',
      excerpt: a.excerpt || '',
      body: cleanBody,
      category: a.category || 'People',
      city: a.city || 'Cochabamba',
      cover_image: a.cover_image || '',
      author: a.author || 'Glamora Editorial',
      is_published: Boolean(a.is_published),
      editorial_status: getEditorialStatus(a),
      is_social: Boolean(a.is_social),
      event_name: a.event_name || '',
      venue: a.venue || '',
      event_date: a.event_date
        ? String(a.event_date).slice(0, 10)
        : '',
      gallery_urls: Array.isArray(a.gallery_images)
        ? a.gallery_images.join('\n')
        : '',
      people_names: Array.isArray(a.people_tags)
        ? a.people_tags.join(', ')
        : '',
      publish_at: toLocalDateTime(a.published_at),
      video_url: video?.url || '',
      video_aspect: video?.aspect || '16:9',
      video_caption: video?.caption || '',
    });

    setMessage('Editando: ' + (a.title || 'Artículo'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
    setCoverFile(null);
    setCoverPreview('');
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setVideoFile(null);
    setUploadProgress('');
    setMessage('Edición cancelada. Puedes crear una nueva publicación.');
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Selecciona una imagen JPG, PNG o WEBP.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_RAW_IMAGE_BYTES) {
      setMessage('La fotografía de origen no puede superar los 25 MB.');
      e.target.value = '';
      return;
    }

    setPendingCropCoverFile(file);
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (files.length > MAX_GALLERY_BATCH_COUNT) {
      setMessage(`Puedes seleccionar un máximo de ${MAX_GALLERY_BATCH_COUNT} fotografías por lote.`);
      e.target.value = '';
      return;
    }

    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setMessage('Todas las fotografías deben ser JPG, PNG o WEBP.');
      e.target.value = '';
      return;
    }

    if (files.some((file) => file.size > MAX_RAW_IMAGE_BYTES)) {
      setMessage('Cada fotografía puede pesar hasta 25 MB antes de optimizar.');
      e.target.value = '';
      return;
    }

    setMessage(`Optimizando ${files.length} fotografías manteniendo su proporción original…`);
    const optimizedFiles = await Promise.all(
      files.map((file) => optimizeEditorialImage(file))
    );

    const totalBefore = files.reduce((acc, f) => acc + f.size, 0);
    const totalAfter = optimizedFiles.reduce((acc, f) => acc + f.size, 0);

    setGalleryFiles(optimizedFiles);
    setGalleryPreviews(optimizedFiles.map((file) => URL.createObjectURL(file)));
    setNewGalleryCaptions(new Array(optimizedFiles.length).fill(''));
    setMessage(
      `${optimizedFiles.length} fotografías optimizadas (${formatFileSize(totalBefore)} → ${formatFileSize(totalAfter)}). Guarda para subirlas.`
    );
  }

  function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedVideoTypes.includes(file.type)) {
      setMessage('Selecciona un archivo de video MP4, WEBM o MOV.');
      e.target.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setMessage('El archivo de video no debe superar los 50 MB. Para videos más largos usa un enlace de YouTube o Vimeo.');
      e.target.value = '';
      return;
    }

    setVideoFile(file);
    update('video_url', URL.createObjectURL(file));
    setMessage(`Video "${file.name}" (${formatFileSize(file.size)}) listo para subir al guardar.`);
  }

  function insertEditorialFormat(
    kind: 'subhead' | 'quote' | 'bold' | 'italic' | 'link' | 'divider'
  ) {
    const textarea = bodyTextareaRef.current;
    const current = form.body;
    const start = textarea ? textarea.selectionStart : current.length;
    const end = textarea ? textarea.selectionEnd : current.length;
    const selected = current.slice(start, end);

    let replacement = '';
    if (kind === 'subhead') {
      replacement = `\n\n## ${selected || 'SUBTÍTULO DE SECCIÓN'}\n\n`;
    } else if (kind === 'quote') {
      replacement = `\n\n> ${selected || 'Una frase destacada que resume el espíritu de la historia.'} — GLAMORA\n\n`;
    } else if (kind === 'bold') {
      replacement = `**${selected || 'texto en negrita'}**`;
    } else if (kind === 'italic') {
      replacement = `*${selected || 'texto en cursiva'}*`;
    } else if (kind === 'link') {
      replacement = `[${selected || 'Texto del enlace'}](https://)`;
    } else if (kind === 'divider') {
      replacement = `\n\n---\n\n`;
    }

    const nextBody =
      current.slice(0, start) + replacement + current.slice(end);
    update('body', nextBody);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const cursor = start + replacement.length;
        textarea.setSelectionRange(cursor, cursor);
      }
    }, 0);
  }

  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Selecciona una imagen JPG, PNG o WEBP para insertar en el texto.');
      return;
    }

    if (file.size > MAX_RAW_IMAGE_BYTES) {
      setMessage('La fotografía no puede superar los 25 MB.');
      return;
    }

    try {
      setBusy(true);
      setUploadProgress('Optimizando y subiendo fotografía intercalada…');
      const optimized = await optimizeEditorialImage(file);
      const ext = optimized.name.split('.').pop()?.toLowerCase() || 'webp';
      const fileName = `articles/inline/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: uploadError } = await db.storage
        .from('covers')
        .upload(fileName, optimized, {
          contentType: optimized.type,
          upsert: false,
        });

      if (uploadError) {
        setMessage('No se pudo subir la fotografía intercalada: ' + uploadError.message);
        return;
      }

      const { data: publicData } = db.storage
        .from('covers')
        .getPublicUrl(fileName);

      const textarea = bodyTextareaRef.current;
      const current = form.body;
      const start = textarea ? textarea.selectionStart : current.length;
      const end = textarea ? textarea.selectionEnd : current.length;
      const block = `\n\n[IMAGEN: ${publicData.publicUrl} | Fotografía editorial GLAMORA]\n\n`;
      const nextBody = current.slice(0, start) + block + current.slice(end);
      update('body', nextBody);
      setMessage('Fotografía insertada en el cuerpo del artículo. Puedes editar el pie de foto después de la barra "|".');
    } finally {
      setUploadProgress('');
      setBusy(false);
    }
  }

  async function syncLinkedCoverage(articleSlug: string, previousSlug?: string) {
    const slugs = Array.from(new Set([articleSlug, previousSlug].filter(Boolean))) as string[];
    if (!slugs.length) return null;
    // Editorial actions maintain only the article link. Coverage.status is operational
    // and remains under the Agenda's manual controls.
    const { error } = await db
      .from('coverage_assignments')
      .update({ linked_article_slug: articleSlug })
      .in('linked_article_slug', slugs);
    return error;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage('');
    setUploadProgress('');

    try {
      const {
        gallery_urls,
        people_names,
        publish_at,
        video_url,
        video_aspect,
        video_caption,
        ...fields
      } = form;

      let publishAt: string | null = null;
      let isPublished = false;

      if (form.editorial_status === 'scheduled') {
        if (!publish_at) {
          setMessage('Para programar la publicación, selecciona una fecha y hora.');
          setBusy(false);
          return;
        }

        const scheduledDate = new Date(publish_at);
        if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
          setMessage('La fecha programada debe ser futura.');
          setBusy(false);
          return;
        }

        publishAt = scheduledDate.toISOString();
        isPublished = true;
      } else if (form.editorial_status === 'published') {
        isPublished = true;
        const previousArticle = editingId
          ? items.find((article) => article.id === editingId)
          : null;
        publishAt =
          (previousArticle as any)?.editorial_status === 'published' && previousArticle?.published_at
            ? previousArticle.published_at
            : new Date().toISOString();
      }

      // Si se seleccionó una fotografía nueva, subirla al bucket público covers.
      // Si no se seleccionó otra, conservar la URL que ya tenía el artículo.
      let coverImage = form.cover_image;

      if (coverFile) {
        setUploadProgress('Subiendo fotografía de portada…');
        const extension = coverFile.name.split('.').pop()?.toLowerCase() || 'webp';
        const fileName = `articles/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        const { error: uploadError } = await db.storage
          .from('covers')
          .upload(fileName, coverFile, {
            contentType: coverFile.type,
            upsert: false,
          });

        if (uploadError) {
          setMessage('Error al subir la fotografía: ' + uploadError.message);
          setUploadProgress('');
          setBusy(false);
          return;
        }

        const { data: publicData } = db.storage
          .from('covers')
          .getPublicUrl(fileName);

        coverImage = publicData.publicUrl;
      }

      // Si se seleccionó un archivo de video local, subirlo al bucket covers
      let finalVideoUrl = video_url.trim();
      if (videoFile) {
        setUploadProgress(`Subiendo video "${videoFile.name}"…`);
        const vExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
        const vName = `articles/videos/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${vExt}`;

        const { error: videoUploadError } = await db.storage
          .from('covers')
          .upload(vName, videoFile, {
            contentType: videoFile.type,
            upsert: false,
          });

        if (videoUploadError) {
          setMessage(
            `No se pudo subir el archivo de video directo al bucket (${videoUploadError.message}). Puedes pegar un enlace de YouTube, Vimeo o Reel en el campo de URL de video.`
          );
          setUploadProgress('');
          setBusy(false);
          return;
        }

        const { data: videoPublicData } = db.storage
          .from('covers')
          .getPublicUrl(vName);
        finalVideoUrl = videoPublicData.publicUrl;
      }

      // Conservar las URL existentes y añadir las nuevas fotografías subidas.
      const existingGallery = gallery_urls
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);

      const uploadedGallery: string[] = [];

      for (let i = 0; i < galleryFiles.length; i++) {
        setUploadProgress(
          `Subiendo fotografía ${i + 1} de ${galleryFiles.length}…`
        );
        const file = galleryFiles[i];
        const extension = file.name.split('.').pop()?.toLowerCase() || 'webp';
        const fileName = `articles/gallery/${Date.now()}-${i}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

        const { error: galleryUploadError } = await db.storage
          .from('covers')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (galleryUploadError) {
          setMessage('Error al subir una fotografía de la galería: ' + galleryUploadError.message);
          setUploadProgress('');
          setBusy(false);
          return;
        }

        const { data: galleryPublicData } = db.storage
          .from('covers')
          .getPublicUrl(fileName);

        const caption = (newGalleryCaptions[i] || '').trim();
        uploadedGallery.push(caption ? `${galleryPublicData.publicUrl} | ${caption}` : galleryPublicData.publicUrl);
      }

      setUploadProgress('Guardando publicación en base de datos…');

      const composedBody = injectEditorialVideo(
        fields.body,
        finalVideoUrl && !finalVideoUrl.startsWith('blob:')
          ? {
              url: finalVideoUrl,
              aspect: video_aspect,
              caption: video_caption,
            }
          : null
      );

      const payload = {
        ...fields,
        body: composedBody,
        cover_image: coverImage,
        is_published: isPublished,
        is_cover: editingId
          ? Boolean(items.find((a) => a.id === editingId)?.is_cover)
          : false,
        gallery_images: [...existingGallery, ...uploadedGallery],
        people_tags: people_names
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        event_date: form.event_date || null,
        published_at: publishAt,
      };

      const result = editingId
        ? await db
            .from('articles')
            .update(payload)
            .eq('id', editingId)
        : await db
            .from('articles')
            .insert(payload);

      if (result.error) {
        setMessage(result.error.message);
      } else {
        const previousArticle = editingId
          ? items.find((article) => article.id === editingId)
          : null;
        const coverageSyncError = await syncLinkedCoverage(
          fields.slug,
          previousArticle?.slug
        );
        setMessage(
          coverageSyncError
            ? `Artículo guardado, pero no se pudo sincronizar la cobertura: ${coverageSyncError.message}`
            : editingId
              ? 'Artículo actualizado correctamente.'
              : 'Artículo guardado correctamente.'
        );

        setEditingId(null);
        setForm(empty);
        setCoverFile(null);
        setCoverPreview('');
        setGalleryFiles([]);
        setGalleryPreviews([]);
        setVideoFile(null);
        setUploadProgress('');
        await load();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar.'
      );
    }

    setUploadProgress('');
    setBusy(false);
  }

  async function feature(article: Article) {
    if (coverActionLock.current) return;
    coverActionLock.current = true;
    setCoverBusyId(article.id);
    setMessage('');

    try {
      const result = await selectManualCover(article.id, {
        findEligibleArticle: async (id, nowIso) => {
          const { data, error } = await db
            .from('articles')
            .select('id,is_published,published_at')
            .eq('id', id)
            .eq('is_published', true)
            .lte('published_at', nowIso)
            .maybeSingle();
          return { data, error: error?.message || null };
        },
        getManualCoverIds: async () => {
          const { data, error } = await db
            .from('articles')
            .select('id')
            .eq('is_cover', true);
          return { data: (data || []).map((row) => row.id), error: error?.message || null };
        },
        clearManualCovers: async () => {
          const { error } = await db
            .from('articles')
            .update({ is_cover: false })
            .eq('is_cover', true)
            .select('id');
          return { error: error?.message || null };
        },
        setManualCover: async (id) => {
          const { data, error } = await db
            .from('articles')
            .update({ is_cover: true })
            .eq('id', id)
            .select('id')
            .maybeSingle();
          return { affected: Boolean(data), error: error?.message || null };
        },
        restoreManualCovers: async (ids) => {
          if (!ids.length) return { data: [], error: null };
          const { data, error } = await db
            .from('articles')
            .update({ is_cover: true })
            .in('id', ids)
            .select('id');
          return { data: (data || []).map((row) => row.id), error: error?.message || null };
        },
      });

      setMessage(result.confirmedAfterUncertainResponse
        ? 'La respuesta fue incierta, pero se verificó la nueva portada.'
        : result.changed
          ? 'Portada principal actualizada.'
          : 'Este artículo ya es la portada principal.');
    } catch (error) {
      setMessage(error instanceof CoverSelectionError
        ? error.message
        : error instanceof Error
          ? `No se pudo actualizar la portada: ${error.message}`
          : 'No se pudo actualizar la portada. La portada pública conserva el fallback al artículo publicado más reciente.');
    } finally {
      await load();
      coverActionLock.current = false;
      setCoverBusyId(null);
    }
  }

  async function toggle(article: Article) {
    const next = !article.is_published;

    const { error } = await db
      .from('articles')
      .update({
        is_published: next,
        editorial_status: next ? 'published' : 'draft',
        published_at: next ? new Date().toISOString() : null,
      })
      .eq('id', article.id);

    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(next ? 'Artículo publicado.' : 'Artículo ocultado.');
    await load();
  }

  async function unpublishAllDemoArticles() {
    if (!window.confirm('¿Confirmas ocultar/despublicar todos los artículos de prueba que contengan imágenes demo o texto provisional? Podrás volver a publicarlos o editarlos cuando desees.')) return;
    setUnpublishDemoBusy(true);
    setMessage('');
    try {
      const demoArticles = items.filter((a) => {
        const title = (a.title || '').toLowerCase();
        const body = (a.body || '').toLowerCase();
        const img = (a.cover_image || '').toLowerCase();
        return (
          title.includes('prueba') ||
          title.includes('test') ||
          title.includes('demo') ||
          body.includes('le garage') ||
          img.includes('le-garage') ||
          img.includes('prueba')
        );
      });

      if (!demoArticles.length) {
        setMessage('No se encontraron artículos con etiquetas o imágenes demo.');
        setUnpublishDemoBusy(false);
        return;
      }

      const ids = demoArticles.map((a) => a.id);
      const { error } = await db
        .from('articles')
        .update({ is_published: false })
        .in('id', ids);

      if (error) {
        setMessage('Error al despublicar artículos demo: ' + error.message);
      } else {
        setMessage(`Se han ocultado ${ids.length} artículos demo. La portada pública quedó despejada para tu contenido real ✓`);
        await load();
      }
    } catch (err) {
      setMessage('Error de conexión al procesar artículos demo.');
    } finally {
      setUnpublishDemoBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este artículo?')) return;

    const { error } = await db
      .from('articles')
      .delete()
      .eq('id', id);

    setMessage(error?.message || 'Artículo eliminado.');
    await load();
  }

  async function logout() {
    await db.auth.signOut();
    router.replace('/admin/login');
  }

  const existingGalleryUrls = form.gallery_urls
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean);

  function removeExistingGallery(index: number) {
    const next = existingGalleryUrls.filter((_, i) => i !== index);
    update('gallery_urls', next.join('\n'));
  }

  function moveExistingGallery(index: number, direction: -1 | 1) {
    const next = [...existingGalleryUrls];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update('gallery_urls', next.join('\n'));
  }

  function removeNewGallery(index: number) {
    setGalleryFiles((current) => current.filter((_, i) => i !== index));
    setGalleryPreviews((current) => current.filter((_, i) => i !== index));
    setNewGalleryCaptions((current) => current.filter((_, i) => i !== index));
  }

  const previewParagraphs = splitEditorialParagraphs(form.body);

  const previewPhotos = [
    ...existingGalleryUrls.map((entry, index) => {
      const [src, caption] = (entry.includes('|') ? entry.split('|') : [entry, '']).map((s) => s.trim());
      return {
        src,
        alt: caption || `Fotografía ${index + 1} de ${form.event_name || form.title || 'GLAMORA'}`,
        caption,
      };
    }),
    ...galleryPreviews.map((src, index) => ({
      src,
      alt: `Nueva fotografía ${index + 1} de ${form.event_name || form.title || 'GLAMORA'}`,
      caption: newGalleryCaptions[index] || '',
    })),
  ];

  const previewDate = form.publish_at
    ? new Date(form.publish_at).toLocaleDateString('es-BO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const editorialCounts = items.reduce(
    (counts, article) => {
      const status = getEditorialStatus(article);
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    },
    { draft: 0, review: 0, approved: 0, scheduled: 0, published: 0 } as Record<string, number>
  );

  const calendarFirstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarStart = new Date(
    calendarFirstDay.getFullYear(),
    calendarFirstDay.getMonth(),
    1 - calendarFirstDay.getDay()
  );
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  const articleCalendarEntries = items.map((article) => {
    const status = getEditorialStatus(article);
    const dateKey = status === 'scheduled'
      ? getCalendarDateKey(article.published_at)
      : (getCalendarDateKey(article.published_at) || getCalendarDateKey((article as any).event_date));
    return dateKey
      ? {
          id: article.id,
          key: `article-${article.id}`,
          kind: 'article' as const,
          title: article.title,
          status,
          dateKey,
          dateType: status === 'scheduled' || status === 'published' ? 'PUBLICACIÓN' : 'EVENTO DEL ARTÍCULO',
          detail: '',
        }
      : null;
  }).filter(Boolean) as Array<{
    id: string; key: string; kind: 'article'; title: string; status: string;
    dateKey: string; dateType: string; detail: string;
  }>;

  const coverageCalendarEntries = coverageItems.map((coverage) => ({
    id: coverage.id,
    key: `coverage-${coverage.id}`,
    kind: 'coverage' as const,
    title: coverage.title,
    status: coverage.status,
    dateKey: coverage.event_date,
    dateType: 'COBERTURA',
    detail: [coverage.event_time?.slice(0, 5), coverage.venue, coverage.city].filter(Boolean).join(' · '),
  }));

  const calendarEntries = [...articleCalendarEntries, ...coverageCalendarEntries];
  const selectedDayEntries = calendarEntries.filter((entry) => entry.dateKey === selectedCalendarDate);
  const todayKey = getBoliviaDateKey();

  if (!ready) return <main className="admin-shell"><div className="admin-state">Verificando acceso…</div></main>;
  if (authError) return (
    <main className="admin-shell">
      <div className="admin-content admin-state admin-state-error" role="alert">
        <div className="eyebrow">GLAMORA STUDIO</div>
        <h1>No se pudo verificar el acceso.</h1>
        <p>{authError}</p>
        <button className="button-primary" onClick={() => window.location.reload()}>INTENTAR DE NUEVO</button>
      </div>
    </main>
  );

  return (
    <main className="admin-shell admin-dashboard">
      <EditorialImageCropperModal
        file={pendingCropCoverFile}
        defaultPreset="horizontal"
        title="Encuadre Editorial de Portada de Artículo (Recomendado: Horizontal 16:9)"
        onConfirm={(standardized) => {
          setCoverFile(standardized);
          setCoverPreview(URL.createObjectURL(standardized));
          setPendingCropCoverFile(null);
          setMessage(
            `Fotografía de portada estandarizada (${formatFileSize(standardized.size)}). Guarda la publicación para confirmar.`
          );
        }}
        onCancel={() => {
          setPendingCropCoverFile(null);
        }}
      />
      <div className="admin-top">
        <strong className="admin-wordmark">GLAMORA <span>STUDIO</span></strong>
        <nav className="admin-top-nav" aria-label="Navegación del estudio">
          <a href="/admin" aria-current="page">DASHBOARD</a>
          <a href="/admin/issues">THE ISSUES (REVISTA)</a>
          <a href="/admin/social-studio">SOCIAL STUDIO</a>
          <a href="/admin/agenda">AGENDA</a>
          <a href="/admin/produccion">PRODUCCIÓN</a>
          <a href="/admin/sponsors">PATROCINIOS</a>
        </nav>
        <button className="button-primary" onClick={logout}>
          CERRAR SESIÓN
        </button>
      </div>

      <div className="admin-content">
        <div className="eyebrow">
          PANEL PRIVADO · ADMINISTRADOR
        </div>

        <h1 className="admin-page-title">
          Dirección editorial
        </h1>

        <p>Gestiona publicaciones y prepara el contenido de Glamora.</p>

        {loadError && <p className="status admin-feedback-error" role="alert">No se pudo completar la carga. {loadError}</p>}
        {loading && <p className="status admin-feedback" role="status">Cargando publicaciones y coberturas…</p>}
        {loadError && <button type="button" className="text-link" onClick={load}>INTENTAR DE NUEVO ↻</button>}
        {message && <p className="status" role="status">{message}</p>}

        <section className="admin-panel admin-summary-panel" style={{ marginBottom: 22 }}>
          <div className="eyebrow">CONTROL EDITORIAL</div>
          <h2 style={{ font: '27px Georgia', fontWeight: 400, marginTop: 8 }}>
            Resumen de publicaciones
          </h2>
          <p style={{ marginTop: 0, marginBottom: 18, color: '#756b68' }}>
            Estado actual de tu contenido editorial.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: 10,
          }}>
            {[
              { key: 'draft', label: 'BORRADORES' },
              { key: 'review', label: 'EN REVISIÓN' },
              { key: 'approved', label: 'APROBADOS' },
              { key: 'scheduled', label: 'PROGRAMADOS' },
              { key: 'published', label: 'PUBLICADOS' },
            ].map((status) => (
              <div key={status.key} style={{
                border: '1px solid #e7ded5',
                background: '#fbfaf7',
                padding: '16px 15px',
                minHeight: 92,
              }}>
                <div style={{
                  color: '#806e68',
                  fontSize: 9,
                  letterSpacing: '.13em',
                  lineHeight: 1.5,
                }}>
                  {status.label}
                </div>
                <div style={{
                  font: '32px Georgia, serif',
                  fontWeight: 400,
                  color: '#211b1d',
                  marginTop: 8,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {editorialCounts[status.key] || 0}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            borderTop: '1px solid #e7ded5',
            marginTop: 16,
            paddingTop: 12,
            color: '#756b68',
            fontSize: 11,
          }}>
            <span>TOTAL DE PUBLICACIONES</span>
            <strong style={{ color: '#211b1d', fontVariantNumeric: 'tabular-nums' }}>{items.length}</strong>
          </div>
        </section>

        <AdminStudioSettingsPanel />

        <section className="admin-panel" style={{ marginBottom: 22 }}>
          <div className="eyebrow">PLANIFICACIÓN EDITORIAL</div>
          <h2 style={{ font: '27px Georgia', fontWeight: 400, marginTop: 8 }}>
            Calendario editorial
          </h2>
          <p style={{ marginTop: 0, marginBottom: 18, color: '#756b68' }}>
            Consulta las fechas de publicación y los eventos de tus coberturas.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            borderBottom: '1px solid #e7ded5',
            paddingBottom: 14,
            marginBottom: 14,
          }}>
            <strong style={{ font: '22px Georgia, serif', fontWeight: 400, textTransform: 'capitalize' }}>
              {formatBoliviaCalendarMonth(calendarMonth)}
            </strong>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="text-link"
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              >← ANTERIOR</button>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  const now = new Date();
                  const boliviaToday = getBoliviaCalendarDate(now);
                  setCalendarMonth(new Date(boliviaToday.getFullYear(), boliviaToday.getMonth(), 1));
                  setSelectedCalendarDate(getBoliviaDateKey(now));
                }}
              >HOY</button>
              <button
                type="button"
                className="text-link"
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              >SIGUIENTE →</button>
            </div>
          </div>

          <div className="admin-calendar-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 5,
          }}>
            {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((day) => (
              <div key={day} style={{
                textAlign: 'center',
                color: '#806e68',
                fontSize: 9,
                letterSpacing: '.08em',
                padding: '7px 0',
              }}>{day}</div>
            ))}
            {calendarDays.map((day) => {
              const key = getLocalCalendarDateKey(day);
              const dayEntries = calendarEntries.filter((entry) => entry.dateKey === key);
              const inMonth = day.getMonth() === calendarMonth.getMonth();
              const selected = key === selectedCalendarDate;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedCalendarDate(key)}
                  aria-label={`${day.toLocaleDateString('es-BO')}, ${dayEntries.length} elementos`}
                  className={`admin-calendar-day${selected ? ' is-selected' : ''}${inMonth ? '' : ' is-outside'}`}
                  style={{
                    minWidth: 0,
                    minHeight: 76,
                    padding: '7px 5px',
                    textAlign: 'left',
                    verticalAlign: 'top',
                    border: selected ? '1px solid #711c32' : '1px solid #e7ded5',
                    background: selected ? '#f0e6e2' : '#fbfaf7',
                    color: inMonth ? '#211b1d' : '#b8ada6',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: key === todayKey ? 700 : 400,
                    color: key === todayKey ? '#711c32' : 'inherit',
                  }}>{day.getDate()}</span>
                  {dayEntries.slice(0, 2).map((entry) => (
                    <span key={entry.id} className={`admin-calendar-chip ${entry.kind === 'coverage' ? 'is-coverage' : `is-${entry.status}`}`} style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: 5,
                      padding: '3px 4px',
                      background: entry.kind === 'coverage' ? '#e8eee9' : entry.status === 'published' ? '#e8e2dc' : entry.status === 'scheduled' ? '#eadde0' : '#eeeae5',
                      color: '#4b3b3d',
                      fontSize: 8,
                    }}>{entry.title}</span>
                  ))}
                  {dayEntries.length > 2 && (
                    <span style={{ display: 'block', marginTop: 3, fontSize: 8, color: '#711c32' }}>
                      +{dayEntries.length - 2} más
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 18, borderTop: '1px solid #e7ded5', paddingTop: 14 }}>
            <div className="eyebrow">
              {formatBoliviaCalendarDate(selectedCalendarDate, {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </div>
            {selectedDayEntries.length === 0 ? (
              <p style={{ color: '#756b68', marginBottom: 0 }}>
                No hay publicaciones ni eventos registrados para esta fecha.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                {selectedDayEntries.map((entry) => (
                  <div key={entry.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    border: '1px solid #e7ded5',
                    padding: 10,
                    background: '#fbfaf7',
                  }}>
                    <div>
                      <strong style={{ display: 'block', font: '16px Georgia, serif', fontWeight: 400 }}>
                        {entry.title}
                      </strong>
                      <small style={{ color: entry.kind === 'coverage' ? '#36583b' : '#806e68', letterSpacing: '.08em' }}>
                        {entry.dateType} · {entry.kind === 'coverage'
                          ? getCoverageStatusLabel(entry.status)
                          : getEditorialStatusLabel(entry.status)}
                      </small>
                      {entry.detail && <small style={{ display: 'block', marginTop: 5, color: '#756b68' }}>{entry.detail}</small>}
                    </div>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        if (entry.kind === 'coverage') {
                          window.location.href = `/admin/agenda?edit=${encodeURIComponent(entry.id)}`;
                          return;
                        }
                        const article = items.find((item) => item.id === entry.id);
                        if (article) edit(article);
                      }}
                    >{entry.kind === 'coverage' ? 'ABRIR COBERTURA ↗' : 'EDITAR ↗'}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <small className="form-note" style={{ display: 'block', marginTop: 12 }}>
            El calendario reúne publicaciones y coberturas. Las coberturas se identifican en verde y conservan su ficha independiente en la Agenda Editorial.
          </small>
        </section>

        <section className="admin-panel admin-article-editor">
          <h2 style={{ font: '27px Georgia', fontWeight: 400 }}>
            {editingId ? 'Editar publicación' : 'Nueva publicación'}
          </h2>

          {editingId && (
            <p>
              Estás modificando una publicación existente.
            </p>
          )}

          <form className="admin-form" onSubmit={save}>
            <label>
              TÍTULO
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                required
              />
            </label>

            <label>
              SLUG
              <input
                value={form.slug}
                onChange={(e) => update('slug', e.target.value)}
                required
              />
            </label>

            <label>
              CATEGORÍA
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                {[
                  'Moda',
                  'Belleza',
                  'People',
                  'Social',
                  'Viajes',
                  'Cultura',
                  'Gastronomía',
                  'Mundo',
                  'Lifestyle',
                  'Society',
                  'The Table',
                  'Wellness',
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>

            <label>
              CIUDAD
              <select
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              >
                {[
                  'Cochabamba',
                  'La Paz',
                  'Santa Cruz',
                  'Oruro',
                  'Potosí',
                  'Internacional',
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>

            <label className="wide">
              EXTRACTO
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => update('excerpt', e.target.value)}
              />
            </label>

            <div className="wide">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 9, letterSpacing: '.14em', color: '#675a56' }}>
                  CUERPO DEL ARTÍCULO
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} aria-label="Herramientas de formato editorial">
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => insertEditorialFormat('subhead')}
                    style={{ border: '1px solid #d8cec4', padding: '5px 9px', background: '#faf7f2' }}
                  >
                    + SUBTÍTULO
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => insertEditorialFormat('quote')}
                    style={{ border: '1px solid #d8cec4', padding: '5px 9px', background: '#faf7f2' }}
                  >
                    + CITA / PULL QUOTE
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => insertEditorialFormat('bold')}
                    style={{ border: '1px solid #d8cec4', padding: '5px 9px', background: '#faf7f2' }}
                  >
                    NEGRITA
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => insertEditorialFormat('italic')}
                    style={{ border: '1px solid #d8cec4', padding: '5px 9px', background: '#faf7f2' }}
                  >
                    CURSIVA
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => insertEditorialFormat('link')}
                    style={{ border: '1px solid #d8cec4', padding: '5px 9px', background: '#faf7f2' }}
                  >
                    + ENLACE
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => insertEditorialFormat('divider')}
                    style={{ border: '1px solid #d8cec4', padding: '5px 9px', background: '#faf7f2' }}
                  >
                    + DIVISOR
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    disabled={busy}
                    onClick={() => inlineImageInputRef.current?.click()}
                    style={{ border: '1px solid #711c32', padding: '5px 9px', background: '#f7eff1', color: '#711c32' }}
                  >
                    + FOTO EN EL TEXTO
                  </button>
                  <input
                    ref={inlineImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleInlineImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              <textarea
                ref={bodyTextareaRef}
                rows={10}
                value={form.body}
                onChange={(e) => update('body', e.target.value)}
                placeholder="Escribe los párrafos separados por una línea en blanco. Usa la barra superior para insertar subtítulos (## ), citas destacadas (> ) o enlaces."
              />
            </div>

            <label className="wide">
              FOTOGRAFÍA DE PORTADA (OPTIMIZACIÓN AUTOMÁTICA HD)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
              />
              <small className="form-note">
                Selecciona una imagen JPG, PNG o WEBP de hasta 25 MB. GLAMORA Studio la optimiza automáticamente manteniendo el 100% de su proporción original.
              </small>
            </label>

            {coverPreview && (
              <div className="wide">
                <p>Vista previa de la portada:</p>
                <img
                  src={coverPreview}
                  alt="Vista previa de portada"
                  style={{
                    display: 'block',
                    maxWidth: '260px',
                    width: '100%',
                    aspectRatio: '3 / 4',
                    objectFit: 'contain',
                    background: '#eee9e2',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                  }}
                />
              </div>
            )}

            <div
              className="wide"
              style={{
                borderTop: '1px solid #e7ded5',
                paddingTop: 18,
                marginTop: 4,
              }}
            >
              <div className="eyebrow">
                GLAMORA MOTION &amp; FILM · VIDEO EDITORIAL (OPCIONAL)
              </div>
            </div>

            <label>
              ENLACE DE VIDEO (YOUTUBE, VIMEO, REEL O MP4)
              <input
                value={form.video_url.startsWith('blob:') ? '' : form.video_url}
                onChange={(e) => {
                  setVideoFile(null);
                  update('video_url', e.target.value);
                }}
                placeholder="https://www.youtube.com/watch?v=... o enlace .mp4"
              />
              <small className="form-note">
                Pega un link de YouTube, YouTube Shorts, Vimeo, Instagram Reel o URL directa .mp4.
              </small>
            </label>

            <label>
              O SUBIR ARCHIVO DE VIDEO DESDE TU COMPUTADORA
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoFileChange}
              />
              <small className="form-note">
                Archivos MP4, WEBM o MOV de hasta 50 MB.
              </small>
            </label>

            <label>
              FORMATO VISUAL DEL VIDEO
              <select
                value={form.video_aspect}
                onChange={(e) =>
                  update('video_aspect', e.target.value as EditorialVideoAspect)
                }
              >
                <option value="16:9">Horizontal · Cinema (16:9)</option>
                <option value="9:16">Vertical · Social Reel (9:16)</option>
              </select>
            </label>

            <label>
              PIE DE VIDEO / CRÉDITO AUDIOVISUAL
              <input
                value={form.video_caption}
                onChange={(e) => update('video_caption', e.target.value)}
                placeholder="Ej. Fashion Film — Dirección creativa GLAMORA"
              />
            </label>

            {form.video_url && (
              <div className="wide" style={{ padding: 14, border: '1px solid #e7ded5', background: '#faf7f2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="eyebrow">VISTA PREVIA DEL VIDEO</span>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      setVideoFile(null);
                      update('video_url', '');
                      update('video_caption', '');
                    }}
                    style={{ color: '#711C32' }}
                  >
                    QUITAR VIDEO ×
                  </button>
                </div>
                <EditorialVideoPlayer
                  video={{
                    url: form.video_url,
                    aspect: form.video_aspect,
                    caption: form.video_caption,
                  }}
                  title={form.title || 'Vista previa de video'}
                />
              </div>
            )}

            <div
              className="wide"
              style={{
                borderTop: '1px solid #e7ded5',
                paddingTop: 18,
                marginTop: 4,
              }}
            >
              <div className="eyebrow">
                GLAMORA SOCIAL · DATOS DE COBERTURA
              </div>
            </div>

            <label>
              NOMBRE DEL EVENTO
              <input
                value={form.event_name}
                onChange={(e) => update('event_name', e.target.value)}
                placeholder="Ej. Noche de aniversario"
              />
            </label>

            <label>
              LUGAR / VENUE
              <input
                value={form.venue}
                onChange={(e) => update('venue', e.target.value)}
                placeholder="Nombre del lugar"
              />
            </label>

            <label>
              FECHA DEL EVENTO
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => update('event_date', e.target.value)}
              />
            </label>

            <label>
              PERSONAS DESTACADAS
              <input
                value={form.people_names}
                onChange={(e) => update('people_names', e.target.value)}
                placeholder="Nombres separados por coma"
              />
            </label>

            <div className="wide">
              <label>
                GALERÍA FOTOGRÁFICA · SUBIR DESDE TU COMPUTADORA (OPTIMIZACIÓN AUTOMÁTICA HD)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleGalleryChange}
                />
                <small className="form-note">
                  Selecciona hasta {MAX_GALLERY_BATCH_COUNT} fotografías por lote (hasta 25 MB por imagen de cámara).
                  Se optimizan automáticamente manteniendo su proporción original y se suben a Supabase al guardar.
                </small>
              </label>

              {existingGalleryUrls.length > 0 && (
                <div style={{ marginTop: 22 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 12,
                  }}>
                    <div>
                      <div className="eyebrow">ARCHIVO FOTOGRÁFICO</div>
                      <p style={{ margin: '6px 0 0', fontFamily: 'Georgia, serif', fontSize: 20 }}>
                        Fotografías guardadas
                      </p>
                    </div>
                    <small className="form-note">
                      {existingGalleryUrls.length} {existingGalleryUrls.length === 1 ? 'fotografía' : 'fotografías'}
                    </small>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(125px, 1fr))',
                    gap: 14,
                  }}>
                    {existingGalleryUrls.map((rawEntry, index) => {
                      const [photoUrl, photoCaption] = (rawEntry.includes('|') ? rawEntry.split('|') : [rawEntry, '']).map((s) => s.trim());
                      return (
                        <div key={`${photoUrl}-${index}`} style={{
                          minWidth: 0,
                          border: '1px solid #e7ded5',
                          background: '#fff',
                          padding: 7,
                        }}>
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '3 / 4',
                            background: '#f3f0ec',
                            overflow: 'hidden',
                          }}>
                            <img
                              src={photoUrl}
                              alt={`Fotografía guardada ${index + 1}`}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div style={{
                              display: 'none',
                              position: 'absolute',
                              inset: 0,
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 10,
                              textAlign: 'center',
                              color: '#711C32',
                              fontSize: 11,
                              background: '#f3f0ec',
                            }}>
                              No se pudo cargar esta imagen
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 4,
                            paddingTop: 8,
                          }}>
                            <small style={{ color: '#777', letterSpacing: '.08em', fontSize: 10 }}>
                              FOTO {String(index + 1).padStart(2, '0')}
                            </small>
                            <div style={{ display: 'flex', gap: 3 }}>
                              <button
                                type="button"
                                className="text-link"
                                title="Mover antes"
                                aria-label={`Mover fotografía ${index + 1} antes`}
                                disabled={index === 0 || busy}
                                onClick={() => moveExistingGallery(index, -1)}
                                style={{ padding: '2px 4px' }}
                              >↑</button>
                              <button
                                type="button"
                                className="text-link"
                                title="Mover después"
                                aria-label={`Mover fotografía ${index + 1} después`}
                                disabled={index === existingGalleryUrls.length - 1 || busy}
                                onClick={() => moveExistingGallery(index, 1)}
                                style={{ padding: '2px 4px' }}
                              >↓</button>
                              <button
                                type="button"
                                className="text-link"
                                title="Quitar de la galería"
                                aria-label={`Quitar fotografía ${index + 1}`}
                                disabled={busy}
                                onClick={() => removeExistingGallery(index)}
                                style={{ padding: '2px 4px', color: '#711C32' }}
                              >×</button>
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Pie de foto / descripción…"
                            value={photoCaption || ''}
                            onChange={(e) => {
                              const next = [...existingGalleryUrls];
                              const newCaption = e.target.value;
                              next[index] = newCaption ? `${photoUrl} | ${newCaption}` : photoUrl;
                              update('gallery_urls', next.join('\n'));
                            }}
                            style={{
                              width: '100%',
                              fontSize: '11px',
                              padding: '5px 7px',
                              marginTop: '6px',
                              border: '1px solid #d9c2b3',
                              background: '#fcfbfa',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <small className="form-note" style={{ display: 'block', marginTop: 10 }}>
                    Puedes escribir una descripción o pie de foto para cada imagen. Los cambios se guardarán al pulsar el botón principal.
                  </small>
                </div>
              )}

              {galleryPreviews.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div className="eyebrow" style={{ marginBottom: 12 }}>
                    NUEVAS FOTOGRAFÍAS · PENDIENTES DE SUBIR
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(125px, 1fr))',
                    gap: 14,
                  }}>
                    {galleryPreviews.map((src, index) => (
                      <div key={src} style={{
                        border: '1px solid #d9c2b3',
                        background: '#fff',
                        padding: 7,
                      }}>
                        <img
                          src={src}
                          alt={`Nueva fotografía ${index + 1}`}
                          style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: 8,
                          gap: 6,
                        }}>
                          <small style={{ color: '#777', letterSpacing: '.08em', fontSize: 10 }}>
                            NUEVA {String(index + 1).padStart(2, '0')}
                          </small>
                          <button
                            type="button"
                            className="text-link"
                            disabled={busy}
                            onClick={() => removeNewGallery(index)}
                            style={{ color: '#711C32' }}
                          >QUITAR</button>
                        </div>
                        <input
                          type="text"
                          placeholder="Pie de foto opcional…"
                          value={newGalleryCaptions[index] || ''}
                          onChange={(e) => {
                            const updated = [...newGalleryCaptions];
                            updated[index] = e.target.value;
                            setNewGalleryCaptions(updated);
                          }}
                          style={{
                            width: '100%',
                            fontSize: '11px',
                            padding: '5px 7px',
                            marginTop: '6px',
                            border: '1px solid #d9c2b3',
                            background: '#fcfbfa',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label style={{ marginTop: 18 }}>
                GESTIÓN AVANZADA · URL DE FOTOGRAFÍAS (OPCIONAL)
                <textarea
                  rows={3}
                  value={form.gallery_urls}
                  onChange={(e) => update('gallery_urls', e.target.value)}
                  placeholder={'https://…/foto-1.jpg | Pie de foto opcional\nhttps://…/foto-2.jpg | Pie de foto opcional'}
                />
              </label>
            </div>

            <label>
              AUTOR / FOTÓGRAFO
              <input
                value={form.author}
                onChange={(e) => update('author', e.target.value)}
              />
            </label>

            <label>
              ESTADO EDITORIAL
              <select
                value={form.editorial_status}
                onChange={(e) => {
                  const nextStatus = e.target.value as typeof form.editorial_status;
                  update('editorial_status', nextStatus);
                  if (nextStatus === 'scheduled' && !form.publish_at) {
                    const boliviaTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    boliviaTomorrow.setMinutes(boliviaTomorrow.getMinutes() - boliviaTomorrow.getTimezoneOffset());
                    update('publish_at', boliviaTomorrow.toISOString().slice(0, 16));
                  }
                }}
              >
                <option value="published">Publicado (Inmediato)</option>
                <option value="scheduled">Programado (Fecha futura)</option>
                <option value="draft">Borrador</option>
                <option value="review">En revisión editorial</option>
                <option value="approved">Aprobado para publicar</option>
              </select>
              <small className="form-note">
                Elige &quot;Publicado&quot; para que se vea de inmediato, o &quot;Programado&quot; para fijar un día y hora de estreno automático.
              </small>
            </label>

            {form.editorial_status === 'scheduled' && (
              <label>
                FECHA Y HORA DE PUBLICACIÓN AUTOMÁTICA
                <input
                  type="datetime-local"
                  value={form.publish_at}
                  onChange={(e) => update('publish_at', e.target.value)}
                  required
                />
                <small className="form-note">
                  Se publicará automáticamente en esta fecha y hora.
                </small>
              </label>
            )}

            <div className="checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_social}
                  onChange={(e) => update('is_social', e.target.checked)}
                />
                Cobertura Glamora Social
              </label>
            </div>

            {uploadProgress && (
              <div className="wide admin-feedback" role="status">
                <strong>PROCESANDO MULTIMEDIA:</strong> {uploadProgress}
              </div>
            )}

            <div className="wide" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button-primary"
                onClick={() => setPreviewOpen(true)}
                disabled={busy}
              >
                VISTA PREVIA EDITORIAL ↗
              </button>
              <button className="button-primary" disabled={busy}>
                {busy
                  ? uploadProgress || 'GUARDANDO…'
                  : editingId
                    ? 'GUARDAR CAMBIOS ↗'
                    : 'GUARDAR PUBLICACIÓN ↗'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="button-primary"
                  onClick={cancelEdit}
                  disabled={busy}
                >
                  CANCELAR EDICIÓN
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 20 }}>
            <a className="text-link" href="/admin/issues">
              GLAMORA STUDIO · CREAR EDICIÓN ↗
            </a>

            <a className="text-link" href="/admin/sponsors">
              ADMINISTRAR PATROCINADORES ↗
            </a>

            <a className="text-link" href="/admin/agenda">
              GLAMORA EDITORIAL DESK · AGENDA DE COBERTURAS ↗
            </a>

            <a className="text-link" href="/admin/produccion">
              GLAMORA EDITORIAL DESK · CENTRO DE PRODUCCIÓN ↗
            </a>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 18,
          }}>
            <h2 style={{ font: '27px Georgia', fontWeight: 400, margin: 0 }}>
              Publicaciones
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 10,
              flex: '1 1 520px',
              maxWidth: 740,
            }}>
              <button
                type="button"
                onClick={unpublishAllDemoArticles}
                disabled={unpublishDemoBusy}
                style={{
                  padding: '9px 12px',
                  border: '1px solid #711c32',
                  background: '#fff9fa',
                  color: '#711c32',
                  fontSize: 8.5,
                  letterSpacing: '.14em',
                  cursor: unpublishDemoBusy ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
                title="Despublica los artículos con textos de prueba o imágenes de prueba para dejar la portada limpia"
              >
                {unpublishDemoBusy ? 'OCULTANDO DEMOS…' : 'DESPUBLICAR DEMOS ✕'}
              </button>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, ciudad o autor…"
                aria-label="Buscar publicaciones"
                style={{ padding: '10px 12px', border: '1px solid #d8cec4', background: '#fffdfa', fontSize: 13 }}
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Filtrar por categoría"
                style={{ padding: '10px 12px', border: '1px solid #d8cec4', background: '#fffdfa', fontSize: 13 }}
              >
                <option value="TODAS">Todas las categorías</option>
                {[
                  'Moda',
                  'Belleza',
                  'People',
                  'Social',
                  'Viajes',
                  'Cultura',
                  'Gastronomía',
                  'Mundo',
                  'Lifestyle',
                  'Society',
                  'The Table',
                  'Wellness',
                ].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filtrar por estado"
                style={{ padding: '10px 12px', border: '1px solid #d8cec4', background: '#fffdfa', fontSize: 13 }}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="published">Publicados</option>
                <option value="scheduled">Programados</option>
                <option value="approved">Aprobados</option>
                <option value="review">En revisión</option>
                <option value="draft">Borradores</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-list">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Imagen</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Portada</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!loading && items.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty-state">{loadError ? 'No fue posible cargar las publicaciones.' : 'Todavía no hay publicaciones. Crea la primera desde el formulario editorial.'}</td></tr>
                )}
                {items
                  .filter((a) => {
                    const q = searchQuery.trim().toLowerCase();
                    const matchesQuery =
                      !q ||
                      (a.title || '').toLowerCase().includes(q) ||
                      (a.city || '').toLowerCase().includes(q) ||
                      (a.author || '').toLowerCase().includes(q);
                    const matchesCat =
                      filterCategory === 'TODAS' ||
                      (a.category || '').toLowerCase() === filterCategory.toLowerCase();
                    const status = getEditorialStatus(a);
                    const matchesStatus =
                      filterStatus === 'TODOS' || status === filterStatus;
                    return matchesQuery && matchesCat && matchesStatus;
                  })
                  .map((a) => (
                  <tr key={a.id}>
                    <td className="admin-article-title-cell">
                      <div>{a.title}</div>
                      {a.city && (
                        <small style={{ color: '#806e68', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                          {a.city}
                        </small>
                      )}
                    </td>
                    <td>{a.cover_image ? <img className="admin-list-thumb" src={a.cover_image} alt={`Portada de ${a.title}`} loading="lazy" /> : <span className="admin-list-thumb-placeholder">G</span>}</td>
                    <td>{a.category}</td>

                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 9px',
                          border: '1px solid #d9cfc6',
                          background: getEditorialStatus(a) === 'published' ? '#eee8e1' : '#f7f5f0',
                          color: '#4b3b3d',
                          fontSize: 10,
                          letterSpacing: '.08em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {EDITORIAL_STATUS_LABELS[getEditorialStatus(a)]}
                      </span>
                    </td>

                    <td>
                      {a.is_cover ? (
                        'COVER STORY'
                      ) : (
                        <button
                          className="text-link"
                          disabled={!isCurrentlyPublished(a) || Boolean(coverBusyId)}
                          onClick={() => feature(a)}
                        >
                          {coverBusyId === a.id ? 'ACTUALIZANDO…' : 'DESTACAR'}
                        </button>
                      )}
                    </td>

                    <td>
                      <button
                        className="text-link"
                        onClick={() => edit(a)}
                      >
                        EDITAR
                      </button>

                      {' '}

                      <button
                        className="text-link"
                        onClick={() => toggle(a)}
                      >
                        {a.is_published ? 'OCULTAR' : 'PUBLICAR'}
                      </button>

                      {' '}

                      <button
                        className="text-link"
                        onClick={() => remove(a.id)}
                      >
                        ELIMINAR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa editorial"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15, 13, 16, .82)',
            padding: '24px 12px',
            overflowY: 'auto',
          }}
        >
          <div style={{
            width: 'min(1120px, 100%)',
            margin: '0 auto',
            background: '#f7f5f0',
            boxShadow: '0 25px 90px rgba(0,0,0,.35)',
          }}>
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              padding: '14px 20px',
              background: '#15131a',
              color: '#f7f5f0',
            }}>
              <div>
                <div style={{ color: '#d9b9a4', fontSize: 8, letterSpacing: '.2em' }}>
                  GLAMORA STUDIO
                </div>
                <strong style={{ font: '18px Georgia, serif', fontWeight: 400 }}>
                  Vista previa editorial
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                style={{
                  border: '1px solid rgba(255,255,255,.35)',
                  background: 'transparent',
                  color: '#fff',
                  padding: '9px 13px',
                  cursor: 'pointer',
                  fontSize: 10,
                  letterSpacing: '.12em',
                }}
              >
                CERRAR ✕
              </button>
            </div>

            <main className="container glamora-article-page" style={{ width: '89%' }}>
              <article className="article-body">
                <header className="editorial-article-header">
                  <div className="article-topline">
                    <span className="eyebrow">
                      {form.category}{form.city ? ` · ${form.city}` : ''}
                    </span>
                    <span>GLAMORA EDITORIAL</span>
                  </div>
                  <h1>{form.title || 'Título de la publicación'}</h1>
                  {form.excerpt && <p className="lead">{form.excerpt}</p>}
                  <div className="article-byline">
                    <span>POR {form.author || 'GLAMORA EDITORIAL'}</span>
                    {previewDate && <span>{previewDate}</span>}
                    <span>GLAMORA · BOLIVIA</span>
                  </div>
                </header>

                {coverPreview && (
                  <figure className="editorial-article-cover">
                    <div className="editorial-cover-image">
                      <img
                        src={coverPreview}
                        alt={form.title || 'Portada GLAMORA'}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <figcaption>GLAMORA EDITORIAL · {form.category}</figcaption>
                  </figure>
                )}

                {form.body.trim() ? (
                  <EditorialBodyRenderer
                    body={form.body}
                    articleTitle={form.title || 'Vista previa GLAMORA'}
                  />
                ) : (
                  <div className="editorial-article-text">
                    <p style={{ color: '#999' }}>El texto del artículo aparecerá aquí.</p>
                  </div>
                )}

                {form.video_url && (
                  <EditorialVideoPlayer
                    video={{
                      url: form.video_url,
                      aspect: form.video_aspect,
                      caption: form.video_caption,
                    }}
                    title={form.title || 'Vista previa de video'}
                  />
                )}

                {(form.is_social || previewPhotos.length > 0 || form.people_names.trim()) && (
                  <section className="article-gallery">
                    <div className="section-heading">
                      <div>
                        <span className="section-overline">
                          {(form.is_social || form.category?.toUpperCase() === 'SOCIEDAD')
                            ? 'GLAMORA SOCIAL · CRÓNICA'
                            : 'GLAMORA EDITORIAL · DIARIO VISUAL'}
                        </span>
                        <h2>
                          {form.event_name || (
                            (form.is_social || form.category?.toUpperCase() === 'SOCIEDAD')
                              ? 'ENCUENTROS & MOMENTOS'
                              : form.category?.toUpperCase() === 'MODA'
                                ? 'DETALLES DE ESTILO'
                                : form.category?.toUpperCase() === 'GASTRONOMÍA'
                                  ? 'ATMÓSFERA & SABOR'
                                  : 'GALERÍA DE LA HISTORIA'
                          )}
                        </h2>
                      </div>
                      <span className="section-action">
                        {form.venue || form.city || 'BOLIVIA'}
                      </span>
                    </div>

                    {previewPhotos.length > 0 && (
                      <div className="moment-gallery">
                        {previewPhotos.map((item, index) => (
                          <figure
                            className={`moment moment-${(index % 4) + 1}`}
                            key={`${item.src}-${index}`}
                          >
                            <div>
                              <img
                                src={item.src}
                                alt={item.alt}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </div>
                            <figcaption>
                              {item.caption || `Fotografía ${String(index + 1).padStart(2, '0')}`}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    )}

                    {form.people_names.trim() && (
                      <div className="social-people">
                        <span className="section-overline">IN THE FRAME</span>
                        <p>{form.people_names.split(',').map((name) => name.trim()).filter(Boolean).join(' · ')}</p>
                      </div>
                    )}
                  </section>
                )}

                <footer className="article-end">
                  <span>—</span>
                  <p>ESTILO · ELEGANCIA · INSPIRACIÓN</p>
                  <span>GLAMORA · BOLIVIA</span>
                </footer>
              </article>
            </main>
          </div>
        </div>
      )}
    </main>
  );
}
