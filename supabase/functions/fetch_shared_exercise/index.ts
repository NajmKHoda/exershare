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
      data: {
        exercise: {
          ...exerciseData,
          id: crypto.randomUUID()
        }
      }
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})