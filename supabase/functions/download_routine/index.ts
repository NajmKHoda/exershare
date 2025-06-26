// download_routine
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  const { token } = await req.json()
  if (!token) {
    return errorResponse(req, "Token is required", 400)
  }

  // Create a Supabase client with service role key for elevated permissions
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  // Call the get_routine_package RPC with the token
  const { data, error } = await supabase.rpc('get_routine_package', { _token: token })

  // Handle errors from the RPC
  if (error) {
    return errorResponse(req, error.message, 500)
  }

  // Handle not found case
  if (!data) {
    return errorResponse(req, "Routine not found", 404)
  }

  // Transform the data with new UUIDs
  transformRoutinePackage(data)

  return new Response(
    JSON.stringify({ data }),
    { headers: { "Content-Type": "application/json" } },
  )
})

// Function to transform routine package with new UUIDs
function transformRoutinePackage(data: { 
  routine: { id: string, workout_ids: string[], [key: string]: any },
  workouts: { id: string, exercise_ids: string[], [key: string]: any }[],
  exercises: { id: string, [key: string]: any }[] 
}) {
  // Generate new IDs for each exercise
  const exerciseIdMap = new Map<string, string>();
  data.exercises.forEach(exercise => {
    const newId = crypto.randomUUID();
    exerciseIdMap.set(exercise.id, newId);
    exercise.id = newId;
  });

  // Generate new IDs for each workout and update exercise IDs
  const workoutIdMap = new Map<string, string>();
  data.workouts.forEach(workout => {
    const newId = crypto.randomUUID();
    workoutIdMap.set(workout.id, newId);
    workout.id = newId;
    workout.exercise_ids = workout.exercise_ids.map(
      id => exerciseIdMap.get(id) || id
    );
  });

  // Assign new ID to the routine and update workout IDs
  data.routine.id = crypto.randomUUID();
  data.routine.workout_ids = data.routine.workout_ids.map(
    id => workoutIdMap.get(id) || id
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
