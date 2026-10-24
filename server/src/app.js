import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { NotFoundError } from './utils/errors.js';
import apiRoutes from './routes/index.js';

export const app = express();

// Trust reverse proxies (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS configuration (origin from env and default Vercel frontend)
const configuredOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : [];

const defaultAllowedOrigins = [
  'https://e-commerce-eta-eight-46.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultAllowedOrigins]));

function isOriginAllowed(origin) {
  if (!origin) return true; // Server-to-server, curl, Postman
  const cleanOrigin = origin.replace(/\/$/, '');

  if (allowedOrigins.includes(cleanOrigin)) return true;

  if (env.NODE_ENV !== 'production') {
    if (cleanOrigin.startsWith('http://localhost') || cleanOrigin.startsWith('http://127.0.0.1')) {
      return true;
    }
  }

  // Allow any Vercel deployment preview / production domain for this e-commerce app
  if (/^https:\/\/e-commerce.*\.vercel\.app$/.test(cleanOrigin)) {
    return true;
  }

  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Body and Cookie parsing
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Pino request logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/health' || req.url === '/',
    },
  })
);

// Root landing endpoint (verifies server is up when visiting directly in browser or Render)
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Pure Origin E-Commerce API',
    status: 'online',
    environment: env.NODE_ENV,
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting on all /api routes
app.use('/api', globalLimiter);

// API Routes
app.use('/api', apiRoutes);

// 404 Route Not Found
app.use((req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Global Centralized Error Handling Middleware
app.use(errorHandler);
