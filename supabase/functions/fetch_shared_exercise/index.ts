// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js'

console.log('Hello from Functions!')

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  )

  // Helper function to create error responses
  const createErrorResponse = (message: string, status = 404) => {
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status,
        headers: { 'Content-Type': 'application/json' } 
      },
    );
  }

  const { token } = await req.json();
  
  // Find the share token with the provided id and type "exercise"
  const { data: shareToken, error: shareTokenError } = await supabase
    .from('share_tokens')
    .select('entity_id')
    .eq('id', token)
    .eq('type', 'exercise')
    .single();

  if (shareTokenError || !shareToken) {
    return createErrorResponse('Invalid or expired share token');
  }

  // Get the exercise using the entity_id from the share token
  const { data: exerciseData, error: exerciseError } = await supabase
    .from('exercises')
    .select('name, sets, notes, categories')
    .eq('id', shareToken.entity_id)
    .single();

  if (exerciseError || !exerciseData) {
    return createErrorResponse('Exercise not found');
  }

  // Return the exercise data
  return new Response(
    JSON.stringify({
      exercise: { ...exerciseData, id: crypto.randomUUID() }
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch_shared_exercise' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: 'application/json' \
    --data '{"token":"your-share-token-id"}'

*/
