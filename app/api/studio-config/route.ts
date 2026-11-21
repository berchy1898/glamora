import { NextResponse } from 'next/server';
import {
  DEFAULT_ISSUE_DESIGN,
  DEFAULT_SOCIAL_LINKS,
  readStudioConfig,
  writeStudioConfig,
  type ArticleEditorialMeta,
  type ContributorProfile,
  type IssueDesignConfig,
  type StudioSocialLinks,
} from '@/lib/studio-config';
import { slugifyContributorName } from '@/lib/contributors';

async function insertSupabaseRest(endpoint: string, body: any): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const res = await fetch(`${url}/rest/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const config = await readStudioConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = await readStudioConfig();

    if (body.action === 'subscribe' && typeof body.email === 'string') {
      const normalized = body.email.trim().toLowerCase();
      if (!normalized || !normalized.includes('@')) {
        return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
      }
      const exists = current.subscribers.some(
        (sub) => sub.email.toLowerCase() === normalized
      );
      if (!exists) {
        const nowIso = new Date().toISOString();
        current.subscribers.unshift({
          email: normalized,
          subscribedAt: nowIso,
        });
        await writeStudioConfig(current);
        await insertSupabaseRest('newsletter_subscribers', {
          email: normalized,
          subscribed_at: nowIso,
        });
      }
      return NextResponse.json({ ok: true, subscribersCount: current.subscribers.length });
    }

    if (body.action === 'contact_message' && typeof body.email === 'string') {
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        nombre: String(body.nombre || '').trim(),
        empresa: String(body.empresa || '').trim(),
        email: String(body.email || '').trim(),
        tipo: String(body.tipo || 'Publicidad y patrocinio').trim(),
        mensaje: String(body.mensaje || '').trim(),
        createdAt: new Date().toISOString(),
      };
      if (!item.nombre || !item.email || !item.mensaje) {
        return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
      }
      current.contactMessages.unshift(item);
      await writeStudioConfig(current);
      await insertSupabaseRest('contact_leads', {
        name: item.nombre,
        company: item.empresa,
        email: item.email,
        inquiry_type: item.tipo,
        message: item.mensaje,
      });
      return NextResponse.json({ ok: true, messageId: item.id });
    }

    if (body.action === 'delete_contact_message' && typeof body.id === 'string') {
      current.contactMessages = current.contactMessages.filter(
        (m) => m.id !== body.id
      );
      await writeStudioConfig(current);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'track_view' && typeof body.slug === 'string') {
      const slugKey = body.slug.trim();
      if (slugKey) {
        current.articleViews[slugKey] = (current.articleViews[slugKey] || 0) + 1;
        await writeStudioConfig(current, ['article_views']);
      }
      return NextResponse.json({
        ok: true,
        views: current.articleViews[slugKey] || 1,
      });
    }

    if (body.action === 'update_socials' && body.socials && typeof body.socials === 'object') {
      const incoming = body.socials as Partial<StudioSocialLinks>;
      current.socials = {
        instagram: incoming.instagram?.trim() || DEFAULT_SOCIAL_LINKS.instagram,
        facebook: incoming.facebook?.trim() || DEFAULT_SOCIAL_LINKS.facebook,
        tiktok: incoming.tiktok?.trim() || DEFAULT_SOCIAL_LINKS.tiktok,
        whatsapp: incoming.whatsapp?.trim() || DEFAULT_SOCIAL_LINKS.whatsapp,
        linkedin: incoming.linkedin?.trim() || DEFAULT_SOCIAL_LINKS.linkedin,
      };
      await writeStudioConfig(current, ['social_links']);
      return NextResponse.json({ ok: true, socials: current.socials });
    }

    if (
      body.action === 'save_issue_design' &&
      typeof body.issueKey === 'string' &&
      body.design &&
      typeof body.design === 'object'
    ) {
      const incoming = body.design as Partial<IssueDesignConfig>;
      current.issueDesigns[body.issueKey] = {
        ...DEFAULT_ISSUE_DESIGN,
        ...incoming,
        articleLayouts:
          incoming.articleLayouts && typeof incoming.articleLayouts === 'object'
            ? incoming.articleLayouts
            : {},
      };
      await writeStudioConfig(current, ['issue_designs']);
      return NextResponse.json({
        ok: true,
        design: current.issueDesigns[body.issueKey],
      });
    }

    if (body.action === 'reset_test_metrics') {
      current.articleViews = {};
      await writeStudioConfig(current, ['article_views']);
      return NextResponse.json({ ok: true, message: 'Métricas y visitas de prueba restablecidas a cero.' });
    }

    if (body.action === 'clear_test_inbox') {
      const count = current.contactMessages.length;
      current.contactMessages = [];
      await writeStudioConfig(current);
      return NextResponse.json({ ok: true, clearedCount: count, message: 'Bandeja de mensajes de prueba vaciada.' });
    }

    if (body.action === 'save_article_meta' && typeof body.slug === 'string') {
      const slugKey = body.slug.trim();
      if (!slugKey) {
        return NextResponse.json({ error: 'Slug de artículo requerido' }, { status: 400 });
      }
      const incoming = (body.meta || {}) as Partial<ArticleEditorialMeta>;
      const cleaned: ArticleEditorialMeta = {
        photographer: incoming.photographer?.trim() || undefined,
        coverageBy: incoming.coverageBy?.trim() || undefined,
        expertHeading: incoming.expertHeading?.trim() || undefined,
        expertBio: incoming.expertBio?.trim() || undefined,
      };
      if (
        !cleaned.photographer &&
        !cleaned.coverageBy &&
        !cleaned.expertHeading &&
        !cleaned.expertBio
      ) {
        delete current.articleMeta[slugKey];
      } else {
        current.articleMeta[slugKey] = cleaned;
      }
      await writeStudioConfig(current, ['article_meta']);
      return NextResponse.json({ ok: true, articleMeta: current.articleMeta[slugKey] || null });
    }

    if (body.action === 'save_contributor' && body.profile && typeof body.profile === 'object') {
      const incoming = body.profile as Partial<ContributorProfile>;
      const name = (incoming.name || '').trim();
      const slug = (incoming.slug || '').trim() || slugifyContributorName(name);
      if (!name || !slug) {
        return NextResponse.json({ error: 'Nombre de colaborador requerido' }, { status: 400 });
      }
      current.contributors[slug] = {
        slug,
        name,
        role: (incoming.role || 'Colaborador Editorial').trim(),
        bio: (incoming.bio || '').trim(),
        instagram: incoming.instagram?.trim() || undefined,
        linkedin: incoming.linkedin?.trim() || undefined,
        website: incoming.website?.trim() || undefined,
      };
      await writeStudioConfig(current, ['contributors']);
      return NextResponse.json({ ok: true, contributor: current.contributors[slug] });
    }

    if (body.action === 'delete_contributor' && typeof body.slug === 'string') {
      const slugKey = body.slug.trim();
      delete current.contributors[slugKey];
      await writeStudioConfig(current, ['contributors']);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Error al procesar configuración' }, { status: 500 });
  }
}
