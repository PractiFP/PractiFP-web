// Error con código HTTP para lanzarlo desde controladores y servicios.
export class HttpError extends Error {
  constructor(status, mensaje, detalles = null) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}
