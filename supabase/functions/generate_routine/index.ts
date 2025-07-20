import fs from 'node:fs'
import { GoogleGenAI, Type } from "npm:@google/genai"

const ai = new GoogleGenAI({ apiKey: Deno.env.get("GOOGLE_GENAI_API_KEY") });

const instructionData = Deno.readFileSync("./systemPrompt.txt");
const systemInstructions = new TextDecoder("utf-8").decode(instructionData);

// Fetch system instructions

Deno.serve(async (req) => {
  const body = await req.json();

  const prompt = 'Input:\n' + JSON.stringify(body, null, 2) + '\nOutput:';
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstructions,
      responseMimeType: 'application/json',
      responseSchema: jsonSchema,
    }
  });

  const data = JSON.parse(response.text);
  const numberToUUID = new Map<number, string>();

  // Transform exercises
  for (const exercise of data.exercises) {
    const uuid = crypto.randomUUID();
    numberToUUID.set(exercise.id, uuid);
    exercise.intensity_types = exercise.intensity_types.join(',')
    exercise.categories = exercise.categories.join(',')
    exercise.id = uuid;
  }

  // Transform workouts
  for (const workout of data.workouts) {
    const uuid = crypto.randomUUID();
    numberToUUID.set(workout.id, uuid);
    workout.id = uuid;
    workout.exercise_ids = workout.exercise_ids.map((id: number) => numberToUUID.get(id));
  }

  // Transform routine
  data.routine.id = crypto.randomUUID();
  data.routine.workout_ids = data.routine.workout_ids.map((id: number) => {
    if (id === null) return null;
    return numberToUUID.get(id);
  });

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});

const jsonSchema = {
  type: Type.OBJECT,
  required: ['exercises', 'workouts', 'routine'],
  properties: {
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['id', 'name', 'intensity_types', 'volume_type', 'sets', 'notes', 'categories'],
        properties: {
          id: { type: Type.INTEGER },
          name: { type: Type.STRING },
          intensity_types: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              enum: ['weight', 'speed', 'incline', 'resistance', 'level']
            }
          },
          volume_type: {
            type: Type.STRING,
            enum: ['reps', 'distance', 'time', 'calories']
          },
          sets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['volume'],
              properties: {
                volume: { type: Type.NUMBER },
                weight: { type: Type.NUMBER },
                speed: { type: Type.NUMBER },
                incline: { type: Type.NUMBER },
                resistance: { type: Type.NUMBER },
                level: { type: Type.NUMBER }
              }
            }
          },
          notes: { type: Type.STRING },
          categories: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    },
    workouts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['id', 'name', 'exercise_ids'],
        properties: {
          id: { type: Type.INTEGER },
          name: { type: Type.STRING },
          exercise_ids: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER }
          }
        }
      }
    },
    routine: {
      type: Type.OBJECT,
      required: ['id', 'name', 'workout_ids'],
      properties: {
        id: { type: Type.INTEGER },
        name: { type: Type.STRING },
        workout_ids: {
          type: Type.ARRAY,
          minItems: 7,
          maxItems: 7,
          items: { anyOf: [
            { type: Type.INTEGER },
            { type: Type.NULL }
          ]}
        }
      }
    }
  }
};