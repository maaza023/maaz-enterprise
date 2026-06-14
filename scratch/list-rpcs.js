async function main() {
  const url = 'https://eaxnjlypozqxtzlmyppp.supabase.co/rest/v1/';
  const apikey = 'sb_publishable_KY42R1MTaXqNds_aDOuCGw_xM_w_AkO';
  
  const res = await fetch(url, {
    headers: {
      'apikey': apikey,
      'Authorization': `Bearer ${apikey}`
    }
  });
  
  const schema = await res.json();
  const rpcs = Object.keys(schema.paths || {}).filter(p => p.startsWith('/rpc/'));
  console.log("RPC paths found:", rpcs);
}

main().catch(console.error);
