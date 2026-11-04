import Link from 'next/link';

export const metadata = {
  title: 'Privacidad y Términos Editoriales | GLAMORA',
  description:
    'Políticas de privacidad, propiedad intelectual, derechos de autor y términos de uso de la revista digital GLAMORA.',
};

export default function PrivacidadPage() {
  return (
    <main className="container people-page privacy-page">
      <header className="people-intro">
        <div className="eyebrow">MARCO INSTITUCIONAL &amp; LEGAL · GLAMORA</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>PRIVACIDAD</h1>
          <p>
            Compromiso ético con la protección de datos, la propiedad intelectual y el rigor periodístico en nuestras publicaciones.
          </p>
        </div>
        <div className="people-index" aria-label="Temas institucionales">
          PROPIEDAD INTELECTUAL <i>·</i> DERECHOS DE IMAGEN <i>·</i> DATOS PERSONALES <i>·</i> TRANSPARENCIA
        </div>
      </header>

      <section className="editorial-article-text" style={{ maxWidth: 820, margin: '48px auto 90px' }}>
        <p className="lead" style={{ font: 'italic 18px/1.7 Georgia, serif', color: '#685d56', marginBottom: 32 }}>
          GLAMORA es una publicación editorial digital concebida en Bolivia con proyección internacional. Valoramos la confianza de nuestros lectores, colaboradores y marcas aliadas.
        </p>

        <h2 className="article-subhead">01 · PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR</h2>
        <p>
          Todo el contenido publicado en GLAMORA —incluyendo textos, artículos, crónicas, fotografías, dirección de arte, emblemas tipográficos, logotipos y maquetaciones interactivas— se encuentra protegido por las leyes de propiedad intelectual y tratados internacionales de derechos de autor.
        </p>
        <p>
          Queda expresamente prohibida la reproducción total o parcial, descarga no autorizada, alteración o explotación comercial de nuestros materiales editoriales sin la autorización expresa y por escrito de la Dirección Editorial de GLAMORA.
        </p>

        <h2 className="article-subhead">02 · COBERTURAS SOCIALES Y DERECHO DE IMAGEN</h2>
        <p>
          En nuestras coberturas de sociedad y crónicas visuales (Glamora Social y The People), registramos acontecimientos culturales, benéficos, empresariales y sociales de interés público. Si usted aparece en una de nuestras galerías y desea solicitar la actualización de su crédito o el retiro de una fotografía, puede contactarnos directamente a través de nuestro <Link href="/contacto" style={{ color: '#711c32', textDecoration: 'underline' }}>formulario de contacto editorial</Link>.
        </p>

        <h2 className="article-subhead">03 · PROTECCIÓN DE DATOS Y SUSCRIPCIÓN AL DISPATCH</h2>
        <p>
          Los correos electrónicos recopilados a través de nuestro formulario de suscripción (*The Glamora Dispatch*) se utilizan exclusivamente para el envío de nuevas ediciones digitales, invitaciones editoriales y comunicados oficiales. GLAMORA no comercializa ni comparte bases de datos con terceros bajo ninguna circunstancia.
        </p>

        <h2 className="article-subhead">04 · TRANSPARENCIA EDITORIAL Y ALIANZAS</h2>
        <p>
          Las colaboraciones comerciales, menciones de patrocinio y producciones especiales realizadas con marcas aliadas se rigen bajo criterios éticos de transparencia, manteniéndose debidamente diferenciadas de la cobertura editorial independiente.
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #d9d2ca', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 9, letterSpacing: '.18em', color: '#887d78' }}>
            ÚLTIMA ACTUALIZACIÓN: {new Date().getFullYear()} · GLAMORA BOLIVIA
          </span>
          <Link href="/contacto" className="read-link">
            CONSULTAS LEGALES Y EDITORIALES ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
