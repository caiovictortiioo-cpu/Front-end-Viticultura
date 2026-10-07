import { bindEvents } from './events/index.js';
import { renderPage } from './config/routes.js';
import { getState, subscribe } from './state/store.js';
import { authFormContent, authView } from './views/auth-view.js';
import { shellView } from './views/shell-view.js';
import { mount, queryRequired, replaceElement } from './utils/dom.js';

const root = queryRequired('#root');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

function renderApp() {
  const state = getState();
  applyTheme(state.theme);
  mount(root, state.authenticated ? shellView(state) : authView(state));
}

function renderAuthForm() {
  mount(queryRequired('.auth-form', root), authFormContent(getState()));
}

/** Troca somente a área da página, preservando topbar, sidebar e rolagem. */
function renderPageContent() {
  replaceElement(queryRequired('main > .page', root), renderPage(getState()));
}

function updateNavigation({ page }) {
  root.querySelectorAll('.sidebar nav button').forEach((button) => {
    const isActive = button.dataset.page === page;
    button.classList.toggle('active', isActive);
    if (isActive) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

/** Alterna classes nos elementos existentes para preservar a transição da sidebar. */
function updateMenu({ menuOpen }) {
  queryRequired('.sidebar', root).classList.toggle('open', menuOpen);
  queryRequired('.sidebar-overlay', root).classList.toggle('show', menuOpen);
}

function updateVariety() {
  const hadFocus = document.activeElement?.matches('select[data-action="change-variety"]');
  renderPageContent();
  if (hadFocus) root.querySelector('select[data-action="change-variety"]')?.focus({ preventScroll: true });
}

subscribe((state, changedKeys) => {
  const has = (key) => changedKeys.includes(key);
  if (has('theme')) applyTheme(state.theme);
  if (has('authenticated')) return renderApp();
  if (!state.authenticated) return has('authMode') || has('authMessage') ? renderAuthForm() : undefined;

  // Preferências que também aparecem no logo e na barra superior precisam de shell novo.
  if (has('settings')) return renderApp();

  if (has('page')) {
    updateNavigation(state);
    renderPageContent();
  } else if (has('variety')) {
    updateVariety();
  }
  if (has('menuOpen')) updateMenu(state);

  const page = state.page;
  if (has('settingsSection') && page === 'Configurações') renderPageContent();
  if (has('rbac') && ['Permissões e RBAC', 'Usuários'].includes(page)) renderPageContent();
  if (has('plantations') && ['Minhas Plantações', 'Histórico', 'Relatórios'].includes(page)) renderPageContent();
  if (has('auditLogs') && ['Dashboard Admin', 'Logs do Sistema', 'Histórico', 'Relatórios'].includes(page)) renderPageContent();
  if (has('logSearch') || has('logStatus') || has('logResource') || has('logSort') || has('expandedLogId')) {
    if (page === 'Logs do Sistema') renderPageContent();
  }
  if (has('designMessage') && page === 'Design System') renderPageContent();
  if (has('modelMessage') && page === 'Modelos Preditivos') renderPageContent();
  if (has('producerMessage') && page === 'Minhas Plantações') renderPageContent();
  if (has('rbacMessage') && page === 'Permissões e RBAC') renderPageContent();
  if (has('settingsMessage') && ['Configurações', 'Segurança'].includes(page)) renderPageContent();
  return undefined;
});

bindEvents(root);
renderApp();
