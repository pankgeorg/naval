import api from './client';

export const getVoyages = (shipId: string, params?: Record<string, string>) =>
  api.get(`/ships/${shipId}/voyages`, { params }).then((r) => r.data);

export const getVoyage = (id: string) =>
  api.get(`/voyages/${id}`).then((r) => r.data);

export const createVoyage = (shipId: string, data: Record<string, unknown>) =>
  api.post(`/ships/${shipId}/voyages`, data).then((r) => r.data);

export const updateVoyage = (id: string, data: Record<string, unknown>) =>
  api.put(`/voyages/${id}`, data).then((r) => r.data);

export const deleteVoyage = (id: string) =>
  api.delete(`/voyages/${id}`);

export const addLegFuel = (legId: string, data: Record<string, unknown>) =>
  api.post(`/voyage-legs/${legId}/fuel`, data).then((r) => r.data);

export const addTrack = (legId: string, points: Record<string, unknown>[]) =>
  api.post(`/voyage-legs/${legId}/track`, points).then((r) => r.data);
