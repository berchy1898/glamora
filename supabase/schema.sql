-- GLAMORA initial schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.articles (
 id uuid primary key default gen_random_uuid(), title text not null, slug text unique not null,
 excerpt text, body text, category text not null default 'People', city text,
 cover_image text, author text default 'Glamora Editorial', is_published boolean not null default false,
 is_social boolean not null default false, event_name text, venue text, event_date date, gallery_images text[] not null default '{}', people_tags text[] not null default '{}', published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists articles_published_idx on public.articles(is_published,published_at desc);
create index if not exists articles_social_idx on public.articles(is_social,published_at desc);
create table if not exists public.sponsors (
 id uuid primary key default gen_random_uuid(), name text not null, logo_url text, placement text not null,
 target_url text, starts_at date, ends_at date, is_active boolean not null default false, created_at timestamptz default now()
);
create table if not exists public.magazine_issues (
 id uuid primary key default gen_random_uuid(), issue_number integer unique not null, title text not null,
 slug text unique not null, cover_image text, article_ids uuid[] not null default '{}', status text not null default 'draft', published_at timestamptz, created_at timestamptz default now()
);
create table if not exists public.contact_leads (
 id uuid primary key default gen_random_uuid(), name text not null, company text, email text not null,
 inquiry_type text, message text not null, created_at timestamptz default now()
);
-- Private administrator model: disable public signups in Supabase Auth and invite only the owner.
alter table public.articles enable row level security;
alter table public.sponsors enable row level security;
alter table public.magazine_issues enable row level security;
alter table public.contact_leads enable row level security;
-- Public can read published editorial content only.
drop policy if exists "public read published articles" on public.articles;
create policy "public read published articles" on public.articles for select using (is_published = true and published_at is not null and published_at <= now());
-- Replace the email below with the owner email before running this script. Public signup must remain disabled.
-- The JWT email check enforces the single-administrator model even if another account is invited.
drop policy if exists "admin manage articles" on public.articles;
create policy "admin manage articles" on public.articles for all to authenticated using ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com') with check ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com');
drop policy if exists "public read active sponsors" on public.sponsors;
create policy "public read active sponsors" on public.sponsors for select using (is_active = true);
drop policy if exists "admin manage sponsors" on public.sponsors;
create policy "admin manage sponsors" on public.sponsors for all to authenticated using ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com') with check ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com');
drop policy if exists "public read published issues" on public.magazine_issues;
create policy "public read published issues" on public.magazine_issues for select using (status = 'published');
drop policy if exists "admin manage issues" on public.magazine_issues;
create policy "admin manage issues" on public.magazine_issues for all to authenticated using ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com') with check ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com');
create policy "admin read contact leads" on public.contact_leads for select to authenticated using ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com');
create policy "admin manage contact leads" on public.contact_leads for all to authenticated using ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com') with check ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com');
-- Public contact submissions are allowed only through a future server-side endpoint, not direct table writes.
-- Storage bucket for editorial photography:
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('glamora-media','glamora-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "public view glamora media" on storage.objects for select using (bucket_id='glamora-media');
create policy "authenticated upload glamora media" on storage.objects for insert to authenticated with check (bucket_id='glamora-media' and (auth.jwt() ->> 'email') = 'legarage1014@gmail.com');
create policy "authenticated update glamora media" on storage.objects for update to authenticated using (bucket_id='glamora-media' and (auth.jwt() ->> 'email') = 'legarage1014@gmail.com');
create policy "authenticated delete glamora media" on storage.objects for delete to authenticated using (bucket_id='glamora-media' and (auth.jwt() ->> 'email') = 'legarage1014@gmail.com');

-- GLAMORA SOCIAL: metadata and multi-photo galleries (safe to run on existing projects).
alter table public.articles add column if not exists event_name text;
alter table public.articles add column if not exists venue text;
alter table public.articles add column if not exists event_date date;
alter table public.articles add column if not exists gallery_images text[] not null default '{}';
alter table public.articles add column if not exists people_tags text[] not null default '{}';


-- GLAMORA 2.0: editorial cover selection and scheduled publication. Safe for existing projects.
alter table public.articles add column if not exists is_cover boolean not null default false;
create unique index if not exists articles_single_cover_idx on public.articles(is_cover) where is_cover = true;
create index if not exists articles_schedule_idx on public.articles(is_published, published_at);
-- Keep only one manually selected cover story at a time. The Studio clears the previous selection before setting a new one.
