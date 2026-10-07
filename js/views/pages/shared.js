import { html } from '../../utils/html.js';
import { findVariety, VARIETIES } from '../../data/varieties.js';
import { icon } from '../../components/icons.js';
import { badge, button, card, chartCard, metricsGrid, sectionHead } from '../../components/ui.js';
import { barChart, lineChart } from '../../components/charts.js';
import { pageHeader } from '../../components/page-header.js';
import { comparisonTable, tableWrapper } from '../../components/tables.js';
import { page } from './page-layout.js';

/* ------------------------------ Comparação ------------------------------ */

const RANKING_ORDER = [3, 1, 0, 4, 2];

export function comparisonPage() {
  const ranking = RANKING_ORDER.map((varietyIndex, position) => {
    const variety = VARIETIES[varietyIndex];
    return html`<div${position === 0 ? html` class="winner"` : ''}><b>${position + 1}º</b><span class="grape-dot grape-${variety.color}"></span><strong>${variety.name}</strong><div><i style="width:${variety.score}%"></i></div><em>${variety.score}</em></div>`;
  });
  return page(
    pageHeader({ title: 'Análise Comparativa', subtitle: 'Compare as condições e oportunidades das cinco variedades.', varietyMode: 'hidden' }),
    card(
      html`<div><span class="overline">Comparativo de referência</span><h2>Qual variedade apresenta o melhor cenário?</h2><p>Uma comparação de clima, preço, procura e risco para ajudar no planejamento.</p></div><div class="ranking-list">${ranking}</div>`,
      'ranking',
    ),
    html`<div class="grid-2">${chartCard({ title: 'Indicadores por dimensão', subtitle: 'Comparação de referência', content: barChart([89, 93, 74, 96, 85, 90, 81], ['Clima', 'Preço', 'Procura', 'Risco', 'Envio', 'Qualidade', 'Exportação']) })}${chartCard({ title: 'Tendência de preço', subtitle: 'Comparação demonstrativa entre variedades', content: lineChart({ secondary: [22, 23, 24, 26, 25, 27, 28, 29, 28, 30, 29, 31, 32], labels: ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'] }) })}</div>`,
    comparisonTable(),
  );
}

/* -------------------------------- Alertas -------------------------------- */

const ALERTS = [
  { category: 'Colheita', message: 'Condições favoráveis para colher a Uva Itália.', level: 'Informativo', tone: 'info', icon: 'leaf', subject: findVariety('Uva Itália').name },
  { category: 'Clima', message: 'Umidade acima da faixa para Thompson Seedless.', level: 'Atenção', tone: 'warning', icon: 'cloud', subject: findVariety('Thompson Seedless').name },
  { category: 'Envio', message: 'Período favorável para enviar Crimson nas próximas 48 horas.', level: 'Importante', tone: 'orange', icon: 'truck', subject: findVariety('Crimson Seedless').name },
  { category: 'Sistema', message: 'Falha temporária de sincronização resolvida.', level: 'Informativo', tone: 'info', icon: 'settings', subject: 'Integração' },
];

const ALERT_FILTERS = ['Clima', 'Colheita', 'Envio', 'Mercado', 'Sistema'];

export function alertsPage() {
  const filters = html`<div class="alert-filters">${button(html`Todos <span class="count">12</span>`)}${ALERT_FILTERS.map((filter) => button(filter, { variant: 'secondary' }))}</div>`;
  const rows = ALERTS.map((alert, index) =>
    card(
      html`<div class="alert-icon">${icon(alert.icon)}</div><div><div>${badge(alert.level, alert.tone)}<span>${alert.category} · ${alert.subject}</span></div><h3>${alert.message}</h3><p>Confira os detalhes e as recomendações disponíveis antes de decidir.</p></div><div class="alert-time"><span>${index + 1}h atrás</span>${button('Ver detalhes', { variant: 'ghost' })}</div>`,
      `alert-row alert-${alert.tone}`,
    ),
  );
  return page(
    pageHeader({ title: 'Central de Alertas', subtitle: 'Avisos sobre o clima, a colheita e o funcionamento da plataforma.', varietyMode: 'hidden' }),
    filters,
    html`<div class="alerts-list">${rows}</div>`,
  );
}

