import OpenAI from 'openai'

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const systemPrompt =
  process.env.OPENAI_SYSTEM_PROMPT ||
  'Eres un coach de desempeño. Resume hallazgos, riesgos y plan 90 días. Devuelve JSON con summary, strengths, risks, focus, actions, y agrega un campo narrative con un párrafo corto, conversacional y humano (sin bullet points) sobre lo que está pasando con la persona. Usa lenguaje claro y cálido, no técnico.'
const corsOrigin = process.env.CORS_ORIGIN || '*'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing on server' })
  }

  try {
    const { evaluation } = req.body || {}
    if (!evaluation || !evaluation.criteria) {
      return res.status(400).json({ error: 'Invalid payload: expected { evaluation }' })
    }

    const openai = new OpenAI({ apiKey })
    const payload = JSON.stringify(evaluation, null, 2)
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Evaluación (JSON):\n${payload}` },
    ]

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages,
    })

    const content = completion.choices?.[0]?.message?.content || '{}'
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = { summary: content }
    }

    return res.json({ ok: true, model, analysis: parsed })
  } catch (error) {
    const status = error?.status || 500
    return res.status(status).json({ error: error?.message || 'Analysis failed' })
  }
}
