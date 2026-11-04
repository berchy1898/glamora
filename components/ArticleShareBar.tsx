'use client';

import { ArticleShareBarWidget } from '@/components/ArticleClientWidgets';

type ArticleShareBarProps = {
  title: string;
  slug: string;
  category?: string;
};

export function ArticleShareBar({
  title,
  slug,
  category,
}: ArticleShareBarProps) {
  return (
    <ArticleShareBarWidget
      title={title}
      slug={slug}
      category={category}
    />
  );
}
