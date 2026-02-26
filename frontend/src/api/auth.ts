import client from './client';

export const login = (email: string, password: string) =>
  client.post('/api/auth/login', { email, password });

export const register = (data: {
  email: string;
  password: string;
  company_name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
}) => client.post('/api/auth/register', data);
