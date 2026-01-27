Deno.serve(async (req: Request) => {
  // CORS headers for cross-origin requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Connect to the Supabase DB using the provided SUPABASE_DB_URL env var
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_DB_URL not set' }), 
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use native fetch to call the Postgres REST endpoint (PostgREST) is not available; instead use direct SQL over the DB URL via pg driver is not allowed in Edge.
    // Instead use Supabase REST API using SUPABASE_URL and SUPABASE_ANON_KEY to query auth.users via the Admin API.
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_URL or SUPABASE_ANON_KEY not set' }), 
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Query auth.users via the Admin REST endpoint: /auth/v1/admin/users requires service_role key, but listing all users is possible via the Admin API using SERVICE_ROLE key.
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || anonKey;

    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/get_user_count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!resp.ok) {
      // fallback: attempt to use Admin users endpoint
      const adminResp = await fetch(`${supabaseUrl}/admin/v1/users`, {
        method: 'GET',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        }
      });
      if (adminResp.ok) {
        const users = await adminResp.json();
        const count = Array.isArray(users) ? users.length : 0;
        const display_value = count / 100;
        return new Response(
          JSON.stringify({ count, display_value }), 
          { 
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      const text = await resp.text();
      return new Response(
        JSON.stringify({ error: 'Failed to query users', details: text }), 
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await resp.json();
    // rpc/get_user_count expected to return { count: int }
    const count = data?.[0]?.count ?? (typeof data.count === 'number' ? data.count : 0);
    const display_value = count / 100;
    return new Response(
      JSON.stringify({ count, display_value }), 
      { 
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }), 
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
