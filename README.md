# GLAMORA 1.1 — Digital Editorial Platform

Proyecto Next.js de la revista digital GLAMORA. Esta versión refina la identidad visual, prepara los logotipos para fondos transparentes e incorpora una primera cobertura editorial de demostración con fotografías aportadas para la historia de La Muela del Diablo.

## Requisitos
- Node.js 20.9 o superior
- npm
- Conexión a Internet para instalar dependencias

## Ejecutar localmente
1. Descomprime el ZIP.
2. Abre CMD dentro de la carpeta `glamora`.
3. Ejecuta `npm install`.
4. Ejecuta `npm run dev`.
5. Abre `http://localhost:3000`.

La portada y la primera historia de muestra funcionan sin configurar Supabase. Los datos de demostración permiten revisar el diseño localmente; para administrar contenido real y publicar desde el panel, configura Supabase.

## Supabase y administración
1. Copia `.env.example` a `.env.local`.
2. Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. En `supabase/schema.sql`, reemplaza `REPLACE_WITH_OWNER_EMAIL` por el correo exacto del administrador y ejecuta el SQL en Supabase.
4. Desactiva los registros públicos e invita únicamente al administrador.
5. Accede a `/admin/login`.

## Marca y enlaces
- Los archivos `public/brand/glamora-mark.png` y `public/brand/legarage-mark.png` son versiones preparadas con fondo transparente a partir de los logotipos proporcionados.
- Configura `NEXT_PUBLIC_LEGARAGE_URL` con el destino real de LE GARAGE 10/14 cuando esté definido.
- Los archivos originales se conservan en `public/brand`.

## Fotografías de muestra
Las cuatro fotografías de la cobertura inicial están en `public/media/`. Se usan en la portada, Glamora Social y el artículo de demostración. Sustituye o amplía estos recursos cuando incorpores nuevas coberturas y confirma los permisos de publicación de cada imagen.

## Rutas principales
- `/` portada editorial
- `/social` Glamora Social y coberturas
- `/articulo/noches-en-la-llajta` artículo de muestra
- `/ediciones` archivo de ediciones
- `/publicidad` publicidad y alianzas
- `/contacto` contacto
- `/admin/login` acceso privado
- `/admin` administración editorial
- `/admin/issues` administración de ediciones
- `/admin/sponsors` administración de patrocinadores

## Estado de esta versión
La portada, navegación, cabecera, pie de página, primera cobertura y galerías de muestra están implementadas. La composición automática de revistas completas a partir de notas seleccionadas, la búsqueda avanzada de personas en galerías, el etiquetado de fotografías, el envío automatizado a redes y la entrega de formularios con protección anti-spam requieren desarrollo e integración adicional antes del lanzamiento público.

## Antes de publicar
- Configurar dominio y HTTPS.
- Configurar Supabase y revisar políticas RLS.
- Definir el destino definitivo de LE GARAGE.
- Configurar correo transaccional para formularios.
- Incorporar aviso de privacidad, cookies y consentimiento de imagen.
- Revisar derechos y autorizaciones de fotografías.
- Sustituir el contenido de muestra por contenido editorial aprobado.


## GLAMORA 1.2 — identidad visual
- Cabecera con navegación territorial: Cochabamba, La Paz, Oruro, Potosí, Santa Cruz y The World.
- Navegación de categorías con mayor legibilidad.
- Logotipo Glamora remasterizado en PNG transparente; lema integrado en el propio archivo.
- Acceso LE GARAGE sin tarjeta ni fondo cuadrado, con su marca borgoña original.
- Lema actualizado a «ESTILO · ELEGANCIA · INSPIRACIÓN».

## GLAMORA 1.5 — Glamora Social
- El panel editorial ahora permite registrar nombre del evento, venue, fecha, fotógrafo, personas destacadas y múltiples fotografías (una URL por línea).
- Las coberturas sociales muestran automáticamente su galería y los nombres destacados en la página Social y en el artículo individual.
- Para instalaciones Supabase existentes, ejecutar nuevamente `supabase/schema.sql`; incluye `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para agregar los campos nuevos sin borrar datos.
- Las fotografías se cargan por URL en esta etapa; la carga directa al almacenamiento de Supabase queda como siguiente mejora.


## GLAMORA 2.0 — Editorial Platform
- La portada principal ya no depende de que una nota sea la primera por fecha: se selecciona desde GLAMORA STUDIO con la acción **DESTACAR**. Solo una nota queda marcada como Cover Story.
- La portada muestra categoría, ciudad y tipo editorial de la nota seleccionada.
- Se puede programar una publicación con fecha y hora; los artículos programados permanecen fuera de la web hasta su hora de publicación.
- Para actualizar una instalación existente, ejecuta de nuevo `supabase/schema.sql` en el SQL Editor de Supabase. El script añade `is_cover` de forma compatible y actualiza la política pública para no exponer publicaciones futuras.
- El sistema de composición de THE ISSUES y la automatización de publicaciones sociales quedan como fases posteriores; esta versión implementa el control editorial de portada y calendario.
