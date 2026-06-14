async function main() {
  const url = 'https://eaxnjlypozqxtzlmyppp.supabase.co/rest/v1/';
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_KY42R1MTaXqNds_aDOuCGw_xM_w_AkO';
  
  const res = await fetch(url, {
    headers: {
      'apikey': apikey,
      'Authorization': `Bearer ${apikey}`
    }
  });
  
  const schema = await res.json();
  console.log("Response schema keys:", Object.keys(schema || {}));
  if (schema && schema.definitions) {
    console.log("Definitions keys:", Object.keys(schema.definitions));
    for (const key of Object.keys(schema.definitions)) {
      console.log(`\nTable ${key}:`);
      console.log("Properties:", Object.keys(schema.definitions[key].properties || {}));
    }
  } else {
    console.log("No definitions found in response:", schema);
  }
}

main().catch(console.error);
