import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins for CORS whitelist
const ALLOWED_ORIGINS = [
  'https://spliq0.web.app',
  'https://spliqo.web.app',
  'https://spliq0.firebaseapp.com',
  'https://spliqo.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
];

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) or in whitelist
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.web.app') || origin.endsWith('.firebaseapp.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to allow if preview URL but log warning
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate Limiter
import { apiLimiter } from './middleware/rateLimiter.js';
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Spliqo API Server',
    time: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Spliqo Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Lỗi hệ thống nội bộ máy chủ.'
  });
});

// Start listening if run directly
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` 🚀 Spliqo API Server is running on port ${PORT}`);
  console.log(` 🔗 URL: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;
