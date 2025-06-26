// download_workout
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  const { token } = await req.json()
  if (!token) {
    return errorResponse(req, "Token is required", 400)
  }

  // Create a Supabase client with service role key for elevated permissions
  const supabase= createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  // Call the get_workout_package RPC with the token
  const { data, error } = await supabase.rpc('get_workout_package', { _token: token })

  // Handle errors from the RPC
  if (error) {
    return errorResponse(req, error.message, 500)
  }

  // Handle not found case
  if (!data) {
    return errorResponse(req, "Workout not found", 404)
  }

  // Transform the data with new UUIDs
  transformWorkoutPackage(data)

  return new Response(
    JSON.stringify({ data }),
    { headers: { "Content-Type": "application/json" } },
  )
})

// Function to transform workout package with new UUIDs
function transformWorkoutPackage(data: { 
  workout: { id: string, exercise_ids: string[], [key: string]: any }, 
  exercises: { id: string, [key: string]: any }[] 
}) {
  // Generate new IDs for each exercise
  const exerciseIdMap = new Map<string, string>();
  data.exercises.forEach(exercise => {
    const newId = crypto.randomUUID();
    exerciseIdMap.set(exercise.id, newId);
    exercise.id = newId;
  });

  // Assign new ID to the workout and update exercise IDs
  data.workout.id = crypto.randomUUID();
  data.workout.exercise_ids = data.workout.exercise_ids.map(
    id => exerciseIdMap.get(id) || id
  );

  return data;
}

function errorResponse(req: Request, message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  )
}