/* ------------------------------ Configurações ------------------------------ */

const SETTINGS_SECTIONS = [
  ['Geral', 'settings'],
  ['Notificações', 'bell'],
  ['Aparência', 'eye'],
];

function settingsNavigation(active) {
  const sections = SETTINGS_SECTIONS.map(([label, iconName]) => html`<button type="button" class="${active === label ? 'active' : ''}" data-action="settings-section" data-section="${label}" aria-current="${active === label ? 'page' : 'false'}">${icon(iconName)}${label}${icon('chevron', 16)}</button>`);
  return html`${sections}<button type="button" data-action="navigate" data-page="Segurança">${icon('shield')}Segurança${icon('chevron', 16)}</button>`;
}

function settingsPanel(settings, section) {
  const general = settings.general;
  const notifications = settings.notifications;
  const theme = settings.appearance.theme;
  if (section === 'Notificações') {
    return html`${sectionHead({ title: 'Notificações', subtitle: 'Escolha quais avisos aparecem no painel.' })}
      <div class="settings-check-list">
        <label><span><strong>Avisos sobre o clima</strong><small>Alertas relacionados às condições da plantação.</small></span><input type="checkbox" data-setting="notifications.climateAlerts"${notifications.climateAlerts ? ' checked' : ''}></label>
        <label><span><strong>Avisos do sistema</strong><small>Notificações sobre a plataforma e seus serviços.</small></span><input type="checkbox" data-setting="notifications.systemAlerts"${notifications.systemAlerts ? ' checked' : ''}></label>
        <label><span><strong>Resumo por e-mail</strong><small>Preferência para receber um resumo periódico.</small></span><input type="checkbox" data-setting="notifications.emailSummary"${notifications.emailSummary ? ' checked' : ''}></label>
      </div>`;
  }
  if (section === 'Aparência') {
    return html`${sectionHead({ title: 'Aparência', subtitle: 'Selecione o tema que será usado em todas as páginas.' })}
      <div class="theme-options">
        <label class="${theme === 'light' ? 'selected' : ''}"><input type="radio" name="theme" value="light" data-action="change-theme"${theme === 'light' ? ' checked' : ''}><div class="theme-preview light"></div><strong>Tema claro</strong></label>
        <label class="${theme === 'dark' ? 'selected' : ''}"><input type="radio" name="theme" value="dark" data-action="change-theme"${theme === 'dark' ? ' checked' : ''}><div class="theme-preview dark"></div><strong>Tema escuro</strong></label>
      </div><p class="settings-hint">A mudança é aplicada imediatamente e guardada neste navegador.</p>`;
  }
  const varietyOptions = VARIETIES.map((variety) => html`<option value="${variety.name}"${variety.name === general.defaultVariety ? ' selected' : ''}>${variety.name}</option>`);
  return html`${sectionHead({ title: 'Configurações gerais', subtitle: 'Defina o nome, a região e as preferências iniciais da plataforma.' })}
    <div class="form-grid">
      <label class="field"><span>Nome do sistema</span><input name="systemName" data-setting="general.systemName" value="${general.systemName}" required maxlength="48"></label>
      <label class="field"><span>Região padrão</span><select name="region" data-setting="general.region"><option${general.region === 'Petrolina / Juazeiro' ? ' selected' : ''}>Petrolina / Juazeiro</option><option${general.region === 'Vale do São Francisco' ? ' selected' : ''}>Vale do São Francisco</option><option${general.region === 'Outra região' ? ' selected' : ''}>Outra região</option></select></label>
      <label class="field"><span>Variedade inicial</span><select name="defaultVariety" data-setting="general.defaultVariety">${varietyOptions}</select></label>
      <label class="field full"><span>Informações institucionais</span><textarea name="institutionalInfo" data-setting="general.institutionalInfo" maxlength="240">${general.institutionalInfo}</textarea></label>
    </div>`;
}

