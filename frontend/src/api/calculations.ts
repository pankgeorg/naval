import api from './client';

export const getEEDI = (shipId: string) =>
  api.get(`/ships/${shipId}/eedi`).then((r) => r.data);

export const getEEXI = (shipId: string) =>
  api.get(`/ships/${shipId}/eexi`).then((r) => r.data);

export const getCII = (shipId: string, year: number) =>
  api.get(`/ships/${shipId}/cii`, { params: { year } }).then((r) => r.data);

export const getFuelEU = (shipId: string, year: number) =>
  api.get(`/ships/${shipId}/fueleu`, { params: { year } }).then((r) => r.data);

export const getEUETS = (shipId: string, year: number, euaPrice?: number) =>
  api.get(`/ships/${shipId}/eu-ets`, { params: { year, eua_price: euaPrice } }).then((r) => r.data);

export const getProjection = (shipId: string, years: string, assumptions?: string) =>
  api.get(`/ships/${shipId}/projection`, { params: { years, assumptions } }).then((r) => r.data);

export const getAnnualReport = (shipId: string, year: number) =>
  api.get(`/ships/${shipId}/annual-report`, { params: { year } }).then((r) => r.data);

export const runScenario = (shipId: string, data: Record<string, unknown>) =>
  api.post(`/ships/${shipId}/scenario`, data).then((r) => r.data);
