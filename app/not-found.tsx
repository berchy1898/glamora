import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container people-page not-found-page">
      <header className="people-intro">
        <div className="eyebrow">GLAMORA · ARCHIVO EDITORIAL · 404</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>NO ENCONTRADO</h1>
          <p>
            La historia, edición o sección que buscas no se encuentra disponible o ha cambiado de dirección dentro de nuestro archivo.
          </p>
        </div>
        <div className="people-index" aria-label="Rutas sugeridas de GLAMORA">
          PORTADA <i>·</i> THE ISSUES <i>·</i> SOCIALES <i>·</i> PEOPLE
        </div>
      </header>

      <section className="not-found-panel" aria-labelledby="not-found-heading">
        <span className="section-overline">CONTINUAR EN GLAMORA</span>
        <h2 id="not-found-heading">
          Explora nuestras historias recientes y ediciones digitales.
        </h2>
        <p>
          Te invitamos a regresar a la portada principal o recorrer las secciones de moda, cultura, sociedad y estilo de vida de GLAMORA.
        </p>

        <div className="not-found-actions">
          <Link href="/" className="button-primary">
            VOLVER A LA PORTADA ↗
          </Link>
          <Link href="/ediciones" className="article-share-btn">
            VER THE ISSUES ↗
          </Link>
          <Link href="/social" className="article-share-btn">
            EXPLORAR SOCIALES ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
