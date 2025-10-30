import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// --- This is the new, robust .env loading ---
// 1. Get the directory name of the current file (e.g., /backend/src)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 2. Go up two levels to the project root (from /backend/src to /)
const projectRoot = path.resolve(__dirname, '..', '..');
// 3. Load the .env file from the root
dotenv.config({ path: path.join(projectRoot, '.env') });
// --- End of new loading ---

import express from 'express';
import cors from 'cors';
import inventoryRoutes from './routes/inventory_routes.js'; 
import itemRoutes from './routes/item.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/items', itemRoutes); 

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Supabase URL: ${process.env.SUPABASE_URL ? 'Loaded' : 'NOT LOADED'}`);
});

export default app;