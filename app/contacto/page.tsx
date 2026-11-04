import { ContactFormClient } from '@/components/ContactFormClient';

export const metadata = { title: 'Contacto | Glamora' };

const contactDesks = [
  {
    number: '01',
    label: 'ALIANZAS DE MARCA & PUBLICIDAD',
    detail: 'Espacios en portada, secciones editoriales, campañas y ediciones especiales.',
  },
  {
    number: '02',
    label: 'GLAMORA SOCIAL & EVENTOS',
    detail: 'Cobertura fotográfica, crónica social y presencia en lanzamientos y celebraciones.',
  },
  {
    number: '03',
    label: 'REDACCIÓN & PRENSA',
    detail: 'Propuestas de perfiles, entrevistas, notas culturales y comunicados oficiales.',
  },
];

export default function Contact() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'legarage1014@gmail.com';

  return (
    <main className="container people-page contact-page">
      <header className="people-intro">
        <div className="eyebrow">GLAMORA · MESA EDITORIAL &amp; COMERCIAL</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>CONTACTO</h1>
          <p>
            Para propuestas editoriales, prensa, publicidad, patrocinios y colaboraciones especiales.
          </p>
        </div>
        <div className="people-index" aria-label="Áreas de atención en CONTACTO">
          PUBLICIDAD &amp; PATROCINIOS <i>·</i> PRENSA &amp; EVENTOS <i>·</i> PROPUESTAS EDITORIALES <i>·</i> ALIANZAS
        </div>
      </header>

      <section className="contact-editorial-grid" aria-labelledby="contact-lead-title">
        <div className="contact-editorial-copy">
          <div className="people-feature-meta">MESA EDITORIAL &amp; COMERCIAL · BOLIVIA</div>
          <h2 id="contact-lead-title">Hablemos de tu próxima historia o campaña.</h2>
          <p className="people-feature-excerpt">
            Creamos alianzas a medida, producciones visuales y crónicas memorables para marcas, creadores y protagonistas que comparten nuestra visión de la elegancia contemporánea.
          </p>

          <div className="contact-desks">
            {contactDesks.map((desk) => (
              <div key={desk.number} className="contact-desk-item">
                <div className="contact-desk-header">
                  <span>{desk.number}</span>
                  <strong>{desk.label}</strong>
                </div>
                <p>{desk.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="contact-form-panel">
          <div className="eyebrow">FORMULARIO DE CONTACTO DIRECTO</div>
          <ContactFormClient />
        </div>
      </section>
    </main>
  );
}
