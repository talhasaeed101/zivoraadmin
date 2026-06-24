export const isRingCategory = (category) => {
  if (!category) {
    return false;
  }

  const text = `${category.slug || ''} ${category.name || ''}`.toLowerCase();
  return text.includes('ring');
};

export const categoryNeedsRingSize = (category) => isRingCategory(category);
