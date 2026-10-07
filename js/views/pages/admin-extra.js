import { html } from '../../utils/html.js';
import { icon } from '../../components/icons.js';
import { badge, button, card, metricsGrid, sectionHead } from '../../components/ui.js';
import { pageHeader } from '../../components/page-header.js';
import { tableWrapper } from '../../components/tables.js';
import { ROLES } from '../../config/roles.js';
import { PERMISSIONS, DEFAULT_RBAC } from '../../modules/access-control.js';
import { page } from './page-layout.js';

const ROLE_VALUES = Object.values(ROLES);

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function roleSelect(user) {
  return html`<label class="sr-only" for="role-${user.id}">Papel de ${user.name}</label><select id="role-${user.id}" class="rbac-role-select" data-action="rbac-user-role" data-user-id="${user.id}">${ROLE_VALUES.map((role) => html`<option value="${role}"${role === user.role ? ' selected' : ''}>${role}</option>`)}</select>`;
}

function rolePermissionCount(snapshot, role) {
  return snapshot.rolePermissions?.[role]?.length ?? 0;
}

function permissionMatrix(snapshot) {
  const header = ['Permissão', ...ROLE_VALUES].map((label) => html`<th>${label}</th>`);
  const rows = PERMISSIONS.map((permission) => html`<tr>
    <td><strong>${permission.label}</strong><small class="cell-note">${permission.area}</small></td>
    ${ROLE_VALUES.map((role) => {
      const required = role === ROLES.ADMIN;
      const checked = required || snapshot.rolePermissions?.[role]?.includes(permission.key);
      return html`<td class="permission-cell"><label><input type="checkbox" aria-label="${permission.label} — ${role}" data-action="rbac-permission" data-role="${role}" data-permission="${permission.key}"${checked ? ' checked' : ''}${required ? ' disabled title="Acesso total obrigatório para preservar a administração do protótipo"' : ''}><span>${checked ? 'Permitido' : 'Sem acesso'}</span></label></td>`;
    })}
  </tr>`);
  return html`<div class="table-scroll"><table class="permission-matrix"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function rbacPage({ rbac = DEFAULT_RBAC, rbacMessage = '' } = {}) {
  const snapshot = rbac.users ? rbac : DEFAULT_RBAC;
  const users = snapshot.users || [];
  const userRows = users.map((user) => html`<tr>
    <td><strong>${user.name}</strong><small class="cell-note">${user.email}</small></td>
    <td>${roleSelect(user)}</td>
    <td>${badge(user.status, user.status === 'Ativo' ? 'success' : 'danger')}</td>
  </tr>`);
  const roleCards = ROLE_VALUES.map((role) => card(
    html`<div class="rbac-role-card-icon">${icon(role === ROLES.ADMIN ? 'lock' : role === ROLES.ANALYST ? 'activity' : 'leaf')}</div><div><span>Papel</span><strong>${role}</strong><small>${users.filter((user) => user.role === role).length} usuários · ${rolePermissionCount(snapshot, role)} permissões</small></div>`,
    'rbac-role-card',
  ));
  const roleOptions = ROLE_VALUES.map((role) => html`<option value="${role}">${role}</option>`);
  return page(
    pageHeader({ title: 'Permissões e RBAC', subtitle: 'Associe pessoas a papéis e escolha o que cada papel pode acessar.', varietyMode: 'hidden' }),
    html`<div class="security-notice">${icon('lock', 17)}<span>Esta matriz controla a navegação da demonstração no navegador. Ela não substitui a autorização no servidor, que não existe neste projeto.</span></div>`,
    metricsGrid([
      { icon: 'users', label: 'Usuários', value: users.length, meta: 'Contas cadastradas', tone: 'blue' },
      { icon: 'lock', label: 'Papéis disponíveis', value: ROLE_VALUES.length, meta: 'Produtor, Analista e Administrador' },
      { icon: 'check', label: 'Permissões descritas', value: PERMISSIONS.length, meta: 'Separadas por área', tone: 'purple' },
    ], 'four'),
    html`<div class="rbac-role-grid">${roleCards}</div>`,
    card(
      html`${sectionHead({ title: 'Usuários e papéis', subtitle: 'A alteração é salva neste navegador e vale no próximo acesso.' })}
        ${rbacMessage && html`<p class="form-feedback" role="status">${rbacMessage}</p>`}
        ${tableWrapper(['Usuário', 'Papel atribuído', 'Situação'], userRows)}
        <form class="rbac-add-user" data-form="rbac-user"><h3>Adicionar usuário à demonstração</h3><div class="form-grid"><label class="field"><span>Nome</span><input name="name" required minlength="2" placeholder="Nome completo"></label><label class="field"><span>E-mail</span><input name="email" type="email" required placeholder="nome@empresa.com"></label><label class="field"><span>Papel inicial</span><select name="role">${roleOptions}</select></label><button type="submit" class="btn btn-primary">${icon('plus', 16)} Adicionar usuário</button></div></form>`,
      'table-card',
    ),
    card(
      html`${sectionHead({ title: 'Matriz de permissões', subtitle: 'Marque ou desmarque acessos por papel. O papel Administrador mantém acesso total.' })}${permissionMatrix(snapshot)}`,
      'table-card permission-card',
    ),
  );
}

const SECURITY_OPTIONS = [
  ['strongPasswords', 'Exigir senha forte', 'Recomendação de senha com letras, números e símbolos.'],
  ['requireMfa', 'Exigir autenticação em duas etapas', 'Preferência registrada; não há provedor de MFA conectado.'],
  ['notifyNewLogin', 'Avisar sobre novo acesso', 'Opção de alerta para novos acessos à conta.'],
  ['lockAfterFailures', 'Bloquear após tentativas repetidas', 'Política configurável para uma futura autenticação no servidor.'],
];

export function securityPage({ settings, auditLogs = [] } = {}) {
  const security = settings?.security ?? {};
  const deniedAttempts = auditLogs.filter((event) => event.resource === 'Sessão' && event.status !== 'Concluído');
  const latestDenied = deniedAttempts[0];
  const options = SECURITY_OPTIONS.map(([key, label, description]) => html`<label class="security-option"><span class="security-option-copy"><strong>${label}</strong><small>${description}</small></span><input type="checkbox" name="${key}" data-setting="security.${key}"${security[key] ? ' checked' : ''}><span class="toggle-track" aria-hidden="true"></span></label>`);
  return page(
    pageHeader({ title: 'Segurança', subtitle: 'Preferências de proteção, política de senha e duração de sessão.', varietyMode: 'hidden' }),
    metricsGrid([
      { icon: 'shield', label: 'Política de senha forte', value: security.strongPasswords ? 'Ativa' : 'Desativada', meta: 'Preferência do administrador', tone: 'green' },
      { icon: 'lock', label: 'Autenticação em duas etapas', value: security.requireMfa ? 'Solicitada' : 'Não solicitada', meta: 'Sem provedor MFA conectado', tone: 'blue' },
      { icon: 'clock', label: 'Duração da sessão', value: `${security.sessionTimeout || '30'} min`, meta: 'Configuração local', tone: 'purple' },
      { icon: 'bell', label: 'Aviso de novo acesso', value: security.notifyNewLogin ? 'Ativo' : 'Desativado', meta: 'Preferência salva', tone: 'orange' },
    ], 'four'),
    card(
      html`${sectionHead({ title: 'Políticas de acesso', subtitle: 'Edite e salve as preferências de segurança.' })}
        <form class="security-form" data-form="settings"><div class="security-options">${options}</div>
          <label class="field security-timeout"><span>Tempo máximo de sessão</span><select name="sessionTimeout" data-setting="security.sessionTimeout"><option value="15"${security.sessionTimeout === '15' ? ' selected' : ''}>15 minutos</option><option value="30"${security.sessionTimeout === '30' ? ' selected' : ''}>30 minutos</option><option value="60"${security.sessionTimeout === '60' ? ' selected' : ''}>60 minutos</option><option value="120"${security.sessionTimeout === '120' ? ' selected' : ''}>2 horas</option></select></label>
          <div class="security-alert">${icon(latestDenied ? 'warning' : 'shield', 17)}<div><strong>${latestDenied ? `${deniedAttempts.length} tentativa(s) de acesso negada(s)` : 'Sem alertas de segurança registrados'}</strong><span>${latestDenied ? `${latestDenied.user} · ${formatDateTime(latestDenied.occurredAt)} · ${latestDenied.details}` : 'Os eventos de acesso e alterações ficam disponíveis em Logs do Sistema.'}</span></div></div>
          <p class="security-disclaimer">A autenticação deste protótipo é demonstrativa: não valida senha e não aplica essas políticas a um servidor.</p>
          <div class="button-row end"><button type="submit" class="btn btn-primary">Salvar preferências</button></div>
        </form>`,
      'table-card security-card',
    ),
  );
}

function rowMarkup(event, expanded) {
  const detailRow = expanded ? html`<tr class="log-detail-row"><td colspan="7"><div><strong>Detalhes do evento</strong><p>${event.details || 'Nenhum detalhe adicional informado.'}</p><small>Origem: ${event.source} · ID: ${event.id}</small></div></td></tr>` : '';
  return html`<tr><td><strong>${event.user}</strong></td><td>${event.action}</td><td>${event.resource}</td><td>${formatDateTime(event.occurredAt)}</td><td>${event.source}</td><td>${badge(event.status, event.status === 'Concluído' ? 'success' : 'warning')}</td><td><button type="button" class="btn btn-ghost" data-action="toggle-log-details" data-id="${event.id}" aria-expanded="${expanded}">${expanded ? 'Fechar' : 'Detalhes'}</button></td></tr>${detailRow}`;
}

export function systemLogsPage({ auditLogs = [], logSearch = '', logStatus = 'Todos', logResource = 'Todos', logSort = 'newest', expandedLogId = null } = {}) {
  let events = auditLogs.filter((event) => {
    const haystack = [event.user, event.action, event.resource, event.details, event.source].join(' ').toLocaleLowerCase('pt-BR');
    const matchesText = !logSearch || haystack.includes(logSearch.toLocaleLowerCase('pt-BR'));
    const matchesStatus = logStatus === 'Todos' || event.status === logStatus;
    const matchesResource = logResource === 'Todos' || event.resource === logResource;
    return matchesText && matchesStatus && matchesResource;
  });
  events = events.slice().sort((a, b) => logSort === 'oldest' ? new Date(a.occurredAt) - new Date(b.occurredAt) : new Date(b.occurredAt) - new Date(a.occurredAt));
  const resources = ['Todos', ...new Set(auditLogs.map((event) => event.resource))];
  const statusOptions = ['Todos', 'Concluído', 'Falhou'];
  const rows = events.map((event) => rowMarkup(event, expandedLogId === event.id));
  return page(
    pageHeader({ title: 'Logs do Sistema', subtitle: 'Auditoria: consulte quem fez o quê, quando e em qual recurso.', varietyMode: 'hidden' }),
    metricsGrid([
      { icon: 'logs', label: 'Eventos registrados', value: auditLogs.length, meta: 'Guardados neste navegador' },
      { icon: 'check', label: 'Operações concluídas', value: auditLogs.filter((event) => event.status === 'Concluído').length, meta: 'Com status registrado', tone: 'green' },
      { icon: 'clock', label: 'Eventos nesta consulta', value: events.length, meta: 'Após aplicar os filtros', tone: 'blue' },
    ], 'four'),
    card(
      html`<form class="toolbar log-filters" data-form="filter-logs"><label class="searchbox">${icon('search')}<input name="search" value="${logSearch}" placeholder="Buscar usuário, ação ou recurso" aria-label="Buscar logs"></label>
        <label class="field compact"><span>Status</span><select name="status">${statusOptions.map((status) => html`<option value="${status}"${status === logStatus ? ' selected' : ''}>${status === 'Todos' ? 'Todos os status' : status}</option>`)}</select></label>
        <label class="field compact"><span>Recurso</span><select name="resource">${resources.map((resource) => html`<option value="${resource}"${resource === logResource ? ' selected' : ''}>${resource === 'Todos' ? 'Todos os recursos' : resource}</option>`)}</select></label>
        <button type="submit" class="btn btn-primary">Aplicar filtros</button><button type="button" class="btn btn-secondary" data-action="clear-log-filters">Limpar</button></form>
        <div class="log-toolbar"><span>${events.length} ${events.length === 1 ? 'evento encontrado' : 'eventos encontrados'}</span><button type="button" class="btn btn-ghost" data-action="sort-logs">${icon('activity', 15)} ${logSort === 'newest' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}</button></div>
        ${events.length ? tableWrapper(['Usuário responsável', 'Ação realizada', 'Recurso afetado', 'Data e hora', 'Origem', 'Status', 'Detalhes'], rows) : html`<div class="empty-state"><span>${icon('logs')}</span><strong>Nenhum evento encontrado</strong><small>As alterações realizadas no protótipo serão registradas aqui.</small></div>`}`,
      'table-card log-card',
    ),
    html`<p class="log-retention-note">Os registros são armazenados localmente neste navegador (até 500 eventos). Não existe serviço de auditoria no servidor neste projeto.</p>`,
  );
}
