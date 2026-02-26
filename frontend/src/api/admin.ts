import client from './client';

export const getPendingCompanies = () =>
  client.get('/api/admin/pending');

export const approveCompany = (id: number) =>
  client.post(`/api/admin/approve/${id}`);

export const adjustMembershipDate = (id: number, date: string) =>
  client.put(`/api/admin/companies/${id}/date`, { membership_start_date: date });

export const adminDeleteListing = (id: number) =>
  client.delete(`/api/admin/listings/${id}`);
