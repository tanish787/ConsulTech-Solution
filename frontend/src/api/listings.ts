import client from './client';

export const getListings = (params?: { category?: string }) =>
  client.get('/api/listings', { params });

export const createListing = (data: { title: string; description?: string; category: string }) =>
  client.post('/api/listings', data);

export const updateListing = (id: number, data: Partial<{ title: string; description: string; category: string }>) =>
  client.put(`/api/listings/${id}`, data);

export const deleteListing = (id: number) =>
  client.delete(`/api/listings/${id}`);
