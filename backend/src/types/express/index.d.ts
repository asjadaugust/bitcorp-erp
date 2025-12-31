import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // Using any to be safe for now, can be specific User type later
    }
  }
}
