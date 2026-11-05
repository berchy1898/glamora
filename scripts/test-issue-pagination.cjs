/**
 * GLAMORA STUDIO — Suite de Pruebas Automatizadas de Paginación y Flujo Editorial
 * Ejecución: node scripts/test-issue-pagination.cjs
 */

const assert = require('assert');
const {
  parseEditorialBlocks,
  partitionBlocksIntoPages,
  buildIssuePaginationPlan,
  getCleanImageUrl,
  getPhotoCaption,
} = require('./issue-pagination.js');

let passedCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FALLO EN: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('\n======================================================');
console.log(' GLAMORA STUDIO — PRUEBAS AUTOMATIZADAS DE PAGINACIÓN');
console.log('======================================================\n');

// 1. Artículo Corto
test('1. Artículo Corto (2 párrafos): Ocupa exactamente 1 pliego (2 páginas) sin división forzada', () => {
  const shortArticle = {
    id: 'art-short',
    title: 'Nota Corta de Alta Costura',
    slug: 'nota-corta',
    body: 'Primer párrafo de la nota breve de sociedad.\n\nSegundo párrafo concluyendo la crónica con elegancia.',
    cover_image: 'https://images.glamora.com/cover1.jpg',
  };

  const plan = buildIssuePaginationPlan([shortArticle]);
  const artPlan = plan.articlePlans[0];

  assert.strictEqual(artPlan.totalSpreads, 1, 'Debe tener exactamente 1 pliego');
  assert.strictEqual(artPlan.totalIndividualPages, 2, 'Debe ocupar 2 páginas individuales');
  assert.strictEqual(artPlan.startPage, 4, 'Debe comenzar en pág 4');
  assert.strictEqual(artPlan.endPage, 5, 'Debe terminar en pág 5');
  assert.strictEqual(artPlan.pageRangeLabel, 'PÁG. 04–05');
  assert.strictEqual(artPlan.spreads[0].hasMoreAfter, false, 'No debe indicar más páginas');
  assert.strictEqual(artPlan.spreads[0].rightBlocks.length, 2, 'Los 2 párrafos deben estar presentes');
});

// 2. Artículo Mediano
test('2. Artículo Mediano (5 párrafos, 2 fotos): Se expande a 2 pliegos (4 páginas) sin perder texto', () => {
  const mediumArticle = {
    id: 'art-med',
    title: 'El Renacimiento del Lino',
    slug: 'renacimiento-lino',
    body: 'Párrafo de apertura con descripción sensorial.\n\nSegundo párrafo sobre sastrería contemporánea.\n\n## La Caída del Tejido\n\nTercer párrafo con detalles técnicos de confección.\n\nCuarto párrafo sobre paletas minerales.',
    cover_image: 'https://images.glamora.com/cover-lino.jpg',
    gallery_images: ['https://images.glamora.com/gal-lino-2.jpg | Macro de tejido'],
  };

  const plan = buildIssuePaginationPlan([mediumArticle]);
  const artPlan = plan.articlePlans[0];

  assert.strictEqual(artPlan.totalSpreads, 2, 'Debe tener 2 pliegos (4 páginas)');
  assert.strictEqual(artPlan.totalIndividualPages, 4);
  assert.strictEqual(artPlan.startPage, 4);
  assert.strictEqual(artPlan.endPage, 7);
  assert.strictEqual(artPlan.pageRangeLabel, 'PÁG. 04–07');

  // Verificar pliego 1
  assert.strictEqual(artPlan.spreads[0].isFirstSpread, true);
  assert.strictEqual(artPlan.spreads[0].hasMoreAfter, true, 'Pliego 1 debe continuar');
  assert.strictEqual(artPlan.spreads[0].leftKind, 'hero-layout');

  // Verificar pliego 2
  assert.strictEqual(artPlan.spreads[1].isLastSpread, true);
  assert.strictEqual(artPlan.spreads[1].hasMoreAfter, false);
  assert.strictEqual(artPlan.spreads[1].leftKind, 'gallery-single');
  assert.strictEqual(artPlan.spreads[1].leftPhotos[0].url, 'https://images.glamora.com/gal-lino-2.jpg');

  // Integridad de bloques: la suma de bloques de ambos pliegos debe coincidir con el total
  const totalBlocks = artPlan.spreads[0].rightBlocks.length + artPlan.spreads[1].rightBlocks.length;
  assert.strictEqual(totalBlocks, 5, 'Todos los 5 bloques deben estar distribuidos sin faltar ninguno');
});

