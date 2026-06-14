async function main() {
  const apikey = 'sb_publishable_KY42R1MTaXqNds_aDOuCGw_xM_w_AkO';
  
  for (const table of ['bookings', 'leads', 'profiles']) {
    const url = `https://eaxnjlypozqxtzlmyppp.supabase.co/rest/v1/${table}`;
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`
      }
    });
    
    console.log(`\nTable: ${table}`);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text length:", text.length);
    console.log("Response text first 500 chars:", text.slice(0, 500));
  }
}

main().catch(console.error);
