import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorHandler(
  error: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);

  if (error instanceof ZodError) {
    const errors = error.errors.reduce((acc, err) => {
      const key = err.path.join('.');
      if (!acc[key]) acc[key] = [];
      acc[key].push(err.message);
      return acc;
    }, {} as Record<string, string[]>);

    const response: ApiResponse = {
      success: false,
      error: 'Validation error',
      errors,
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  if (error instanceof ApiError) {
    const response: ApiResponse = {
      success: false,
      error: error.message,
      errors: error.errors,
      timestamp: new Date().toISOString(),
    };
    res.status(error.statusCode).json(response);
    return;
  }

  const response: ApiResponse = {
    success: false,
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  };
  res.status(500).json(response);
}

export function success<T>(data: T, statusCode = 200): (req: Request, res: Response) => void {
  return (req: Request, res: Response) => {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
  };
}
