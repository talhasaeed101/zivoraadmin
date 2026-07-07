export const FONT_OPTIONS = [
  { id: 'elegant-script', label: 'Elegant Script' },
  { id: 'luxury-serif', label: 'Luxury Serif' },
  { id: 'modern-sans', label: 'Modern Sans' },
  { id: 'classic-roman', label: 'Classic Roman' },
  { id: 'minimal-line', label: 'Minimal Line' },
  { id: 'bold-signature', label: 'Bold Signature' },
];

export const MATERIAL_OPTIONS = [
  'Stainless Steel',
  'Sterling Silver',
  'Gold Plated',
  'Rose Gold',
  '18K Gold',
];

export const JEWELRY_COLOR_OPTIONS = [
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'rose-gold', label: 'Rose Gold' },
  { id: 'black', label: 'Black' },
];

export const CHAIN_LENGTH_OPTIONS = ['40 cm', '45 cm', '50 cm', '55 cm', '60 cm'];

export const BIRTHSTONE_OPTIONS = [
  { id: 'garnet', label: 'Garnet' },
  { id: 'amethyst', label: 'Amethyst' },
  { id: 'aquamarine', label: 'Aquamarine' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'pearl', label: 'Pearl' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'peridot', label: 'Peridot' },
  { id: 'sapphire', label: 'Sapphire' },
  { id: 'opal', label: 'Opal' },
  { id: 'topaz', label: 'Topaz' },
  { id: 'turquoise', label: 'Turquoise' },
];

export const SYMBOL_OPTIONS = [
  { id: 'heart', label: 'Heart' },
  { id: 'infinity', label: 'Infinity' },
  { id: 'star', label: 'Star' },
  { id: 'moon', label: 'Moon' },
  { id: 'cross', label: 'Cross' },
  { id: 'butterfly', label: 'Butterfly' },
];

export const GIFT_OPTION_DEFAULTS = [
  { id: 'premium-gift-box', label: 'Premium Gift Box', price: 299 },
  { id: 'greeting-card', label: 'Greeting Card', price: 99 },
  { id: 'luxury-packaging', label: 'Luxury Packaging', price: 199 },
];

export const getDefaultCustomizationOptions = () => ({
  nameWord: { enabled: true, maxLength: 20, required: false },
  initials: { enabled: true, maxLength: 4, required: false },
  fontSelection: { enabled: true, options: FONT_OPTIONS.map((font) => font.id) },
  materialSelection: { enabled: true, options: [...MATERIAL_OPTIONS] },
  jewelryColor: { enabled: true, options: JEWELRY_COLOR_OPTIONS.map((color) => color.id) },
  chainLength: { enabled: true, options: [...CHAIN_LENGTH_OPTIONS] },
  engraving: { enabled: true, frontMaxLength: 30, backMaxLength: 30 },
  uploadImage: { enabled: true, maxSizeMB: 5 },
  birthstone: { enabled: true, options: BIRTHSTONE_OPTIONS.map((stone) => stone.id) },
  symbols: { enabled: true, options: SYMBOL_OPTIONS.map((symbol) => symbol.id) },
  giftOptions: { enabled: true, options: GIFT_OPTION_DEFAULTS.map((gift) => ({ ...gift })) },
  specialInstructions: { enabled: true, maxLength: 500 },
  quantity: { enabled: true, min: 1, max: 99 },
});

export const mergeCustomizationOptions = (options = {}) => {
  const defaults = getDefaultCustomizationOptions();
  const merged = { ...defaults, ...options };

  Object.keys(defaults).forEach((key) => {
    if (defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      merged[key] = { ...defaults[key], ...(options[key] || {}) };
    }
  });

  if (options.giftOptions?.options) {
    merged.giftOptions = {
      ...merged.giftOptions,
      options: options.giftOptions.options.map((gift) => ({ ...gift })),
    };
  }

  return merged;
};
