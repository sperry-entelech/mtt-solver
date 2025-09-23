import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = {
  badRequest: (message: string = 'Bad Request') => new AppError(message, 400),
  unauthorized: (message: string = 'Unauthorized') => new AppError(message, 401),
  forbidden: (message: string = 'Forbidden') => new AppError(message, 403),
  notFound: (message: string = 'Not Found') => new AppError(message, 404),
  conflict: (message: string = 'Conflict') => new AppError(message, 409),
  unprocessableEntity: (message: string = 'Unprocessable Entity') => new AppError(message, 422),
  tooManyRequests: (message: string = 'Too Many Requests') => new AppError(message, 429),
  internal: (message: string = 'Internal Server Error') => new AppError(message, 500),
  badGateway: (message: string = 'Bad Gateway') => new AppError(message, 502),
  serviceUnavailable: (message: string = 'Service Unavailable') => new AppError(message, 503),
};

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Log the error
  if (statusCode >= 500) {
    logger.error(`${error.message}`, {
      error: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } else {
    logger.warn(`${error.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' || error.name === 'PostgresError') {
    statusCode = 500;
    message = 'Database Error';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong!';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = createError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const validateBody = (schema: any) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = schema.validate(req.body);
  if (error) {
    const message = error.details.map((detail: any) => detail.message).join(', ');
    return next(createError.badRequest(message));
  }
  next();
};

export const validateQuery = (schema: any) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = schema.validate(req.query);
  if (error) {
    const message = error.details.map((detail: any) => detail.message).join(', ');
    return next(createError.badRequest(message));
  }
  next();
};

export const validateParams = (schema: any) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = schema.validate(req.params);
  if (error) {
    const message = error.details.map((detail: any) => detail.message).join(', ');
    return next(createError.badRequest(message));
  }
  next();
};