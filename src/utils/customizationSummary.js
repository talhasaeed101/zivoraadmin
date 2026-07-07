import {
  BIRTHSTONE_OPTIONS,
  FONT_OPTIONS,
  GIFT_OPTION_DEFAULTS,
  JEWELRY_COLOR_OPTIONS,
  SYMBOL_OPTIONS,
} from '../constants/customization.js';

const findLabel = (catalog, id) => catalog.find((entry) => entry.id === id)?.label || id;

export const buildCustomizationSummaryLines = (customization = {}) => {
  if (!customization) {
    return [];
  }

  const lines = [];

  if (customization.nameWord) {
    lines.push({ label: 'Name / Word', value: customization.nameWord });
  }

  if (customization.initials) {
    lines.push({ label: 'Initials', value: customization.initials });
  }

  if (customization.font) {
    lines.push({ label: 'Font', value: findLabel(FONT_OPTIONS, customization.font) });
  }

  if (customization.material) {
    lines.push({ label: 'Material', value: customization.material });
  }

  if (customization.jewelryColor) {
    lines.push({ label: 'Color', value: findLabel(JEWELRY_COLOR_OPTIONS, customization.jewelryColor) });
  }

  if (customization.chainLength) {
    lines.push({ label: 'Chain Length', value: customization.chainLength });
  }

  if (customization.engravingFront) {
    lines.push({ label: 'Front Engraving', value: customization.engravingFront });
  }

  if (customization.engravingBack) {
    lines.push({ label: 'Back Engraving', value: customization.engravingBack });
  }

  if (customization.uploadedImage) {
    lines.push({ label: 'Custom Image', value: 'Uploaded' });
  }

  if (customization.birthstone) {
    lines.push({ label: 'Birthstone', value: findLabel(BIRTHSTONE_OPTIONS, customization.birthstone) });
  }

  if (customization.symbol) {
    lines.push({ label: 'Symbol', value: findLabel(SYMBOL_OPTIONS, customization.symbol) });
  }

  if (customization.giftOptions?.length) {
    const giftLabels = customization.giftOptions
      .map((giftId) => findLabel(GIFT_OPTION_DEFAULTS, giftId))
      .filter(Boolean);

    if (giftLabels.length) {
      lines.push({ label: 'Gift Options', value: giftLabels.join(', ') });
    }
  }

  if (customization.specialInstructions) {
    lines.push({ label: 'Instructions', value: customization.specialInstructions });
  }

  return lines;
};
