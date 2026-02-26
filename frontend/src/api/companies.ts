import client from './client';

export const getCompanies = (params?: { sort?: string; industry?: string; size?: string }) =>
  client.get('/api/companies', { params });

export const getCompany = (id: number) =>
  client.get(`/api/companies/${id}`);

export const updateCompany = (id: number, data: Partial<{
  company_name: string;
  description: string;
  industry: string;
  size: string;
  website: string;
}>) => client.put(`/api/companies/${id}`, data);
