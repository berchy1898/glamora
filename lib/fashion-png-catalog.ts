export type AtelierCatalogCategory =
  | 'joyeria'
  | 'bolsos'
  | 'calzado'
  | 'sastreria'
  | 'accesorios';

export type AtelierCatalogItem = {
  id: string;
  category: AtelierCatalogCategory;
  categoryLabel: string;
  brand: string;
  item: string;
  price: string;
  pngUrl: string;
  description: string;
};

/**
 * Catálogo Curado de Prendas y Accesorios PNG con Fondo Transparente
 * para Maquetación de Bodegones de Moda y Wishlists en GLAMORA Studio.
 */
export const ATELIER_PNG_CATALOG: AtelierCatalogItem[] = [
  // 1. Bolsos & Marroquinería
  {
    id: 'bag-kelly-leather',
    category: 'bolsos',
    categoryLabel: 'Bolsos & Marroquinería',
    brand: 'GLAMORA ATELIER',
    item: 'Tote Slouchy en Cuero Graneado',
    price: '1.850 USD',
    pngUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    description: 'Bolso amplio de piel suave con caída natural y acabados metálicos en paladio.',
  },
  {
    id: 'bag-clutch-satin',
    category: 'bolsos',
    categoryLabel: 'Bolsos & Marroquinería',
    brand: 'SAINT LAURENT',
    item: 'Clutch Minaudière en Raso de Seda',
    price: '2.100 USD',
    pngUrl: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=600&q=80',
    description: 'Estructura rígida de noche con cierre joya bañado en oro satinado.',
  },
  {
    id: 'bag-shoulder-camel',
    category: 'bolsos',
    categoryLabel: 'Bolsos & Marroquinería',
    brand: 'LILIANA CASTELLANOS',
    item: 'Bandolera de Gamuza Tostada & Apliques',
    price: '890 USD',
    pngUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
    description: 'Diseño artesanal boliviano con textura de gamuza suave y pespuntes de talabartería.',
  },

  // 2. Joyería & Relojería
  {
    id: 'jewelry-gold-cuff',
    category: 'joyeria',
    categoryLabel: 'Joyería & Relojería',
    brand: 'CARTIER',
    item: 'Brazalete Rígido en Oro Amarillo 18k',
    price: '6.450 USD',
    pngUrl: 'https://images.unsplash.com/photo-1611591475853-bc26f588c871?auto=format&fit=crop&w=600&q=80',
    description: 'Silueta escultórica pulida a espejo con bisagra invisible de alta manufactura.',
  },
  {
    id: 'jewelry-pearl-drop',
    category: 'joyeria',
    categoryLabel: 'Joyería & Relojería',
    brand: 'MIKIMOTO',
    item: 'Pendientes de Perla Barroca & Diamantes',
    price: '3.200 USD',
    pngUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    description: 'Perlas de agua dulce con montura ligera de platino e incrustaciones pavé.',
  },
  {
    id: 'jewelry-chronograph',
    category: 'joyeria',
    categoryLabel: 'Joyería & Relojería',
    brand: 'VACHERON CONSTANTIN',
    item: 'Cronógrafo Automático Esfera Marfil',
    price: '24.500 USD',
    pngUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    description: 'Caja de 40mm en oro rosa con correa de aligátor marrón chocolate.',
  },

  // 3. Calzado de Alta Gama
  {
    id: 'shoes-stiletto-black',
    category: 'calzado',
    categoryLabel: 'Calzado & Zapatos',
    brand: 'CHRISTIAN LOUBOUTIN',
    item: 'Stiletto So Kate 100 en Charol Noir',
    price: '795 USD',
    pngUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80',
    description: 'Línea de corte afilado con suela escarlata emblemática y tacón de aguja.',
  },
  {
    id: 'shoes-loafer-suede',
    category: 'calzado',
    categoryLabel: 'Calzado & Zapatos',
    brand: 'LORO PIANA',
    item: 'Mocasín Summer Charms en Ante Gris',
    price: '980 USD',
    pngUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80',
    description: 'Suela de goma ultraligera con herrajes micro-dije grabados con láser.',
  },
  {
    id: 'shoes-strappy-gold',
    category: 'calzado',
    categoryLabel: 'Calzado & Zapatos',
    brand: 'AQUAZZURA',
    item: 'Sandalia de Tiras Metalizadas Champagne',
    price: '850 USD',
    pngUrl: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?auto=format&fit=crop&w=600&q=80',
    description: 'Tiras entrelazadas al tobillo en piel laminada color oro pálido.',
  },

  // 4. Sastrería & Alta Costura
  {
    id: 'tailoring-alpaca-coat',
    category: 'sastreria',
    categoryLabel: 'Alta Costura & Tejidos',
    brand: 'LILIANA CASTELLANOS',
    item: 'Abrigo Envolvente en Alpaca Suri Pura',
    price: '1.450 USD',
    pngUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    description: 'Fibra natural andina con caída fluida, solapa de cascada y cinturón a juego.',
  },
  {
    id: 'tailoring-tuxedo-jacket',
    category: 'sastreria',
    categoryLabel: 'Alta Costura & Tejidos',
    brand: 'DIOR MEN',
    item: 'Smoking Bar Jacket en Lana Crepé',
    price: '3.600 USD',
    pngUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
    description: 'Silueta arquitectónica estructurada con solapas de pico en satén de seda.',
  },

  // 5. Accesorios & Complementos
  {
    id: 'accessory-sunglasses-tortoise',
    category: 'accesorios',
    categoryLabel: 'Accesorios & Belleza',
    brand: 'CELINE',
    item: 'Gafas Triomphe en Acetato de Carey',
    price: '520 USD',
    pngUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
    description: 'Montura ovalada vintage con lentes tintadas en verde bosque y logo dorado.',
  },
  {
    id: 'accessory-silk-scarf',
    category: 'accesorios',
    categoryLabel: 'Accesorios & Belleza',
    brand: 'HERMÈS',
    item: 'Carré 90 de Seda en Estampado Ecuestre',
    price: '540 USD',
    pngUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80',
    description: 'Sarga de seda 100% con orillo enrollado a mano en tonos burdeos y champagne.',
  },
  {
    id: 'accessory-perfume-niche',
    category: 'accesorios',
    categoryLabel: 'Accesorios & Belleza',
    brand: 'BYREDO',
    item: 'Eau de Parfum Gypsy Water 100ml',
    price: '290 USD',
    pngUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
    description: 'Notas de bayas de enebro, aguja de pino, incienso y ámbar cálido.',
  },
];
