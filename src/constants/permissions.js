import { ADMIN_PANEL_ROLES, SHIPPING_ADMIN_ROLES } from './roles.js';

/**
 * Frontend permission helpers aligned with EXISTING backend middleware.
 *
 * Limitation (do not guess beyond this):
 * Backend grants SUPER_ADMIN / ADMIN / MANAGER / STAFF equal access to all
 * admin panel modules (catalog, campaigns, promos, orders list/status, etc.).
 * The only verified backend role split is shipment tracking mutation
 * (SUPER_ADMIN | ADMIN). Therefore frontend must NOT invent module-level
 * hide rules for STAFF/MANAGER — that would falsely block APIs they can call.
 */

export const canAccessAdminPanel = (role) =>
  Boolean(role) && ADMIN_PANEL_ROLES.includes(role);

export const canManageShipping = (role) =>
  Boolean(role) && SHIPPING_ADMIN_ROLES.includes(role);

export const hasAnyRole = (role, allowedRoles = []) =>
  Boolean(role) && Array.isArray(allowedRoles) && allowedRoles.includes(role);
