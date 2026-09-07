import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { campaignApi, categoryApi, productApi } from '../services/api.js';
import {
  applyCampaignTemplate,
  CUSTOM_TEMPLATE_ID,
  isCampaignFormEqual,
  listCampaignTemplates,
} from '../constants/campaignTemplates.js';
import './Campaigns.css';

const TIMEZONE_OPTIONS = [
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

const defaultForm = {
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

const toOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  return Number(value);
};

const utcToLocalInput = (value, timeZone) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || 'UTC',
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

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export default function CampaignForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const campaignTemplates = useMemo(() => listCampaignTemplates(), []);

  const [form, setForm] = useState(defaultForm);
  const [baselineForm, setBaselineForm] = useState(defaultForm);
  const [selectedTemplateId, setSelectedTemplateId] = useState(CUSTOM_TEMPLATE_ID);
  const [pendingTemplateId, setPendingTemplateId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [effectiveStatus, setEffectiveStatus] = useState('');

  const formIsDirty = !isCampaignFormEqual(form, baselineForm);

  const applyTemplateById = (templateId) => {
    const result = applyCampaignTemplate(templateId, {
      baseForm: { ...defaultForm, timezone: form.timezone || defaultForm.timezone },
    });
    setForm(result.form);
    setBaselineForm(result.form);
    setSelectedTemplateId(result.templateId);
    setPendingTemplateId(null);
  };

  const requestTemplate = (templateId) => {
    if (isEditing || templateId === selectedTemplateId) {
      return;
    }

    if (!formIsDirty) {
      applyTemplateById(templateId);
      return;
    }

    setPendingTemplateId(templateId);
  };

  useEffect(() => {
    let mounted = true;

    Promise.all([
      categoryApi.getCategories({ limit: 100, status: 'active' }),
      productApi.getProducts({ limit: 100, status: 'active' }),
    ])
      .then(([categoryResponse, productResponse]) => {
        if (!mounted) return;
        setCategories(categoryResponse.data?.categories || []);
        setProducts(productResponse.data?.products || []);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([]);
        setProducts([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const loadCampaign = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await campaignApi.getCampaign(id);
        const campaign = response.data;
        const tz = campaign.timezone || 'Asia/Karachi';

        const loaded = {
          name: campaign.name || '',
          description: campaign.description || '',
          status: campaign.status || 'draft',
          timezone: tz,
          startAtLocal: utcToLocalInput(campaign.startAt, tz),
          endAtLocal: utcToLocalInput(campaign.endAt, tz),
          discountType: campaign.discountType || 'percentage',
          discountValue: campaign.discountValue ?? '',
          maxDiscountAmount: campaign.maxDiscountAmount ?? '',
          minOrderAmount: campaign.minOrderAmount ?? '',
          targetType: campaign.targetType || 'all',
          targetProductIds: (campaign.targetProductIds || []).map(String),
          targetCategoryIds: (campaign.targetCategoryIds || []).map(String),
          targetVariantIdsText: (campaign.targetVariantIds || []).join('\n'),
          stackingPolicy: campaign.stackingPolicy || 'exclusive',
          showAnnouncement: campaign.showAnnouncement !== false,
          showBadge: campaign.showBadge !== false,
          showPdpMessage: campaign.showPdpMessage !== false,
          showHomeSection: campaign.showHomeSection !== false,
          showCountdown: Boolean(campaign.showCountdown),
          announcementText: campaign.announcementText || '',
          badgeText: campaign.badgeText || '',
          pdpText: campaign.pdpText || '',
          heroTitle: campaign.heroTitle || '',
          heroSubtitle: campaign.heroSubtitle || '',
          homeCtaText: campaign.homeCtaText || '',
          ctaDestination: campaign.ctaDestination || 'campaign',
          ctaCategoryId: campaign.ctaCategoryId ? String(campaign.ctaCategoryId) : '',
        };
        setForm(loaded);
        setBaselineForm(loaded);
        setSelectedTemplateId(CUSTOM_TEMPLATE_ID);
        setEffectiveStatus(campaign.effectiveStatus || '');
      } catch (err) {
        setError(err.message || 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [id, isEditing]);

  const timezoneOptions = useMemo(() => {
    if (TIMEZONE_OPTIONS.includes(form.timezone)) {
      return TIMEZONE_OPTIONS;
    }
    return [form.timezone, ...TIMEZONE_OPTIONS];
  }, [form.timezone]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const discountLabel = useMemo(() => {
    if (!form.discountValue && form.discountValue !== 0) {
      return '';
    }
    if (form.discountType === 'percentage') {
      return `${form.discountValue}% OFF`;
    }
    return `Rs. ${Number(form.discountValue || 0).toLocaleString('en-PK')} OFF`;
  }, [form.discountType, form.discountValue]);

  const previewAnnouncement =
    form.announcementText.trim() ||
    (form.name && discountLabel ? `${form.name} — ${discountLabel}` : '');
  const previewBadge = form.badgeText.trim() || discountLabel;
  const previewPdp =
    form.pdpText.trim() ||
    (discountLabel && form.name ? `${discountLabel} — ${form.name}` : '');
  const previewHomeTitle = form.heroTitle.trim() || form.name;
  const previewHomeSubtitle = form.heroSubtitle.trim() || discountLabel;
  const previewCta = form.homeCtaText.trim() || 'Shop Now';

  const handleMultiSelect = (event, field) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((prev) => ({ ...prev, [field]: values }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      timezone: form.timezone,
      startAt: form.startAtLocal,
      endAt: form.endAtLocal,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: toOptionalNumber(form.maxDiscountAmount),
      minOrderAmount: toOptionalNumber(form.minOrderAmount) ?? 0,
      targetType: form.targetType,
      targetProductIds: form.targetType === 'products' ? form.targetProductIds : [],
      targetCategoryIds: form.targetType === 'categories' ? form.targetCategoryIds : [],
      targetVariantIds:
        form.targetType === 'variants'
          ? form.targetVariantIdsText
              .split(/[\n,]+/)
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
      stackingPolicy: form.stackingPolicy,
      showAnnouncement: form.showAnnouncement,
      showBadge: form.showBadge,
      showPdpMessage: form.showPdpMessage,
      showHomeSection: form.showHomeSection,
      showCountdown: form.showCountdown,
      announcementText: form.announcementText.trim() || undefined,
      badgeText: form.badgeText.trim() || undefined,
      pdpText: form.pdpText.trim() || undefined,
      heroTitle: form.heroTitle.trim() || undefined,
      heroSubtitle: form.heroSubtitle.trim() || undefined,
      homeCtaText: form.homeCtaText.trim() || undefined,
      ctaDestination: form.ctaDestination || 'campaign',
      ctaCategoryId:
        form.ctaDestination === 'category' && form.ctaCategoryId
          ? form.ctaCategoryId
          : null,
    };

    try {
      if (isEditing) {
        await campaignApi.updateCampaign(id, payload);
      } else {
        await campaignApi.createCampaign(payload);
      }

      navigate('/campaigns', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Edit Campaign' : 'Add Campaign'} label="Marketing">
        <div className="state-card">Loading campaign...</div>
      </AdminLayout>
    );
  }

  const pendingTemplateLabel =
    campaignTemplates.find((template) => template.id === pendingTemplateId)?.label || 'template';

  return (
    <AdminLayout title={isEditing ? 'Edit Campaign' : 'Add Campaign'} label="Marketing">
      <div className="campaigns-page">
        {error && <div className="alert-banner alert-error">{error}</div>}

        {effectiveStatus ? (
          <div className="alert-banner">
            Effective status now: <strong>{effectiveStatus}</strong> (computed from schedule + stored
            status). Pricing flows through PromotionEngine; merchandising is storefront presentation.
          </div>
        ) : null}

        <form className="admin-form-card" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            {!isEditing ? (
              <>
                <div className="campaign-form-section">
                  <h3>Campaign Template</h3>
                  <p className="campaign-form-hint">
                    Optional presets only. Selecting a template fills this form — it does not create
                    or publish a campaign. Dates stay editable. Status defaults to draft.
                  </p>
                </div>

                <div className="campaign-template-picker" style={{ gridColumn: '1 / -1' }}>
                  {campaignTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`campaign-template-chip${
                        selectedTemplateId === template.id ? ' is-selected' : ''
                      }`}
                      onClick={() => requestTemplate(template.id)}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>

                <div className="campaign-template-actions" style={{ gridColumn: '1 / -1' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      if (!formIsDirty) {
                        applyTemplateById(selectedTemplateId);
                        return;
                      }
                      setPendingTemplateId(selectedTemplateId);
                    }}
                  >
                    Apply template defaults
                  </button>
                  {formIsDirty ? (
                    <span className="campaign-template-dirty-note">
                      Form has edits — applying a template will replace current field values.
                    </span>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="campaign-form-section">
              <h3>Campaign Details</h3>
              <p className="campaign-form-hint">Identity and stored lifecycle status.</p>
            </div>

            <div className="admin-form-field">
              <label htmlFor="name">Name *</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="admin-form-field">
              <label htmlFor="status">Stored Status *</label>
              <select id="status" name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="campaign-form-section">
              <h3>Schedule</h3>
              <p className="campaign-form-hint">
                Times are interpreted in the selected timezone and stored as UTC. Template dates are
                suggestions only — review before saving.
              </p>
            </div>

            <div className="admin-form-field">
              <label htmlFor="timezone">Timezone *</label>
              <select id="timezone" name="timezone" value={form.timezone} onChange={handleChange} required>
                {timezoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div className="campaign-timezone-note">
              Schedule timezone: <strong>{form.timezone}</strong>. Enter start/end as local wall
              clock in that zone.
            </div>

            <div className="admin-form-field">
              <label htmlFor="startAtLocal">Start *</label>
              <input
                id="startAtLocal"
                name="startAtLocal"
                type="datetime-local"
                value={form.startAtLocal}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="endAtLocal">End *</label>
              <input
                id="endAtLocal"
                name="endAtLocal"
                type="datetime-local"
                value={form.endAtLocal}
                onChange={handleChange}
                required
              />
            </div>

            <div className="campaign-form-section">
              <h3>Discount</h3>
              <p className="campaign-form-hint">
                Applied at checkout via PromotionEngine when the campaign is effectively active.
              </p>
            </div>

            <div className="admin-form-field">
              <label htmlFor="discountType">Discount Type *</label>
              <select
                id="discountType"
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="discountValue">Discount Value *</label>
              <input
                id="discountValue"
                name="discountValue"
                type="number"
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="maxDiscountAmount">Max Discount Amount</label>
              <input
                id="maxDiscountAmount"
                name="maxDiscountAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.maxDiscountAmount}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="minOrderAmount">Minimum Order Amount</label>
              <input
                id="minOrderAmount"
                name="minOrderAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={handleChange}
              />
            </div>

            <div className="campaign-form-section">
              <h3>Targeting</h3>
              <p className="campaign-form-hint">
                Categories use existing product.category. There is no separate Collection entity.
              </p>
            </div>

            <div className="admin-form-field">
              <label htmlFor="targetType">Target Type *</label>
              <select
                id="targetType"
                name="targetType"
                value={form.targetType}
                onChange={handleChange}
              >
                <option value="all">All products</option>
                <option value="products">Selected products</option>
                <option value="categories">Selected categories</option>
                <option value="variants">Selected variants</option>
              </select>
            </div>

            {form.targetType === 'products' ? (
              <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="targetProductIds">Products *</label>
                <select
                  id="targetProductIds"
                  multiple
                  className="campaign-multi-select"
                  value={form.targetProductIds}
                  onChange={(event) => handleMultiSelect(event, 'targetProductIds')}
                >
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.title} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {form.targetType === 'categories' ? (
              <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="targetCategoryIds">Categories *</label>
                <select
                  id="targetCategoryIds"
                  multiple
                  className="campaign-multi-select"
                  value={form.targetCategoryIds}
                  onChange={(event) => handleMultiSelect(event, 'targetCategoryIds')}
                >
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {form.targetType === 'variants' ? (
              <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="targetVariantIdsText">Variant IDs *</label>
                <textarea
                  id="targetVariantIdsText"
                  name="targetVariantIdsText"
                  rows={4}
                  placeholder="One Mongo variant _id per line"
                  value={form.targetVariantIdsText}
                  onChange={handleChange}
                />
              </div>
            ) : null}

            <div className="campaign-form-section">
              <h3>Stacking Policy</h3>
              <p className="campaign-form-hint">
                Exclusive is enforced at checkout. Stackable is stored but not activated.
              </p>
            </div>

            <div className="admin-form-field">
              <label htmlFor="stackingPolicy">Policy</label>
              <select
                id="stackingPolicy"
                name="stackingPolicy"
                value={form.stackingPolicy}
                onChange={handleChange}
              >
                <option value="exclusive">Exclusive</option>
                <option value="stackable">Stackable (not active)</option>
              </select>
            </div>

            <div className="campaign-form-section">
              <h3>Merchandising</h3>
              <p className="campaign-form-hint">
                Controls storefront presentation only. Pricing still applies when the campaign is
                active even if merchandising is disabled.
              </p>
            </div>

            <div className="admin-form-field">
              <label className="campaign-checkbox-label">
                <input
                  type="checkbox"
                  name="showAnnouncement"
                  checked={form.showAnnouncement}
                  onChange={handleChange}
                />
                Show announcement
              </label>
            </div>
            <div className="admin-form-field">
              <label className="campaign-checkbox-label">
                <input
                  type="checkbox"
                  name="showBadge"
                  checked={form.showBadge}
                  onChange={handleChange}
                />
                Show product badge
              </label>
            </div>
            <div className="admin-form-field">
              <label className="campaign-checkbox-label">
                <input
                  type="checkbox"
                  name="showPdpMessage"
                  checked={form.showPdpMessage}
                  onChange={handleChange}
                />
                Show PDP message
              </label>
            </div>
            <div className="admin-form-field">
              <label className="campaign-checkbox-label">
                <input
                  type="checkbox"
                  name="showHomeSection"
                  checked={form.showHomeSection}
                  onChange={handleChange}
                />
                Show homepage promotion
              </label>
            </div>
            <div className="admin-form-field">
              <label className="campaign-checkbox-label">
                <input
                  type="checkbox"
                  name="showCountdown"
                  checked={form.showCountdown}
                  onChange={handleChange}
                />
                Show countdown (visual only)
              </label>
            </div>

            <div className="admin-form-field">
              <label htmlFor="announcementText">Announcement text</label>
              <input
                id="announcementText"
                name="announcementText"
                placeholder={previewAnnouncement || 'e.g. 11.11 Mega Sale — 20% OFF'}
                value={form.announcementText}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="badgeText">Badge text</label>
              <input
                id="badgeText"
                name="badgeText"
                placeholder={previewBadge || 'e.g. 20% OFF'}
                value={form.badgeText}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="pdpText">PDP message</label>
              <input
                id="pdpText"
                name="pdpText"
                placeholder={previewPdp || 'e.g. 20% OFF — 11.11 Mega Sale'}
                value={form.pdpText}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="heroTitle">Homepage title</label>
              <input
                id="heroTitle"
                name="heroTitle"
                placeholder={previewHomeTitle || 'Campaign name'}
                value={form.heroTitle}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="heroSubtitle">Homepage subtitle</label>
              <input
                id="heroSubtitle"
                name="heroSubtitle"
                placeholder={previewHomeSubtitle || discountLabel || 'Offer line'}
                value={form.heroSubtitle}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="homeCtaText">Homepage CTA</label>
              <input
                id="homeCtaText"
                name="homeCtaText"
                placeholder="Shop Now"
                value={form.homeCtaText}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="ctaDestination">CTA destination</label>
              <select
                id="ctaDestination"
                name="ctaDestination"
                value={form.ctaDestination}
                onChange={handleChange}
              >
                <option value="campaign">Campaign landing page</option>
                <option value="collection">Shop / Collection (legacy → campaign page)</option>
                <option value="category">Category</option>
              </select>
            </div>

            {form.ctaDestination === 'category' ? (
              <div className="admin-form-field">
                <label htmlFor="ctaCategoryId">Category</label>
                <select
                  id="ctaCategoryId"
                  name="ctaCategoryId"
                  value={form.ctaCategoryId}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="campaign-form-section" style={{ gridColumn: '1 / -1' }}>
              <h3>Merchandising preview</h3>
              <p className="campaign-form-hint">Simple text preview — not a visual editor.</p>
              <div className="campaign-merch-preview">
                <p>
                  <strong>Announcement:</strong> {previewAnnouncement || '—'}
                </p>
                <p>
                  <strong>Badge:</strong> {previewBadge || '—'}
                </p>
                <p>
                  <strong>PDP:</strong> {previewPdp || '—'}
                </p>
                <p>
                  <strong>Homepage:</strong> {previewHomeTitle || '—'} /{' '}
                  {previewHomeSubtitle || '—'} / {previewCta}
                </p>
              </div>
            </div>
          </div>

          <div className="admin-form-actions">
            <Link to="/campaigns" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>

        <ConfirmModal
          open={Boolean(pendingTemplateId)}
          title="Apply template defaults?"
          message={`Applying “${pendingTemplateLabel}” will replace the current form values with template defaults. Your unsaved edits will be lost. This does not create a campaign until you save.`}
          confirmLabel="Apply template"
          onCancel={() => setPendingTemplateId(null)}
          onConfirm={() => applyTemplateById(pendingTemplateId)}
        />
      </div>
    </AdminLayout>
  );
}
