export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(error.errors).map((item) => item.message)
    });
  }
  if (error.code === 11000) return res.status(409).json({ message: 'Email is already registered' });
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
}
