import { ROLES } from '../config/roles.js';
import { findRbacUserByEmail } from './access-control.js';

/**
 * Autenticação apenas demonstrativa: o perfil vem da associação RBAC do e-mail.
 * E-mails não cadastrados ficam no perfil Produtor. Não há senha validada nem
 * servidor de identidade neste projeto.
 */
export function resolveRole(email) {
  const assignedUser = findRbacUserByEmail(String(email ?? '').trim().toLowerCase());
  return assignedUser?.role ?? ROLES.PRODUCER;
}
