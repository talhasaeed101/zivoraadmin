import { FONT_PREVIEW_CLASSES, slugifyOptionId } from '../constants/customization.js';

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

function EditableOptionsEditor({
  items = [],
  fields,
  onChange,
  disabled,
  addLabel,
  createItem,
}) {
  const updateItem = (index, patch) => {
    onChange(
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        if (patch.label && !item.idLocked) {
          next.id = slugifyOptionId(patch.label, item.id || 'option');
        }
        return next;
      })
    );
  };

  const removeItem = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    onChange([...items, createItem(items.length)]);
  };

  return (
    <div className="customization-editable-list">
      {items.length === 0 ? (
        <p className="field-hint">No options yet. Add the choices customers should see.</p>
      ) : null}

      {items.map((item, index) => (
        <div key={item.id || index} className="customization-editable-row">
          <div className="customization-editable-fields">
            {fields.map((field) => (
              <div key={field.key} className="admin-form-field customization-editable-field">
                <label>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={item[field.key] || field.defaultValue || ''}
                    onChange={(event) => updateItem(index, { [field.key]: event.target.value })}
                    disabled={disabled}
                  >
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || 'text'}
                    min={field.min}
                    step={field.step}
                    value={
                      field.type === 'color'
                        ? /^#[0-9A-Fa-f]{6}$/.test(String(item[field.key] || ''))
                          ? item[field.key]
                          : field.defaultValue || '#967259'
                        : (item[field.key] ?? field.defaultValue ?? '')
                    }
                    onChange={(event) => {
                      const value =
                        field.type === 'number'
                          ? Number(event.target.value) || 0
                          : event.target.value;
                      updateItem(index, { [field.key]: value });
                    }}
                    disabled={disabled}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="customization-remove-btn"
            onClick={() => removeItem(index)}
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      ))}

      <button type="button" className="customization-add-btn" onClick={addItem} disabled={disabled}>
        {addLabel}
      </button>
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

  const updateOptionsList = (sectionKey, nextOptions) => {
    updateSection(sectionKey, { options: nextOptions });
  };

  return (
    <div className="customization-settings-section">
      <div className="customization-settings-intro">
        <h3 className="customization-settings-title">Customization Settings</h3>
        <p className="field-hint">
          Enable sections and fully edit the options customers can choose (fonts, colors, lengths,
          gifts, and more).
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
          <EditableOptionsEditor
            items={options.fontSelection?.options || []}
            onChange={(next) => updateOptionsList('fontSelection', next)}
            disabled={disabled}
            addLabel="Add font"
            createItem={(index) => ({
              id: `font-${index + 1}`,
              label: `Font ${index + 1}`,
              previewClass: 'cm-font-luxury-serif',
            })}
            fields={[
              { key: 'label', label: 'Font name', placeholder: 'e.g. Elegant Script' },
              {
                key: 'previewClass',
                label: 'Preview style',
                type: 'select',
                options: FONT_PREVIEW_CLASSES,
                defaultValue: 'cm-font-luxury-serif',
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Material"
          enabled={options.materialSelection?.enabled}
          onToggleEnabled={(enabled) => updateSection('materialSelection', { enabled })}
          disabled={disabled}
        >
          <EditableOptionsEditor
            items={options.materialSelection?.options || []}
            onChange={(next) => updateOptionsList('materialSelection', next)}
            disabled={disabled}
            addLabel="Add material"
            createItem={(index) => ({
              id: `material-${index + 1}`,
              label: `Material ${index + 1}`,
            })}
            fields={[{ key: 'label', label: 'Material name', placeholder: 'e.g. Sterling Silver' }]}
          />
        </SectionCard>

        <SectionCard
          title="Jewelry Color"
          enabled={options.jewelryColor?.enabled}
          onToggleEnabled={(enabled) => updateSection('jewelryColor', { enabled })}
          disabled={disabled}
        >
          <EditableOptionsEditor
            items={options.jewelryColor?.options || []}
            onChange={(next) => updateOptionsList('jewelryColor', next)}
            disabled={disabled}
            addLabel="Add color"
            createItem={(index) => ({
              id: `color-${index + 1}`,
              label: `Color ${index + 1}`,
              color: '#967259',
            })}
            fields={[
              { key: 'label', label: 'Color name', placeholder: 'e.g. Rose Gold' },
              { key: 'color', label: 'Swatch hex', type: 'color', defaultValue: '#967259' },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Chain Length"
          enabled={options.chainLength?.enabled}
          onToggleEnabled={(enabled) => updateSection('chainLength', { enabled })}
          disabled={disabled}
        >
          <EditableOptionsEditor
            items={options.chainLength?.options || []}
            onChange={(next) => updateOptionsList('chainLength', next)}
            disabled={disabled}
            addLabel="Add length"
            createItem={(index) => ({
              id: `length-${index + 1}`,
              label: `${40 + index * 5} cm`,
            })}
            fields={[{ key: 'label', label: 'Length label', placeholder: 'e.g. 45 cm' }]}
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
          <EditableOptionsEditor
            items={options.birthstone?.options || []}
            onChange={(next) => updateOptionsList('birthstone', next)}
            disabled={disabled}
            addLabel="Add birthstone"
            createItem={(index) => ({
              id: `stone-${index + 1}`,
              label: `Stone ${index + 1}`,
              month: 'Jan',
              color: '#967259',
            })}
            fields={[
              { key: 'label', label: 'Stone name', placeholder: 'e.g. Garnet' },
              { key: 'month', label: 'Month', placeholder: 'e.g. Jan' },
              { key: 'color', label: 'Swatch hex', type: 'color', defaultValue: '#967259' },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Symbols & Icons"
          enabled={options.symbols?.enabled}
          onToggleEnabled={(enabled) => updateSection('symbols', { enabled })}
          disabled={disabled}
        >
          <EditableOptionsEditor
            items={options.symbols?.options || []}
            onChange={(next) => updateOptionsList('symbols', next)}
            disabled={disabled}
            addLabel="Add symbol"
            createItem={(index) => ({
              id: `symbol-${index + 1}`,
              label: `Symbol ${index + 1}`,
              icon: '★',
            })}
            fields={[
              { key: 'label', label: 'Symbol name', placeholder: 'e.g. Heart' },
              { key: 'icon', label: 'Icon / emoji', placeholder: 'e.g. ♥' },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Gift Options"
          enabled={options.giftOptions?.enabled}
          onToggleEnabled={(enabled) => updateSection('giftOptions', { enabled })}
          disabled={disabled}
        >
          <EditableOptionsEditor
            items={options.giftOptions?.options || []}
            onChange={(next) => updateOptionsList('giftOptions', next)}
            disabled={disabled}
            addLabel="Add gift option"
            createItem={(index) => ({
              id: `gift-${index + 1}`,
              label: `Gift option ${index + 1}`,
              price: 0,
            })}
            fields={[
              { key: 'label', label: 'Gift name', placeholder: 'e.g. Premium Gift Box' },
              { key: 'price', label: 'Price (PKR)', type: 'number', min: 0, defaultValue: 0 },
            ]}
          />
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
