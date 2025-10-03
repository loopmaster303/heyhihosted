import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Custom API Error class with status code and optional error code
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Centralized error handler for API routes
 * Handles ApiError, ZodError, and generic errors
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  // Handle custom ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code,
        timestamp: new Date().toISOString()
      },
      { status: error.statusCode }
    );
  }
  
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        code: 'VALIDATION_ERROR',
        details: error.errors,
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
  
  // Handle standard Error instances
  if (error instanceof Error) {
    return NextResponse.json(
      { 
        error: error.message,
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
  
  // Handle unknown errors
  return NextResponse.json(
    { 
      error: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

/**
 * Validates request data against a Zod schema
 * Throws ApiError if validation fails
 */
export function validateRequest<T>(
  schema: z.Schema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new ApiError(
      400, 
      'Invalid request data', 
      'VALIDATION_ERROR'
    );
  }
  
  return result.data;
}

/**
 * Validates environment variable exists
 * Throws ApiError if not found
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  
  if (!value) {
    throw new ApiError(
      500,
      `Server configuration error: ${name} is not set`,
      'MISSING_ENV_VAR'
    );
  }
  
  return value;
}

/**
 * Type guard to check if error is ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Common API error factory functions
 */
export const apiErrors = {
  notFound: (resource: string) => 
    new ApiError(404, `${resource} not found`, 'NOT_FOUND'),
    
  unauthorized: (message = 'Unauthorized') => 
    new ApiError(401, message, 'UNAUTHORIZED'),
    
  forbidden: (message = 'Forbidden') => 
    new ApiError(403, message, 'FORBIDDEN'),
    
  badRequest: (message: string) => 
    new ApiError(400, message, 'BAD_REQUEST'),
    
  internal: (message = 'Internal server error') => 
    new ApiError(500, message, 'INTERNAL_ERROR'),
    
  serviceUnavailable: (service: string) => 
    new ApiError(503, `${service} is currently unavailable`, 'SERVICE_UNAVAILABLE'),
};


