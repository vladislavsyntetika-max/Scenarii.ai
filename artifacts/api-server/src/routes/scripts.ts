import { Request, Response } from 'express';

// Простая имитация базы данных в памяти (для MVP)
const mockScripts: any[] = [];

export const getScripts = (req: Request, res: Response) => {
  res.json(mockScripts);
};

export const createScript = (req: Request, res: Response) => {
  const newScript = { 
    id: Date.now(), 
    ...req.body, 
    createdAt: new Date().toISOString() 
  };
  mockScripts.push(newScript);
  res.status(201).json(newScript);
};
