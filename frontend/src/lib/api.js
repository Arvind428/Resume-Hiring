import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: BASE });

// Candidates
export const getCandidates = (params) => api.get('/api/candidates', { params });
export const getCandidate = (id) => api.get(`/api/candidates/${id}`);
export const createCandidate = (data) => api.post('/api/candidates', data);
export const analyzeCandidate = (id) => api.post(`/api/candidates/${id}/analyze`);
export const deleteCandidate = (id) => api.delete(`/api/candidates/${id}`);

// Interviews
export const getInterviews = (params) => api.get('/api/interviews', { params });
export const getInterview = (id) => api.get(`/api/interviews/${id}`);
export const startInterview = (data) => api.post('/api/interviews/start', data);
export const respondInterview = (id, data) => api.post(`/api/interviews/${id}/respond`, data);
export const getInterviewSummary = (id) => api.get(`/api/interviews/${id}/summary`);

// Simulations
export const getSimulations = (params) => api.get('/api/simulations', { params });
export const getSimulation = (id) => api.get(`/api/simulations/${id}`);
export const createSimulation = (data) => api.post('/api/simulations', data);
export const scoreSimulation = (id, data) => api.post(`/api/simulations/${id}/score`, data);
export const decideSimulation = (id) => api.post(`/api/simulations/${id}/decide`);
