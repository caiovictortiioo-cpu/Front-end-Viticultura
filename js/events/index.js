import { ACCOUNTS, NAVIGATION, ROLES } from '../config/roles.js';
import { resolveRole } from '../modules/auth.js';
import { canAccessPage, findRbacUserByEmail, addRbacUser, assignUserRole, setRolePermission } from '../modules/access-control.js';
import { recordAuditEvent } from '../modules/audit.js';
import { createPlantation as registerPlantation, getPlantations, recordHarvest } from '../modules/plantations.js';
import { getSettings, saveSettings } from '../modules/settings.js';
import { buildAnalystCsv } from '../views/pages/analyst.js';
import { buildProducerCsv } from '../views/pages/plantations.js';
import { getState, resetState, setState } from '../state/store.js';

/** Eventos delegados do app, mantidos fora das views geradas. */

function actorName(state = getState()) {
  return findRbacUserByEmail(state.email)?.name || ACCOUNTS[state.role]?.name || state.email || 'Usuário';
}

function addAudit({ action, resource, details = '', status = 'Concluído' }) {
  const state = getState();
  return recordAuditEvent({ actor: actorName(state), action, resource, details, status, source: 'Painel web' });
}

function fillDemoEmail(email) {
  setState({ email, authMessage: '' });
  const emailInput = document.querySelector('#login-email');
  if (emailInput) emailInput.value = email;
}

function login() {
  const { email } = getState();
  const assignedUser = findRbacUserByEmail(email);
  if (assignedUser?.status === 'Bloqueado') {
    const auditLogs = recordAuditEvent({ actor: assignedUser.name, action: 'Tentou acessar uma conta bloqueada', resource: 'Sessão', details: 'Acesso negado pelo status da conta.', status: 'Falhou', source: 'Tela de login' });
    setState({ authMessage: 'Esta conta está bloqueada. Peça a um administrador para revisar o acesso.', auditLogs });
    return;
  }
  const role = resolveRole(email);
  const page = NAVIGATION[role].find((item) => canAccessPage(role, item.label))?.label || NAVIGATION[role][0].label;
  const auditLogs = recordAuditEvent({
    actor: findRbacUserByEmail(email)?.name || ACCOUNTS[role]?.name || email,
    action: 'Iniciou sessão',
    resource: 'Sessão',
    details: `Acesso como ${role}.`,
    source: 'Painel web',
  });
  setState({ authenticated: true, role, page, auditLogs, authMessage: '', menuOpen: false, producerMessage: '', settingsMessage: '', rbacMessage: '' });
}

function navigate(element) {
  const { role } = getState();
  const page = element.dataset.page;
  if (!NAVIGATION[role]?.some((item) => item.label === page) || !canAccessPage(role, page)) return;
  setState({ page, menuOpen: false });
}

function downloadCsv(filename, csv) {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') return false;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

function createPlantation(form) {
  const state = getState();
  if (state.role !== ROLES.PRODUCER || !canAccessPage(state.role, 'Minhas Plantações')) return;
  try {
    const data = new FormData(form);
    const plantation = registerPlantation({
      variety: data.get('variety'),
      quantity: data.get('quantity'),
      field: data.get('field'),
      notes: data.get('notes'),
    }, actorName(state));
    const auditLogs = addAudit({
      action: 'Cadastrou uma plantação',
      resource: 'Plantações',
      details: `${plantation.variety} · ${plantation.quantity.toLocaleString('pt-BR')} plantas · início em ${plantation.plantedAt}.`,
    });
    setState({ plantations: getPlantations(), auditLogs, producerMessage: 'Plantação cadastrada. A data de início foi registrada automaticamente.' });
  } catch (error) {
    setState({ producerMessage: error.message || 'Não foi possível cadastrar a plantação.' });
  }
}

function harvestPlantation(element) {
  const state = getState();
  if (state.role !== ROLES.PRODUCER) return;
  try {
    const plantation = recordHarvest(element.dataset.id, actorName(state));
    const auditLogs = addAudit({
      action: 'Registrou a colheita',
      resource: 'Plantações',
      details: `${plantation.variety} · colheita registrada em ${plantation.harvestedAt}.`,
    });
    setState({ plantations: getPlantations(), auditLogs, producerMessage: 'Colheita registrada. A data e o status foram atualizados.' });
  } catch (error) {
    setState({ producerMessage: error.message || 'Não foi possível registrar a colheita.' });
  }
}

function setDeep(target, path, value) {
  const keys = path.split('.');
  let current = target;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) current[key] = value;
    else {
      current[key] ??= {};
      current = current[key];
    }
  });
}

