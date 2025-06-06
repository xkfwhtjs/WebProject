// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jwnywdgwopbpylvvxihr.supabase.co'
const supabaseAnonKey = 
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3bnl3ZGd3b3BicHlsdnZ4aWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MDg2NDIsImV4cCI6MjA2NDA4NDY0Mn0.PHIgDa6iiOkD5GY1qvlW0RkRRVVZMO6loTjxpzcsMPk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)