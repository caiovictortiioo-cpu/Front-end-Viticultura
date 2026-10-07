import { ROLES } from '../config/roles.js';
import { loadRbac, saveRbac } from '../data/local-repository.js';

/** Permissões do protótipo. A autorização real precisa ser repetida no servidor. */
export const PERMISSIONS = Object.freeze([
  { key: 'overview.view', label: 'Ver painéis e visão geral', area: 'Painéis' },
  { key: 'plantations.manage', label: 'Cadastrar e atualizar plantações', area: 'Plantações' },
  { key: 'monitoring.view', label: 'Consultar monitoramento climático', area: 'Monitoramento' },
  { key: 'analytics.view', label: 'Consultar análises e modelos', area: 'Análises' },
  { key: 'reports.view', label: 'Consultar e gerar relatórios', area: 'Relatórios' },
  { key: 'users.manage', label: 'Consultar e gerenciar usuários', area: 'Usuários' },
  { key: 'rbac.manage', label: 'Gerenciar papéis e permissões', area: 'Permissões e RBAC' },
  { key: 'security.manage', label: 'Consultar políticas de segurança', area: 'Segurança' },
  { key: 'logs.read', label: 'Consultar registros de auditoria', area: 'Logs do Sistema' },
  { key: 'settings.manage', label: 'Alterar configurações do sistema', area: 'Configurações' },
  { key: 'design.manage', label: 'Visualizar e testar componentes', area: 'Design System' },
  { key: 'integrations.manage', label: 'Consultar integrações', area: 'Integrações' },
]);

const ALL_PERMISSION_KEYS = PERMISSIONS.map(({ key }) => key);

export const DEFAULT_RBAC = Object.freeze({
  users: [
    { id: 'user-mariana', name: 'Mariana Costa', email: 'produtor@agroclima.com', role: ROLES.PRODUCER, status: 'Ativo' },
    { id: 'user-rafael', name: 'Rafael Nunes', email: 'analista@agroclima.com', role: ROLES.ANALYST, status: 'Ativo' },
    { id: 'user-carlos', name: 'Carlos Almeida', email: 'admin@agroclima.com', role: ROLES.ADMIN, status: 'Ativo' },
    { id: 'user-luciana', name: 'Luciana Freire', email: 'luciana@frutasul.com', role: ROLES.PRODUCER, status: 'Bloqueado' },
  ],
  rolePermissions: {
    [ROLES.PRODUCER]: ['overview.view', 'plantations.manage', 'monitoring.view', 'analytics.view', 'reports.view'],
    [ROLES.ANALYST]: ['overview.view', 'monitoring.view', 'analytics.view', 'reports.view', 'integrations.manage'],
    [ROLES.ADMIN]: ALL_PERMISSION_KEYS,
  },
});

function validRole(role) {
  return Object.values(ROLES).includes(role);
}

function normalizeRbac(saved) {
  const seed = JSON.parse(JSON.stringify(DEFAULT_RBAC));
  if (!saved || typeof saved !== 'object') return seed;

  const validUsers = Array.isArray(saved.users) ? saved.users : seed.users;
  const users = validUsers
    .filter((user) => user && typeof user.email === 'string' && typeof user.name === 'string')
    .map((user, index) => ({
      id: String(user.id || `user-${index + 1}`),
      name: user.name.trim() || 'Usuário',
      email: user.email.trim().toLowerCase(),
      role: validRole(user.role) ? user.role : ROLES.PRODUCER,
      status: user.status === 'Bloqueado' ? 'Bloqueado' : 'Ativo',
    }));

  const rolePermissions = { ...seed.rolePermissions };
  Object.values(ROLES).forEach((role) => {
    const requested = saved.rolePermissions?.[role];
    if (Array.isArray(requested)) {
      rolePermissions[role] = requested.filter((key) => ALL_PERMISSION_KEYS.includes(key));
    }
  });
  // O papel de administrador permanece como papel de controle total.
  rolePermissions[ROLES.ADMIN] = ALL_PERMISSION_KEYS;
  return { users, rolePermissions };
}

export function getRbacSnapshot() {
  return normalizeRbac(loadRbac(DEFAULT_RBAC));
}

function persist(snapshot) {
  const normalized = normalizeRbac(snapshot);
  saveRbac(normalized);
  return normalized;
}

export const getRbacUsers = () => getRbacSnapshot().users;

export function findRbacUserByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase();
  return getRbacUsers().find((user) => user.email === normalized) ?? null;
}

export function assignUserRole(userId, role) {
  if (!validRole(role)) throw new Error('Selecione um papel válido.');
  const snapshot = getRbacSnapshot();
  const user = snapshot.users.find((entry) => entry.id === userId);
  if (!user) throw new Error('Usuário não encontrado.');
  user.role = role;
  return persist(snapshot);
}

export function addRbacUser({ name, email, role }) {
  const cleanName = String(name ?? '').trim();
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  if (cleanName.length < 2) throw new Error('Informe o nome completo do usuário.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Informe um e-mail válido.');
  if (!validRole(role)) throw new Error('Selecione um papel válido.');

  const snapshot = getRbacSnapshot();
  if (snapshot.users.some((user) => user.email === cleanEmail)) throw new Error('Já existe um usuário com esse e-mail.');
  const id = globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  snapshot.users.unshift({ id, name: cleanName, email: cleanEmail, role, status: 'Ativo' });
  return persist(snapshot);
}

export function setRolePermission(role, permission, allowed) {
  if (!validRole(role)) throw new Error('Papel não encontrado.');
  if (!ALL_PERMISSION_KEYS.includes(permission)) throw new Error('Permissão não encontrada.');
  if (role === ROLES.ADMIN) throw new Error('As permissões do Administrador são obrigatórias neste protótipo.');

  const snapshot = getRbacSnapshot();
  const current = new Set(snapshot.rolePermissions[role] ?? []);
  if (allowed) current.add(permission);
  else current.delete(permission);
  snapshot.rolePermissions[role] = [...current];
  return persist(snapshot);
}

export function hasPermission(role, permission) {
  if (role === ROLES.ADMIN) return true;
  const snapshot = getRbacSnapshot();
  return snapshot.rolePermissions[role]?.includes(permission) ?? false;
}

const PAGE_PERMISSIONS = {
  'Visão Geral': 'overview.view',
  'Dashboard Analítico': 'analytics.view',
  'Dashboard Admin': 'overview.view',
  'Minhas Plantações': 'plantations.manage',
  'Monitoramento': 'monitoring.view',
  'Dados Climáticos': 'monitoring.view',
  'Previsões': 'analytics.view',
  'Mercado e Exportação': 'analytics.view',
  'Dados de Mercado': 'analytics.view',
  'Análise Comparativa': 'analytics.view',
  'Comparação': 'analytics.view',
  'Qualidade dos Dados': 'analytics.view',
  'Modelos Preditivos': 'analytics.view',
  'Histórico': 'reports.view',
  'Relatórios': 'reports.view',
  'Usuários': 'users.manage',
  'Permissões e RBAC': 'rbac.manage',
  Segurança: 'security.manage',
  'Logs do Sistema': 'logs.read',
  Configurações: 'settings.manage',
  'Design System': 'design.manage',
  Integrações: 'integrations.manage',
};

export function canAccessPage(role, page) {
  const permission = PAGE_PERMISSIONS[page];
  return !permission || hasPermission(role, permission);
}
