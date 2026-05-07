// Central AI client — all calls go through /api/ai (server-side, secure)

export async function callAI(mode, data) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, data }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'KI-Fehler');
  }
  
  const json = await res.json();
  return json.result;
}

// Convenience functions
export const analyzeFoodText = (description) => 
  callAI('food_text', { description });

export const analyzeFoodPhoto = (b64, mime, description = '') => 
  callAI('food_photo', { image: { b64, mime }, description });

export const getLifestyleScore = (name, data) => 
  callAI('lifestyle_score', { name, ...data });

export const planCalendar = (message, events) => 
  callAI('calendar_plan', { message, events });

export const generateScript = (mode, data) => 
  callAI('content_script', { mode, ...data });

export const askAI = (question) => 
  callAI('universal', { question });

export const getCycleInsight = (cycleDay, phaseName, moon) => 
  callAI('cycle_insight', { cycleDay, phaseName, moon });

export const getWeeklyReview = (weekData) => 
  callAI('weekly_review', weekData);

export const askBusinessCoach = (brand, owner, metrics, question) => 
  callAI('business', { brand, owner, metrics, question });
