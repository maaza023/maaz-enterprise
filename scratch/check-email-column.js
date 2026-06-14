const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = 'https://eaxnjlypozqxtzlmyppp.supabase.co';
  const supabaseKey = 'sb_publishable_KY42R1MTaXqNds_aDOuCGw_xM_w_AkO';
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Testing insert on bookings with email...");
  const { data, error } = await supabase
    .from('bookings')
    .insert([{ address: 'Test', pincode: '123456', consultation_date: '2026-06-15', consultation_time: '09:00:00', email: 'test@example.com' }])
    .select();
    
  console.log("Bookings insert with email result:", { data, error });
}

main().catch(console.error);
