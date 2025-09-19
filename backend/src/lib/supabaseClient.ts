import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://waxtxjnhrrcyxcvuaujn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheHR4am5ocnJjeXhjdnVhdWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNTQ4NTUsImV4cCI6MjA3MzYzMDg1NX0.3Zm-FfXjAofjYSMBNB6LhJRDYTx08lAFWYQtZquxGfw'

export const supabase = createClient(supabaseUrl, supabaseKey)
