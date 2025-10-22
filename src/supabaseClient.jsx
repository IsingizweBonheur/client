
// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://kuxrbtxmiwjuabxfbqfx.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eHJidHhtaXdqdWFieGZicWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NjMyMjIsImV4cCI6MjA3NjEzOTIyMn0.AwJEEPyOnq7BFB1PDlXFLt-VC3J5cDilYa3PYnu_048";

export const supabase = createClient(supabaseUrl, anonKey);
