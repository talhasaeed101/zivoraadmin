/**
 * Campaign template presets for Admin CampaignForm.
 * Frontend configuration only — does NOT create campaigns or touch pricing engines.
 *
 * To add Ramadan / Mother's Day / etc.: append an entry to CAMPAIGN_TEMPLATES.
 */

export const CUSTOM_TEMPLATE_ID = 'custom';

/** Blank create defaults — matches CampaignForm defaultForm shape. */
export const BLANK_CAMPAIGN_FORM = {
  name: '',
  description: '',
  status: 'draft',
  timezone: 'Asia/Karachi',
  startAtLocal: '',
  endAtLocal: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  targetType: 'all',
  targetProductIds: [],
  targetCategoryIds: [],
  targetVariantIdsText: '',
  stackingPolicy: 'exclusive',
  showAnnouncement: true,
  showBadge: true,
  showPdpMessage: true,
  showHomeSection: true,
  showCountdown: false,
  announcementText: '',
  badgeText: '',
  pdpText: '',
  heroTitle: '',
  heroSubtitle: '',
  homeCtaText: '',
  ctaDestination: 'campaign',
  ctaCategoryId: '',
};

/**
 * @typedef {Object} CampaignTemplate
 * @property {string} id
 * @property {string} label
 * @property {string} [description]
 * @property {number} [suggestedDurationHours] - optional; never auto-publishes
 * @property {object} defaults - partial CampaignForm fields
 */

/** @type {CampaignTemplate[]} */
export const CAMPAIGN_TEMPLATES = [
  {
    id: CUSTOM_TEMPLATE_ID,
    label: 'Custom',
    description: 'Start from a blank campaign and fill every field manually.',
    defaults: {},
  },
  {
    id: 'azadi-sale',
    label: 'Azadi Sale',
    description: 'Independence Day merchandising preset.',
    suggestedDurationHours: 168,
    defaults: {
      name: 'Azadi Sale',
      description: 'Celebrate Independence Day with Zivorah jewellery.',
      status: 'draft',
      discountType: 'percentage',
      discountValue: 20,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: '🇵🇰 Azadi Sale — Up to 20% OFF',
      badgeText: '20% OFF',
      pdpText: 'Celebrate with Zivorah — Azadi Sale',
      heroTitle: 'Azadi Sale',
      heroSubtitle: 'Celebrate with Zivorah Jewellery',
      homeCtaText: 'SHOP THE SALE',
      ctaDestination: 'campaign',
    },
  },
  {
    id: '9-9-sale',
    label: '9.9 Sale',
    description: '9.9 seasonal sale preset.',
    suggestedDurationHours: 72,
    defaults: {
      name: '9.9 Sale',
      description: '9.9 Sale on selected Zivorah jewellery.',
      status: 'draft',
      discountType: 'percentage',
      discountValue: 15,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: '9.9 Sale — Up to 15% OFF',
      badgeText: '15% OFF',
      pdpText: '15% OFF — 9.9 Sale',
      heroTitle: '9.9 Sale',
      heroSubtitle: 'Seasonal favourites at a special price',
      homeCtaText: 'SHOP THE SALE',
      ctaDestination: 'campaign',
    },
  },
  {
    id: '10-10-sale',
    label: '10.10 Sale',
    description: '10.10 seasonal sale preset.',
    suggestedDurationHours: 72,
    defaults: {
      name: '10.10 Sale',
      description: '10.10 Sale on selected Zivorah jewellery.',
      status: 'draft',
      discountType: 'percentage',
      discountValue: 15,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: '10.10 Sale — Up to 15% OFF',
      badgeText: '15% OFF',
      pdpText: '15% OFF — 10.10 Sale',
      heroTitle: '10.10 Sale',
      heroSubtitle: 'Limited-time jewellery offers',
      homeCtaText: 'SHOP THE SALE',
      ctaDestination: 'campaign',
    },
  },
  {
    id: '11-11-sale',
    label: '11.11 Sale',
    description: '11.11 mega sale preset.',
    suggestedDurationHours: 96,
    defaults: {
      name: '11.11 Sale',
      description: '11.11 Sale on Zivorah jewellery.',
      status: 'draft',
      discountType: 'percentage',
      discountValue: 20,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: '11.11 Sale — Up to 20% OFF',
      badgeText: '20% OFF',
      pdpText: '20% OFF — 11.11 Sale',
      heroTitle: '11.11 Sale',
      heroSubtitle: 'Your favourites, now at a special price',
      homeCtaText: 'SHOP THE SALE',
      ctaDestination: 'campaign',
    },
  },
  {
    id: 'black-friday',
    label: 'Black Friday',
    description: 'Black Friday merchandising preset.',
    suggestedDurationHours: 72,
    defaults: {
      name: 'Black Friday Sale',
      description: 'Black Friday offers on Zivorah jewellery.',
      status: 'draft',
      discountType: 'percentage',
      discountValue: 25,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: 'Black Friday — Up to 25% OFF',
      badgeText: '25% OFF',
      pdpText: '25% OFF — Black Friday',
      heroTitle: 'Black Friday',
      heroSubtitle: 'Our biggest jewellery offers of the season',
      homeCtaText: 'SHOP THE SALE',
      ctaDestination: 'campaign',
    },
  },
  {
    id: 'christmas-sale',
    label: 'Christmas',
    description: 'Christmas / festive gift preset.',
    suggestedDurationHours: 168,
    defaults: {
      name: 'Christmas Sale',
      description: 'Festive jewellery gifts from Zivorah.',
      status: 'draft',
      discountType: 'percentage',
      discountValue: 15,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: 'Christmas Sale — Up to 15% OFF',
      badgeText: '15% OFF',
      pdpText: '15% OFF — Christmas Sale',
      heroTitle: 'Christmas Sale',
      heroSubtitle: 'Gifts crafted to sparkle this season',
      homeCtaText: 'SHOP GIFTS',
      ctaDestination: 'campaign',
    },
  },
  {
    id: 'valentines-sale',
    label: "Valentine's",
    description: "Valentine's Day preset.",
    suggestedDurationHours: 120,
    defaults: {
      name: "Valentine's Sale",
      description: "Valentine's jewellery offers from Zivorah.",
      status: 'draft',
      discountType: 'percentage',
      discountValue: 15,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: "Valentine's Sale — Up to 15% OFF",
      badgeText: '15% OFF',
      pdpText: "15% OFF — Valentine's Sale",
      heroTitle: "Valentine's Sale",
      heroSubtitle: 'Jewellery made for the ones you love',
      homeCtaText: 'SHOP THE SALE',
      ctaDestination: 'campaign',
    },
  },
  {
    id: 'eid-sale',
    label: 'Eid Sale',
    description: 'Eid celebration preset.',
    suggestedDurationHours: 120,
    defaults: {
      name: 'Eid Sale',
      description: 'Eid jewellery offers from Zivorah.',
      status: 'draft',
      discountType: 'percentage',
      discountValue: 20,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: 'Eid Sale — Up to 20% OFF',
      badgeText: '20% OFF',
      pdpText: '20% OFF — Eid Sale',
      heroTitle: 'Eid Sale',
      heroSubtitle: 'Celebrate Eid with timeless jewellery',
      homeCtaText: 'SHOP THE SALE',
      ctaDestination: 'campaign',
    },
  },
  {
    id: 'flash-sale',
    label: 'Flash Sale',
    description: 'Short-duration flash sale preset (dates still Admin-controlled).',
    suggestedDurationHours: 24,
    defaults: {
      name: 'Flash Sale',
      description: 'Limited-time flash offer on Zivorah jewellery.',
      status: 'draft',
      discountType: 'percentage',
      discountValue: 15,
      targetType: 'all',
      showAnnouncement: true,
      showBadge: true,
      showPdpMessage: true,
      showHomeSection: true,
      showCountdown: true,
      announcementText: 'Flash Sale — Limited Time',
      badgeText: 'FLASH SALE',
      pdpText: 'Flash Sale — Limited Time',
      heroTitle: 'Flash Sale',
      heroSubtitle: 'Ends soon — shop while it lasts',
      homeCtaText: 'SHOP NOW',
      ctaDestination: 'campaign',
    },
  },
];

