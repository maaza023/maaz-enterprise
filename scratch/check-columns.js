const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = 'https://eaxnjlypozqxtzlmyppp.supabase.co';
  const supabaseKey = 'sb_publishable_KY42R1MTaXqNds_aDOuCGw_xM_w_AkO';
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Testing insert on leads with phone...");
  const { data: leadData, error: leadError } = await supabase
    .from('leads')
    .insert([{ name: 'Test', email: 'test@example.com', message: 'test', phone: '1234567890' }])
    .select();
  
  console.log("Leads insert result:", { leadData, leadError });

  console.log("\nTesting insert on bookings with phone...");
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .insert([{ address: 'Test', pincode: '123456', consultation_date: '2026-06-15', consultation_time: '09:00:00', phone: '1234567890' }])
    .select();
    
  console.log("Bookings insert result:", { bookingData, bookingError });
}

main().catch(console.error);
