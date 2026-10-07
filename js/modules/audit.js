import { loadAuditEvents, saveAuditEvents } from '../data/local-repository.js';

export function getAuditEvents() {
  return loadAuditEvents().slice().sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
}

export function recordAuditEvent({ actor, action, resource, details = '', status = 'Concluído', source = 'Navegador web', now = new Date() }) {
  const event = {
    id: globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user: String(actor || 'Usuário'),
    action: String(action || 'Ação realizada'),
    resource: String(resource || 'Sistema'),
    occurredAt: now.toISOString(),
    source,
    status,
    details: String(details || ''),
  };
  const events = [event, ...getAuditEvents()].slice(0, 500);
  saveAuditEvents(events);
  return events;
}
