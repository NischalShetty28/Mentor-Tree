import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';
import menteeRoutes from './routes/mentee.routes';
import mentorRoutes from './routes/mentor.routes';
import adminRoutes from './routes/admin.routes';
import meetingRoutes from './routes/meeting.routes';
import alertRoutes from './routes/alert.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';
import departmentRoutes from './routes/department.routes';

export const app = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Permissive for local API usage
  })
);
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MentorTree API',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentee', menteeRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/departments', departmentRoutes);

// Error Handling Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🚀 MentorTree Backend Server running on: http://localhost:${config.port}`);
    console.log(`📋 Health check available at: http://localhost:${config.port}/api/health`);
    console.log(`=========================================`);
  });
}