export const getCampaignTemplate = (id) =>
  CAMPAIGN_TEMPLATES.find((template) => template.id === id) || null;

export const listCampaignTemplates = () => CAMPAIGN_TEMPLATES;

const pad2 = (value) => String(value).padStart(2, '0');

/**
 * Format an absolute instant as datetime-local wall clock in a timezone.
 * Suggestion only — Admin remains free to edit.
 */
export const formatZonedDateTimeLocal = (date, timeZone = 'Asia/Karachi') => {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }

  return `${parts.year}-${parts.month}-${parts.day}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
};

const normalizeComparable = (form) => ({
  ...form,
  discountValue:
    form.discountValue === '' || form.discountValue === null || form.discountValue === undefined
      ? ''
      : String(form.discountValue),
  maxDiscountAmount:
    form.maxDiscountAmount === '' || form.maxDiscountAmount === null
      ? ''
      : String(form.maxDiscountAmount),
  minOrderAmount:
    form.minOrderAmount === '' || form.minOrderAmount === null ? '' : String(form.minOrderAmount),
  targetProductIds: [...(form.targetProductIds || [])].map(String).sort(),
  targetCategoryIds: [...(form.targetCategoryIds || [])].map(String).sort(),
  targetVariantIdsText: String(form.targetVariantIdsText || '').trim(),
});

export const isCampaignFormEqual = (a, b) =>
  JSON.stringify(normalizeComparable(a)) === JSON.stringify(normalizeComparable(b));

/**
 * Apply a template onto a base form. Never activates/publishes.
 * Suggested duration fills start/end as editable defaults when provided.
 */
export const applyCampaignTemplate = (
  templateId,
  { baseForm = BLANK_CAMPAIGN_FORM, now = new Date() } = {}
) => {
  const template = getCampaignTemplate(templateId) || getCampaignTemplate(CUSTOM_TEMPLATE_ID);
  const timezone = baseForm.timezone || BLANK_CAMPAIGN_FORM.timezone;

  let next = {
    ...BLANK_CAMPAIGN_FORM,
    ...baseForm,
    timezone,
    ...template.defaults,
    status: 'draft',
    timezone,
    targetProductIds: [],
    targetCategoryIds: [],
    targetVariantIdsText: '',
    ctaCategoryId: '',
    stackingPolicy: template.defaults.stackingPolicy || 'exclusive',
  };

  if (template.id === CUSTOM_TEMPLATE_ID) {
    next = {
      ...BLANK_CAMPAIGN_FORM,
      timezone,
    };
  }

  if (template.suggestedDurationHours && template.id !== CUSTOM_TEMPLATE_ID) {
    const start = new Date(now);
    const end = new Date(now.getTime() + template.suggestedDurationHours * 60 * 60 * 1000);
    next.startAtLocal = formatZonedDateTimeLocal(start, timezone);
    next.endAtLocal = formatZonedDateTimeLocal(end, timezone);
  } else if (template.id === CUSTOM_TEMPLATE_ID) {
    next.startAtLocal = '';
    next.endAtLocal = '';
  }

  return {
    form: next,
    templateId: template.id,
    createdCampaign: false,
  };
};
