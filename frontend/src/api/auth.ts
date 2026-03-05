import api from './client';

export const login = async (email: string, password: string) => {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  const res = await api.post('/auth/jwt/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
};

export const register = (email: string, password: string) =>
  api.post('/auth/register', { email, password }).then((r) => r.data);

export const getMe = () =>
  api.get('/users/me').then((r) => r.data);