function saveSettingsForm(form) {
  const state = getState();
  if (state.role !== ROLES.ADMIN) return;
  const patch = {};
  form.querySelectorAll('[data-setting]').forEach((control) => {
    const value = control.type === 'checkbox' ? control.checked : control.value;
    setDeep(patch, control.dataset.setting, value);
  });
  const settings = saveSettings(patch);
  const auditLogs = addAudit({ action: 'Atualizou configurações', resource: 'Configurações', details: 'Preferências da plataforma salvas neste navegador.' });
  setState({
    settings,
    theme: settings.appearance.theme,
    variety: settings.general.defaultVariety,
    auditLogs,
    settingsMessage: 'Alterações salvas com sucesso neste navegador.',
  });
}

function saveTheme(target) {
  const theme = target.value === 'dark' ? 'dark' : 'light';
  const settings = saveSettings({ appearance: { theme } });
  const auditLogs = addAudit({ action: `Alterou o tema para ${theme === 'dark' ? 'escuro' : 'claro'}`, resource: 'Configurações', details: 'Preferência de aparência aplicada a todas as páginas.' });
  setState({ theme, settings, auditLogs, settingsMessage: '' });
}

function assignRole(target) {
  if (getState().role !== ROLES.ADMIN) return;
  try {
    const rbac = assignUserRole(target.dataset.userId, target.value);
    const user = rbac.users.find((entry) => entry.id === target.dataset.userId);
    const auditLogs = addAudit({ action: 'Alterou o papel de um usuário', resource: 'Permissões e RBAC', details: `${user?.name || target.dataset.userId} agora tem o papel ${target.value}.` });
    setState({ rbac, auditLogs, rbacMessage: 'Papel atualizado. A nova associação vale no próximo acesso.' });
  } catch (error) {
    setState({ rbacMessage: error.message || 'Não foi possível alterar o papel.' });
  }
}

function updateRolePermission(target) {
  if (getState().role !== ROLES.ADMIN) return;
  try {
    const rbac = setRolePermission(target.dataset.role, target.dataset.permission, target.checked);
    const permissionLabel = target.getAttribute('aria-label')?.split(' — ')[0] || target.dataset.permission;
    const auditLogs = addAudit({
      action: `${target.checked ? 'Concedeu' : 'Removeu'} uma permissão`,
      resource: 'Permissões e RBAC',
      details: `${permissionLabel} no papel ${target.dataset.role}.`,
    });
    setState({ rbac, auditLogs, rbacMessage: 'Matriz de permissões atualizada.' });
  } catch (error) {
    setState({ rbacMessage: error.message || 'Não foi possível alterar a permissão.' });
  }
}

function addUser(form) {
  if (getState().role !== ROLES.ADMIN) return;
  try {
    const values = new FormData(form);
    const rbac = addRbacUser({ name: values.get('name'), email: values.get('email'), role: values.get('role') });
    const added = rbac.users[0];
    const auditLogs = addAudit({ action: 'Cadastrou um usuário', resource: 'Usuários', details: `${added.name} · ${added.email} · papel ${added.role}.` });
    setState({ rbac, auditLogs, rbacMessage: 'Usuário adicionado. O acesso desta demonstração será definido pelo e-mail.' });
  } catch (error) {
    setState({ rbacMessage: error.message || 'Não foi possível adicionar o usuário.' });
  }
}

function submitLogFilters(form) {
  const data = new FormData(form);
  setState({ logSearch: String(data.get('search') || '').trim(), logStatus: data.get('status') || 'Todos', logResource: data.get('resource') || 'Todos', expandedLogId: null });
}

