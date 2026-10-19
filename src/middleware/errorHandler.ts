import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../errors';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.path} not found`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
    res.status(409).json({ error: 'A record with this unique value already exists' });
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Request body contains invalid JSON' });
    return;
  }

  console.error('Unhandled API error:', error);
  res.status(500).json({ error: 'Internal server error' });
};
