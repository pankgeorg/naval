import api from './client';
import type { CIICorrection, CIICorrectionInput } from '../types/ciiCorrection';

export const listCIICorrections = (voyageId: string) =>
  api.get<CIICorrection[]>(`/voyages/${voyageId}/cii-corrections`).then((r) => r.data);

export const createCIICorrection = (voyageId: string, data: CIICorrectionInput) =>
  api.post<CIICorrection>(`/voyages/${voyageId}/cii-corrections`, data).then((r) => r.data);

export const updateCIICorrection = (id: string, data: Partial<CIICorrectionInput>) =>
  api.put<CIICorrection>(`/cii-corrections/${id}`, data).then((r) => r.data);

export const deleteCIICorrection = (id: string) =>
  api.delete(`/cii-corrections/${id}`);