export function settingsPage({ settings, settingsSection = 'Geral', settingsMessage = '' } = {}) {
  const activeSection = SETTINGS_SECTIONS.some(([name]) => name === settingsSection) ? settingsSection : 'Geral';
  const savedSettings = settings || {
    general: { systemName: 'AgroClima Cloud', region: 'Petrolina / Juazeiro', defaultVariety: VARIETIES[0].name, institutionalInfo: '' },
    notifications: { climateAlerts: true, systemAlerts: true, emailSummary: false },
    appearance: { theme: 'light' },
  };
  return page(
    pageHeader({ title: 'Configurações', subtitle: 'Altere preferências que afetam o painel e a navegação.', varietyMode: 'hidden' }),
    html`<div class="settings-layout">${card(settingsNavigation(activeSection), 'settings-nav')}${card(html`<form class="settings-form" data-form="settings">${settingsMessage && html`<p class="form-feedback" role="status">${settingsMessage}</p>`}${settingsPanel(savedSettings, activeSection)}<div class="settings-divider"></div><div class="button-row end"><button type="button" class="btn btn-secondary" data-action="cancel-settings">Descartar mudanças</button><button type="submit" class="btn btn-primary">Salvar alterações</button></div></form>`, 'settings-content')}</div>`,
  );
}

/* ------------------------------ Design System ------------------------------ */

const SWATCHES = ['forest', 'emerald', 'blue', 'navy', 'wine', 'gold', 'danger', 'cloud'];
const SYSTEM_STATES = [
  ['activity', 'Carregando', 'Atualizando informações...', 'Carregamento de demonstração ativado.'],
  ['warning', 'Sem dados', 'Nenhum registro no período.', 'Estado vazio selecionado para visualização.'],
  ['wifi', 'Conexão perdida', 'Confira sua conexão.', 'Estado de conexão selecionado para visualização.'],
];

export function designSystemPage({ designMessage = '' } = {}) {
  const colors = card(html`<h3>Cores do produto</h3><div class="swatches">${SWATCHES.map((name) => html`<div><i class="swatch-${name}"></i><span>${name}</span></div>`)}</div>`);
  const typography = card(html`<h3>Tipografia</h3><div class="type-samples"><b>Display / Semibold</b><strong>Dashboard de clima</strong><p>Interface / Regular — Dados claros para decisões melhores.</p></div>`);
  const components = card(html`<h3>Botões e indicadores</h3><div class="component-row"><button type="button" class="btn btn-primary" data-action="design-interaction" data-message="O botão principal está funcionando.">Primário</button><button type="button" class="btn btn-secondary" data-action="design-interaction" data-message="O botão secundário está funcionando.">Secundário</button><button type="button" class="btn btn-ghost" data-action="design-interaction" data-message="O botão de texto está funcionando.">Texto</button>${badge('Sucesso')}${badge('Atenção', 'warning')}</div>${designMessage && html`<p class="design-feedback" role="status">${icon('check', 15)}${designMessage}</p>`}`);
  const states = card(html`<h3>Estados do sistema</h3><div class="state-grid">${SYSTEM_STATES.map(([iconName, title, description, message]) => html`<button type="button" data-action="design-interaction" data-message="${message}">${icon(iconName)}<b>${title}</b><span>${description}</span></button>`)}</div>`);
  const fields = card(html`<h3>Campos e controles</h3><div class="form-grid"><label class="field"><span>Campo de texto</span><input placeholder="Digite para testar"></label><label class="field"><span>Lista de opções</span><select><option>Opção de exemplo</option><option>Outra opção</option></select></label><label class="design-check"><input type="checkbox" checked><span>Controle selecionável</span></label></div><button type="button" class="btn btn-secondary" data-action="design-interaction" data-message="Os campos do design system estão prontos para interação.">Testar campos</button>`);
  return page(
    pageHeader({ title: 'Design System', subtitle: 'Visualize componentes, confira estados e teste as interações.', varietyMode: 'hidden' }),
    html`<div class="ds-grid">${colors}${typography}${components}${states}${fields}</div>`,
  );
}

/* ------------------------- Fallback para páginas futuras ------------------------- */

export function genericPage({ title, role }) {
  return page(
    pageHeader({ title, subtitle: `Área de ${role || 'trabalho'} da plataforma.`, varietyMode: 'hidden' }),
    card(html`<div class="empty-state"><span>${icon('grid')}</span><strong>Esta área ainda não foi configurada</strong><small>As páginas funcionais do sistema são exibidas pelo menu de cada perfil.</small></div>`, 'table-card'),
  );
}
