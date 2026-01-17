import { Response } from 'express';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: unknown;
  pagination?: PaginationMeta;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: unknown,
  status = 200
): Response<ApiResponse<T>> => {
  return res.status(status).json({ success: true, data, meta });
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  meta?: unknown
): Response<ApiResponse<T>> => {
  return sendSuccess(res, data, meta, 201);
};

export const sendNoContent = (res: Response): Response<ApiResponse<null>> => {
  return res.status(204).json({ success: true, data: null });
};

/**
 * Send paginated success response
 * @param res - Express Response object
 * @param data - Array of data items
 * @param pagination - Pagination metadata (page, limit, total)
 * @returns Response with pagination metadata
 *
 * @example
 * sendPaginatedSuccess(res, equipos, { page: 1, limit: 10, total: 45 })
 * // Returns: { success: true, data: [...], pagination: { page: 1, limit: 10, total: 45, total_pages: 5 } }
 */
export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number }
): Response<ApiResponse<T[]>> => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      total_pages: Math.ceil(pagination.total / pagination.limit),
    },
  });
};

export const sendError = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response<ApiResponse<null>> => {
  return res.status(status).json({ success: false, error: { code, message, details } });
};
