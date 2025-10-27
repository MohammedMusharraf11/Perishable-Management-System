# PMS Backend - Folder Structure

## 📁 Directory Structure

```
backend/
├── database/
│   ├── schema.sql          # Main database schema (run this on Supabase)
│   └── seed.sql            # Seed data for testing
├── src/
│   ├── config/
│   │   └── database.js     # Database connection configuration
│   ├── controllers/        # Route controllers (add your logic here)
│   ├── middleware/         # Custom middleware (auth, validation, etc.)
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Helper functions
│   ├── jobs/               # Cron jobs
│   └── server.js           # Main server file
├── logs/                   # Application logs (auto-generated)
├── tests/                  # Test files
├── .env                    # Environment variables (create from .env.example)
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Run Database Schema on Supabase
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Copy and paste contents of `database/schema.sql`
- Execute the SQL
- (Optional) Run `database/seed.sql` for test data

### 4. Test Database Connection
```bash
node src/config/database.js
```

### 5. Start Development Server
```bash
npm run dev
```

