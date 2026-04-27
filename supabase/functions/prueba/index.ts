// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

console.log('Hello from Functions!')

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  Bash:
  curl -i --location --request POST 'https://mrx7013v-54321.usw3.devtunnels.ms/functions/v1/prueba' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwOTIwNjg3NTd9.HmpFyXs63M9xIUxaGSROHRCnLB3eThNtijiGtclYwSFwsF7IGBkYvG8zQkxTgUcEEc1B-8cQV1F6sdkXZZgoZw' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

  PowerShell:
  curl.exe -i --location --request POST 'https://mrx7013v-54321.usw3.devtunnels.ms/functions/v1/prueba' `
     --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwOTIwNjg3NTd9.HmpFyXs63M9xIUxaGSROHRCnLB3eThNtijiGtclYwSFwsF7IGBkYvG8zQkxTgUcEEc1B-8cQV1F6sdkXZZgoZw' `
     --header 'Content-Type: application/json' `
     --data '{\"name\":\"Functions\"}'

*/
