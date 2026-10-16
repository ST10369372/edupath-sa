/**
 * EduPath SA – Google Gemini AI integration
 *
 * SECURITY NOTE: In production, this call should be proxied through a
 * Supabase Edge Function so the API key is never exposed in the browser.
 * For a student prototype, the key is read from VITE_GEMINI_API_KEY.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

/**
 * Build a structured prompt for the Education Pathway Advisor
 */
function buildPathwayPrompt(subjects, interests, careerGoals, grade) {
  const subjectList = subjects
    .map(s => `  - ${s.subject}: ${s.mark}%`)
    .join('\n')

  return `You are EduPath SA's AI Education Advisor for South African students. Analyse this learner's academic profile and provide personalised higher education pathway recommendations.

LEARNER PROFILE:
Grade/Level: ${grade || 'Grade 12'}
Subjects and Marks:
${subjectList}
Interests: ${interests || 'Not specified'}
Career Goals: ${careerGoals || 'Not specified'}

Please respond in the following JSON format ONLY (no markdown, no extra text):

{
  "summary": "A 2-3 sentence personalised summary of the learner's academic strengths",
  "aps_estimate": "Estimated APS (Admission Point Score) if relevant",
  "top_pathways": [
    {
      "rank": 1,
      "field": "Field of study name",
      "programmes": ["Degree/Diploma 1", "Degree/Diploma 2"],
      "qualification_types": ["BSc", "BTech", "Diploma"],
      "why_suitable": "Explanation of why this suits the learner",
      "key_requirements": "Typical admission requirements for this field",
      "institutions": ["University of Pretoria", "UCT", "TVET College option"],
      "match_level": "strong_match | possible_match | stretch_goal"
    }
  ],
  "alternative_pathways": [
    {
      "title": "Alternative pathway title",
      "description": "What this path involves",
      "suitable_if": "When the learner should consider this"
    }
  ],
  "improvement_tips": [
    {
      "subject": "Subject name",
      "current_mark": 0,
      "tip": "Specific advice to improve or maintain"
    }
  ],
  "next_steps": [
    "Concrete action step 1",
    "Concrete action step 2",
    "Concrete action step 3"
  ],
  "funding_note": "Brief note about relevant funding opportunities (NSFAS, bursaries)"
}

Base recommendations on:
- South African National Senior Certificate (NSC) requirements
- APS (Admission Point Score) system
- TVET college options as valid alternatives
- NSFAS funding eligibility
- Actual South African universities: UCT, Wits, UP, Stellenbosch, UJ, UKZN, NWU, UFS, WSU, etc.
- Always suggest TVET alternatives for students who may not meet university requirements`
}

/**
 * Get education pathway recommendations from Google Gemini
 */
export async function getPathwayRecommendations({ subjects, interests, careerGoals, grade }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.')
  }

  const prompt = buildPathwayPrompt(subjects, interests, careerGoals, grade)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error('Could not parse Gemini response. Please try again.')
  }
}

/**
 * Ask a follow-up question about study pathways
 */
export async function askFollowUpQuestion({ question, context }) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured.')
  }

  const prompt = `You are EduPath SA's AI Education Advisor for South African students.

Previous context:
${JSON.stringify(context, null, 2)}

Student question: "${question}"

Answer helpfully and specifically for South African higher education. Keep your response under 200 words, practical and encouraging.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
      }),
    }
  )

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)

  const data = await response.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.'
}
