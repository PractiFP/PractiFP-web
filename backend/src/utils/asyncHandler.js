// Envuelve controladores async para que los errores lleguen al manejador central.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