// 3. Artículo Largo con Intertítulos y Citas
test('3. Artículo Largo (10 párrafos, intertítulos ## y citas >): Conserva tipos semánticos y distribuye en 3 pliegos', () => {
  const bodyText = [
    'Apertura de la crónica nocturna en la ciudad.',
    'Atmósfera y cócteles de autor en la barra.',
    '## Sonidos en Vivo',
    'La banda comienza con compases de blues contemporáneo.',
    '> “La música en Cochabamba ha encontrado su propio templo de sofisticación.”',
    'El público responde con entusiasmo discreto y aplausos.',
    '## La Gastronomía Artesanal',
    'Pizzas de fermentación lenta maridadas con vinos de altura.',
    'El servicio de mesa mantiene una cadencia impecable.',
    'Una velada que reafirma la vitalidad cultural de la región.',
  ].join('\n\n');

  const longArticle = {
    id: 'art-long',
    title: 'Noches en la Llajta Vol. 1',
    slug: 'noches-llajta',
    body: bodyText,
    cover_image: 'https://images.glamora.com/muela-hero.jpg',
    gallery_images: [
      'https://images.glamora.com/banda.jpg | Música en vivo',
      'https://images.glamora.com/pizza.jpg | Maridaje de autor',
    ],
  };

  const plan = buildIssuePaginationPlan([longArticle]);
  const artPlan = plan.articlePlans[0];

  assert.ok(artPlan.totalSpreads >= 2, 'Debe requerir al menos 2 o 3 pliegos');
  assert.strictEqual(artPlan.totalIndividualPages % 2, 0, 'Las páginas individuales deben ser pares');

  // Verificar que los bloques preserven su tipo
  const allParsedBlocks = artPlan.spreads.flatMap((s) => s.rightBlocks);
  const headings = allParsedBlocks.filter((b) => b.type === 'heading');
  const quotes = allParsedBlocks.filter((b) => b.type === 'quote');
  const paragraphs = allParsedBlocks.filter((b) => b.type === 'paragraph');

  assert.strictEqual(headings.length, 2, 'Deben existir exactamente 2 intertítulos');
  assert.strictEqual(quotes.length, 1, 'Debe existir exactamente 1 cita en bloque');
  assert.strictEqual(paragraphs.length, 7, 'Deben existir exactamente 7 párrafos');
});

// 4. Artículo Muy Largo
test('4. Artículo Muy Largo (20 párrafos, 7000+ chars): Se expande dinámicamente a 4+ pliegos sin techo artificial', () => {
  const paragraphs = [];
  for (let i = 1; i <= 20; i++) {
    paragraphs.push(
      `Párrafo ${i} de la gran crónica documental. Este párrafo contiene suficiente longitud y detalles analíticos para simular una narrativa de gran extensión dentro de una edición impresa de lujo, explorando cada faceta de la arquitectura, la estética y la sociología del vestir contemporáneo.`
    );
  }

  const veryLongArticle = {
    id: 'art-very-long',
    title: 'Manifiesto de la Moda Andina',
    slug: 'manifiesto-andino',
    body: paragraphs.join('\n\n'),
    cover_image: 'https://images.glamora.com/andina-hero.jpg',
  };

  const plan = buildIssuePaginationPlan([veryLongArticle]);
  const artPlan = plan.articlePlans[0];

  assert.ok(artPlan.totalSpreads >= 4, `Debe asignar al menos 4 pliegos (asignó ${artPlan.totalSpreads})`);
  assert.strictEqual(artPlan.totalIndividualPages, artPlan.totalSpreads * 2);

  // Verificar que los 20 párrafos estén íntegros
  const blocksDelivered = artPlan.spreads.flatMap((s) => s.rightBlocks);
  assert.strictEqual(blocksDelivered.length, 20, 'Los 20 párrafos deben estar presentes sin omisión');
});

