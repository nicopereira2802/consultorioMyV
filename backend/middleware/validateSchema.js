export const validateSchema = (schema) => (req, res, next) => {
  // safeParse realiza la validación sin lanzar excepciones inesperadas
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Formateamos los errores para responder un JSON estructurado
    const formattedErrors = result.error.issues.reduce((acc, issue) => {
      const field = issue.path[0];
      acc[field] = issue.message;
      return acc;
    }, {});

    return res.status(400).json({
      status: 'error',
      message: 'Error de validación en los datos enviados',
      errors: formattedErrors,
    });
  }

  // Reemplazamos req.body con los datos parseados y saneados por Zod
  req.body = result.data;
  next();
};