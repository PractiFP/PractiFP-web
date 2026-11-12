import { api } from './api.js';

export const resumenAlumno = (opciones) => api.get('/panel/alumno', opciones);
export const resumenEmpresa = (opciones) => api.get('/panel/empresa', opciones);
export const resumenAdmin = (opciones) => api.get('/panel/admin', opciones);
