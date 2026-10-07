import { html } from '../../utils/html.js';
import { icon } from '../../components/icons.js';
import { badge, button, card, chartCard, metricsGrid, sectionHead } from '../../components/ui.js';
import { barChart, donutChart } from '../../components/charts.js';
import { pageHeader } from '../../components/page-header.js';
import { tableWrapper } from '../../components/tables.js';
import { page } from './page-layout.js';
import { ROLES } from '../../config/roles.js';
import { DEFAULT_RBAC } from '../../modules/access-control.js';

const hiddenVarietyHeader = (title, subtitle) => pageHeader({ title, subtitle, varietyMode: 'hidden' });

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

const SERVICES = [
  { name: 'Interface web', status: 'Disponível', detail: 'HTML · CSS · JS', icon: 'grid' },
  { name: 'Armazenamento', status: 'Local', detail: 'Neste navegador', icon: 'database' },
  { name: 'API / backend', status: 'Não conectado', detail: 'Não implementado', icon: 'server' },
  { name: 'Dados de clima', status: 'Demonstrativos', detail: 'Séries locais', icon: 'cloud' },
];

const EVENT_ICON = { 'Plantações': 'leaf', 'Relatórios': 'report', 'Usuários': 'users', 'Permissões e RBAC': 'lock', 'Segurança': 'shield', 'Configurações': 'settings', 'Sessão': 'lock' };

function serviceCards() {
  return html`<div class="services">${SERVICES.map(
    (service) => card(
      html`<div class="service-icon">${icon(service.icon)}</div><div><span>${service.name}</span><strong>${service.status}</strong></div>${badge(service.detail, service.status === 'Não conectado' ? 'neutral' : 'info')}`,
      'service-card',
    ),
  )}</div>`;
}

function recentActivity(auditLogs = []) {
  const items = auditLogs.slice(0, 4).map((event) => html`<div><span class="activity-symbol tone-blue">${icon(EVENT_ICON[event.resource] || 'activity')}</span><div><strong>${event.action}</strong><span>${event.user} · ${event.resource}</span></div><time>${formatDateTime(event.occurredAt)}</time></div>`);
  return card(
    html`${sectionHead({ title: 'Atividade recente', subtitle: 'Ações registradas para auditoria', action: button('Abrir logs', { variant: 'ghost', action: 'navigate', page: 'Logs do Sistema' }) })}${items.length ? html`<div class="activity-list">${items}</div>` : html`<div class="empty-state compact"><small>As ações realizadas na plataforma aparecerão aqui.</small></div>`}`,
    'table-card',
  );
}

export function adminDashboardPage({ auditLogs = [], rbac = DEFAULT_RBAC } = {}) {
  const users = rbac.users || [];
  const activeUsers = users.filter((user) => user.status === 'Ativo').length;
  const blockedUsers = users.length - activeUsers;
  const today = new Date();
  const sameDay = (left, right) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  const sessionsToday = auditLogs.filter((event) => event.action === 'Iniciou sessão' && sameDay(new Date(event.occurredAt), today)).length;
  const failedEvents = auditLogs.filter((event) => event.status !== 'Concluído').length;
  const roleCounts = Object.values(ROLES).map((role) => users.filter((user) => user.role === role).length);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });
  const sessionsByDay = days.map((day) => auditLogs.filter((event) => event.action === 'Iniciou sessão' && sameDay(new Date(event.occurredAt), day)).length);
  const dayLabels = days.map((date) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', ''));
  return page(
    hiddenVarietyHeader('Dashboard Administrativo', 'Resumo dos usuários e dos eventos registrados nesta demonstração.'),
    metricsGrid(
      [
        { icon: 'users', label: 'Usuários ativos', value: activeUsers, meta: `${users.length} contas cadastradas` },
        { icon: 'lock', label: 'Usuários bloqueados', value: blockedUsers, meta: 'Conforme cadastro local', tone: 'orange' },
        { icon: 'activity', label: 'Acessos hoje', value: sessionsToday, meta: 'Sessões registradas', tone: 'blue' },
        { icon: 'shield', label: 'Ações com falha', value: failedEvents, meta: 'Nos eventos de auditoria', tone: 'purple' },
      ],
      'four',
    ),
    serviceCards(),
    html`<div class="grid-2">${chartCard({ title: 'Acessos registrados', subtitle: 'Sessões registradas nos últimos sete dias', content: barChart(sessionsByDay, dayLabels) })}${chartCard({
      title: 'Usuários por papel',
      subtitle: `Distribuição das ${users.length} contas cadastradas`,
      content: donutChart({
        modifier: 'admin',
        total: String(users.length),
        caption: 'usuários',
        legend: [
          { tone: 'green', label: 'Produtores', value: String(roleCounts[0]) },
          { tone: 'blue', label: 'Analistas', value: String(roleCounts[1]) },
          { tone: 'gold', label: 'Administradores', value: String(roleCounts[2]) },
        ],
        segments: [
          { tone: 'green', value: roleCounts[0] },
          { tone: 'blue', value: roleCounts[1] },
          { tone: 'gold', value: roleCounts[2] },
        ],
      }),
    })}</div>`,
    recentActivity(auditLogs),
  );
}

