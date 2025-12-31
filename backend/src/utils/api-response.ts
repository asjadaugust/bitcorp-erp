import { Response } from 'express';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: any;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: any,
  status = 200
): Response<ApiResponse<T>> => {
  return res.status(status).json({ success: true, data, meta });
};

export const sendCreated = <T>(res: Response, data: T, meta?: any): Response<ApiResponse<T>> => {
  return sendSuccess(res, data, meta, 201);
};

export const sendNoContent = (res: Response): Response<ApiResponse<null>> => {
  return res.status(204).json({ success: true, data: null });
};

export const sendError = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: any
): Response<ApiResponse<null>> => {
  return res.status(status).json({ success: false, error: { code, message, details } });
};
