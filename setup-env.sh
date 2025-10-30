#!/bin/bash

echo "🔧 Setting up environment files for dductly..."
echo ""

# Frontend .env.local
echo "📝 Creating frontend/.env.local..."
cat > frontend/.env.local << 'EOF'
VITE_SUPABASE_URL=https://waxtxjnhrrcyxcvuaujn.supabase.co
VITE_SUPABASE_ANON_PUBLIC_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheHR4am5ocnJjeXhjdnVhdWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTQ4NTUsImV4cCI6MjA3MzYzMDg1NX0.3Zm-FfXjAofjYSMBNB6LhJRDYTx08lAFWYQtZquxGfw
EOF

# Backend .env
echo "📝 Creating backend/.env..."
cat > backend/.env << 'EOF'
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
VITE_SUPABASE_URL=https://waxtxjnhrrcyxcvuaujn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheHR4am5ocnJjeXhjdnVhdWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTQ4NTUsImV4cCI6MjA3MzYzMDg1NX0.3Zm-FfXjAofjYSMBNB6LhJRDYTx08lAFWYQtZquxGfw

# Service Role Key (for admin operations like deleting users)
# WARNING: Keep this secret! Never expose to frontend!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheHR4am5ocnJjeXhjdnVhdWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NDg1NSwiZXhwIjoyMDczNjMwODU1fQ.8LA2lvm6H8XtGRijOUeej6iq_6L9V8T9hWh6Mt1ekFA
EOF

echo ""
echo "✅ Environment files created successfully!"
echo ""
echo "📍 Files created:"
echo "   - frontend/.env.local"
echo "   - backend/.env"
echo ""
echo "🔐 Key Information:"
echo "   - anon public key: Used in frontend (safe to expose)"
echo "   - service_role key: Used in backend only (KEEP SECRET!)"
echo ""
echo "🚀 Next steps:"
echo "   1. cd frontend && npm install && npm run dev"
echo "   2. In a new terminal: cd backend && npm install && npm run dev"
echo "   3. Open http://localhost:5173"
echo ""




