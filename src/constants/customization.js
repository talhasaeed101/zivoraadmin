export const FONT_OPTIONS = [
  { id: 'elegant-script', label: 'Elegant Script', previewClass: 'cm-font-elegant-script' },
  { id: 'luxury-serif', label: 'Luxury Serif', previewClass: 'cm-font-luxury-serif' },
  { id: 'modern-sans', label: 'Modern Sans', previewClass: 'cm-font-modern-sans' },
  { id: 'classic-roman', label: 'Classic Roman', previewClass: 'cm-font-classic-roman' },
  { id: 'minimal-line', label: 'Minimal Line', previewClass: 'cm-font-minimal-line' },
  { id: 'bold-signature', label: 'Bold Signature', previewClass: 'cm-font-bold-signature' },
];

export const FONT_PREVIEW_CLASSES = [
  { value: 'cm-font-elegant-script', label: 'Elegant Script style' },
  { value: 'cm-font-luxury-serif', label: 'Luxury Serif style' },
  { value: 'cm-font-modern-sans', label: 'Modern Sans style' },
  { value: 'cm-font-classic-roman', label: 'Classic Roman style' },
  { value: 'cm-font-minimal-line', label: 'Minimal Line style' },
  { value: 'cm-font-bold-signature', label: 'Bold Signature style' },
];

export const MATERIAL_OPTIONS = [
  { id: 'stainless-steel', label: 'Stainless Steel' },
  { id: 'sterling-silver', label: 'Sterling Silver' },
  { id: 'gold-plated', label: 'Gold Plated' },
  { id: 'rose-gold', label: 'Rose Gold' },
  { id: '18k-gold', label: '18K Gold' },
];

export const JEWELRY_COLOR_OPTIONS = [
  { id: 'gold', label: 'Gold', color: '#c8815f' },
  { id: 'silver', label: 'Silver', color: '#c8c8c8' },
  { id: 'rose-gold', label: 'Rose Gold', color: '#e8b4a8' },
  { id: 'black', label: 'Black', color: '#2a2a2a' },
];

export const CHAIN_LENGTH_OPTIONS = [
  { id: '40-cm', label: '40 cm' },
  { id: '45-cm', label: '45 cm' },
  { id: '50-cm', label: '50 cm' },
  { id: '55-cm', label: '55 cm' },
  { id: '60-cm', label: '60 cm' },
];

export const BIRTHSTONE_OPTIONS = [
  { id: 'garnet', label: 'Garnet', month: 'Jan', color: '#8b1a1a' },
  { id: 'amethyst', label: 'Amethyst', month: 'Feb', color: '#9966cc' },
  { id: 'aquamarine', label: 'Aquamarine', month: 'Mar', color: '#7fffd4' },
  { id: 'diamond', label: 'Diamond', month: 'Apr', color: '#e8e8e8' },
  { id: 'emerald', label: 'Emerald', month: 'May', color: '#50c878' },
  { id: 'pearl', label: 'Pearl', month: 'Jun', color: '#f5f0e8' },
  { id: 'ruby', label: 'Ruby', month: 'Jul', color: '#e0115f' },
  { id: 'peridot', label: 'Peridot', month: 'Aug', color: '#9acd32' },
  { id: 'sapphire', label: 'Sapphire', month: 'Sep', color: '#0f52ba' },
  { id: 'opal', label: 'Opal', month: 'Oct', color: '#d4c4a8' },
  { id: 'topaz', label: 'Topaz', month: 'Nov', color: '#ffc87c' },
  { id: 'turquoise', label: 'Turquoise', month: 'Dec', color: '#40e0d0' },
];

export const SYMBOL_OPTIONS = [
  { id: 'heart', label: 'Heart', icon: '♥' },
  { id: 'infinity', label: 'Infinity', icon: '∞' },
  { id: 'star', label: 'Star', icon: '★' },
  { id: 'moon', label: 'Moon', icon: '☾' },
  { id: 'cross', label: 'Cross', icon: '✝' },
  { id: 'butterfly', label: 'Butterfly', icon: '🦋' },
];

export const GIFT_OPTION_DEFAULTS = [
  { id: 'premium-gift-box', label: 'Premium Gift Box', price: 299 },
  { id: 'greeting-card', label: 'Greeting Card', price: 99 },
  { id: 'luxury-packaging', label: 'Luxury Packaging', price: 199 },
];

export const slugifyOptionId = (label, fallback = 'option') => {
  const slug = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `${fallback}-${Date.now()}`;
};

export const getOptionId = (entry) => {
  if (typeof entry === 'string' || typeof entry === 'number') {
    return String(entry);
  }
  return entry?.id ? String(entry.id) : '';
};

export const getOptionLabel = (entry) => {
  if (typeof entry === 'string' || typeof entry === 'number') {
    return String(entry);
  }
  return entry?.label || entry?.id || '';
};

const findCatalogMatch = (catalog, entry) => {
  const id = getOptionId(entry);
  const label = getOptionLabel(entry);
  return (
    catalog.find((item) => item.id === id) ||
    catalog.find((item) => item.label === label) ||
    catalog.find((item) => item.id === label) ||
    null
  );
};

