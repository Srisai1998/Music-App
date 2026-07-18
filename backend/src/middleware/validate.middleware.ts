import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const grouped: Record<string, string[]> = {};
    errors.array().forEach((err: any) => {
      const field = err.path || err.param || 'general';
      if (!grouped[field]) grouped[field] = [];
      grouped[field].push(err.msg);
    });
    res.status(422).json({ success: false, message: 'Validation failed', errors: grouped });
    return;
  }
  next();
};
