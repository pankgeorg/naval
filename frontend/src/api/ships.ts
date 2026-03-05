import api from './client';
import type { Ship, ShipCreate, ShipUpdate } from '../types/ship';

export const getShips = (params?: Record<string, string>) =>
  api.get<Ship[]>('/ships', { params }).then((r) => r.data);

export const getShip = (id: string) =>
  api.get<Ship>(`/ships/${id}`).then((r) => r.data);

export const createShip = (data: ShipCreate) =>
  api.post<Ship>('/ships', data).then((r) => r.data);

export const updateShip = (id: string, data: ShipUpdate) =>
  api.put<Ship>(`/ships/${id}`, data).then((r) => r.data);

export const deleteShip = (id: string) =>
  api.delete(`/ships/${id}`);

export const getShipEngines = (shipId: string) =>
  api.get(`/ships/${shipId}/engines`).then((r) => r.data);

export const createEngine = (shipId: string, data: Record<string, unknown>) =>
  api.post(`/ships/${shipId}/engines`, data).then((r) => r.data);
