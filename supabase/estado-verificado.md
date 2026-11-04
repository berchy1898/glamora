# GLAMORA — inventario verificado de Supabase

Este documento registra evidencia de consultas **de solo lectura** realizadas a la instancia conectada el 2 de noviembre de 2026. No es una migración ni una instrucción para ejecutar SQL. Los resultados obtenidos con el cliente anónimo solo describen lo que ese rol pudo leer; una respuesta vacía no demuestra que una tabla esté vacía ni permite deducir sus políticas RLS.

## Evidencia de tablas y columnas

| Recurso | Evidencia verificada | Alcance y límites |
|---|---|---|
| `public.articles` | La API de datos respondió correctamente al seleccionar `id`, `title`, `slug`, `excerpt`, `body`, `category`, `city`, `cover_image`, `author`, `is_published`, `is_social`, `is_cover`, `event_name`, `venue`, `event_date`, `gallery_images`, `people_tags`, `published_at`, `editorial_status` y `created_at`. Se recibieron dos filas visibles para el rol anónimo; ambas estaban publicadas y tenían fecha de publicación vigente. | La consulta confirma que esos nombres de columna son aceptados por la API. No constituye inventario de todas las columnas, restricciones, índices o políticas de la tabla. |
| `public.coverage_assignments` | La API respondió correctamente al seleccionar `id`, `title`, `event_date`, `event_time`, `city`, `venue`, `status`, `category`, `lead_name`, `photographer`, `notes` y `linked_article_slug`. | La consulta devolvió cero filas visibles para el rol anónimo. No se puede concluir que no existan filas ni que el usuario administrador vea cero. No se verificó una clave foránea desde `linked_article_slug`. |
| `public.magazine_issues` | La tabla respondió a una consulta de lectura y se observó una fila visible para el rol anónimo. | No se conserva evidencia verificable aquí de las columnas seleccionadas, restricciones o relaciones reales. |
| `public.sponsors` | La tabla respondió a una consulta de lectura. | No se observaron filas visibles para el rol anónimo. No se conserva evidencia verificable aquí de su inventario de columnas ni de si RLS explica el resultado. |
| `public.contact_leads` | Sin comprobación directa documentada en las consultas de esta verificación. | Existencia y columnas reales quedan pendientes. Su presencia en `schema.sql` no prueba que exista en la instancia. |

## Relaciones

- El código de GLAMORA empareja `coverage_assignments.linked_article_slug` con `articles.slug`. Esto verifica una relación **de aplicación**, no una restricción de clave foránea en Postgres.
- No hay evidencia suficiente en las consultas registradas para afirmar claves foráneas de `magazine_issues`, `sponsors` o `contact_leads`, ni para documentar índices o restricciones reales.

## Storage

| Recurso | Evidencia verificada | Alcance y límites |
|---|---|---|
| `covers` | Doce referencias de imagen usadas por los dos artículos visibles respondieron HTTP 200 al comprobar su acceso público. Las rutas indicaban el espacio `covers`. | Se comprobó la lectura de esos objetos, no el inventario administrativo del bucket, sus límites, MIME permitidos ni sus políticas completas. |
| `glamora-media` | No apareció en la respuesta anónima de listado de buckets. La consulta anónima de metadatos individuales no permitió confirmar su configuración. | **Existencia y políticas no verificadas.** La ausencia en un listado anónimo no demuestra que el bucket no exista. |

No se verificaron directamente las políticas RLS de tablas ni las políticas de `storage.objects`. No deben deducirse a partir de una respuesta vacía o de la disponibilidad pública de una imagen.

## Comparación con `schema.sql`

`schema.sql` es un guion ejecutable que describe una instalación/configuración prevista. No es una exportación de catálogo de la instancia actual. Frente a la evidencia disponible:

- El archivo documenta tablas y políticas para `articles`, `sponsors`, `magazine_issues` y `contact_leads`, además del bucket `glamora-media`; las consultas resumidas aquí no verificaron todas esas columnas ni esas políticas.
- El archivo no define `coverage_assignments`, aunque la API de datos sí aceptó la consulta de sus doce columnas enumeradas arriba.
- La definición inicial de `articles` no incluye `editorial_status`; las consultas a la instancia sí aceptaron esa columna.
- `is_cover` aparece en una sección posterior del archivo y también fue aceptada por la API.
- El código de carga de fotografía usa `covers`; los objetos referenciados por artículos fueron legibles, mientras que la configuración de `glamora-media` no pudo confirmarse.

Por estos límites, este inventario **no reemplaza ni certifica** `schema.sql` como representación completa de la instancia. Antes de usar ese guion como procedimiento de instalación o recuperación, se debe obtener un inventario con acceso autorizado al catálogo y a la configuración de Storage, en modo de solo lectura.

## Riesgos operativos observados en el código y corrección mínima propuesta

### Agenda: guardado de cobertura y creación/vínculo de borrador

El flujo guarda la cobertura y después puede crear el artículo borrador y guardar `linked_article_slug`. Un fallo intermedio puede dejar una cobertura sin vínculo o un borrador sin vínculo. El código usa un slug determinista y comprueba si el artículo ya existe, lo que ayuda a que un reintento no duplique el borrador.

**Propuesta, no implementada:** conservar ese slug idempotente y hacer explícito el reintento de reconciliación: al reintentar, buscar el borrador por slug, completar el vínculo que falte y mostrar qué paso quedó pendiente. No borrar automáticamente el artículo o la cobertura como compensación, porque esa acción podría eliminar trabajo editorial válido. Probar fallos entre cada escritura antes de cambiar el flujo.

### Selección de portada: dos escrituras sucesivas

El código primero desmarca la portada actual y después marca la seleccionada. Si la segunda escritura falla, la revista puede quedar temporalmente sin portada. Si la primera falla, debe impedirse la segunda.

**Propuesta, no implementada:** como mejora mínima en cliente, comprobar y reportar cada resultado, no continuar si falla el primer paso y, si falla el segundo, intentar restaurar el artículo previamente marcado, informando claramente si la restauración también falla. Esto reduce el riesgo, pero no garantiza atomicidad. La solución estrictamente atómica requiere una operación transaccional del lado de Supabase; no se propone ni ejecuta en esta etapa.

## Comprobaciones pendientes

Para cerrar un inventario completo hacen falta consultas de solo lectura con acceso autorizado a catálogos y configuración: columnas completas, restricciones, claves foráneas, índices, estado y políticas RLS, existencia/configuración administrativa de ambos buckets y políticas de Storage. Este documento no afirma resultados para esos aspectos.
