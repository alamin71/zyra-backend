import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';

// Multipart requests that mix file uploads with regular fields send the
// regular fields JSON-stringified under a "data" field (alongside the
// files) — this unpacks it into req.body so validateRequest sees the real
// fields instead of one opaque string.
export const parseFormDataJson = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (typeof req.body?.data === 'string') {
    try {
      const parsed = JSON.parse(req.body.data);
      req.body = { ...req.body, ...parsed };
      delete req.body.data;
    } catch {
      return next(
        new AppError(StatusCodes.BAD_REQUEST, 'Invalid JSON in "data" field')
      );
    }
  }
  next();
};
