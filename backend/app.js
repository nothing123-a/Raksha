import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import hodRoutes from './routes/hodRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import correctionRoutes from './routes/correctionRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin like curl or mobile
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // In development, allow local dev
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'MITAOE Attendance Management System API',
  });
});

// Mount Routes (with /api and root fallback to prevent 404s)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/students', studentRoutes);
app.use('/students', studentRoutes);

app.use('/api/faculty', facultyRoutes);
app.use('/faculty', facultyRoutes);

app.use('/api/hod', hodRoutes);
app.use('/hod', hodRoutes);

app.use('/api/courses', courseRoutes);
app.use('/courses', courseRoutes);

app.use('/api/sessions', sessionRoutes);
app.use('/sessions', sessionRoutes);

app.use('/api/attendance', attendanceRoutes);
app.use('/attendance', attendanceRoutes);

app.use('/api/corrections', correctionRoutes);
app.use('/corrections', correctionRoutes);

app.use('/api/timetable', timetableRoutes);
app.use('/timetable', timetableRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