function handleClick(event) {
  const element = event.target.closest('[data-action]');
  if (!element) return;
  const action = element.dataset.action;
  if (action === 'navigate') return navigate(element);
  if (action === 'open-menu') return setState({ menuOpen: true });
  if (action === 'close-menu') return setState({ menuOpen: false });
  if (action === 'logout') {
    const auditLogs = addAudit({ action: 'Encerrou sessão', resource: 'Sessão', details: 'Logout realizado.' });
    setState({ auditLogs });
    return resetState();
  }
  if (action === 'toggle-theme') return saveTheme({ value: getState().theme === 'dark' ? 'light' : 'dark' });
  if (action === 'auth-mode') return setState({ authMode: element.dataset.mode });
  if (action === 'demo-login') return fillDemoEmail(element.dataset.email);
  if (action === 'harvest-plantation') return harvestPlantation(element);
  if (action === 'settings-section') return setState({ settingsSection: element.dataset.section, settingsMessage: '' });
  if (action === 'cancel-settings') return setState({ settings: getSettings(), theme: getSettings().appearance.theme, settingsSection: 'Geral', settingsMessage: 'Alterações não salvas foram descartadas.' });
  if (action === 'design-interaction') return setState({ designMessage: element.dataset.message || 'Interação concluída.' });
  if (action === 'toggle-log-details') return setState({ expandedLogId: getState().expandedLogId === element.dataset.id ? null : element.dataset.id });
  if (action === 'sort-logs') return setState({ logSort: getState().logSort === 'newest' ? 'oldest' : 'newest' });
  if (action === 'clear-log-filters') return setState({ logSearch: '', logStatus: 'Todos', logResource: 'Todos', expandedLogId: null });
  if (action === 'download-analyst-report') {
    const state = getState();
    if (state.role !== ROLES.ANALYST) return;
    const downloaded = downloadCsv('relatorio-analitico-agroclima.csv', buildAnalystCsv(state.plantations));
    const auditLogs = addAudit({ action: downloaded ? 'Gerou relatório CSV' : 'Solicitou relatório CSV', resource: 'Relatórios', details: 'Resumo por variedade, clima de referência e plantações cadastradas.' });
    return setState({ auditLogs });
  }
  if (action === 'download-producer-report') {
    const state = getState();
    if (state.role !== ROLES.PRODUCER) return;
    const downloaded = downloadCsv('relatorio-de-plantacoes.csv', buildProducerCsv(state.plantations));
    const auditLogs = addAudit({ action: downloaded ? 'Baixou relatório de plantações' : 'Solicitou relatório de plantações', resource: 'Relatórios', details: 'Resumo de variedade, quantidade, início, colheita e status.' });
    return setState({ auditLogs });
  }
  if (action === 'run-demo-analysis') {
    const state = getState();
    if (state.role !== ROLES.ANALYST) return;
    const auditLogs = addAudit({ action: 'Executou análise demonstrativa', resource: 'Análises', details: 'Ação local; não foi acionado um serviço de análise externo.' });
    return setState({ auditLogs, modelMessage: 'Análise demonstrativa executada. Nenhum serviço externo foi acionado.' });
  }
  if (action === 'save-demo-model') {
    const state = getState();
    if (state.role !== ROLES.ANALYST) return;
    const auditLogs = addAudit({ action: 'Solicitou salvar configuração do modelo', resource: 'Análises', details: 'Ação demonstrativa; não há serviço de modelo conectado.' });
    return setState({ auditLogs, modelMessage: 'A configuração é apenas demonstrativa e não foi enviada a um serviço externo.' });
  }
}

function handleChange({ target }) {
  if (target.matches('select[data-action="change-variety"]')) {
    setState({ variety: target.value });
    return;
  }
  if (target.matches('select[data-locked-value]')) {
    target.value = target.dataset.lockedValue;
    return;
  }
  if (target.matches('input[data-action="change-theme"]')) {
    saveTheme(target);
    return;
  }
  if (target.matches('select[data-action="rbac-user-role"]')) {
    assignRole(target);
    return;
  }
  if (target.matches('input[data-action="rbac-permission"]')) updateRolePermission(target);
}

function handleInput({ target }) {
  if (target.matches('#login-email')) setState({ email: target.value });
}

function handleSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const action = form.dataset.form;
  if (action === 'login') return login();
  if (action === 'signup' || action === 'forgot') return setState({ authMode: 'login' });
  if (action === 'create-plantation') return createPlantation(form);
  if (action === 'settings') return saveSettingsForm(form);
  if (action === 'rbac-user') return addUser(form);
  if (action === 'filter-logs') return submitLogFilters(form);
}

export function bindEvents(root) {
  root.addEventListener('click', handleClick);
  root.addEventListener('change', handleChange);
  root.addEventListener('input', handleInput);
  root.addEventListener('submit', handleSubmit);
}
