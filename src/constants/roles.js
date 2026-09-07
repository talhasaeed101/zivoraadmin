/**
 * Mirrors backend `zivorabackend/src/constants/roles.js`.
 * Do not invent additional roles here.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
};

/** Matches backend `adminMiddleware` ADMIN_PANEL_ROLES. */
export const ADMIN_PANEL_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.STAFF,
];

/**
 * Matches backend `shippingAdminMiddleware` SHIPPING_ADMIN_ROLES.
 * Only these roles may call PATCH /admin/orders/:id/shipping.
 */
export const SHIPPING_ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];