export const normalizeObjectOptions = (entries = [], catalog = [], extras = {}) =>
  (Array.isArray(entries) ? entries : [])
    .map((entry) => {
      const match = findCatalogMatch(catalog, entry);
      const raw = typeof entry === 'string' || typeof entry === 'number' ? {} : entry || {};
      const id =
        raw.id ||
        match?.id ||
        slugifyOptionId(raw.label || match?.label || entry, extras.fallback || 'option');
      const label = raw.label || match?.label || String(entry);

      return {
        ...(match || {}),
        ...raw,
        id,
        label,
      };
    })
    .filter((entry) => entry.id && entry.label);

export const normalizeCustomizationOptionsShape = (options = {}) => {
  const source = options && typeof options === 'object' ? options : {};

  return {
    ...source,
    fontSelection: source.fontSelection
      ? {
          ...source.fontSelection,
          options: normalizeObjectOptions(source.fontSelection.options, FONT_OPTIONS, {
            fallback: 'font',
          }),
        }
      : source.fontSelection,
    materialSelection: source.materialSelection
      ? {
          ...source.materialSelection,
          options: normalizeObjectOptions(source.materialSelection.options, MATERIAL_OPTIONS, {
            fallback: 'material',
          }),
        }
      : source.materialSelection,
    jewelryColor: source.jewelryColor
      ? {
          ...source.jewelryColor,
          options: normalizeObjectOptions(source.jewelryColor.options, JEWELRY_COLOR_OPTIONS, {
            fallback: 'color',
          }),
        }
      : source.jewelryColor,
    chainLength: source.chainLength
      ? {
          ...source.chainLength,
          options: normalizeObjectOptions(source.chainLength.options, CHAIN_LENGTH_OPTIONS, {
            fallback: 'chain',
          }),
        }
      : source.chainLength,
    birthstone: source.birthstone
      ? {
          ...source.birthstone,
          options: normalizeObjectOptions(source.birthstone.options, BIRTHSTONE_OPTIONS, {
            fallback: 'stone',
          }),
        }
      : source.birthstone,
    symbols: source.symbols
      ? {
          ...source.symbols,
          options: normalizeObjectOptions(source.symbols.options, SYMBOL_OPTIONS, {
            fallback: 'symbol',
          }),
        }
      : source.symbols,
    giftOptions: source.giftOptions
      ? {
          ...source.giftOptions,
          options: normalizeObjectOptions(source.giftOptions.options, GIFT_OPTION_DEFAULTS, {
            fallback: 'gift',
          }).map((gift) => ({
            ...gift,
            price: Number(gift.price) || 0,
          })),
        }
      : source.giftOptions,
  };
};

export const getDefaultCustomizationOptions = () => ({
  nameWord: { enabled: true, maxLength: 20, required: false },
  initials: { enabled: true, maxLength: 4, required: false },
  fontSelection: { enabled: true, options: FONT_OPTIONS.map((font) => ({ ...font })) },
  materialSelection: {
    enabled: true,
    options: MATERIAL_OPTIONS.map((material) => ({ ...material })),
  },
  jewelryColor: {
    enabled: true,
    options: JEWELRY_COLOR_OPTIONS.map((color) => ({ ...color })),
  },
  chainLength: {
    enabled: true,
    options: CHAIN_LENGTH_OPTIONS.map((length) => ({ ...length })),
  },
  engraving: { enabled: true, frontMaxLength: 30, backMaxLength: 30 },
  uploadImage: { enabled: true, maxSizeMB: 5 },
  birthstone: {
    enabled: true,
    options: BIRTHSTONE_OPTIONS.map((stone) => ({ ...stone })),
  },
  symbols: { enabled: true, options: SYMBOL_OPTIONS.map((symbol) => ({ ...symbol })) },
  giftOptions: { enabled: true, options: GIFT_OPTION_DEFAULTS.map((gift) => ({ ...gift })) },
  specialInstructions: { enabled: true, maxLength: 500 },
  quantity: { enabled: true, min: 1, max: 99 },
});

const LIST_OPTION_KEYS = [
  'fontSelection',
  'materialSelection',
  'jewelryColor',
  'chainLength',
  'birthstone',
  'symbols',
  'giftOptions',
];

export const mergeCustomizationOptions = (options = {}) => {
  const defaults = getDefaultCustomizationOptions();
  const normalized = normalizeCustomizationOptionsShape(options);
  const merged = { ...defaults, ...normalized };

  Object.keys(defaults).forEach((key) => {
    if (defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      merged[key] = { ...defaults[key], ...(normalized[key] || {}) };
    }
  });

  LIST_OPTION_KEYS.forEach((key) => {
    if (Array.isArray(normalized[key]?.options)) {
      merged[key] = {
        ...merged[key],
        options: normalized[key].options.map((entry) => ({ ...entry })),
      };
    }
  });

  return merged;
};
