import axios from 'axios';
import { TransportRoute, Bus, StudentTransport } from '../models/transport';

// API_BASE me dono transport rahne dena
const API_BASE = "http://127.0.0.1:8000/api/transport/transport";

const transportService = {
  // Routes
  getRoutes: () => axios.get<TransportRoute[]>(`${API_BASE}/routes/`),
  createRoute: (data: TransportRoute) => axios.post(`${API_BASE}/routes/`, data),
  updateRoute: (id: string | number, data: TransportRoute) => 
    axios.put(`${API_BASE}/routes/${id}/`, data),
  deleteRoute: (id: string | number) => 
    axios.delete(`${API_BASE}/routes/${id}/`),

  // Buses
  getBuses: () => axios.get<Bus[]>(`${API_BASE}/buses/`),
  createBus: (data: Bus) => axios.post(`${API_BASE}/buses/`, data),
  updateBus: (id: string | number, data: Bus) => 
    axios.put(`${API_BASE}/buses/${id}/`, data),
  deleteBus: (id: string | number) => 
    axios.delete(`${API_BASE}/buses/${id}/`),

  // Student Transport
  getStudentTransports: (params?: any) => axios.get<StudentTransport[]>(`${API_BASE}/student/`, { params }),
  assignTransport: (payload: StudentTransport) => axios.post(`${API_BASE}/student/`, payload),
  updateStudentTransport: (id: string | number, payload: StudentTransport) => 
    axios.put(`${API_BASE}/student/${id}/`, payload),
  deleteStudentTransport: (id: string | number) => 
    axios.delete(`${API_BASE}/student/${id}/`),
};

export default transportService;