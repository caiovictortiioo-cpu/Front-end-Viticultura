/**
 * Estado global da interface, com notificação das chaves alteradas.
 * Os registros persistentes ficam no repositório local da demonstração.
 */
import { DEFAULT_VARIETY } from '../data/varieties.js';
import { ROLES } from '../config/roles.js';
import { getAuditEvents } from '../modules/audit.js';
import { getRbacSnapshot } from '../modules/access-control.js';
import { getPlantations } from '../modules/plantations.js';
import { getSettings } from '../modules/settings.js';

const initialState = () => {
  const settings = getSettings();
  return {
    authenticated: false,
    authMode: 'login', // 'login' | 'signup' | 'forgot'
    authMessage: '',
    email: '',
    role: ROLES.PRODUCER,
    page: null,
    variety: settings.general.defaultVariety || DEFAULT_VARIETY,
    menuOpen: false,
    theme: settings.appearance.theme,
    settings,
    settingsSection: 'Geral',
    plantations: getPlantations(),
    rbac: getRbacSnapshot(),
    auditLogs: getAuditEvents(),
    logSearch: '',
    logStatus: 'Todos',
    logResource: 'Todos',
    logSort: 'newest',
    expandedLogId: null,
    designMessage: '',
    modelMessage: '',
    producerMessage: '',
    settingsMessage: '',
    rbacMessage: '',
  };
};

let state = initialState();
const listeners = new Set();

export const getState = () => state;

export function setState(patch) {
  const changedKeys = Object.keys(patch).filter((key) => state[key] !== patch[key]);
  if (changedKeys.length === 0) return;
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state, changedKeys));
}

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Reinicia apenas a sessão de interface; preferências e registros persistidos continuam. */
export const resetState = () => setState({ ...initialState() });
