import api from './client';

export const getPorts = (params?: Record<string, string>) =>
  api.get('/ports', { params }).then((r) => r.data);

export const getPort = (id: string) =>
  api.get(`/ports/${id}`).then((r) => r.data);

export const createPort = (data: Record<string, unknown>) =>
  api.post('/ports', data).then((r) => r.data);
