import { getOptionLabel } from '../constants/customization.js';

const findLabel = (entries = [], value) => {
  if (!value) return '';
  const match = entries.find(
    (entry) => entry.id === value || entry.label === value || entry === value
  );
  return getOptionLabel(match || value);
};

export const buildCustomizationSummaryLines = (customization = {}, productOptions = null) => {
  if (!customization) {
    return [];
  }

  const lines = [];
  const options = productOptions || {};

  if (customization.nameWord) {
    lines.push({ label: 'Name / Word', value: customization.nameWord });
  }
  if (customization.initials) {
    lines.push({ label: 'Initials', value: customization.initials });
  }
  if (customization.font) {
    lines.push({
      label: 'Font',
      value: findLabel(options.fontSelection?.options || [], customization.font),
    });
  }
  if (customization.material) {
    lines.push({
      label: 'Material',
      value: findLabel(options.materialSelection?.options || [], customization.material),
    });
  }
  if (customization.jewelryColor) {
    lines.push({
      label: 'Color',
      value: findLabel(options.jewelryColor?.options || [], customization.jewelryColor),
    });
  }
  if (customization.chainLength) {
    lines.push({
      label: 'Chain Length',
      value: findLabel(options.chainLength?.options || [], customization.chainLength),
    });
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
    lines.push({
      label: 'Birthstone',
      value: findLabel(options.birthstone?.options || [], customization.birthstone),
    });
  }
  if (customization.symbol) {
    lines.push({
      label: 'Symbol',
      value: findLabel(options.symbols?.options || [], customization.symbol),
    });
  }
  if (customization.giftOptions?.length) {
    const labels = customization.giftOptions
      .map((giftId) => findLabel(options.giftOptions?.options || [], giftId))
      .filter(Boolean);
    if (labels.length) {
      lines.push({ label: 'Gift Options', value: labels.join(', ') });
    }
  }
  if (customization.specialInstructions) {
    lines.push({ label: 'Notes', value: customization.specialInstructions });
  }

  return lines;
};
