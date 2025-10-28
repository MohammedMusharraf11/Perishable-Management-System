import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Import routes
import itemRoutes from './routes/item.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
const API_VERSION = 'v1';
app.use(`/api/${API_VERSION}/items`, itemRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    console.log('✅ Database connection established successfully');
    console.log(`📊 Connected to Supabase: ${process.env.SUPABASE_URL}`);

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📡 Available Endpoints:`);
      console.log(`   GET    http://localhost:${PORT}/health`);
      console.log(`   POST   http://localhost:${PORT}/api/${API_VERSION}/items`);
      console.log(`   GET    http://localhost:${PORT}/api/${API_VERSION}/items`);
      console.log(`   GET    http://localhost:${PORT}/api/${API_VERSION}/items/:id`);
      console.log(`   PUT    http://localhost:${PORT}/api/${API_VERSION}/items/:id`);
      console.log(`   DELETE http://localhost:${PORT}/api/${API_VERSION}/items/:id\n`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
