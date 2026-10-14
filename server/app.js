import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'SplitMate API Server',
    time: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SplitMate Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Lỗi hệ thống nội bộ máy chủ.'
  });
});

// Start listening if run directly
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` 🚀 SplitMate API Server is running on port ${PORT}`);
  console.log(` 🔗 URL: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

export default app;
