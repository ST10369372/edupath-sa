import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.8-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireString(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new HttpError(`${label} is missing or invalid.`);
  }
  return value.trim();
}

function markToAps(mark: number) {
  if (mark >= 80) return 7;
  if (mark >= 70) return 6;
  if (mark >= 60) return 5;
  if (mark >= 50) return 4;
  if (mark >= 40) return 3;
  if (mark >= 30) return 2;
  return 1;
}

function calculateApsVariants(subjects: Array<{ subject: string; mark: number }>) {
  const marked = subjects.map(item => ({
    ...item,
    points: markToAps(item.mark),
  }));
  const nonLifeOrientation = marked
    .filter(item => item.subject !== "Life Orientation")
    .sort((left, right) => right.points - left.points);
  const bestSix = nonLifeOrientation.slice(0, 6);
  const lifeOrientation = marked.find(item => item.subject === "Life Orientation");
  const baseScore = bestSix.reduce((total, item) => total + item.points, 0);
  const halfLifeOrientation = lifeOrientation
    ? Math.min(2, Math.floor(lifeOrientation.points / 2))
    : 0;
  const bestSixOverall = [...marked]
    .sort((left, right) => right.points - left.points)
    .slice(0, 6);

  return {
    variants: [
      { label: "Best 6, excluding Life Orientation", score: baseScore },
      {
        label: "Best 6, including Life Orientation",
        score: bestSixOverall.reduce((total, item) => total + item.points, 0),
      },
      { label: "Best 6 + half Life Orientation", score: baseScore + halfLifeOrientation },
    ],
  };
}

function pathwayPrompt({
  subjects,
  interests,
  careerGoals,
  grade,
  province,
  studyStartYear,
  aps,
}: Record<string, any>) {
  const subjectList = subjects.map((subject: Record<string, unknown>) =>
    `- ${String(subject.subject)}: ${Number(subject.mark)}%`
  ).join("\n");
  const apsList = Array.isArray(aps?.variants)
    ? aps.variants.map((variant: Record<string, unknown>) =>
      `- ${String(variant.label)}: ${Number(variant.score)} points`
    ).join("\n")
    : "Not provided";

  return `You are EduPath SA's education advisor for South African students. Use Google Search to research current admission requirements for the requested study-start year. Prioritise official university, college and government websites. Be practical and cautious.

LEARNER PROFILE
Grade/level: ${grade || "Grade 12"}
Preferred province: ${province || "Not specified"}
Intended study-start year: ${studyStartYear || "Not specified"}
Subjects and marks:
${subjectList}
Indicative APS calculations (institution rules differ):
${apsList}
Interests: ${interests || "Not specified"}
Career goals: ${careerGoals || "Not specified"}

Return a single JSON object only. Use this shape:
{
  "summary": "Personalised 2-3 sentence summary",
  "top_pathways": [{
    "rank": 1,
    "field": "Field of study",
    "programmes": ["Programme"],
    "qualification_types": ["Degree", "Diploma"],
    "why_suitable": "Why it may fit",
    "key_requirements": "Typical requirements; explain that they vary",
    "requirements_to_check": ["Specific subject requirements or application condition to verify"],
    "profile_evidence": ["Learner subject/mark or stated interest that supports the match"],
    "potential_gaps": ["Specific missing/weak prerequisite, or state that no subject gaps were identified from the supplied profile"],
    "typical_aps_min": null,
    "aps_context": "Use a number only when found in a current source; otherwise null and say it varies",
    "improvement_actions": ["Practical step addressing a potential gap"],
    "institutions": ["South African institution"],
    "match_level": "strong_match"
  }],
  "alternative_pathways": [{
    "title": "Alternative route",
    "description": "What it involves",
    "suitable_if": "When to consider it"
  }],
  "improvement_tips": [{
    "subject": "Subject",
    "current_mark": 0,
    "tip": "Practical advice"
  }],
  "next_steps": ["Concrete action"],
  "funding_note": "General funding guidance"
}

Include university, diploma, TVET, bridging and other realistic routes where relevant. Prefer options in the learner's province, while noting strong national alternatives. For every recommendation, distinguish profile evidence from missing information and institution-specific requirements. Never infer a missing subject mark, guarantee admission or funding, or invent a minimum APS/subject mark; use null when no reliable current source confirms a value. Explain that the learner must confirm the current programme page and application deadline with the institution.`;
}

