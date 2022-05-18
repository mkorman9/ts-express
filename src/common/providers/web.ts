import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { ZodType } from "zod";

export const withRequestBody = async <T> (req: Request, res: Response, t: ZodType, func: (body: T) => Promise<unknown>) => {
  const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res
        .status(400)
        .json({
          status: 'error',
          message: 'Validation error',
          causes: validationErrors.array().map(e => ({
            field: e.param,
            code: e.msg
          }))
        });

      return;
    }

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
