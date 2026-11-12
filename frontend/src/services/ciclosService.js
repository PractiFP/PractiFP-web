import { api } from './api.js';

export const listarCiclos = (opciones) => api.get('/ciclos', opciones);
