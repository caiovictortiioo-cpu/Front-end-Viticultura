import { loadPlantations, savePlantations } from '../data/local-repository.js';
import { VARIETIES } from '../data/varieties.js';

export const PLANTATION_STATUSES = Object.freeze({ GROWING: 'Em cultivo', HARVESTED: 'Colhida' });

export function getPlantations() {
  return loadPlantations().slice().sort((a, b) => new Date(b.plantedAt) - new Date(a.plantedAt));
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `plant-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createPlantation({ variety, quantity, field = '', notes = '' }, createdBy = 'Produtor', now = new Date()) {
  const selectedVariety = VARIETIES.find((entry) => entry.name === variety);
  const amount = Number(quantity);
  if (!selectedVariety) throw new Error('Selecione um tipo de uva válido.');
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('A quantidade deve ser um número inteiro maior que zero.');
  if (!Number.isFinite(now.getTime())) throw new Error('Não foi possível registrar a data do plantio.');

  const plantation = {
    id: makeId(),
    variety: selectedVariety.name,
    quantity: amount,
    field: String(field).trim(),
    notes: String(notes).trim(),
    plantedAt: now.toISOString(),
    harvestedAt: null,
    status: PLANTATION_STATUSES.GROWING,
    createdBy,
  };
  const plantations = loadPlantations();
  plantations.unshift(plantation);
  savePlantations(plantations);
  return plantation;
}

export function recordHarvest(plantationId, harvestedBy = 'Produtor', now = new Date()) {
  const plantations = loadPlantations();
  const plantation = plantations.find((entry) => entry.id === plantationId);
  if (!plantation) throw new Error('Plantação não encontrada.');
  if (plantation.status === PLANTATION_STATUSES.HARVESTED) throw new Error('Esta plantação já está marcada como colhida.');
  if (!Number.isFinite(now.getTime())) throw new Error('Não foi possível registrar a data da colheita.');

  plantation.harvestedAt = now.toISOString();
  plantation.status = PLANTATION_STATUSES.HARVESTED;
  plantation.harvestedBy = harvestedBy;
  savePlantations(plantations);
  return plantation;
}
