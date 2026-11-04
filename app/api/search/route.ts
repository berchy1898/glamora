import { NextResponse } from 'next/server';
import { getArticles } from '@/lib/data';

function normalizeToken(value: string | null | undefined): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const q = normalizeToken(rawQuery);

    const articles = await getArticles({ limit: 80, demoFallback: false });

    if (!q) {
      return NextResponse.json({
        results: articles.slice(0, 6).map((a) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          category: a.category,
          city: a.city,
          cover_image: a.cover_image,
          event_name: a.event_name,
          published_at: a.published_at,
          matchedPeople: [] as string[],
        })),
      });
    }

    const filtered = articles
      .map((a) => {
        const people = (a.people_tags ?? []).filter(Boolean);
        const matchedPeople = people.filter((person) =>
          normalizeToken(person).includes(q)
        );

        const haystacks = [
          a.title,
          a.excerpt,
          a.category,
          a.city,
          a.event_name,
          a.venue,
          a.author,
        ].map(normalizeToken);

        const matchesText = haystacks.some((field) => field.includes(q));

        if (!matchesText && matchedPeople.length === 0) {
          return null;
        }

        return {
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          category: a.category,
          city: a.city,
          cover_image: a.cover_image,
          event_name: a.event_name,
          published_at: a.published_at,
          matchedPeople,
        };
      })
      .filter(Boolean)
      .slice(0, 12);

    return NextResponse.json({ results: filtered });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
