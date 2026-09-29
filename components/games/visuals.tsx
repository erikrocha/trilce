import { cn } from "@/lib/utils";
import type { Visual } from "@/lib/games/types";

export function fractionLayout(parts: number, shape: "bar" | "area" | "circle") {
  if (shape === "area") {
    if (parts === 4) return { rows: 2, cols: 2 };
    if (parts === 6) return { rows: 2, cols: 3 };
    if (parts === 8) return { rows: 2, cols: 4 };
  }
  return { rows: 1, cols: parts };
}

export function FractionCells({
  parts,
  shape,
  shaded,
  onToggle,
}: {
  parts: number;
  shape: "bar" | "area";
  shaded: (i: number) => boolean;
  onToggle?: (i: number) => void;
}) {
  const { rows, cols } = fractionLayout(parts, shape);
  return (
    <div
      className="grid overflow-hidden rounded-lg border-2 border-foreground"
      style={{ gridTemplateColumns: `repeat(${cols}, 3.5rem)`, gridTemplateRows: `repeat(${rows}, ${shape === "bar" ? "3.5rem" : "3.5rem"})` }}
    >
      {Array.from({ length: parts }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={!onToggle}
          onClick={() => onToggle?.(i)}
          className={cn(
            "border border-foreground/40",
            shaded(i) ? "bg-brand-green/60" : "bg-background",
            onToggle && "cursor-pointer hover:bg-brand-green/30"
          )}
          aria-label={`Parte ${i + 1}`}
        />
      ))}
    </div>
  );
}

