import { api } from './api.js';

export const listarTecnologias = (opciones) => api.get('/tecnologias', opciones);