const getInitials = (fullName) => fullName.split(' ').map((part) => part[0]).join('').slice(0, 2);

export function usersPage({ rbac = DEFAULT_RBAC } = {}) {
  const users = rbac.users || [];
  const activeUsers = users.filter((user) => user.status === 'Ativo').length;
  const blockedUsers = users.length - activeUsers;
  const rows = users.map(
    (user) => html`<tr><td><div class="user-cell"><span>${getInitials(user.name)}</span><strong>${user.name}</strong></div></td><td>${user.email}</td><td>${user.role}</td><td>${badge(user.status, user.status === 'Ativo' ? 'success' : 'danger')}</td><td>Não registrado</td><td>${button('Ajustar papel', { variant: 'ghost', action: 'navigate', page: 'Permissões e RBAC' })}</td></tr>`,
  );
  return page(
    hiddenVarietyHeader('Usuários', 'Consulte as contas e os papéis associados a cada pessoa.'),
    card(
      html`${sectionHead({ title: 'Contas da demonstração', subtitle: `${activeUsers} ativas · ${blockedUsers} bloqueadas` })}${tableWrapper(['Nome', 'E-mail', 'Papel', 'Status', 'Último acesso', 'Ações'], rows)}`,
      'table-card',
    ),
    html`<div class="admin-callout">${icon('lock', 17)}<span>Para adicionar pessoas ou alterar um papel, use <strong>Permissões e RBAC</strong>. Os papéis ficam salvos neste navegador.</span>${button('Gerenciar papéis', { variant: 'secondary', action: 'navigate', page: 'Permissões e RBAC' })}</div>`,
  );
}

const ARCHITECTURE_STEPS = [
  { name: 'Telas do navegador', detail: 'Views e componentes', icon: 'grid' },
  { name: 'Eventos', detail: 'Delegação por ação', icon: 'activity' },
  { name: 'Módulos locais', detail: 'Regras da interface', icon: 'settings' },
  { name: 'Repositório local', detail: 'Leitura e gravação', icon: 'database' },
  { name: 'localStorage', detail: 'Neste navegador', icon: 'server' },
];

const INTEGRATIONS = [
  { name: 'Dados de clima', description: 'Séries estáticas em js/data/series.js', status: 'Demonstrativo', updated: 'Sem atualização externa', icon: 'cloud' },
  { name: 'Plantações', description: 'Armazenamento local do navegador', status: 'Ativo neste navegador', updated: 'localStorage', icon: 'leaf' },
  { name: 'ThingSpeak', description: 'Nenhuma chamada de API implementada', status: 'Não conectado', updated: 'Integração pendente', icon: 'link' },
  { name: 'Banco de dados e serviços', description: 'Não há backend ou ORM no repositório', status: 'Não conectado', updated: 'Sem persistência remota', icon: 'database' },
];

function architectureFlow() {
  const steps = ARCHITECTURE_STEPS.map((step, index) => {
    const isFeatured = step.name === 'localStorage';
    return html`<div class="arch-group"><div class="arch-step ${isFeatured ? 'featured' : ''}"><div>${icon(step.icon)}</div><strong>${step.name}</strong><span>${step.detail}</span>${isFeatured && badge('Armazenamento local')}</div>${index < ARCHITECTURE_STEPS.length - 1 && html`<span class="flow-arrow">→</span>`}</div>`;
  });
  return card(
    html`${sectionHead({ title: 'Fluxo implementado neste protótipo', subtitle: 'A interface usa módulos JavaScript e salva preferências e registros no navegador.' })}<div class="architecture-flow">${steps}</div><div class="architecture-note">${icon('warning')}<span><strong>Limite atual:</strong> não há servidor, API, banco remoto ou conexão real com sensores neste repositório.</span></div>`,
    'architecture',
  );
}

export function integrationsPage() {
  const cards = INTEGRATIONS.map((integration) =>
    card(
      html`<div class="integration-card-top"><div class="service-icon">${icon(integration.icon)}</div>${badge(integration.status, integration.status.startsWith('Não') ? 'neutral' : 'info')}</div><h3>${integration.name}</h3><p>${integration.description}</p><div><span>Última atualização</span><strong>${integration.updated}</strong></div>${button('Ver configuração', { variant: 'secondary' })}`,
      'integration-card',
    ),
  );
  return page(
    hiddenVarietyHeader('Integrações', 'Consulte as fontes de dados realmente configuradas neste protótipo.'),
    architectureFlow(),
    html`<div class="integration-grid">${cards}</div>`,
  );
}
