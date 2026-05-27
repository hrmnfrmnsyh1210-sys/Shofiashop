import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/httpError.js';
import { env } from '../config/env.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ error: { message: err.message, details: err.details } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: {
          message: 'Unique constraint violation',
          details: { target: err.meta?.target },
        },
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Record not found' } });
    }
    return res.status(400).json({
      error: { message: 'Database request error', code: err.code },
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: {
        message: 'Database validation error',
        details: env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      details:
        env.NODE_ENV === 'development'
          ? (err instanceof Error ? err.message : String(err))
          : undefined,
    },
  });
};
