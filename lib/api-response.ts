import { NextResponse } from "next/server";
import { ApiSuccess, ApiError } from "./api-schemas";

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export function apiSuccess<T>(data: T, status = 200, customRequestId?: string): NextResponse<ApiSuccess<T>> & ApiSuccess<T> {
  const requestId = customRequestId || generateRequestId();
  const payload: ApiSuccess<T> = {
    success: true,
    data,
    requestId,
  };
  const res = NextResponse.json(payload, { status }) as any;
  res.success = payload.success;
  res.data = payload.data;
  res.requestId = payload.requestId;
  return res;
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
  details?: unknown,
  customRequestId?: string
): NextResponse<ApiError> & ApiError {
  const requestId = customRequestId || generateRequestId();
  const payload: ApiError = {
    success: false,
    error: {
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
      ...(details !== undefined ? { details } : {}),
    },
    requestId,
  };
  const res = NextResponse.json(payload, { status }) as any;
  res.success = payload.success;
  res.error = payload.error;
  res.requestId = payload.requestId;
  return res;
}
