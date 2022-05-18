import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ZodType } from "zod";

const RequestBodyParamName = "requestBodyParsed";
const RequestQueryParamName = "requestQueryParsed";

export const validationMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Validation error',
          causes: validationErrors.array().map(e => ({
            field: e.param,
            code: e.msg
          }))
        });
    }

    next();
  };
};

export const requestBodyMiddleware = (t: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = t.parse(req.body);
      req[RequestBodyParamName] = body;
    } catch (err) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Malformed request body'
        });
    }

    next();
  };
};

export const getRequestBody = <T> (req: Request) => {
  return req[RequestBodyParamName] as T;
};

export const requestQueryMiddleware = (t: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = t.parse(req.query);
      req[RequestQueryParamName] = query;
    } catch (err) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Malformed request query params'
        });
    }

    next();
  };
};

export const getRequestQuery = <T> (req: Request) => {
  return req[RequestQueryParamName] as T;
};
