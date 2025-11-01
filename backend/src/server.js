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
import publicEnvRouter from "./routes/publicENV.js";
import { createClient } from '@supabase/supabase-js';



const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/publicENV", publicEnvRouter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Generate staff email and ID for staff role
    let staffEmail = email;
    let staffId = null;

    if (role === 'Staff') {
      // Get used staff IDs
      const { data: usedIds } = await supabase
        .from('pms_users')
        .select('staff_id')
        .not('staff_id', 'is', null);

      const usedSet = new Set(usedIds?.map(u => u.staff_id));
      const availableIds = Array.from({ length: 499 }, (_, i) => i + 1)
        .filter(id => !usedSet.has(id));

      if (availableIds.length === 0) {
        return res.status(400).json({ error: 'All Staff IDs (1–499) are taken.' });
      }

      staffId = availableIds[Math.floor(Math.random() * availableIds.length)];
      const padded = String(staffId).padStart(3, '0');
      staffEmail = `pms_${padded}@gmail.com`;
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('pms_users')
      .select('*')
      .eq('email', staffEmail)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Insert new user
    const { data, error } = await supabase
      .from('pms_users')
      .insert([{
        name,
        email: staffEmail,
        password, // In production, hash this password!
        role,
        staff_id: staffId,
        approval_status: role === 'Manager' ? 'pending' : 'approved'
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user: data,
      message: role === 'Staff' ? 
        `Your Staff ID is: ${String(staffId).padStart(3, '0')}. Use ${staffEmail} to login.` :
        'Signup successful! Please wait for admin approval.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and password
    const { data: user, error } = await supabase
      .from('pms_users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (user.role === 'Manager' && user.approval_status !== 'approved') {
      return res.status(401).json({ error: 'Your manager account is pending admin approval.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        approvalStatus: user.approval_status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

  // Add these routes to your server.js

// Get pending managers
app.get('/api/admin/pending-managers', async (req, res) => {
  try {
    const { data: pendingManagers, error } = await supabase
      .from('public.pms_users')
      .select('*')
      .eq('role', 'Manager')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending managers:', error);
      return res.status(500).json({ error: 'Database error: ' + error.message });
    }

    res.json({
      success: true,
      pendingManagers: pendingManagers || []
    });

  } catch (error) {
    console.error('Pending managers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve manager
app.post('/api/admin/approve-manager', async (req, res) => {
  try {
    const { managerId } = req.body;

    const { data, error } = await supabase
      .from('public.pms_users')
      .update({ approval_status: 'approved' })
      .eq('id', managerId)
      .eq('role', 'Manager')
      .select()
      .single();

    if (error) {
      console.error('Error approving manager:', error);
      return res.status(500).json({ error: 'Database error: ' + error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    res.json({
      success: true,
      message: 'Manager approved successfully',
      manager: data
    });

  } catch (error) {
    console.error('Approve manager error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Supabase URL: ${process.env.SUPABASE_URL ? 'Loaded' : 'NOT LOADED'}`);
});

export default app;
