export const buildVariantCombinations = (variationGroups = []) => {
  const activeGroups = variationGroups.filter(
    (group) => group.name?.trim() && group.options?.some((option) => option.trim())
  );

  if (!activeGroups.length) {
    return [];
  }

  const normalizedGroups = activeGroups.map((group) => ({
    name: group.name.trim(),
    options: group.options.map((option) => option.trim()).filter(Boolean),
  }));

  const combine = (groups, index = 0, current = {}) => {
    if (index >= groups.length) {
      return [{ attributes: { ...current } }];
    }

    const group = groups[index];
    return group.options.flatMap((option) =>
      combine(groups, index + 1, { ...current, [group.name]: option })
    );
  };

  return combine(normalizedGroups);
};

export const mergeVariantsWithCombinations = (combinations, existingVariants = [], defaults = {}) => {
  const existingMap = new Map(
    existingVariants.map((variant) => [
      JSON.stringify(variant.attributes || {}),
      variant,
    ])
  );

  return combinations.map((combination) => {
    const key = JSON.stringify(combination.attributes);
    const existing = existingMap.get(key);

    return {
      attributes: combination.attributes,
      stock: existing?.stock ?? defaults.stock ?? 0,
      price: existing?.price ?? defaults.price ?? '',
      sku: existing?.sku ?? '',
      image: existing?.image ?? '',
    };
  });
};

export const deriveLegacyFieldsFromVariations = (variationGroups = []) => {
  const ringGroup = variationGroups.find((group) =>
    /ring\s*size/i.test(group.name || '')
  );
  const colorGroup = variationGroups.find((group) =>
    /color|metal/i.test(group.name || '')
  );

  return {
    ringSizes: ringGroup?.options?.filter(Boolean) || [],
    metalColors: colorGroup?.options?.filter(Boolean) || [],
  };
};

export const createDefaultVariationGroups = () => [
  { name: 'Color', options: ['Gold', 'Silver'] },
  { name: 'Ring Size', options: [] },
];

export const DEFAULT_RING_SIZE_OPTIONS = [
  'Size 5 — 49MM (Small)',
  'Size 6 — 52MM (Medium)',
  'Size 7 — 54MM (Large)',
  'Size 8 — 57MM (XLarge)',
];
