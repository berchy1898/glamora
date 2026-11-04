'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Sponsor = {
  id: string;
  name: string;
  placement: string;
  target_url: string | null;
  is_active: boolean;
};

const ADMIN_EMAIL = 'legarage1014@gmail.com';

export default function Sponsors() {
  const db = supabaseBrowser();
  const router = useRouter();

  const [rows, setRows] = useState<Sponsor[]>([]);
  const [name, setName] = useState('');
  const [placement, setPlacement] = useState('Homepage');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const {
        data: { user },
        error,
      } = await db.auth.getUser();

      if (error || !user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
        router.replace('/admin/login');
        return;
      }

      if (active) {
        setReady(true);
        await load();
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  async function load() {
    const { data, error } = await db
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('No se pudieron cargar los patrocinadores: ' + error.message);
      return;
    }

    setRows((data || []) as Sponsor[]);
  }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage('');

    const { error } = await db.from('sponsors').insert({
      name: name.trim(),
      placement,
      target_url: url.trim() || null,
      is_active: false,
    });

    if (error) {
      setMessage('No se pudo añadir el patrocinador: ' + error.message);
    } else {
      setMessage('Patrocinador añadido como inactivo.');
      setName('');
      setUrl('');
      await load();
    }

    setBusy(false);
  }

  async function toggle(sponsor: Sponsor) {
    const { error } = await db
      .from('sponsors')
      .update({ is_active: !sponsor.is_active })
      .eq('id', sponsor.id);

    if (error) {
      setMessage('No se pudo actualizar el estado: ' + error.message);
      return;
    }

    setMessage('Estado actualizado.');
    await load();
  }

  if (!ready) {
    return <main className="admin-shell" />;
  }

  return (
    <main className="admin-shell">
      <div className="admin-top">
        <strong>GLAMORA STUDIO · ADVERTISING</strong>
        <button
          type="button"
          className="button-primary"
          onClick={() => router.push('/admin')}
        >
          VOLVER AL PANEL
        </button>
      </div>

      <div className="admin-content">
        <div className="eyebrow">AD MANAGER</div>
        <h1 style={{ font: '42px Georgia', fontWeight: 400 }}>
          Patrocinadores
        </h1>

        <section className="admin-panel">
          <form className="admin-form" onSubmit={add}>
            <label>
              NOMBRE DE MARCA
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label>
              UBICACIÓN
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
              >
                {[
                  'Homepage',
                  'Social',
                  'Fashion',
                  'Beauty',
                  'City Partner',
                  'Issue Partner',
                  'Newsletter',
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="wide">
              URL DE DESTINO
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
                placeholder="https://..."
              />
            </label>

            <div className="wide">
              <button className="button-primary" disabled={busy}>
                {busy ? 'GUARDANDO…' : 'AÑADIR PATROCINADOR ↗'}
              </button>
            </div>
          </form>

          {message && <p className="status">{message}</p>}
        </section>

        <section className="admin-panel">
          <h2 style={{ font: '26px Georgia' }}>Marcas registradas</h2>

          <table className="admin-list">
            <thead>
              <tr>
                <th>Marca</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((sponsor) => (
                <tr key={sponsor.id}>
                  <td>{sponsor.name}</td>
                  <td>{sponsor.placement}</td>
                  <td>{sponsor.is_active ? 'ACTIVO' : 'INACTIVO'}</td>
                  <td>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => void toggle(sponsor)}
                    >
                      {sponsor.is_active ? 'DESACTIVAR' : 'ACTIVAR'}
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={4}>Todavía no hay patrocinadores registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
