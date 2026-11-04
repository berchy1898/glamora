import Link from 'next/link';
import { SponsorSlot } from '@/components/SponsorSlot';

export const metadata = {
  title: 'Publicidad y alianzas | GLAMORA',
  description:
    'Alianzas estratégicas, dirección de arte y espacios editoriales de alto impacto para marcas de prestigio en GLAMORA.',
};

const partnershipPillars = [
  {
    number: '01',
    meta: 'PRESENCIA EDITORIAL',
    title: 'Espacios Editoriales & Display',
    description:
      'Espacios de alto impacto integrados con sutileza en portada, ediciones digitales y secciones temáticas, respetando la experiencia visual del lector.',
  },
  {
    number: '02',
    meta: 'DIRECCIÓN DE ARTE',
    title: 'Alianzas & Contenido de Marca',
    description:
      'Producciones editoriales a medida, perfiles de marca y narrativas visuales creadas por el equipo creativo de Glamora e identificadas con transparencia.',
  },
  {
    number: '03',
    meta: 'EXPERIENCIAS & ESCENA',
    title: 'Eventos & Cobertura Social',
    description:
      'Cobertura fotográfica y crónica social en Glamora Social para lanzamientos, aperturas, cenas privadas y acontecimientos de marca.',
  },
];

export default function Advertising() {
  return (
    <main className="container people-page advertising-page">
      <header className="people-intro">
        <div className="eyebrow">GLAMORA · ALIANZAS &amp; PUBLICIDAD</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>PUBLICIDAD</h1>
          <p>
            Conectamos marcas de prestigio, historias y experiencias con una audiencia que valora el estilo, la cultura y la sofisticación.
          </p>
        </div>
        <div className="people-index" aria-label="Modalidades de alianza en PUBLICIDAD">
          ESPACIOS EDITORIALES <i>·</i> ALIANZAS DE MARCA <i>·</i> EVENTOS &amp; COBERTURAS <i>·</i> EDICIONES ESPECIALES
        </div>
      </header>

      <section className="advertising-lead-spread" aria-labelledby="advertising-lead-title">
        <div className="advertising-lead-card">
          <span className="eyebrow">ALIANZAS COMERCIALES · GLAMORA</span>
          <h2 id="advertising-lead-title">Creemos algo extraordinario.</h2>
          <p>
            En Glamora no ofrecemos anuncios convencionales. Concebimos presencias de marca que dialogan con la dirección de arte de nuestra revista y conectan con una audiencia selecta, sensible a la estética, la cultura y el buen vivir.
          </p>
          <div className="advertising-lead-actions">
            <Link className="people-read-link" href="/contacto">
              SOLICITAR PROPUESTA COMERCIAL <span>↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="people-recent" aria-labelledby="advertising-formats-title">
        <div className="section-heading">
          <div>
            <span className="section-overline">FORMATOS · COLABORACIONES · ALCANCE</span>
            <h2 id="advertising-formats-title">Modalidades de presencia</h2>
          </div>
          <span className="people-story-count">03 MODALIDADES</span>
        </div>

        <div className="advertising-pillars-grid">
          {partnershipPillars.map((pillar) => (
            <article key={pillar.number} className="advertising-pillar-card">
              <div className="advertising-pillar-top">
                <span className="advertising-pillar-number">{pillar.number}</span>
                <span className="card-meta">{pillar.meta}</span>
              </div>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
              <Link href="/contacto" className="read-link">
                CONSULTAR DISPONIBILIDAD ↗
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="advertising-sponsor-preview">
        <SponsorSlot placement="Homepage" />
      </section>
    </main>
  );
}