function groundingSources(groundingMetadata: unknown) {
  const chunks = (groundingMetadata as Record<string, any>)?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  return chunks.flatMap((chunk: Record<string, any>) => {
    const web = chunk?.web;
    if (typeof web?.uri !== "string" || typeof web?.title !== "string") return [];
    try {
      const url = new URL(web.uri);
      if (url.protocol !== "https:" || seen.has(url.href)) return [];
      seen.add(url.href);
      return [{ title: web.title.slice(0, 200), url: url.href }];
    } catch {
      return [];
    }
  });
}

function fundingPrompt(items: Array<{ name: string; funder?: string }>) {
  const list = items.map(item =>
    `- ${item.name}${item.funder ? ` (${item.funder})` : ""}`
  ).join("\n");

  return `Check the current application status of these South African student funding opportunities using web search:
${list}

Return only a JSON array, with one item per opportunity:
[{"name":"exact supplied name","status":"open","closing_date":"YYYY-MM-DD or null","note":"short explanation or null"}]

Use status open, closed, or unknown. An annual programme between application cycles is not permanently closed. Use unknown if reliable current information is unavailable. Do not guess dates.`;
}

async function generate(contents: unknown, options: {
  json?: boolean;
  maxOutputTokens?: number;
  temperature?: number;
  googleSearch?: boolean;
}) {
  if (!GEMINI_API_KEY) {
    throw new HttpError("Gemini is not configured on the server. Ask the administrator to set GEMINI_API_KEY.", 503);
  }

  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.3,
    maxOutputTokens: options.maxOutputTokens ?? 2048,
  };
  if (options.json) generationConfig.responseMimeType = "application/json";

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig,
  };
  if (options.googleSearch) requestBody.tools = [{ google_search: {} }];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    },
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result?.error?.message;
    throw new HttpError(
      typeof message === "string" ? `Gemini request failed: ${message}` : "Gemini request failed. Check the server API key and model configuration.",
      response.status >= 400 && response.status < 500 ? 400 : 502,
    );
  }

  const candidate = result?.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part: Record<string, unknown>) => part.text)
    .filter((part: unknown): part is string => typeof part === "string")
    .join("");

  if (!text) {
    const reason = candidate?.finishReason;
    if (reason === "MAX_TOKENS") {
      throw new HttpError("Gemini's response was cut off. Please try again.", 502);
    }
    throw new HttpError("Gemini returned no text. Check the prompt and safety settings.", 502);
  }

  return {
    text,
    finishReason: candidate?.finishReason,
    groundingMetadata: candidate?.groundingMetadata,
  };
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const arrayStart = text.indexOf("[");
    const jsonStart = start < 0 ? arrayStart : arrayStart < 0 ? start : Math.min(start, arrayStart);
    if (jsonStart < 0) throw new HttpError("Gemini returned invalid JSON. Please try again.", 502);

    const opening = text[jsonStart];
    const closing = opening === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = jsonStart; index < text.length; index++) {
      const char = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
      } else if (char === '"') {
        inString = true;
      } else if (char === opening) {
        depth++;
      } else if (char === closing) {
        depth--;
        if (depth === 0) return JSON.parse(text.slice(jsonStart, index + 1));
      }
    }

    throw new HttpError(
      "Gemini's response was incomplete. Please try again.",
      502,
    );
  }
}

