-- GLAMORA: Tablas de persistencia en la nube para Despliegue Oficial
-- Ejecutar en Supabase -> SQL Editor -> Run

-- 1. Tabla de configuración de Glamora Studio (Redes, Diseños de Edición, Vistas)
create table if not exists public.studio_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.studio_settings enable row level security;

-- Lectura pública para que la web lea enlaces a redes sociales y vistas de artículos
drop policy if exists "public read studio_settings" on public.studio_settings;
create policy "public read studio_settings" on public.studio_settings
  for select using (true);

-- Administración exclusiva para el correo editorial
drop policy if exists "admin manage studio_settings" on public.studio_settings;
create policy "admin manage studio_settings" on public.studio_settings
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com');

-- Permitir actualización pública de vistas de artículos (contador de lectura)
drop policy if exists "public update article views" on public.studio_settings;
create policy "public update article views" on public.studio_settings
  for update using (key = 'article_views')
  with check (key = 'article_views');

-- 2. Tabla de Suscriptores de Newsletter
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Cualquier visitante puede suscribirse ingresando su correo
drop policy if exists "public subscribe newsletter" on public.newsletter_subscribers;
create policy "public subscribe newsletter" on public.newsletter_subscribers
  for insert with check (true);

-- Solo el administrador puede ver o exportar la lista de correos
drop policy if exists "admin read newsletter" on public.newsletter_subscribers;
create policy "admin read newsletter" on public.newsletter_subscribers
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com');

-- 3. Tabla de Mensajes de Contacto / Patrocinios
create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text not null,
  inquiry_type text,
  message text not null,
  created_at timestamptz default now()
);

alter table public.contact_leads enable row level security;

drop policy if exists "public submit contact" on public.contact_leads;
create policy "public submit contact" on public.contact_leads
  for insert with check (true);

drop policy if exists "admin manage contact leads" on public.contact_leads;
create policy "admin manage contact leads" on public.contact_leads
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'legarage1014@gmail.com');

-- Datos iniciales por defecto
insert into public.studio_settings (key, value)
values
  ('social_links', '{"instagram":"https://www.instagram.com/","facebook":"https://www.facebook.com/","tiktok":"https://www.tiktok.com/","x":"https://x.com/","whatsapp":"https://wa.me/","messenger":"https://www.messenger.com/"}'::jsonb),
  ('issue_designs', '{}'::jsonb),
  ('article_views', '{}'::jsonb)
on conflict (key) do nothing;
