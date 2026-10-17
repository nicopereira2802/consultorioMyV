/** @format */

export const errorHandler = (err, req, res, next) => {
  console.error("Error capturado por middleware:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Error interno del servidor";
  res.status(status).json({ error: message });
};

export default errorHandler;