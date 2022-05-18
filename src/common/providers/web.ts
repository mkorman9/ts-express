import { Request, Response } from "express";
import { ZodType } from "zod";

export const withRequestBody = async <T> (req: Request, res: Response, t: ZodType, func: (body: T) => Promise<unknown>) => {
  let parsed: unknown = null;

  try {
    parsed = t.parse(req.body);
  } catch (err) {
    return res
      .status(400)
      .json({
        status: 'error',
        message: 'Malformed request'
      });
  }

  await func(parsed as T);
}

export const withRequestQuery = async <T> (req: Request, res: Response, t: ZodType, func: (query: T) => Promise<unknown>) => {
  let parsed: unknown = null;

  try {
    parsed = t.parse(req.query);
  } catch (err) {
    return res
      .status(400)
      .json({
        status: 'error',
        message: 'Malformed request'
      });
  }

  await func(parsed as T);
}
