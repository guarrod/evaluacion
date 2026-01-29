/* global __APP_VERSION__ */
import React, { useMemo, useState } from "react";

/**
 * Evaluation Matrix — UX Designer
 * React + Tailwind (no deps)
 *
 * - Scale 1..5 per criterion
 * - Notes/evidence per criterion
 * - Optional weights
 * - Layer summaries + overall score
 * - Export/Import JSON
 */

const VERSION_INFO =
  typeof __APP_VERSION__ === "object" && __APP_VERSION__ !== null
    ? __APP_VERSION__
    : { semver: "0.0.0", build: "dev", label: "v0.0.0", full: "v0.0.0+dev" };

const VERSION_SEMVER = VERSION_INFO.semver || "0.0.0";
const VERSION_LABEL = VERSION_INFO.label || `v${VERSION_SEMVER}`;
const VERSION_FULL = VERSION_INFO.full || `${VERSION_LABEL}+${VERSION_INFO.build || "dev"}`;
const API_BASE = import.meta.env.VITE_API_BASE || "";

const SCALE = [1, 2, 3, 4, 5];

const DEFAULT_CRITERIA = [
  {
    id: "deliverables_quality",
    layer: "Entrega",
    name: "Calidad de entregables",
    description:
      "Claridad de la solución, nivel de detalle adecuado, consistencia con lineamientos, criterio explícito.",
    examples: [
      "Flujos, pantallas y estados edge bien cubiertos sin retrabajo posterior.",
      "Documenta decisiones y especifica con claridad (copys, reglas, edge cases).",
    ],
    anchors: [
      "1: Entregas incompletas o erróneas; generan retrabajo.",
      "2: Cubre lo básico pero con huecos frecuentes; poca claridad.",
      "3: Esperado: completo y entendible; sigue lineamientos.",
      "4: Anticipa edge cases y documenta decisiones; consistencia sólida.",
      "5: Referencia para el equipo; eleva estándares y acelera a otros.",
    ],
    recommendedWeights: { junior: 1.2, mid: 1.4, senior: 1.5 },
    weight: 1.4,
  },
  {
    id: "delivery_ownership",
    layer: "Entrega",
    name: "Cumplimiento y ownership de entregas",
    description:
      "Cumple tiempos sin persecución, anticipa bloqueos, da seguimiento y cierra loops.",
    examples: [
      "Se adelanta a riesgos y renegocia a tiempo con stakeholders.",
      "Cierra loops: comunica avances y cambios sin persecución.",
    ],
    anchors: [
      "1: Requiere seguimiento constante; no cierra compromisos.",
      "2: Cumple solo con empuje; poca anticipación.",
      "3: Entrega en tiempo y comunica cambios básicos.",
      "4: Anticipa riesgos y renegocia; reduce sorpresas al equipo.",
      "5: Modelo de ownership; otros se coordinan siguiendo su cadencia.",
    ],
    recommendedWeights: { junior: 1.0, mid: 1.2, senior: 1.4 },
    weight: 1.2,
  },
  {
    id: "communication_participation",
    layer: "Forma de trabajar",
    name: "Comunicación y participación",
    description:
      "Participa en reuniones, explica decisiones, escucha y construye sobre otros.",
    examples: [
      "Llega preparado a rituales, explica decisiones con contexto.",
      "Escucha y sintetiza; hace preguntas que desbloquean.",
    ],
    anchors: [
      "1: No participa o descoordina; confunde al equipo.",
      "2: Comunicación reactiva; falta claridad y estructura.",
      "3: Comunicaciones claras; participa y escucha.",
      "4: Facilita discusiones, sintetiza y hace visibles riesgos.",
      "5: Facilita sesiones complejas y eleva la comunicación del grupo.",
    ],
    recommendedWeights: { junior: 1.0, mid: 1.2, senior: 1.3 },
    weight: 1.1,
  },
  {
    id: "collaboration_team_attitude",
    layer: "Forma de trabajar",
    name: "Colaboración y actitud de equipo",
    description:
      "Disposición real a ayudar, actitud ante pedidos extra, lenguaje verbal/no verbal.",
    examples: [
      "Se ofrece para apoyar picos de carga y pair design.",
      "Mantiene actitud constructiva en desacuerdos.",
    ],
    anchors: [
      "1: Actitud negativa o bloqueante; drena al equipo.",
      "2: Ayuda solo si se le insiste; lenguaje poco colaborativo.",
      "3: Colabora cuando se le pide; trato respetuoso.",
      "4: Se adelanta a ayudar; cuida tono y clima.",
      "5: Cataliza colaboración; crea espacios seguros y productivos.",
    ],
    recommendedWeights: { junior: 1.0, mid: 1.1, senior: 1.2 },
    weight: 1.0,
  },
  {
    id: "proactivity_initiative",
    layer: "Ownership & cultura",
    name: "Proactividad e iniciativa",
    description:
      "Propone mejoras, detecta problemas antes, sugiere caminos alternativos.",
    examples: [
      "Identifica problemas sin que se le pida y plantea opciones.",
      "Trae data, comparativos o prototipos rápidos para validar.",
    ],
    anchors: [
      "1: No propone; espera instrucciones incluso ante problemas obvios.",
      "2: Propone esporádico y sin profundidad; poca acción.",
      "3: Sugiere mejoras con sustento básico y las ejecuta.",
      "4: Anticipa problemas, prioriza y mueve recursos para resolver.",
      "5: Cambia la vara del equipo; crea playbooks y frameworks reutilizables.",
    ],
    recommendedWeights: { junior: 1.0, mid: 1.3, senior: 1.6 },
    weight: 1.3,
  },
  {
    id: "product_domain_context",
    layer: "Entrega",
    name: "Dominio del producto y contexto",
    description:
      "Entiende el producto, restricciones negocio/tecnología, usa data/feedback real.",
    examples: [
      "Decisiones basadas en métricas, feedback real o constraints técnicos.",
      "Conoce el flujo end-to-end y sus trade-offs.",
    ],
    anchors: [
      "1: Diseños desconectados de negocio/tech; ignora datos.",
      "2: Considera contexto solo tras feedback; errores por desconocimiento.",
      "3: Usa inputs clave y evita choques con restricciones.",
      "4: Integra data y tech temprano; optimiza trade-offs.",
      "5: Se vuelve referencia de dominio; guía decisiones estratégicas.",
    ],
    recommendedWeights: { junior: 1.1, mid: 1.3, senior: 1.4 },
    weight: 1.2,
  },
  {
    id: "feedback_adaptability",
    layer: "Forma de trabajar",
    name: "Actitud frente al feedback y al cambio",
    description:
      "Recibe feedback sin defensiva, itera con buena disposición, aprende de correcciones.",
    examples: [
      "Pide feedback temprano y lo incorpora rápido.",
      "Explica qué cambió y qué aprendió tras iteraciones.",
    ],
    anchors: [
      "1: Rechaza feedback; no corrige o corrige tarde.",
      "2: Acepta a regañadientes; itera mínimo y lento.",
      "3: Recibe feedback y ajusta con buena disposición.",
      "4: Pide feedback proactivamente, itera rápido y comunica cambios.",
      "5: Eleva la cultura de feedback; crea mecánicas y da coaching.",
    ],
    recommendedWeights: { junior: 1.0, mid: 1.2, senior: 1.3 },
    weight: 1.1,
  },
  {
    id: "cultural_impact_projection",
    layer: "Ownership & cultura",
    name: "Impacto cultural (proyección)",
    description:
      "Energía que aporta, si suma o drena, si refuerza o debilita cultura.",
    examples: [
      "Participa en rituales de equipo y cuida el clima.",
      "Modela comportamientos: comparte aprendizajes, celebra logros.",
    ],
    anchors: [
      "1: Impacto negativo visible; drena moral o rompe acuerdos.",
      "2: Neutral con sesgos negativos; no cuida clima.",
      "3: Suma al clima; respeta acuerdos y normas.",
      "4: Refuerza cultura activamente; contagia buenas prácticas.",
      "5: Referente cultural; crea mecanismos que perduran.",
    ],
    recommendedWeights: { junior: 0.8, mid: 1.2, senior: 1.5 },
    weight: 1.2,
  },
];

