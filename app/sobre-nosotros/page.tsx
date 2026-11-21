import Link from 'next/link';
import { readStudioConfig } from '@/lib/studio-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Sobre nosotros | GLAMORA',
  description:
    'Conoce la visión editorial, historia y equipo detrás de GLAMORA: moda, cultura, gastronomía y vida social desde Bolivia hacia el mundo.',
};

const editorialPillars = [
  {
    number: '01',
    meta: 'CURADURÍA & ESTÉTICA',
    title: 'Moda, diseño y dirección visual',
    description:
      'Exploramos la moda de autor, la estética contemporánea y los lenguajes visuales con rigor periodístico y una sensibilidad inspirada en las grandes cabeceras internacionales.',
  },
  {
    number: '02',
    meta: 'ESCENA & SOCIEDAD',
    title: 'Crónica viva en nuestras ciudades',
    description:
      'Seguimos de cerca el pulso cultural, gastronómico y social de Cochabamba, La Paz, Oruro, Potosí y Santa Cruz, proyectando el talento local hacia escenarios internacionales.',
  },
  {
    number: '03',
    meta: 'THE ISSUES',
    title: 'Edición digital y de colección',
    description:
      'Más allá de la lectura cotidiana, cada número especial reúne entrevistas, crónicas visuales y fotografía curada en una experiencia editorial pensada para perdurar.',
  },
];

export default async function AboutPage() {
  const studioConfig = await readStudioConfig();
  const contributorsList = Object.values(studioConfig.contributors || {});

  return (
    <main className="container people-page advertising-page">
      <header className="people-intro">
        <div className="eyebrow">GLAMORA · QUIÉNES SOMOS</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>SOBRE NOSOTROS</h1>
          <p>
            Somos una revista digital y editorial contemporánea dedicada a narrar el estilo, la cultura, la gastronomía y la vida social de Bolivia con una mirada estética e internacional.
          </p>
        </div>
        <div className="people-index" aria-label="Pilares de GLAMORA">
          ESTILO <i>·</i> CULTURA <i>·</i> SOCIEDAD <i>·</i> BOLIVIA &amp; THE WORLD
        </div>
      </header>

      <section className="advertising-lead-spread" aria-labelledby="about-manifesto-title">
        <div className="advertising-lead-card">
          <span className="eyebrow">FILOSOFÍA EDITORIAL · GLAMORA</span>
          <h2 id="about-manifesto-title">Una mirada propia desde Bolivia hacia el mundo.</h2>
          <p>
            GLAMORA nace con la convicción de contar nuestras historias con el cuidado tipográfico, la dirección de arte y la profundidad editorial que caracterizan a las revistas más influyentes. Creemos en el periodismo visual honesto, en las conversaciones pausadas y en destacar a quienes transforman la escena creativa, cultural y empresarial de nuestra región.
          </p>
          <p style={{ marginTop: 14 }}>
            Cada cobertura y cada edición de THE ISSUES está pensada para inspirar: celebramos el oficio, el diseño, la hospitalidad y los encuentros que definen nuestro tiempo.
          </p>
          <div className="advertising-lead-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <Link className="people-read-link" href="/ediciones">
              EXPLORAR THE ISSUES <span>↗</span>
            </Link>
            <Link className="people-read-link" href="/contacto">
              CONTACTO EDITORIAL <span>↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="people-recent" aria-labelledby="about-pillars-title">
        <div className="section-heading">
          <div>
            <span className="section-overline">IDENTIDAD · ENFOQUE · ARCHIVO</span>
            <h2 id="about-pillars-title">Nuestra visión editorial</h2>
          </div>
          <span className="people-story-count">03 PILARES</span>
        </div>

        <div className="advertising-pillars-grid">
          {editorialPillars.map((pillar) => (
            <article key={pillar.number} className="advertising-pillar-card">
              <div className="advertising-pillar-top">
                <span className="advertising-pillar-number">{pillar.number}</span>
                <span className="card-meta">{pillar.meta}</span>
              </div>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
              <Link href="/publicidad" className="read-link">
                ALIANZAS &amp; COLABORACIONES ↗
              </Link>
            </article>
          ))}
        </div>
      </section>

      {contributorsList.length > 0 && (
        <section className="people-recent" aria-labelledby="about-team-title" style={{ marginTop: 48 }}>
          <div className="section-heading">
            <div>
              <span className="section-overline">EQUIPO &amp; FIRMAS</span>
              <h2 id="about-team-title">Nuestros colaboradores</h2>
            </div>
            <span className="people-story-count">
              {String(contributorsList.length).padStart(2, '0')} FIRMAS
            </span>
          </div>

          <div className="advertising-pillars-grid">
            {contributorsList.map((contrib, idx) => (
              <article key={contrib.slug} className="advertising-pillar-card">
                <div className="advertising-pillar-top">
                  <span className="advertising-pillar-number">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="card-meta">{contrib.role.toUpperCase()}</span>
                </div>
                <h3>{contrib.name}</h3>
                {contrib.bio && <p>{contrib.bio}</p>}
                <Link href={`/colaborador/${contrib.slug}`} className="read-link">
                  VER PERFIL Y ARCHIVO ↗
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
