/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

export interface SingleResponse<T> {
  success: true;
  data: T;
}

export interface ListResponse<T> {
  success: true;
  data: T[];
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T> = SingleResponse<T> | ErrorResponse;
export type ApiListResponse<T> = PaginatedResponse<T> | ListResponse<T> | ErrorResponse;
