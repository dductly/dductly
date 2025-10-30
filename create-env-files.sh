#!/bin/bash

echo "🔧 Creating environment files..."
echo ""

# Create backend .env
cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
VITE_SUPABASE_URL=https://waxtxjnhrrcyxcvuaujn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheHR4am5ocnJjeXhjdnVhdWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTQ4NTUsImV4cCI6MjA3MzYzMDg1NX0.3Zm-FfXjAofjYSMBNB6LhJRDYTx08lAFWYQtZquxGfw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheHR4am5ocnJjeXhjdnVhdWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODA1NDg1NSwiZXhwIjoyMDczNjMwODU1fQ.8LA2lvm6H8XtGRijOUeej6iq_6L9V8T9hWh6Mt1ekFA
EOF

# Create frontend .env.local
cat > frontend/.env.local << 'EOF'
VITE_SUPABASE_URL=https://waxtxjnhrrcyxcvuaujn.supabase.co
VITE_SUPABASE_ANON_PUBLIC_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheHR4am5ocnJjeXhjdnVhdWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTQ4NTUsImV4cCI6MjA3MzYzMDg1NX0.3Zm-FfXjAofjYSMBNB6LhJRDYTx08lAFWYQtZquxGfw
EOF

echo "✅ Files created:"
echo "   ✓ backend/.env"
echo "   ✓ frontend/.env.local"
echo ""
echo "🚀 Next steps:"
echo "   1. cd backend && npm install && npm run dev"
echo "   2. Open new terminal: cd frontend && npm install && npm run dev"
echo ""

