import { supabase } from './supabase'

async function callGemini(action, payload) {
  const { data, error } = await supabase.functions.invoke('gemini', {
    body: { action, ...payload },
  })

  if (error) {
    let message = error.message || 'Gemini request failed.'
    const response = error.context

    if (response instanceof Response) {
      try {
        const body = await response.clone().json()
        if (body?.error) message = body.error
      } catch {
        // Keep the SDK error when the function did not return a JSON error.
      }
    }

    throw new Error(message)
  }

  if (data?.error) throw new Error(data.error)
  return data
}

export async function getPathwayRecommendations({
  subjects,
  interests,
  careerGoals,
  grade,
  province,
  studyStartYear,
}) {
  const recommendations = await callGemini('pathway', {
    subjects,
    interests,
    careerGoals,
    grade,
    province,
    studyStartYear,
  })

  if (!recommendations || typeof recommendations !== 'object' || Array.isArray(recommendations)) {
    throw new Error('Gemini returned an unexpected response. Please try again.')
  }

  return {
    ...recommendations,
    top_pathways: Array.isArray(recommendations.top_pathways) ? recommendations.top_pathways : [],
    alternative_pathways: Array.isArray(recommendations.alternative_pathways) ? recommendations.alternative_pathways : [],
    next_steps: Array.isArray(recommendations.next_steps) ? recommendations.next_steps : [],
    sources: Array.isArray(recommendations.sources) ? recommendations.sources : [],
    research_checked_at: recommendations.research_checked_at || null,
  }
}

export async function verifyFundingStatus(items) {
  if (!items?.length) return []

  const data = await callGemini('funding-status', { items })
  if (!Array.isArray(data)) {
    throw new Error('Gemini returned an unexpected funding response. Please try again.')
  }

  return data.map(item => ({
    name: String(item.name || '').trim(),
    status: ['open', 'closed', 'unknown'].includes(item.status) ? item.status : 'unknown',
    closing_date: item.closing_date || null,
    note: item.note || null,
  }))
}

export async function askFollowUpQuestion({ question, context }) {
  const data = await callGemini('follow-up', { question, context })
  if (typeof data?.text !== 'string' || !data.text.trim()) {
    throw new Error('Gemini did not return an answer. Please try again.')
  }
  return data.text
}
