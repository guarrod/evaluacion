import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import { config as loadEnv } from 'dotenv'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const envLocal = path.join(rootDir, '.env.local')
const envDefault = path.join(rootDir, '.env')

if (fs.existsSync(envLocal)) {
  loadEnv({ path: envLocal })
} else if (fs.existsSync(envDefault)) {
  loadEnv({ path: envDefault })
}

const app = express()
const port = process.env.PORT || 8788
const apiKey = process.env.OPENAI_API_KEY
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const promptPath = process.env.OPENAI_PROMPT_PATH
const DEFAULT_SYSTEM_PROMPT =
  'Eres un coach de desempeño. Resume hallazgos, riesgos y plan 90 días. Devuelve JSON con summary, strengths, risks, focus, actions, y agrega un campo narrative con un párrafo corto, conversacional y humano (sin bullet points) sobre lo que está pasando con la persona. Usa lenguaje claro y cálido, no técnico.'
let systemPrompt = process.env.OPENAI_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT
if (promptPath) {
  const fullPath = path.isAbsolute(promptPath)
    ? promptPath
    : path.join(rootDir, promptPath)
  if (fs.existsSync(fullPath)) {
    systemPrompt = fs.readFileSync(fullPath, 'utf8')
  }
}
const corsOrigin = process.env.CORS_ORIGIN

let openai = null
if (apiKey) {
  openai = new OpenAI({ apiKey })
} else {
  console.warn('[api] OPENAI_API_KEY not set. /api/analyze will return 500 until configured.')
}

app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model, hasKey: !!apiKey })
})

app.post('/api/analyze', async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing on server' })
  }

  const { evaluation } = req.body || {}
  if (!evaluation || !evaluation.criteria) {
    return res.status(400).json({ error: 'Invalid payload: expected { evaluation }' })
  }

  try {
    const payload = JSON.stringify(evaluation, null, 2)
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Evaluación (JSON):\n${payload}`,
      },
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
    } catch (err) {
      parsed = { summary: content }
    }

    res.json({
      ok: true,
      model,
      analysis: parsed,
    })
  } catch (error) {
    console.error('OpenAI error', error)
    const status = error?.status || 500
    res.status(status).json({ error: error?.message || 'Analysis failed' })
  }
})

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`)
})
