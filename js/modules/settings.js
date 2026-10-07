import { loadSettings, saveSettingsRecord } from '../data/local-repository.js';
import { DEFAULT_VARIETY } from '../data/varieties.js';

export const DEFAULT_SETTINGS = Object.freeze({
  general: {
    systemName: 'AgroClima Cloud',
    region: 'Petrolina / Juazeiro',
    institutionalInfo: 'Projeto Integrador — Análise e Desenvolvimento de Sistemas',
    defaultVariety: DEFAULT_VARIETY,
  },
  notifications: {
    climateAlerts: true,
    systemAlerts: true,
    emailSummary: false,
  },
  appearance: {
    theme: 'light',
  },
  security: {
    strongPasswords: true,
    requireMfa: false,
    notifyNewLogin: true,
    lockAfterFailures: true,
    sessionTimeout: '30',
  },
});

function mergeDefaults(defaults, saved) {
  const result = { ...defaults };
  Object.entries(defaults).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeDefaults(value, saved?.[key] ?? {});
    } else if (saved && Object.hasOwn(saved, key)) {
      result[key] = saved[key];
    }
  });
  return result;
}

export function getSettings() {
  return mergeDefaults(DEFAULT_SETTINGS, loadSettings(DEFAULT_SETTINGS));
}

export function saveSettings(patch) {
  const updated = mergeDefaults(getSettings(), patch);
  // Protege os valores de aparência aceitos, inclusive dados antigos no storage.
  if (!['light', 'dark'].includes(updated.appearance.theme)) updated.appearance.theme = 'light';
  saveSettingsRecord(updated);
  return updated;
}

export function setSettingPath(settings, path, value) {
  const keys = path.split('.');
  const patch = {};
  let cursor = patch;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) cursor[key] = value;
    else {
      cursor[key] = {};
      cursor = cursor[key];
    }
  });
  return { ...settings, ...patch };
}
