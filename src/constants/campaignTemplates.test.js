/**
 * Campaign template unit checks (no API, no campaign creation).
 * Run: npm run test:campaign-templates
 */
import assert from 'assert';
import {
  applyCampaignTemplate,
  BLANK_CAMPAIGN_FORM,
  CUSTOM_TEMPLATE_ID,
  getCampaignTemplate,
  isCampaignFormEqual,
  listCampaignTemplates,
} from './campaignTemplates.js';

console.log('Running campaign template checks...');

const templates = listCampaignTemplates();
assert.ok(templates.length >= 10, 'expected core templates including custom');
assert.ok(templates.every((t) => t.id && t.label), 'templates need id + label');

{
  const azadi = applyCampaignTemplate('azadi-sale');
  assert.strictEqual(azadi.createdCampaign, false);
  assert.strictEqual(azadi.form.name, 'Azadi Sale');
  assert.strictEqual(azadi.form.discountType, 'percentage');
  assert.strictEqual(Number(azadi.form.discountValue), 20);
  assert.strictEqual(azadi.form.announcementText.includes('Azadi'), true);
  assert.strictEqual(azadi.form.badgeText, '20% OFF');
  assert.strictEqual(azadi.form.heroTitle, 'Azadi Sale');
  assert.strictEqual(azadi.form.showHomeSection, true);
  assert.strictEqual(azadi.form.showCountdown, true);
  assert.strictEqual(azadi.form.status, 'draft');
  assert.ok(azadi.form.startAtLocal, 'suggested start filled');
  assert.ok(azadi.form.endAtLocal, 'suggested end filled');
}

{
  const sale = applyCampaignTemplate('11-11-sale');
  assert.strictEqual(sale.createdCampaign, false);
  assert.strictEqual(sale.form.name, '11.11 Sale');
  assert.strictEqual(Number(sale.form.discountValue), 20);
  assert.strictEqual(sale.form.homeCtaText, 'SHOP THE SALE');
  assert.strictEqual(sale.form.announcementText.includes('11.11'), true);
  assert.strictEqual(sale.form.status, 'draft');
}

{
  const flash = applyCampaignTemplate('flash-sale');
  assert.strictEqual(flash.createdCampaign, false);
  assert.strictEqual(flash.form.name, 'Flash Sale');
  assert.strictEqual(Number(flash.form.discountValue), 15);
  assert.strictEqual(flash.form.badgeText, 'FLASH SALE');
  assert.strictEqual(flash.form.showCountdown, true);
  assert.strictEqual(flash.form.status, 'draft');
  const tpl = getCampaignTemplate('flash-sale');
  assert.strictEqual(tpl.suggestedDurationHours, 24);
}

{
  const custom = applyCampaignTemplate(CUSTOM_TEMPLATE_ID, {
    baseForm: { ...BLANK_CAMPAIGN_FORM, timezone: 'Asia/Karachi' },
  });
  assert.strictEqual(custom.createdCampaign, false);
  assert.strictEqual(custom.form.name, '');
  assert.strictEqual(custom.form.discountValue, '');
  assert.strictEqual(custom.form.announcementText, '');
  assert.strictEqual(custom.form.startAtLocal, '');
  assert.strictEqual(custom.form.endAtLocal, '');
  assert.strictEqual(custom.form.status, 'draft');
  assert.ok(isCampaignFormEqual(custom.form, { ...BLANK_CAMPAIGN_FORM, timezone: 'Asia/Karachi' }));
}

{
  const applied = applyCampaignTemplate('azadi-sale');
  const overridden = {
    ...applied.form,
    discountValue: 30,
    announcementText: 'Custom announcement',
    startAtLocal: '2026-08-14T00:00',
    endAtLocal: '2026-08-15T23:59',
  };
  assert.strictEqual(Number(overridden.discountValue), 30);
  assert.strictEqual(overridden.announcementText, 'Custom announcement');
  assert.notStrictEqual(overridden.startAtLocal, applied.form.startAtLocal);
  assert.strictEqual(isCampaignFormEqual(overridden, applied.form), false);
}

{
  const beforeCount = listCampaignTemplates().length;
  applyCampaignTemplate('black-friday');
  applyCampaignTemplate('eid-sale');
  assert.strictEqual(listCampaignTemplates().length, beforeCount, 'apply does not mutate template list');
}

console.log('Campaign template checks passed.');
