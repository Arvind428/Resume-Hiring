import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testQuery() {
  console.log('Testing Supabase Connection...');
  const { data: cands, error: getErr } = await supabase.from('candidates').select('id').limit(3);
  if (getErr) return console.error('Error fetching baseline:', getErr);
  if (!cands || cands.length < 3) return console.log('DB currently has less than 3 candidates! Total:', cands?.length);
  
  const ids = cands.map(c => c.id);
  console.log('Testing .in() match for IDs:', ids);
  
  const { data: matched, error: matchErr } = await supabase.from('candidates').select('*').in('id', ids);
  if (matchErr) return console.error('Match Error:', matchErr);
  
  console.log('Result Matched Length:', matched.length);
  if (matched.length !== 3) console.log('FAILED TO MATCH EXACTLY 3!');
  else console.log('SUCCESS! The .in() query fundamentally works.');
}

testQuery();
