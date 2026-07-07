import {
  BIRTHSTONE_OPTIONS,
  CHAIN_LENGTH_OPTIONS,
  FONT_OPTIONS,
  JEWELRY_COLOR_OPTIONS,
  MATERIAL_OPTIONS,
  SYMBOL_OPTIONS,
} from '../constants/customization.js';

function SectionCard({ title, enabled, onToggleEnabled, disabled, children }) {
  return (
    <div className={`customization-option-card ${enabled ? '' : 'customization-option-card-disabled'}`}>
      <div className="customization-option-card-header">
        <label className="admin-form-checkbox customization-option-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggleEnabled(event.target.checked)}
            disabled={disabled}
          />
          <strong>{title}</strong>
        </label>
      </div>
      {enabled && <div className="customization-option-card-body">{children}</div>}
    </div>
  );
}

function OptionCheckboxGroup({ catalog, selected = [], onChange, disabled, getId = (item) => item.id, getLabel = (item) => item.label || item }) {
  return (
    <div className="customization-checkbox-grid">
      {catalog.map((item) => {
        const id = getId(item);
        const label = getLabel(item);

        return (
          <label key={id} className="admin-form-checkbox customization-option-item">
            <input
              type="checkbox"
              checked={selected.includes(id)}
              onChange={() => {
                const next = selected.includes(id)
                  ? selected.filter((value) => value !== id)
                  : [...selected, id];
                onChange(next);
              }}
              disabled={disabled}
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}

export default function CustomizationOptionsSection({ options, onChange, disabled = false }) {
  const updateSection = (sectionKey, patch) => {
    onChange({
      ...options,
      [sectionKey]: {
        ...options[sectionKey],
        ...patch,
      },
    });
  };

  const updateGiftOption = (giftId, patch) => {
    const giftOptions = (options.giftOptions?.options || []).map((gift) =>
      gift.id === giftId ? { ...gift, ...patch } : gift
    );

    updateSection('giftOptions', { options: giftOptions });
  };

  const toggleGiftOptionEnabled = (giftId, enabled) => {
    const current = options.giftOptions?.options || [];
    const exists = current.some((gift) => gift.id === giftId);

    if (!exists && enabled) {
      const defaults = {
        'premium-gift-box': { id: 'premium-gift-box', label: 'Premium Gift Box', price: 299 },
        'greeting-card': { id: 'greeting-card', label: 'Greeting Card', price: 99 },
        'luxury-packaging': { id: 'luxury-packaging', label: 'Luxury Packaging', price: 199 },
      };
      updateSection('giftOptions', { options: [...current, defaults[giftId]] });
      return;
    }

    if (!enabled) {
      updateSection('giftOptions', {
        options: current.filter((gift) => gift.id !== giftId),
      });
    }
  };

  const allGiftDefinitions = [
    { id: 'premium-gift-box', label: 'Premium Gift Box', price: 299 },
    { id: 'greeting-card', label: 'Greeting Card', price: 99 },
    { id: 'luxury-packaging', label: 'Luxury Packaging', price: 199 },
  ];

  return (
    <div className="customization-settings-section">
      <div className="customization-settings-intro">
        <h3 className="customization-settings-title">Customization Settings</h3>
        <p className="field-hint">
          Choose which options customers can configure on the storefront customization modal.
        </p>
      </div>

      <div className="customization-option-list">
        <SectionCard
          title="Name / Word"
          enabled={options.nameWord?.enabled}
          onToggleEnabled={(enabled) => updateSection('nameWord', { enabled })}
          disabled={disabled}
        >
          <div className="customization-inline-fields">
            <div className="admin-form-field">
              <label>Max Length</label>
              <input
                type="number"
                min="1"
                max="100"
                value={options.nameWord?.maxLength ?? 20}
                onChange={(event) =>
                  updateSection('nameWord', { maxLength: Number(event.target.value) || 20 })
                }
                disabled={disabled}
              />
            </div>
            <label className="admin-form-checkbox">
              <input
                type="checkbox"
                checked={Boolean(options.nameWord?.required)}
                onChange={(event) => updateSection('nameWord', { required: event.target.checked })}
                disabled={disabled}
              />
              Required
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Initials"
          enabled={options.initials?.enabled}
          onToggleEnabled={(enabled) => updateSection('initials', { enabled })}
          disabled={disabled}
        >
          <div className="customization-inline-fields">
            <div className="admin-form-field">
              <label>Max Length</label>
              <input
                type="number"
                min="1"
                max="20"
                value={options.initials?.maxLength ?? 4}
                onChange={(event) =>
                  updateSection('initials', { maxLength: Number(event.target.value) || 4 })
                }
                disabled={disabled}
              />
            </div>
            <label className="admin-form-checkbox">
              <input
                type="checkbox"
                checked={Boolean(options.initials?.required)}
                onChange={(event) => updateSection('initials', { required: event.target.checked })}
                disabled={disabled}
              />
              Required
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Font Selection"
          enabled={options.fontSelection?.enabled}
          onToggleEnabled={(enabled) => updateSection('fontSelection', { enabled })}
          disabled={disabled}
        >
          <OptionCheckboxGroup
            catalog={FONT_OPTIONS}
            selected={options.fontSelection?.options || []}
            onChange={(next) => updateSection('fontSelection', { options: next })}
            disabled={disabled}
          />
        </SectionCard>

        <SectionCard
          title="Material"
          enabled={options.materialSelection?.enabled}
          onToggleEnabled={(enabled) => updateSection('materialSelection', { enabled })}
          disabled={disabled}
        >
          <OptionCheckboxGroup
            catalog={MATERIAL_OPTIONS}
            selected={options.materialSelection?.options || []}
            onChange={(next) => updateSection('materialSelection', { options: next })}
            disabled={disabled}
            getId={(item) => item}
            getLabel={(item) => item}
          />
        </SectionCard>

        <SectionCard
          title="Jewelry Color"
          enabled={options.jewelryColor?.enabled}
          onToggleEnabled={(enabled) => updateSection('jewelryColor', { enabled })}
          disabled={disabled}
        >
          <OptionCheckboxGroup
            catalog={JEWELRY_COLOR_OPTIONS}
            selected={options.jewelryColor?.options || []}
            onChange={(next) => updateSection('jewelryColor', { options: next })}
            disabled={disabled}
          />
        </SectionCard>

        <SectionCard
          title="Chain Length"
          enabled={options.chainLength?.enabled}
          onToggleEnabled={(enabled) => updateSection('chainLength', { enabled })}
          disabled={disabled}
        >
          <OptionCheckboxGroup
            catalog={CHAIN_LENGTH_OPTIONS}
            selected={options.chainLength?.options || []}
            onChange={(next) => updateSection('chainLength', { options: next })}
            disabled={disabled}
            getId={(item) => item}
            getLabel={(item) => item}
          />
        </SectionCard>

        <SectionCard
          title="Engraving"
          enabled={options.engraving?.enabled}
          onToggleEnabled={(enabled) => updateSection('engraving', { enabled })}
          disabled={disabled}
        >
          <div className="customization-inline-fields">
            <div className="admin-form-field">
              <label>Front Max Length</label>
              <input
                type="number"
                min="1"
                max="100"
                value={options.engraving?.frontMaxLength ?? 30}
                onChange={(event) =>
                  updateSection('engraving', { frontMaxLength: Number(event.target.value) || 30 })
                }
                disabled={disabled}
              />
            </div>
            <div className="admin-form-field">
              <label>Back Max Length</label>
              <input
                type="number"
                min="1"
                max="100"
                value={options.engraving?.backMaxLength ?? 30}
                onChange={(event) =>
                  updateSection('engraving', { backMaxLength: Number(event.target.value) || 30 })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Upload Image"
          enabled={options.uploadImage?.enabled}
          onToggleEnabled={(enabled) => updateSection('uploadImage', { enabled })}
          disabled={disabled}
        >
          <div className="admin-form-field">
            <label>Max Size (MB)</label>
            <input
              type="number"
              min="1"
              max="20"
              value={options.uploadImage?.maxSizeMB ?? 5}
              onChange={(event) =>
                updateSection('uploadImage', { maxSizeMB: Number(event.target.value) || 5 })
              }
              disabled={disabled}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Birthstone"
          enabled={options.birthstone?.enabled}
          onToggleEnabled={(enabled) => updateSection('birthstone', { enabled })}
          disabled={disabled}
        >
          <OptionCheckboxGroup
            catalog={BIRTHSTONE_OPTIONS}
            selected={options.birthstone?.options || []}
            onChange={(next) => updateSection('birthstone', { options: next })}
            disabled={disabled}
          />
        </SectionCard>

        <SectionCard
          title="Symbols & Icons"
          enabled={options.symbols?.enabled}
          onToggleEnabled={(enabled) => updateSection('symbols', { enabled })}
          disabled={disabled}
        >
          <OptionCheckboxGroup
            catalog={SYMBOL_OPTIONS}
            selected={options.symbols?.options || []}
            onChange={(next) => updateSection('symbols', { options: next })}
            disabled={disabled}
          />
        </SectionCard>

        <SectionCard
          title="Gift Options"
          enabled={options.giftOptions?.enabled}
          onToggleEnabled={(enabled) => updateSection('giftOptions', { enabled })}
          disabled={disabled}
        >
          <div className="customization-gift-list">
            {allGiftDefinitions.map((giftDef) => {
              const activeGift = (options.giftOptions?.options || []).find(
                (gift) => gift.id === giftDef.id
              );
              const isEnabled = Boolean(activeGift);

              return (
                <div key={giftDef.id} className="customization-gift-row">
                  <label className="admin-form-checkbox">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(event) => toggleGiftOptionEnabled(giftDef.id, event.target.checked)}
                      disabled={disabled}
                    />
                    {giftDef.label}
                  </label>
                  {isEnabled && (
                    <input
                      type="number"
                      min="0"
                      className="customization-gift-price-input"
                      value={activeGift?.price ?? giftDef.price}
                      onChange={(event) =>
                        updateGiftOption(giftDef.id, { price: Number(event.target.value) || 0 })
                      }
                      disabled={disabled}
                      aria-label={`${giftDef.label} price`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard
          title="Special Instructions"
          enabled={options.specialInstructions?.enabled}
          onToggleEnabled={(enabled) => updateSection('specialInstructions', { enabled })}
          disabled={disabled}
        >
          <div className="admin-form-field">
            <label>Max Length</label>
            <input
              type="number"
              min="50"
              max="2000"
              value={options.specialInstructions?.maxLength ?? 500}
              onChange={(event) =>
                updateSection('specialInstructions', {
                  maxLength: Number(event.target.value) || 500,
                })
              }
              disabled={disabled}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Quantity"
          enabled={options.quantity?.enabled}
          onToggleEnabled={(enabled) => updateSection('quantity', { enabled })}
          disabled={disabled}
        >
          <div className="customization-inline-fields">
            <div className="admin-form-field">
              <label>Minimum</label>
              <input
                type="number"
                min="1"
                value={options.quantity?.min ?? 1}
                onChange={(event) =>
                  updateSection('quantity', { min: Number(event.target.value) || 1 })
                }
                disabled={disabled}
              />
            </div>
            <div className="admin-form-field">
              <label>Maximum</label>
              <input
                type="number"
                min="1"
                value={options.quantity?.max ?? 99}
                onChange={(event) =>
                  updateSection('quantity', { max: Number(event.target.value) || 99 })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
