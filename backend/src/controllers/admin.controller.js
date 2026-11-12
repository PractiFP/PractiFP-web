import * as admin from '../services/adminService.js';

const id = (req) => Number(req.params.id);

export const usuarios = async (req, res) => res.json({ data: await admin.listarUsuarios(req.query) });
export const cambiarActivoUsuario = async (req, res) => res.json({ data: await admin.cambiarActivo(id(req), req.body?.activo, req.usuario) });

export const empresas = async (req, res) => res.json({ data: await admin.listarEmpresas(req.query) });
export const cambiarVerificada = async (req, res) => res.json({ data: await admin.cambiarVerificada(id(req), req.body?.verificada) });

export const ofertas = async (req, res) => res.json({ data: await admin.listarOfertas(req.query) });
export const cambiarActivaOferta = async (req, res) => res.json({ data: await admin.cambiarActivaOferta(id(req), req.body?.activa) });
export const eliminarOferta = async (req, res) => res.json({ data: await admin.eliminarOferta(id(req)) });

export const valoraciones = async (req, res) => res.json({ data: await admin.listarValoraciones(req.query) });
export const moderarValoracion = async (req, res) => res.json({ data: await admin.moderarValoracion(id(req), req.body?.estado) });
export const eliminarValoracion = async (req, res) => res.json({ data: await admin.eliminarValoracion(id(req)) });
