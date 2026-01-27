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

const SCALE = [1, 2, 3, 4, 5];

const DEFAULT_CRITERIA = [
  {
    id: "deliverables_quality",
    layer: "Entrega",
    name: "Calidad de entregables",
    description:
      "Claridad de la solución, nivel de detalle adecuado, consistencia con lineamientos, criterio explícito.",
    weight: 1,
  },
  {
    id: "delivery_ownership",
    layer: "Entrega",
    name: "Cumplimiento y ownership de entregas",
    description:
      "Cumple tiempos sin persecución, anticipa bloqueos, da seguimiento y cierra loops.",
    weight: 1,
  },
  {
    id: "communication_participation",
    layer: "Forma de trabajar",
    name: "Comunicación y participación",
    description:
      "Participa en reuniones, explica decisiones, escucha y construye sobre otros.",
    weight: 1,
  },
  {
    id: "collaboration_team_attitude",
    layer: "Forma de trabajar",
    name: "Colaboración y actitud de equipo",
    description:
      "Disposición real a ayudar, actitud ante pedidos extra, lenguaje verbal/no verbal.",
    weight: 1,
  },
  {
    id: "proactivity_initiative",
    layer: "Ownership & cultura",
    name: "Proactividad e iniciativa",
    description:
      "Propone mejoras, detecta problemas antes, sugiere caminos alternativos.",
    weight: 1,
  },
  {
    id: "product_domain_context",
    layer: "Entrega",
    name: "Dominio del producto y contexto",
    description:
      "Entiende el producto, restricciones negocio/tecnología, usa data/feedback real.",
    weight: 1,
  },
  {
    id: "feedback_adaptability",
    layer: "Forma de trabajar",
    name: "Actitud frente al feedback y al cambio",
    description:
      "Recibe feedback sin defensiva, itera con buena disposición, aprende de correcciones.",
    weight: 1,
  },
  {
    id: "cultural_impact_projection",
    layer: "Ownership & cultura",
    name: "Impacto cultural (proyección)",
    description:
      "Energía que aporta, si suma o drena, si refuerza o debilita cultura.",
    weight: 1,
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
  const [importText, setImportText] = useState("");

  const layers = useMemo(() => {
    const unique = Array.from(new Set(criteria.map((c) => c.layer)));
    return unique;
  }, [criteria]);

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
      version: "1.0.0",
    }),
    [meta, useWeights, criteria, computed]
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
    const w = clamp(Number(weight || 0), 0, 5);
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, weight: w } : c))
    );
  }

  function resetAll() {
    setCriteria((prev) => prev.map((c) => ({ ...c, score: 0, evidence: "" })));
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

      setMeta((m) => ({ ...m, ...parsed.meta }));
      setUseWeights(!!parsed.useWeights);

      // Merge by id to preserve defaults if missing.
      const incoming = Array.isArray(parsed.criteria) ? parsed.criteria : [];
      setCriteria((prev) =>
        prev.map((c) => {
          const hit = incoming.find((x) => x.id === c.id);
          if (!hit) return c;
          return {
            ...c,
            weight: typeof hit.weight === "number" ? hit.weight : c.weight,
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
                Radiografía de desempeño (Entrega · Forma de trabajar · Ownership & cultura)
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

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field
              label="Evaluado"
              value={meta.evaluateeName}
              onChange={(v) => setMeta((m) => ({ ...m, evaluateeName: v }))}
              placeholder="Nombre del diseñador"
            />
            <Field
              label="Proyecto / Squad"
              value={meta.project}
              onChange={(v) => setMeta((m) => ({ ...m, project: v }))}
              placeholder="Ej: Pagos / Cobros"
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
            <div className="flex items-end justify-between gap-3">
              <div className="w-full">
                <div className="text-xs font-medium text-zinc-600">Pesos</div>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useWeights}
                    onChange={(e) => setUseWeights(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-zinc-700">
                    Usar pesos por criterio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Summary */}
        <section className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
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
                      min={0}
                      max={5}
                      step={0.5}
                      value={c.weight}
                      disabled={!useWeights}
                      onChange={(e) => setWeight(c.id, e.target.value)}
                      className="w-20 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

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

        <footer className="mt-10 pb-6 text-center text-xs text-zinc-500">
          Hecho para que el feedback sea observable y accionable (no “sensaciones”).
        </footer>
      </div>
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