const CHANGELOG = [
  {
    version: "0.3.0",
    date: "2026-01-27",
    build: VERSION_INFO.build,
    items: [
      "Botón de análisis IA vía proxy /api/analyze (OpenAI) para resumir hallazgos y focos.",
      "Rango de pesos ajustado (0.5–2, extremos 0–3) alineado con sugerencias.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-01-27",
    items: [
      "Anclajes 1–5 por criterio + ejemplos observables para reducir subjetividad.",
      "Pesos sugeridos por seniority, opción para bloquear extremos (0/5) y preset rápido.",
      "Sección de fortalezas y focos de 90 días para acción concreta.",
      "Export/import conserva notas, pesos y plan de acción.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-01-27",
    items: [
      "Primer corte de la matriz UX con criterios base y pesos opcionales.",
      "Resumen general + por capas, export/import JSON y reset rápido.",
      "UI con Tailwind y tipografía Space Grotesk.",
    ],
  },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreLabel(v) {
  switch (v) {
    case 1:
      return "Crítico";
    case 2:
      return "Bajo";
    case 3:
      return "Esperado";
    case 4:
      return "Bueno";
    case 5:
      return "Referente";
    default:
      return "—";
  }
}

function badgeClass(v) {
  if (v <= 2) return "bg-red-100 text-red-800 border-red-200";
  if (v === 3) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

export default function EvaluationMatrix() {
  const [meta, setMeta] = useState({
    evaluateeName: "",
    role: "UX Designer",
    project: "",
    period: "",
    evaluator: "",
    createdAt: new Date().toISOString().slice(0, 10),
  });

  const [criteria, setCriteria] = useState(() =>
    DEFAULT_CRITERIA.map((c) => ({
      ...c,
      score: 0,
      evidence: "",
    }))
  );

  const [useWeights, setUseWeights] = useState(true);
  const [showJSON, setShowJSON] = useState(false);
  const [allowExtremeWeights, setAllowExtremeWeights] = useState(false);
  const [weightPreset, setWeightPreset] = useState("custom");
  const [showChangelog, setShowChangelog] = useState(false);
  const [importText, setImportText] = useState("");
  const [strengths, setStrengths] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisModel, setAnalysisModel] = useState("");

  function normalizeAnalysis(payload) {
    const raw = payload || {};
    const ensureArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === "string") return [val];
      return [JSON.stringify(val)];
    };
    const summary =
      typeof raw.summary === "string"
        ? raw.summary
        : raw.summary
        ? JSON.stringify(raw.summary)
        : "";

    return {
      summary,
      strengths: ensureArray(raw.strengths),
      risks: ensureArray(raw.risks),
      focus: ensureArray(raw.focus || raw.focusAreas),
      actions: ensureArray(raw.actions || raw.recommendations),
      raw,
    };
  }

  const layers = useMemo(() => {
    const unique = Array.from(new Set(criteria.map((c) => c.layer)));
    return unique;
  }, [criteria]);

  const weightLimits = useMemo(
    () => (allowExtremeWeights ? { min: 0, max: 3 } : { min: 0.5, max: 2 }),
    [allowExtremeWeights]
  );

  const computed = useMemo(() => {
    const filled = criteria.filter((c) => c.score > 0);

    const perLayer = {};
    for (const layer of layers) {
      const items = criteria.filter((c) => c.layer === layer && c.score > 0);
      const denom = items.reduce((a, c) => a + (useWeights ? c.weight : 1), 0);
      const num = items.reduce(
        (a, c) => a + c.score * (useWeights ? c.weight : 1),
        0
      );
      perLayer[layer] = {
        count: items.length,
        score: denom > 0 ? num / denom : 0,
      };
    }

    const denomAll = filled.reduce((a, c) => a + (useWeights ? c.weight : 1), 0);
    const numAll = filled.reduce(
      (a, c) => a + c.score * (useWeights ? c.weight : 1),
      0
    );

    const overall = denomAll > 0 ? numAll / denomAll : 0;

    const missing = criteria.filter((c) => c.score === 0).length;

    return { overall, perLayer, missing, filledCount: filled.length };
  }, [criteria, layers, useWeights]);

  const overallLabel = useMemo(() => {
    const rounded = Math.round(computed.overall);
    if (!rounded) return "Sin calificar";
    return `${rounded} – ${scoreLabel(rounded)}`;
  }, [computed.overall]);

  const exportObject = useMemo(
    () => ({
      meta,
      useWeights,
      allowExtremeWeights,
      weightPreset,
      strengths,
      focusAreas,
      criteria: criteria.map(({ id, layer, name, description, weight, score, evidence }) => ({
        id,
        layer,
        name,
        description,
        weight,
        score,
        evidence,
      })),
      computed: {
        overall: computed.overall,
        perLayer: computed.perLayer,
        createdAtISO: new Date().toISOString(),
      },
      version: VERSION_FULL,
    }),
    [
      meta,
      useWeights,
      criteria,
      computed,
      allowExtremeWeights,
      weightPreset,
      strengths,
      focusAreas,
    ]
  );

  const exportJSON = useMemo(
    () => JSON.stringify(exportObject, null, 2),
    [exportObject]
  );

  function setScore(id, score) {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, score } : c))
    );
  }

  function setEvidence(id, evidence) {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, evidence } : c))
    );
  }

  function setWeight(id, weight) {
    const w = clamp(Number(weight || 0), weightLimits.min, weightLimits.max);
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, weight: w } : c))
    );
  }

  function applyPreset(preset) {
    setWeightPreset(preset);
    setCriteria((prev) =>
      prev.map((c) => {
        const rec = c.recommendedWeights?.[preset];
        if (typeof rec !== "number") return c;
        return { ...c, weight: clamp(rec, weightLimits.min, weightLimits.max) };
      })
    );
  }

  function resetAll() {
    setCriteria((prev) => prev.map((c) => ({ ...c, score: 0, evidence: "" })));
    setStrengths("");
    setFocusAreas("");
    setWeightPreset("custom");
  }

  async function copyJSON() {
    try {
      await navigator.clipboard.writeText(exportJSON);
      alert("JSON copiado al portapapeles.");
    } catch {
      alert("No pude copiar. Selecciona el texto y copia manualmente.");
    }
  }

  function importJSON() {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed?.criteria || !parsed?.meta) throw new Error("Formato inválido");

      const importLimits = parsed.allowExtremeWeights
        ? { min: 0, max: 3 }
        : { min: 0.5, max: 2 };

      setMeta((m) => ({ ...m, ...parsed.meta }));
      setUseWeights(!!parsed.useWeights);
      setAllowExtremeWeights(!!parsed.allowExtremeWeights);
      setWeightPreset(parsed.weightPreset || "custom");
      setStrengths(typeof parsed.strengths === "string" ? parsed.strengths : "");
    setFocusAreas(typeof parsed.focusAreas === "string" ? parsed.focusAreas : "");

    // Merge by id to preserve defaults if missing.
    const incoming = Array.isArray(parsed.criteria) ? parsed.criteria : [];
    setCriteria((prev) =>
        prev.map((c) => {
          const hit = incoming.find((x) => x.id === c.id);
          if (!hit) return c;
          return {
            ...c,
            weight:
              typeof hit.weight === "number"
                ? clamp(hit.weight, importLimits.min, importLimits.max)
                : c.weight,
            score: typeof hit.score === "number" ? hit.score : 0,
            evidence: typeof hit.evidence === "string" ? hit.evidence : "",
          };
        })
      );

      alert("Importado ✅");
    } catch (e) {
      alert("No pude importar. Revisa que sea un JSON válido del export.");
    }
  }

  async function analyzeWithAI() {
    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysisResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluation: exportObject }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo analizar");
      }
      setAnalysisModel(data?.model || "");
      setAnalysisResult(normalizeAnalysis(data?.analysis));
    } catch (err) {
      setAnalysisError(err.message || "No se pudo analizar");
    } finally {
      setAnalysisLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Matriz de evaluación — UX Designer
              </h1>
              <p className="text-sm text-zinc-600">
                Reporte de desempeño (Entrega · Forma de trabajar · Ownership & cultura)
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowJSON((v) => !v)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                {showJSON ? "Ocultar JSON" : "Ver JSON"}
              </button>
              <button
                onClick={copyJSON}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Copiar JSON
              </button>
              <button
                onClick={resetAll}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Evaluado"
              value={meta.evaluateeName}
              onChange={(v) => setMeta((m) => ({ ...m, evaluateeName: v }))}
              placeholder="Nombre del diseñador"
            />
            <Field
              label="Tribu / Squad"
              value={meta.project}
              onChange={(v) => setMeta((m) => ({ ...m, project: v }))}
              placeholder="Ej: Business Banking / Cobros"
            />
            <Field
              label="Periodo"
              value={meta.period}
              onChange={(v) => setMeta((m) => ({ ...m, period: v }))}
              placeholder="Ej: Ene 2026"
            />
            <Field
              label="Evaluador"
              value={meta.evaluator}
              onChange={(v) => setMeta((m) => ({ ...m, evaluator: v }))}
              placeholder="Tu nombre"
            />
          </div>

          <div className="mt-3 space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={useWeights}
                    onChange={(e) => setUseWeights(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Usar pesos por criterio
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={allowExtremeWeights}
                    onChange={(e) => {
                      const allow = e.target.checked;
                      setAllowExtremeWeights(allow);
                      if (!allow) {
                        setCriteria((prev) =>
                          prev.map((c) => ({
                            ...c,
                            weight: clamp(c.weight, 0.5, 2),
                          }))
                        );
                      }
                    }}
                    className="h-4 w-4"
                  />
                  Permitir pesos extremos (0–3) solo por acuerdo
                </label>
              </div>
              <div className="text-xs text-zinc-500">
                Límites actuales: {weightLimits.min} – {weightLimits.max}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-600">Preset por seniority</span>
                <select
                  value={weightPreset}
                  onChange={(e) => {
                    const preset = e.target.value;
                    if (preset === "custom") {
                      setWeightPreset(preset);
                      return;
                    }
                    applyPreset(preset);
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="custom">Custom</option>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
                <button
                  onClick={() => applyPreset(weightPreset === "custom" ? "mid" : weightPreset)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  Aplicar preset
                </button>
              </div>
              <div className="text-xs text-zinc-600">
                Pesos de seniority: proactividad/impacto cultural pesan más en senior.
              </div>
            </div>
          </div>
        </header>

        {/* Summary */}
        <section className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-zinc-600">
                  Resultado general
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {computed.overall ? computed.overall.toFixed(2) : "—"}
                </div>
                <div className="mt-1 text-sm text-zinc-700">{overallLabel}</div>
              </div>
              <div
                className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  badgeClass(Math.round(computed.overall || 0))
                }`}
              >
                {computed.overall ? "Calificado" : "Pendiente"}
              </div>
            </div>
            <div className="mt-3 text-sm text-zinc-600">
              {computed.missing > 0 ? (
                <span>Faltan {computed.missing} criterios por calificar.</span>
              ) : (
                <span>Todos los criterios calificados.</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-600">Por capas</div>
            <div className="mt-3 space-y-3">
              {layers.map((layer) => {
                const s = computed.perLayer[layer]?.score || 0;
                const count = computed.perLayer[layer]?.count || 0;
                return (
                  <div key={layer}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{layer}</span>
                      <span className="text-zinc-600">
                        {count ? s.toFixed(2) : "—"}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-zinc-100">
                      <div
                        className="h-2 rounded-full bg-zinc-900"
                        style={{ width: `${(s / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-600">
              Lectura rápida
            </div>
            <div className="mt-3 space-y-2 text-sm text-zinc-700">
              <p>
                <span className="font-medium">Entrega</span> alta +{" "}
                <span className="font-medium">Forma de trabajar</span> baja =
                riesgo cultural aunque “entregue”.
              </p>
              <p>
                Puntajes bajos repetidos en <span className="font-medium">comunicación</span>{" "}
                y <span className="font-medium">feedback</span> suelen requerir plan
                explícito (no “esperar que mejore solo”).
              </p>
              <p className="text-zinc-500">
                Tip: usa evidencia observable (situación → conducta → impacto).
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-zinc-600">
                  Análisis IA (beta)
                </div>
                <p className="text-sm text-zinc-700">
                  Usa tu proxy /api/analyze con OPENAI_API_KEY.
                </p>
              </div>
              <button
                onClick={analyzeWithAI}
                disabled={analysisLoading}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {analysisLoading ? "Analizando…" : "Analizar"}
              </button>
            </div>

            {analysisError && (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {analysisError}
              </div>
            )}

            {analysisResult ? (
              <div className="mt-3 space-y-2 text-xs text-zinc-700">
                {analysisResult.summary && (
                  <p className="text-sm font-semibold text-zinc-900">
                    {analysisResult.summary}
                  </p>
                )}
                {analysisResult.strengths?.length ? (
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-emerald-700">
                      Fortalezas
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {analysisResult.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {analysisResult.risks?.length ? (
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-amber-700">
                      Riesgos
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {analysisResult.risks.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {analysisResult.focus?.length ? (
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-zinc-700">
                      Focos 90 días
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {analysisResult.focus.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {analysisResult.actions?.length ? (
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-zinc-700">
                      Recomendaciones
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {analysisResult.actions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {analysisResult.raw && (
                  <details className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600">
                    <summary className="cursor-pointer font-semibold text-zinc-700">
                      Ver JSON completo
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-[11px]">
                      {JSON.stringify(analysisResult.raw, null, 2)}
                    </pre>
                  </details>
                )}
                <div className="text-[11px] text-zinc-500">
                  Modelo: {analysisModel || "desconocido"}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-zinc-600">
                Requiere que el backend (server.js) corra con OPENAI_API_KEY. No envía PII a menos
                que la escribas en la evaluación.
              </p>
            )}
          </div>
        </section>

        {/* Criteria */}
        <section className="space-y-3">
          {criteria.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{c.name}</h2>
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                      {c.layer}
                    </span>
                    {c.score > 0 && (
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${badgeClass(
                          c.score
                        )}`}
                      >
                        {c.score} – {scoreLabel(c.score)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{c.description}</p>
                  <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)]">
                    {c.examples?.length ? (
                      <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          Ejemplos observables
                        </div>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-zinc-600">
                          {c.examples.map((ex) => (
                            <li key={ex}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <div className="flex flex-wrap gap-2">
                    {SCALE.map((s) => (
                      <button
                        key={s}
                        onClick={() => setScore(c.id, s)}
                        className={[
                          "rounded-xl border px-3 py-2 text-sm",
                          c.score === s
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white hover:bg-zinc-50",
                        ].join(" ")}
                        title={scoreLabel(s)}
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      onClick={() => setScore(c.id, 0)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                      title="Limpiar"
                    >
                      —
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">Peso</span>
                    <input
                      type="number"
                      min={weightLimits.min}
                      max={weightLimits.max}
                      step={0.5}
                      value={c.weight}
                      disabled={!useWeights}
                      onChange={(e) => setWeight(c.id, e.target.value)}
                      className="w-20 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                    />
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Sug. J {c.recommendedWeights?.junior ?? "-"} · M {c.recommendedWeights?.mid ?? "-"} · S {c.recommendedWeights?.senior ?? "-"}
                  </div>
                </div>
              </div>

              {c.anchors?.length ? (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-5">
                  {c.anchors.map((anchor, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] text-white">
                          {idx + 1}
                        </span>
                        <span>{scoreLabel(idx + 1)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-600">{anchor}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-3">
                <div className="text-xs font-medium text-zinc-600">
                  Evidencias / observaciones (qué pasó, cuándo, impacto)
                </div>
                <textarea
                  value={c.evidence}
                  onChange={(e) => setEvidence(c.id, e.target.value)}
                  rows={3}
                  placeholder="Ej: En la reunión X (fecha), no participó; cuando se pidió apoyo para Y, no levantó la mano; impacto: retraso / carga en otros / clima."
                  className="mt-1 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Fortalezas
                </div>
                <p className="text-sm text-zinc-600">
                  Conductas o skills que queremos reforzar.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                Qué mantener
              </span>
            </div>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={5}
              placeholder="Ej: Facilita workshops complejos; entrega specs impecables sin retrabajo; contagia buenas prácticas."
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Áreas clave (próx. 90 días)
                </div>
                <p className="text-sm text-zinc-600">
                  1–3 focos concretos con pasos observables.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
                Plan de acción
              </span>
            </div>
            <textarea
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              rows={5}
              placeholder="Ej: Aumentar participación en rituales (llevar agenda, facilitación 1 vez/semana); validar con data antes de iterar; mejorar ownership de entregas."
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>
        </section>

        {/* JSON Panel */}
        {showJSON && (
          <section className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Export (JSON)</div>
                <button
                  onClick={copyJSON}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  Copiar
                </button>
              </div>
              <pre className="mt-3 max-h-[420px] overflow-auto rounded-2xl bg-zinc-950 p-3 text-xs text-zinc-100">
                {exportJSON}
              </pre>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold">Import (JSON)</div>
              <p className="mt-1 text-sm text-zinc-600">
                Pega aquí un JSON exportado previamente para restaurar una evaluación.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={12}
                className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder='{"meta": {...}, "criteria":[...]}'
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={importJSON}
                  className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
                >
                  Importar
                </button>
                <button
                  onClick={() => setImportText("")}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </section>
        )}

        <footer className="mt-10 pb-6 text-xs text-zinc-500">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm">
                Versión {VERSION_LABEL}
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600">
                Build {VERSION_INFO.build || "dev"}
              </span>
              <button
                onClick={() => setShowChangelog(true)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Ver log de cambios
              </button>
            </div>
            <span className="text-center sm:text-right">
              Hecho para que el feedback sea observable y accionable (no “sensaciones”).
            </span>
          </div>
        </footer>
      </div>

      {showChangelog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-900">Log de cambios</div>
                <p className="text-xs text-zinc-600">
                  Formato SemVer + build (SHA corto).
                </p>
              </div>
              <button
                onClick={() => setShowChangelog(false)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {CHANGELOG.map((entry) => (
                <div
                  key={entry.version}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">
                        v{entry.version}
                      </div>
                      <div className="text-xs text-zinc-500">{entry.date}</div>
                      {entry.build && (
                        <div className="text-[11px] text-zinc-400">
                          build {entry.build}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-white">
                        SemVer
                      </span>
                      {entry.version === VERSION_SEMVER && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                          Actual
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                    {entry.items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
      />
    </div>
  );
}