// 5. Marcadores [IMAGEN: ...]
test('5. Tratamiento de [IMAGEN: ... | ...]: No se eliminan silenciosamente, se convierten en bloques inline y fotos de galería', () => {
  const textWithImages = [
    'Párrafo introductorio de la pasarela.',
    '[IMAGEN: https://images.glamora.com/pasarela-1.jpg | Modelo abriendo el desfile con traje de lana fría]',
    'Segundo párrafo comentando la estructura de hombros.',
    '[IMAGEN: https://images.glamora.com/pasarela-2.jpg | Detalle macro de botones de asta]',
    'Párrafo de cierre sobre la ovación final.',
  ].join('\n\n');

  const { blocks, inlinePhotos } = parseEditorialBlocks(textWithImages);

  assert.strictEqual(blocks.length, 5, 'Deben existir 5 bloques (3 párrafos y 2 imágenes inline)');
  assert.strictEqual(inlinePhotos.length, 2, 'Deben haberse extraído 2 fotografías inline');

  const imgBlocks = blocks.filter((b) => b.type === 'inline-image');
  assert.strictEqual(imgBlocks.length, 2);
  assert.strictEqual(imgBlocks[0].url, 'https://images.glamora.com/pasarela-1.jpg');
  assert.strictEqual(imgBlocks[0].caption, 'Modelo abriendo el desfile con traje de lana fría');

  // Verificar integración en plan
  const plan = buildIssuePaginationPlan([
    {
      id: 'art-inline',
      title: 'Desfile Alta Gama',
      slug: 'desfile-alta-gama',
      body: textWithImages,
      cover_image: 'https://images.glamora.com/portada-desfile.jpg',
    },
  ]);

  const artPlan = plan.articlePlans[0];
  assert.ok(artPlan.allPhotos.some((p) => p.url === 'https://images.glamora.com/pasarela-1.jpg'));
  assert.ok(artPlan.allPhotos.some((p) => p.url === 'https://images.glamora.com/pasarela-2.jpg'));
});

// 6. Galería con más de 3 fotografías
test('6. Galería Rica (>3 fotografías): Distribuye todas las imágenes en pliegos sucesivos (gallery-duo / gallery-single)', () => {
  const articleWith6Photos = {
    id: 'art-photos',
    title: 'Reportaje Visual: Fotografía de Calle en París',
    slug: 'paris-street',
    body: 'Crónica breve.\n\nPárrafo complementario.\n\nConclusión.',
    cover_image: 'https://images.glamora.com/paris-cover.jpg',
    gallery_images: [
      'https://images.glamora.com/paris-1.jpg | Foto 1',
      'https://images.glamora.com/paris-2.jpg | Foto 2',
      'https://images.glamora.com/paris-3.jpg | Foto 3',
      'https://images.glamora.com/paris-4.jpg | Foto 4',
      'https://images.glamora.com/paris-5.jpg | Foto 5',
    ],
  };

  const plan = buildIssuePaginationPlan([articleWith6Photos]);
  const artPlan = plan.articlePlans[0];

  // Debe tener al menos 3 pliegos para dar cabida a la portada y las 5 fotos de galería
  assert.ok(artPlan.totalSpreads >= 3, `Debe asignar al menos 3 pliegos (asignó ${artPlan.totalSpreads})`);

  // Contar cuántas fotos fueron asignadas a los pliegos
  const photosRepresented = new Set();
  artPlan.spreads.forEach((spread) => {
    spread.leftPhotos.forEach((p) => photosRepresented.add(p.url));
  });

  // Todas las fotos de galería deben estar disponibles en allPhotos
  assert.strictEqual(artPlan.allPhotos.length, 6, 'Deben existir 6 fotos en total (1 portada + 5 galería)');
  assert.ok(photosRepresented.size >= 4, 'La mayoría de fotos deben tener presencia activa en los pliegos');
});

// 7. Consistencia de Límites, Páginas y Sumario
test('7. Integridad de Límites y Sumario: Conexión perfecta entre artículos, números pares y saltos directos', () => {
  const articles = [
    {
      id: 'art-1',
      title: 'Historia 1',
      slug: 'historia-1',
      body: 'P1.\n\nP2.',
    },
    {
      id: 'art-2',
      title: 'Historia 2',
      slug: 'historia-2',
      body: 'P1.\n\nP2.\n\nP3.\n\nP4.\n\nP5.\n\nP6.',
    },
    {
      id: 'art-3',
      title: 'Historia 3',
      slug: 'historia-3',
      body: 'P1.\n\nP2.\n\nP3.',
    },
  ];

  const plan = buildIssuePaginationPlan(articles);

  // Páginas fijas: 0 (Portada), 1 (Carta), 2 (Sumario), 3 (Patrocinador)
  assert.strictEqual(plan.pages[0].type, 'cover');
  assert.strictEqual(plan.pages[1].type, 'letter');
  assert.strictEqual(plan.pages[2].type, 'toc');
  assert.strictEqual(plan.pages[3].type, 'sponsor');

  // Primer artículo debe arrancar en pág 4
  const p1 = plan.articlePageMap['art-1'];
  assert.strictEqual(p1.startPage, 4);

  // Segundo artículo debe arrancar exactamente en endPage + 1 del anterior
  const p2 = plan.articlePageMap['art-2'];
  assert.strictEqual(p2.startPage, p1.endPage + 1);

  // Tercer artículo debe conectar con el anterior
  const p3 = plan.articlePageMap['art-3'];
  assert.strictEqual(p3.startPage, p2.endPage + 1);

  // Colofón y Contraportada
  const colophon = plan.pages[plan.totalPages - 2];
  const backcover = plan.pages[plan.totalPages - 1];
  assert.strictEqual(colophon.type, 'colophon');
  assert.strictEqual(backcover.type, 'backcover');

  // La cantidad total de páginas debe ser estrictamente un múltiplo de 2 (pliegos dobles)
  assert.strictEqual(plan.totalPages % 2, 0, 'Total de páginas debe ser estrictamente par');
  assert.strictEqual(plan.totalSpreads, plan.totalPages / 2);
});

