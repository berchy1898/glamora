const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  HeadingLevel,
  AlignmentType,
  ShadingType,
} = require('docx');

async function buildDocx() {
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'DED7CF' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DED7CF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'EFEBE6' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  const headerShading = {
    fill: '18141C',
    type: ShadingType.CLEAR,
    color: 'auto',
  };

  const altRowShading = {
    fill: 'FBF8F4',
    type: ShadingType.CLEAR,
    color: 'auto',
  };

  function createHeaderCell(text, widthPercent) {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: headerShading,
      margins: { top: 140, bottom: 140, left: 160, right: 160 },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text.toUpperCase(),
              bold: true,
              color: 'E7C7B4',
              size: 18, // 9pt
              font: 'Calibri',
            }),
          ],
        }),
      ],
    });
  }

  function createDataCell(text, widthPercent, isAlt = false, bold = false) {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: isAlt ? altRowShading : undefined,
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: text,
              bold: bold,
              color: '2B2420',
              size: 20, // 10pt
              font: 'Calibri',
            }),
          ],
        }),
      ],
    });
  }

  // TABLA 1: FOTOS WEB
  const webPhotoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [
      new TableRow({
        children: [
          createHeaderCell('Elemento', 25),
          createHeaderCell('Aspecto', 18),
          createHeaderCell('Dimensiones', 25),
          createHeaderCell('Notas Editoriales', 32),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Foto de Portada', 25, false, true),
          createDataCell('3:4 o 16:9', 18, false),
          createDataCell('1600 × 2133 px / 1920 × 1080 px', 25, false),
          createDataCell('Se ajusta con el recortador interactivo de Glamora.', 32, false),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Galería / Photo Diary', 25, true, true),
          createDataCell('3:4 (Vertical)', 18, true),
          createDataCell('1200 × 1600 px', 25, true),
          createDataCell('Retratos de pie o medio cuerpo. Se comprime solo a ~140 KB.', 32, true),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Portada Revista (Issue)', 25, false, true),
          createDataCell('3:4 (Estricto)', 18, false),
          createDataCell('1800 × 2400 px', 25, false),
          createDataCell('Dejar tercio superior libre para el título GLAMORA.', 32, false),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Pliego Cinema Bleed', 25, true, true),
          createDataCell('16:9 (Panorámico)', 18, true),
          createDataCell('2000 × 1125 px', 25, true),
          createDataCell('Fotografía nocturna o arquitectura a pliego oscuro.', 32, true),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Avatares / Autores', 25, false, true),
          createDataCell('1:1 (Cuadrado)', 18, false),
          createDataCell('800 × 800 px', 25, false),
          createDataCell('Rostro centrado con margen para recorte circular.', 32, false),
        ],
      }),
    ],
  });

  // TABLA 2: REDES SOCIALES
  const socialPhotoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [
      new TableRow({
        children: [
          createHeaderCell('Plataforma', 26),
          createHeaderCell('Formato', 18),
          createHeaderCell('Dimensiones', 24),
          createHeaderCell('Uso en GLAMORA', 32),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('WhatsApp Preview', 26, false, true),
          createDataCell('Horizontal 1.91:1', 18, false),
          createDataCell('1200 × 630 px', 24, false),
          createDataCell('Tarjeta de previsualización al enviar enlaces.', 32, false),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Instagram Feed (Retrato)', 26, true, true),
          createDataCell('Vertical 4:5', 18, true),
          createDataCell('1080 × 1350 px', 24, true),
          createDataCell('Formato #1 recomendado para mayor impacto en feed.', 32, true),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Stories / Reels / TikTok', 26, false, true),
          createDataCell('Vertical 9:16', 18, false),
          createDataCell('1080 × 1920 px', 24, false),
          createDataCell('Dejar 250 px libres arriba y abajo (zona segura).', 32, false),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Instagram / Facebook (1:1)', 26, true, true),
          createDataCell('Cuadrado 1:1', 18, true),
          createDataCell('1080 × 1080 px', 24, true),
          createDataCell('Citas célebres, mosaicos o placas informativas.', 32, true),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Facebook Post / Link', 26, false, true),
          createDataCell('Horizontal 1.91:1', 18, false),
          createDataCell('1200 × 630 px', 24, false),
          createDataCell('Imagen destacada con texto y enlace a la web.', 32, false),
        ],
      }),
      new TableRow({
        children: [
          createDataCell('Foto de Perfil (Todas)', 26, true, true),
          createDataCell('Circular 1:1', 18, true),
          createDataCell('1000 × 1000 px', 24, true),
          createDataCell('Monograma G dorado sobre fondo obsidiana oscuro.', 32, true),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // CABECERA MARCA
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'G L A M O R A',
                bold: true,
                size: 38, // 19pt
                color: '711C32', // Wine
                font: 'Georgia',
                spacing: 140,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [
              new TextRun({
                text: 'ESTILO · CULTURA · SOCIEDAD',
                size: 18, // 9pt
                color: '8F725F',
                font: 'Calibri',
                spacing: 120,
              }),
            ],
          }),

          // TÍTULO DEL DOCUMENTO
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'MANUAL EDITORIAL, GUÍA DE FORMATOS FOTOGRÁFICOS Y OPERACIONES DE GLAMORA STUDIO',
                bold: true,
                size: 28, // 14pt
                color: '18141C',
                font: 'Georgia',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 440 },
            children: [
              new TextRun({
                text: 'Documento Maestro de Operaciones · Ayuda Memoria para Redacción, Redes Sociales y Despliegue Web',
                italics: true,
                size: 20, // 10pt
                color: '5C524A',
                font: 'Calibri',
              }),
            ],
          }),

          // SECCIÓN 1: FORMATOS
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 140 },
            children: [
              new TextRun({
                text: '1. GUÍA DE FORMATOS Y DIMENSIONES FOTOGRÁFICAS',
                bold: true,
                size: 24,
                color: '711C32',
                font: 'Georgia',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: 'A. Fotografías para la Plataforma Web de GLAMORA (revistaglamora.com):',
                bold: true,
                size: 20,
                color: '2B2420',
                font: 'Calibri',
              }),
            ],
          }),
          webPhotoTable,

          new Paragraph({
            spacing: { before: 300, after: 140 },
            children: [
              new TextRun({
                text: 'B. Fotografías y Artes para Redes Sociales (Instagram, WhatsApp, TikTok, Facebook):',
                bold: true,
                size: 20,
                color: '2B2420',
                font: 'Calibri',
              }),
            ],
          }),
          socialPhotoTable,

          new Paragraph({
            spacing: { before: 180, after: 260 },
            children: [
              new TextRun({
                text: 'Nota de Zona Segura (Stories / Reels 9:16): ',
                bold: true,
                size: 19,
                color: '711C32',
                font: 'Calibri',
              }),
              new TextRun({
                text: 'Deja libres los 250 px superiores y los 250 px inferiores para evitar que los nombres de usuario y botones de Instagram tapen elementos clave o logotipos.',
                size: 19,
                color: '4A413C',
                font: 'Calibri',
              }),
            ],
          }),

          // SECCIÓN 2: DIRECTRICES
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 320, after: 140 },
            children: [
              new TextRun({
                text: '2. ANATOMÍA Y DIRECTRICES DE UN ARTÍCULO EN GLAMORA',
                bold: true,
                size: 24,
                color: '711C32',
                font: 'Georgia',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'Cada artículo publicado en el panel de administración consta de los siguientes componentes estándar:',
                size: 20,
                color: '2B2420',
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Título Editorial: ', bold: true, color: '18141C' }),
              new TextRun({ text: 'Periodístico, sofisticado y cosmopolita. Evitar sensacionalismo o mayúsculas sostenidas.' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Categoría & Ciudad: ', bold: true, color: '18141C' }),
              new TextRun({ text: 'GASTRONOMÍA, MODA, SOCIEDAD, CULTURA, NOCHES, NEGOCIOS o ARTE, asociado a Cochabamba, La Paz, Santa Cruz u otra ciudad.' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Extracto / Lead: ', bold: true, color: '18141C' }),
              new TextRun({ text: 'Un párrafo conciso de 140 a 180 caracteres que capta la atmósfera de la historia.' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Cuerpo de la Crónica: ', bold: true, color: '18141C' }),
              new TextRun({ text: 'Subtítulos breves en MAYÚSCULAS para crear ritmo. La primera letra se convierte en Capitular (Drop Cap) automáticamente. Las frases destacadas con > se convierten en citas elegantes.' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Galería y People Tags: ', bold: true, color: '18141C' }),
              new TextRun({ text: 'Nombres separados por comas. El sistema los ubica bajo cada foto en letra pequeña refinada (12px), sin tapar nunca rostros.' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 240 },
            children: [
              new TextRun({ text: 'Video (Opcional): ', bold: true, color: '18141C' }),
              new TextRun({ text: 'Enlace de YouTube, Vimeo, Instagram Reel o archivo MP4 local.' }),
            ],
          }),

          // SECCIÓN 3: PROMPT GEMINI
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 320, after: 140 },
            children: [
              new TextRun({
                text: '3. PROMPT MAESTRO PARA GENERAR ARTÍCULOS CON GOOGLE GEMINI',
                bold: true,
                size: 24,
                color: '711C32',
                font: 'Georgia',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: 'Copia el siguiente texto exacto en Gemini y completa únicamente los corchetes [DATOS DEL EVENTO]:',
                italics: true,
                size: 20,
                color: '5C524A',
                font: 'Calibri',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: '711C32' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: '711C32' },
              left: { style: BorderStyle.SINGLE, size: 4, color: '711C32' },
              right: { style: BorderStyle.SINGLE, size: 4, color: '711C32' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FBF9F6', type: ShadingType.CLEAR, color: 'auto' },
                    margins: { top: 160, bottom: 160, left: 180, right: 180 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Actúa como el Director Creativo y Redactor Jefe de GLAMORA, la revista digital de alta sociedad, gastronomía, cultura y estilo de vida de Cochabamba y Bolivia (con estándares estéticos de Vogue, Vanity Fair y Condé Nast Traveler).\n\nGenera una publicación completa y lista para pegar en el panel de administración de GLAMORA con los siguientes datos:\n\n[DATOS DEL EVENTO]\n- Nombre del lugar o evento: [Ej: La Muela del Diablo / Desfile de Moda / Gala Benéfica]\n- Ciudad: [Ej: Cochabamba / La Paz / Santa Cruz]\n- Categoría: [GASTRONOMÍA / MODA / SOCIEDAD / CULTURA / NOCHES / NEGOCIOS / ARTE]\n- Qué sucedió / Puntos clave: [Breve descripción de platos probados, ambiente, música, anfitriones, momentos destacados]\n- Personas destacadas presentes: [Nombres y apellidos separados por comas]\n- Nombre del autor de la crónica: [Ej: Redacción GLAMORA / Tu Nombre]\n\n---\nPOR FAVOR, DEVUÉLVEME EL CONTENIDO EN EL SIGUIENTE FORMATO EXACTO:\n\n### 1. TÍTULO EDITORIAL\n(Un titular sofisticado, cosmopolita y atractivo de una sola línea)\n\n### 2. CATEGORÍA & CIUDAD\n(La categoría en mayúsculas y la ciudad correspondiente)\n\n### 3. EXTRACTO / LEAD\n(Un párrafo breve de 2 líneas, entre 140 y 180 caracteres, que condense el tono exclusivo y la atmósfera)\n\n### 4. CUERPO DE LA CRÓNICA\n(Redacta una crónica de 4 a 5 secciones. Usa subtítulos breves en MAYÚSCULAS sin numerales. Incluye al menos una cita textual en formato > "Cita aquí". Tono: refinado, sensorial, festivo, nunca acartonado ni publicitario vulgar)\n\n### 5. PERSONAS DESTACADAS (PEOPLE TAGS)\n(Lista limpia de nombres separados por comas lista para copiar en el campo de personas)\n\n### 6. TEXTO SUGERIDO PARA REDES SOCIALES\n- Copy para Instagram Feed / Facebook (con emojis elegantes y saltos de línea limpios).\n- Frase corta para compartir por WhatsApp.',
                            size: 19,
                            font: 'Consolas',
                            color: '231E1B',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // SECCIÓN 4: GLAMORA STUDIO
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 340, after: 140 },
            children: [
              new TextRun({
                text: '4. MANUAL DE OPERACIONES DE GLAMORA STUDIO',
                bold: true,
                size: 24,
                color: '711C32',
                font: 'Georgia',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Módulo de Artículos (/admin): ',
                bold: true,
                color: '711C32',
              }),
              new TextRun({
                text: 'Permite crear historias al instante. Incluye recortador interactivo con zoom para la portada, subida por lotes de hasta 24 fotos para el Photo Diary y ordenamiento con flechas ↑ / ↓.',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Módulo de Revista Digital (/admin/issues): ',
                bold: true,
                color: '711C32',
              }),
              new TextRun({
                text: 'Ensambla ediciones periódicas ("The Digital Issue"). En computadoras abre pliego doble y en celulares abre exactamente una página individual por cada deslizamiento.',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Módulo de Patrocinadores (/admin/sponsors): ',
                bold: true,
                color: '711C32',
              }),
              new TextRun({
                text: 'Gestión de marcas aliadas y páginas publicitarias exclusivas dentro de la revista digital.',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Módulo de Mantenimiento Pre-Lanzamiento (/admin -> Configuración): ',
                bold: true,
                color: '711C32',
              }),
              new TextRun({
                text: 'Incluye botón "DESPUBLICAR DEMOS ✕" y "RESETEAR MÉTRICAS" para iniciar el lanzamiento oficial con la base de datos limpia y contadores en cero.',
              }),
            ],
          }),

          // PIE FINAL
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: 'GLAMORA · COCHABAMBA · BOLIVIA',
                bold: true,
                size: 18,
                color: '8F725F',
                font: 'Calibri',
                spacing: 120,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  // Guardar en 3 ubicaciones clave:
  // 1. Descargas de Windows del usuario (C:\Users\USER\Downloads)
  const userDownloadsPath = path.join('C:', 'Users', 'USER', 'Downloads', 'MANUAL_EDITORIAL_GLAMORA.docx');
  fs.writeFileSync(userDownloadsPath, buffer);
  console.log('Guardado en:', userDownloadsPath);

  // 2. Carpeta pública del proyecto web para descarga directa con clic (public/)
  const publicWebPath = path.join(process.cwd(), 'public', 'MANUAL_EDITORIAL_GLAMORA.docx');
  fs.writeFileSync(publicWebPath, buffer);
  console.log('Guardado en:', publicWebPath);

  // 3. Raíz del proyecto
  const projectRootPath = path.join(process.cwd(), 'MANUAL_EDITORIAL_GLAMORA.docx');
  fs.writeFileSync(projectRootPath, buffer);
  console.log('Guardado en:', projectRootPath);
}

buildDocx()
  .then(() => console.log('DOCX generado exitosamente.'))
  .catch((err) => {
    console.error('Error generando DOCX:', err);
    process.exit(1);
  });