function Pie({ parts, shaded }: { parts: number; shaded: number }) {
  const r = 45;
  const slices = Array.from({ length: parts }, (_, i) => {
    const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
    const p = (a: number) => `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
    return <path key={i} d={`M50,50 L${p(a0)} A${r},${r} 0 0 1 ${p(a1)} Z`} className={cn("stroke-foreground", i < shaded ? "fill-brand-green/60" : "fill-background")} strokeWidth={1.5} />;
  });
  return (
    <svg viewBox="0 0 100 100" className="size-40">
      {parts === 1 ? <circle cx="50" cy="50" r={r} className="fill-brand-green/60 stroke-foreground" /> : slices}
    </svg>
  );
}

function regularPolygon(sides: number, cx = 50, cy = 52, r = 40) {
  return Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * 2 * Math.PI - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
}

function Shape2d({ name }: { name: string }) {
  const cls = "fill-brand-green/30 stroke-foreground";
  return (
    <svg viewBox="0 0 100 100" className="size-28">
      {name === "círculo" && <circle cx="50" cy="50" r="38" className={cls} strokeWidth={2} />}
      {name === "triángulo" && <polygon points="50,12 90,85 10,85" className={cls} strokeWidth={2} />}
      {name === "cuadrado" && <rect x="17" y="17" width="66" height="66" className={cls} strokeWidth={2} />}
      {name === "rectángulo" && <rect x="8" y="27" width="84" height="46" className={cls} strokeWidth={2} />}
      {name === "pentágono" && <polygon points={regularPolygon(5)} className={cls} strokeWidth={2} />}
      {name === "hexágono" && <polygon points={regularPolygon(6, 50, 50, 40)} className={cls} strokeWidth={2} />}
    </svg>
  );
}

function Solid({ name }: { name: string }) {
  const f = "fill-brand-green/30 stroke-foreground";
  const p = { className: f, strokeWidth: 2, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 100 100" className="size-32">
      {name === "cubo" && (
        <>
          <polygon points="20,35 65,35 65,80 20,80" {...p} />
          <polygon points="20,35 35,20 80,20 65,35" {...p} />
          <polygon points="65,35 80,20 80,65 65,80" {...p} />
        </>
      )}
      {name === "prisma rectangular" && (
        <>
          <polygon points="8,42 66,42 66,80 8,80" {...p} />
          <polygon points="8,42 26,26 84,26 66,42" {...p} />
          <polygon points="66,42 84,26 84,64 66,80" {...p} />
        </>
      )}
      {name === "cilindro" && (
        <>
          <path d="M22,25 V75 A28,9 0 0 0 78,75 V25" {...p} />
          <ellipse cx="50" cy="25" rx="28" ry="9" {...p} />
        </>
      )}
      {name === "cono" && <path d="M50,10 L22,74 A28,9 0 0 0 78,74 Z" {...p} />}
      {name === "esfera" && (
        <>
          <circle cx="50" cy="50" r="34" {...p} />
          <ellipse cx="50" cy="50" rx="34" ry="10" fill="none" className="stroke-foreground" strokeDasharray="3 3" />
        </>
      )}
      {name === "pirámide cuadrada" && (
        <>
          <polygon points="50,12 20,76 66,76" {...p} />
          <polygon points="50,12 66,76 84,58" {...p} />
        </>
      )}
      {name === "pirámide triangular" && (
        <>
          <polygon points="50,12 18,78 82,78" {...p} />
          <polyline points="50,12 60,58 18,78" fill="none" className="stroke-foreground" strokeWidth={2} />
          <polyline points="60,58 82,78" fill="none" className="stroke-foreground" strokeWidth={2} />
        </>
      )}
      {name === "prisma triangular" && (
        <>
          <polygon points="12,72 48,72 30,38" {...p} />
          <polygon points="30,38 66,38 84,72 48,72" {...p} />
        </>
      )}
    </svg>
  );
}

function Labeled({ names, render }: { names: string[]; render: (n: string) => React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      {names.map((n, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          {render(n)}
          {names.length > 1 && <span className="text-lg font-medium">{String.fromCharCode(65 + i)}</span>}
        </div>
      ))}
    </div>
  );
}

function NumberLine({ v }: { v: Extract<Visual, { kind: "numberLine" }> }) {
  const W = 560;
  const pad = 20;
  const x = (n: number) => pad + ((n - v.min) / (v.max - v.min)) * (W - pad * 2);
  const ticks: number[] = [];
  for (let n = v.min; n <= v.max; n += v.step) ticks.push(n);
  return (
    <svg viewBox={`0 0 ${W} 80`} className="w-full max-w-xl">
      <line x1={pad} x2={W - pad} y1={45} y2={45} className="stroke-foreground" strokeWidth={2} />
      {ticks.map((n) => {
        const labeled = (n - v.min) % v.labelEvery === 0;
        return (
          <g key={n}>
            <line x1={x(n)} x2={x(n)} y1={labeled ? 36 : 40} y2={labeled ? 54 : 50} className="stroke-foreground" strokeWidth={2} />
            {labeled && v.marked !== n && (
              <text x={x(n)} y={72} textAnchor="middle" className="fill-foreground text-[14px]">
                {n}
              </text>
            )}
          </g>
        );
      })}
      {v.marked !== undefined && <circle cx={x(v.marked)} cy={45} r={8} className="fill-brand-green stroke-foreground" strokeWidth={2} />}
    </svg>
  );
}

function FractionLine({ v }: { v: Extract<Visual, { kind: "fractionLine" }> }) {
  const W = 560;
  const pad = 30;
  const x = (k: number) => pad + (k / v.parts) * (W - pad * 2);
  return (
    <svg viewBox={`0 0 ${W} 80`} className="w-full max-w-xl">
      <line x1={pad} x2={W - pad} y1={45} y2={45} className="stroke-foreground" strokeWidth={2} />
      {Array.from({ length: v.parts + 1 }, (_, k) => (
        <line key={k} x1={x(k)} x2={x(k)} y1={35} y2={55} className="stroke-foreground" strokeWidth={2} />
      ))}
      <text x={x(0)} y={74} textAnchor="middle" className="fill-foreground text-[15px]">0</text>
      <text x={x(v.parts)} y={74} textAnchor="middle" className="fill-foreground text-[15px]">1</text>
      <circle cx={x(v.marked)} cy={45} r={8} className="fill-brand-green stroke-foreground" strokeWidth={2} />
    </svg>
  );
}

function Ruler({ length }: { length: number }) {
  const cm = 40;
  const W = cm * 11 + 20;
  return (
    <svg viewBox={`0 0 ${W} 110`} className="w-full max-w-xl">
      <rect x={10} y={40} width={length * cm} height={22} rx={4} className="fill-brand-green/40 stroke-foreground" strokeWidth={2} />
      <rect x={10} y={66} width={cm * 10 + 4} height={38} className="fill-background stroke-foreground" strokeWidth={2} />
      {Array.from({ length: 11 }, (_, i) => (
        <g key={i}>
          <line x1={10 + i * cm} x2={10 + i * cm} y1={66} y2={82} className="stroke-foreground" strokeWidth={2} />
          <text x={10 + i * cm} y={98} textAnchor="middle" className="fill-foreground text-[13px]">{i}</text>
        </g>
      ))}
    </svg>
  );
}

function Thermometer({ v }: { v: Extract<Visual, { kind: "thermometer" }> }) {
  const top = 15;
  const bottom = 165;
  const y = (t: number) => bottom - ((t - v.min) / (v.max - v.min)) * (bottom - top);
  return (
    <svg viewBox="0 0 120 200" className="h-56">
      <rect x={45} y={top - 5} width={20} height={bottom - top + 15} rx={10} className="fill-background stroke-foreground" strokeWidth={2} />
      <circle cx={55} cy={bottom + 12} r={14} className="fill-destructive stroke-foreground" strokeWidth={2} />
      <rect x={50} y={y(v.value)} width={10} height={bottom + 12 - y(v.value)} className="fill-destructive" />
      {Array.from({ length: (v.max - v.min) / 5 + 1 }, (_, i) => {
        const t = v.min + i * 5;
        const major = t % 10 === 0;
        return (
          <g key={t}>
            <line x1={68} x2={major ? 82 : 76} y1={y(t)} y2={y(t)} className="stroke-foreground" strokeWidth={2} />
            {major && <text x={86} y={y(t) + 4} className="fill-foreground text-[11px]">{t}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function CoordPlane({ v }: { v: Extract<Visual, { kind: "coordPlane" }> }) {
  const s = 44;
  const o = 30;
  const size = o * 2 + s * v.max;
  const px = (x: number) => o + x * s;
  const py = (y: number) => size - o - y * s;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="size-72">
      {Array.from({ length: v.max + 1 }, (_, i) => (
        <g key={i}>
          <line x1={px(i)} x2={px(i)} y1={py(0)} y2={py(v.max)} className="stroke-foreground/25" />
          <line x1={px(0)} x2={px(v.max)} y1={py(i)} y2={py(i)} className="stroke-foreground/25" />
          <text x={px(i)} y={py(0) + 18} textAnchor="middle" className="fill-foreground text-[13px]">{i}</text>
          <text x={px(0) - 12} y={py(i) + 4} textAnchor="middle" className="fill-foreground text-[13px]">{i}</text>
        </g>
      ))}
      <line x1={px(0)} x2={px(v.max)} y1={py(0)} y2={py(0)} className="stroke-foreground" strokeWidth={2} />
      <line x1={px(0)} x2={px(0)} y1={py(0)} y2={py(v.max)} className="stroke-foreground" strokeWidth={2} />
      {v.points.map((p, i) => (
        <text key={i} x={px(p.x)} y={py(p.y) + 8} textAnchor="middle" className="text-[24px]">{p.emoji}</text>
      ))}
    </svg>
  );
}

export function VisualView({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "text":
      return <p className="whitespace-pre text-center text-4xl font-medium tabular-nums sm:text-5xl">{visual.text}</p>;
    case "objects":
      return (
        <div className="flex max-w-md flex-wrap justify-center gap-2 text-4xl">
          {Array.from({ length: visual.count }, (_, i) => <span key={i}>{visual.emoji}</span>)}
        </div>
      );
    case "groups":
      return (
        <div className="flex flex-wrap items-center justify-center gap-4 text-4xl">
          {[visual.a, visual.b].map((n, gi) => (
            <div key={gi} className="flex items-center gap-4">
              {gi === 1 && <span className="text-3xl font-medium">+</span>}
              <span className="flex max-w-44 flex-wrap justify-center gap-1 rounded-2xl border border-border p-3">
                {Array.from({ length: n }, (_, i) => <span key={i}>{visual.emoji}</span>)}
              </span>
            </div>
          ))}
        </div>
      );
    case "takeaway":
      return (
        <div className="flex max-w-md flex-wrap justify-center gap-2 text-4xl">
          {Array.from({ length: visual.total }, (_, i) => (
            <span key={i} className={cn("relative", i >= visual.total - visual.removed && "opacity-30")}>
              {visual.emoji}
              {i >= visual.total - visual.removed && <span className="absolute inset-0 text-center text-destructive">✕</span>}
            </span>
          ))}
        </div>
      );
    case "numberLine":
      return <NumberLine v={visual} />;
    case "fractionLine":
      return <FractionLine v={visual} />;
    case "hundredsChart": {
      const blank = new Set(visual.blank);
      return (
        <div className="grid grid-cols-10 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs tabular-nums sm:text-sm">
          {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={cn(
                "flex size-7 items-center justify-center bg-background sm:size-9",
                n === visual.highlight && "bg-brand-green/40 font-bold",
                blank.has(n) && n !== visual.highlight && "bg-muted"
              )}
            >
              {blank.has(n) ? (n === visual.highlight ? "?" : "") : n}
            </div>
          ))}
        </div>
      );
    }
    case "placeValue":
      return (
        <div className="flex flex-wrap items-end justify-center gap-6">
          <div className="flex items-end gap-2">
            {Array.from({ length: visual.tens }, (_, i) => (
              <div key={i} className="grid h-24 w-4 grid-rows-10 overflow-hidden rounded-sm border-2 border-foreground bg-brand-green/40">
                {Array.from({ length: 10 }, (_, j) => <div key={j} className="border-b border-foreground/40 last:border-b-0" />)}
              </div>
            ))}
          </div>
          <div className="grid max-w-24 grid-cols-3 gap-1">
            {Array.from({ length: visual.ones }, (_, i) => (
              <div key={i} className="size-6 rounded-sm border-2 border-foreground bg-brand-green/40" />
            ))}
          </div>
        </div>
      );
    case "fraction":
      if (visual.shape === "circle") return <Pie parts={visual.parts} shaded={visual.shaded} />;
      return <FractionCells parts={visual.parts} shape={visual.shape} shaded={(i) => i < visual.shaded} />;
    case "fractionGroup":
      return (
        <div className="flex max-w-md flex-wrap justify-center gap-2 text-4xl">
          {Array.from({ length: visual.total }, (_, i) => (
            <span key={i} className={cn("rounded-lg p-1", i < visual.highlighted ? "bg-brand-green/40 ring-2 ring-foreground" : "opacity-60")}>
              {visual.emoji}
            </span>
          ))}
        </div>
      );
    case "measureObjects":
      return (
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center rounded-lg border-2 border-foreground px-1 text-4xl" style={{ width: `${visual.count * 2.5}rem` }}>
            {visual.itemEmoji}
          </div>
          <div className="flex text-3xl">
            {Array.from({ length: visual.count }, (_, i) => (
              <span key={i} className="w-10 text-center">{visual.unitEmoji}</span>
            ))}
          </div>
        </div>
      );
    case "ruler":
      return <Ruler length={visual.length} />;
    case "thermometer":
      return <Thermometer v={visual} />;
    case "lengthBars":
      return (
        <div className="flex w-full max-w-md flex-col gap-3">
          {[["A", visual.a], ["B", visual.b]].map(([label, n]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-4 font-medium">{label}</span>
              <div className="h-6 rounded bg-brand-green/50 ring-2 ring-foreground" style={{ width: `${Number(n) * 9}%` }} />
            </div>
          ))}
        </div>
      );
    case "gridObjects":
      return (
        <div className="grid text-2xl" style={{ gridTemplateColumns: `repeat(${visual.size + 1}, 3rem)` }}>
          <div />
          {Array.from({ length: visual.size }, (_, c) => (
            <div key={c} className="flex h-8 items-center justify-center text-sm text-muted-foreground">col {c + 1}</div>
          ))}
          {Array.from({ length: visual.size }, (_, r) => (
            <div key={r} className="contents">
              <div className="flex items-center justify-end pr-2 text-sm text-muted-foreground">fila {r + 1}</div>
              {Array.from({ length: visual.size }, (_, c) => (
                <div key={c} className="flex size-12 items-center justify-center border border-border">
                  {visual.cells.find((cell) => cell.r === r + 1 && cell.c === c + 1)?.emoji}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    case "stack":
      return (
        <div className="flex flex-col overflow-hidden rounded-lg border-2 border-foreground">
          {visual.items.map((e, i) => (
            <div key={i} className="flex size-14 items-center justify-center border-b border-border text-3xl last:border-b-0">{e}</div>
          ))}
        </div>
      );
    case "coordPlane":
      return <CoordPlane v={visual} />;
    case "shapes":
      return <Labeled names={visual.names} render={(n) => <Shape2d name={n} />} />;
    case "solids":
      return <Labeled names={visual.names} render={(n) => <Solid name={n} />} />;
    case "pattern":
      return (
        <div className="flex flex-wrap items-center justify-center gap-2 text-4xl">
          {visual.items.map((e, i) => (
            <span key={i} className={cn("flex size-12 items-center justify-center", e === "?" && "rounded-lg border-2 border-dashed border-foreground text-2xl")}>{e}</span>
          ))}
        </div>
      );
    case "bag":
      return (
        <div className="flex max-w-md flex-wrap justify-center gap-2 rounded-2xl border-2 border-foreground p-4 text-3xl">
          {visual.items.flatMap((it) => Array.from({ length: it.count }, (_, i) => <span key={`${it.emoji}${i}`}>{it.emoji}</span>))}
        </div>
      );
  }
}
