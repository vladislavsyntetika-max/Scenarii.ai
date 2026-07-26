import express, { Request, Response } from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { healthCheck } from './routes/health';
import { generateScript } from './routes/generate';
import { getScripts, createScript } from './routes/scripts';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

const app = express();

// Настройка логгера
app.use(pinoHttp({ logger }));

// CORS
app.use(cors());

// Маршруты
app.use('/api/health', healthCheck);
app.use('/api/generate', generateScript);
app.use('/api/scripts', getScripts, createScript);

// Обработка несуществующих маршрутов
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