async function handleAction(body: Record<string, any>) {
  switch (body.action) {
    case "pathway": {
      if (!Array.isArray(body.subjects) || body.subjects.length < 2 || body.subjects.length > 20) {
        throw new HttpError("Add between 2 and 20 subjects before requesting recommendations.");
      }
      const subjects = body.subjects.map((subject: Record<string, unknown>) => {
        const name = requireString(subject?.subject, "Subject", 100);
        const mark = Number(subject?.mark);
        if (!Number.isInteger(mark) || mark < 0 || mark > 100) {
          throw new HttpError(`The mark for ${name} must be between 0 and 100.`);
        }
        return { subject: name, mark };
      });
      const interests = typeof body.interests === "string" ? body.interests.slice(0, 500) : "";
      const careerGoals = typeof body.careerGoals === "string" ? body.careerGoals.slice(0, 500) : "";
      const grade = typeof body.grade === "string" ? body.grade.slice(0, 80) : "";
      const province = typeof body.province === "string" ? body.province.slice(0, 80) : "";
      const studyStartYear = Number(body.studyStartYear);
      if (!Number.isInteger(studyStartYear) || studyStartYear < 2024 || studyStartYear > 2040) {
        throw new HttpError("Choose a valid intended study-start year.");
      }
      const aps = calculateApsVariants(subjects);
      const result = await generate(pathwayPrompt({
        subjects,
        interests,
        careerGoals,
        grade,
        province,
        studyStartYear,
        aps,
      }), {
        maxOutputTokens: 4096,
        googleSearch: true,
      });
      const parsed = parseJson(result.text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new HttpError("Gemini returned an invalid pathway response.", 502);
      }
      return {
        ...parsed,
        sources: groundingSources(result.groundingMetadata),
        research_checked_at: new Date().toISOString(),
      };
    }
    case "funding-status": {
      if (!Array.isArray(body.items) || body.items.length > 10) {
        throw new HttpError("Check between 1 and 10 funding opportunities at a time.");
      }
      if (!body.items.length) return [];
      const items = body.items.map((item: Record<string, unknown>) => ({
        name: requireString(item?.name, "Funding opportunity name", 200),
        funder: typeof item?.funder === "string" ? item.funder.slice(0, 150) : "",
      }));
      const result = await generate(fundingPrompt(items), {
        maxOutputTokens: 2048,
        temperature: 0.1,
        googleSearch: true,
      });
      const parsed = parseJson(result.text);
      if (!Array.isArray(parsed)) throw new HttpError("Gemini returned an invalid funding status list.", 502);
      return parsed.map((item: Record<string, unknown>) => ({
        name: String(item.name || "").trim(),
        status: ["open", "closed", "unknown"].includes(String(item.status)) ? item.status : "unknown",
        closing_date: typeof item.closing_date === "string" ? item.closing_date : null,
        note: typeof item.note === "string" ? item.note : null,
      }));
    }
    case "follow-up": {
      const question = requireString(body.question, "Question", 1000);
      const context = JSON.stringify(body.context ?? {}).slice(0, 12000);
      const result = await generate(
        `You are EduPath SA's education advisor for South African students.
Previous pathway context:
${context}

Student question: ${question}
Answer practically and encouragingly in no more than 200 words. Do not guarantee admissions or funding.`,
        { maxOutputTokens: 512, temperature: 0.5 },
      );
      return { text: result.text };
    }
    default:
      throw new HttpError("Unknown Gemini action.");
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Use POST for Gemini requests." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!authorization?.startsWith("Bearer ") || !supabaseUrl || !supabaseKey) {
    return jsonResponse({ error: "Sign in to use EduPath AI." }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Your session has expired. Sign in again to use EduPath AI." }, 401);
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new HttpError("Send a JSON object with a valid Gemini action.");
    }
    return jsonResponse(await handleAction(body));
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    console.error("Gemini function failed:", error);
    return jsonResponse({ error: "Gemini could not complete the request. Please try again." }, 502);
  }
});