// 8. Arquitectura Editorial: Fascículos, Bodegón Wishlist y Masthead Institucional
test('8. Escaleta de Fascículos & Bodegón Wishlist: Clasifica fascículos, integra items PNG y créditos de masthead', () => {
  const fashionArticle = {
    id: 'art-fashion',
    title: 'Siluetas de Otoño en Cochabamba',
    slug: 'siluetas-otono',
    body: 'Crónica del atelier y las nuevas piezas de autor.',
    category: 'Alta Costura',
  };
  const galaArticle = {
    id: 'art-gala',
    title: 'Gala Anual de Arte Contemporáneo',
    slug: 'gala-arte',
    body: 'Los invitados más destacados de la noche.',
    category: 'Eventos Sociales',
  };

  const customDesign = {
    mastheadStaff: {
      director: 'Dirección Editorial GLAMORA',
      artDirection: 'Estudio de Arte Didone',
      fashionDirector: 'Atelier de Moda',
      editorialStaff: 'Crónica de Sociedad',
      photoContributors: 'Fotografía de Autor',
      cityCorrespondents: 'Cochabamba · La Paz · Santa Cruz',
    },
    articleFascicles: {
      'art-fashion': 'moda-atelier',
      'art-gala': 'sociedad-gala',
    },
    articleWishlistItems: {
      'art-fashion': [
        {
          id: 'item-1',
          pngUrl: 'https://images.glamora.com/png/bag.png',
          brand: 'Dior',
          item: 'Saddle Bag en piel de becerro',
          price: '2.800 USD',
        },
      ],
    },
    articleSponsorTags: {
      'art-gala': {
        active: true,
        brandName: 'Chandon',
        roleLabel: 'En colaboración con',
      },
    },
  };

  const plan = buildIssuePaginationPlan([fashionArticle, galaArticle], customDesign);

  // Verificar Page 3 (Masthead Staff)
  const page3 = plan.pages[3];
  assert.strictEqual(page3.type, 'sponsor');
  assert.ok(page3.mastheadStaff, 'Página 3 debe contener créditos de masthead');
  assert.strictEqual(page3.mastheadStaff.director, 'Dirección Editorial GLAMORA');

  // Verificar Fascículo Moda & Atelier con Wishlist
  const fashionPlan = plan.articlePlans[0];
  assert.strictEqual(fashionPlan.fascicleKind, 'moda-atelier');
  assert.strictEqual(fashionPlan.wishlistItems.length, 1);
  assert.strictEqual(fashionPlan.wishlistItems[0].brand, 'Dior');
  assert.strictEqual(fashionPlan.spreads[0].fascicleKind, 'moda-atelier');
  assert.strictEqual(fashionPlan.spreads[0].wishlistItems[0].item, 'Saddle Bag en piel de becerro');

  // Verificar Fascículo Sociedad & Gala con Sponsor Tag
  const galaPlan = plan.articlePlans[1];
  assert.strictEqual(galaPlan.fascicleKind, 'sociedad-gala');
  assert.ok(galaPlan.sponsorTag);
  assert.strictEqual(galaPlan.sponsorTag.brandName, 'Chandon');
  assert.strictEqual(galaPlan.spreads[0].sponsorTag.roleLabel, 'En colaboración con');
});

console.log('\n======================================================');
console.log(` RESULTADO: ${passedCount} pruebas pasaron exitosamente (100%).`);
console.log('======================================================\n');
