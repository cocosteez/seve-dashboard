"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  Legend,
} from "recharts";

/* Brand tokens */
const brand = {
  ink: "#0F1112",
  forest: "#1E3B2F",
  slate: "#6F767E",
  stone: "#E5E3DA",
  off: "#F8F8F5",
  deepBlue: "#2D5C88",
  gold: "#D4A373",
  card: "#FFFFFF",
  border: "#E8E8E6",
  grid: "#ECECEC",
};

const LOCK = {
  closeRate: 0.6, // fixed
  emailToMeeting: 0.1, // fixed
  callToMeeting: 0.2, // fixed
  team: 1, // fixed
  workdays: 6, // fixed
};

type Inputs = {
  salesGoal: number;
  months: number;
  aov: number;
  emailsPerDay: number;
  callsPerDay: number;
};

const defaults: Inputs = {
  salesGoal: 1_000_000,
  months: 12,
  aov: 288,
  emailsPerDay: 120,
  callsPerDay: 90,
};

function money(n: number) {
  const parts = Math.round(n).toLocaleString("en-CA");
  return `CA$${parts}`;
}
function pct(n: number) {
  return (n * 100).toFixed(0) + "%";
}

/** Numeric input that won’t reset while typing */
function NumericInput({
  value,
  onCommit,
  min,
  max,
}: {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
}) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => setRaw(String(value)), [value]);

  const commit = useCallback(() => {
    const cleaned = raw.replace(/,/g, "").trim();
    let n = cleaned === "" ? 0 : Number(cleaned);
    if (!Number.isFinite(n)) n = 0;
    if (typeof min === "number") n = Math.max(min, n);
    if (typeof max === "number") n = Math.min(max, n);
    onCommit(n);
    setRaw(n.toLocaleString());
  }, [raw, onCommit, min, max]);

  return (
    <input
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      inputMode="decimal"
      style={{
        border: `1px solid ${brand.stone}`,
        borderRadius: 10,
        padding: "10px 12px",
        background: brand.off,
        fontWeight: 600,
        width: "100%",
      }}
    />
  );
}

/** Custom legend (typed loosely to avoid recharts type friction on Vercel) */
function CustomLegend(props: any) {
  const payload = props?.payload ?? [];
  return (
    <div style={{ display: "flex", gap: 16, paddingBottom: 6 }}>
      {payload.map((entry: any) => (
        <div key={entry?.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {entry?.type === "line" ? (
            <span style={{ width: 18, height: 0, borderTop: `3px dashed ${entry?.color}` }} />
          ) : (
            <span style={{ width: 12, height: 12, background: entry?.color, borderRadius: 2 }} />
          )}
          <span style={{ fontSize: 12, color: brand.slate }}>{entry?.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  /* Inputs */
  const [inp, setInp] = useState<Inputs>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const saved = localStorage.getItem("seve.inputs");
      return saved ? JSON.parse(saved) : defaults;
    } catch {
      return defaults;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("seve.inputs", JSON.stringify(inp));
    } catch {}
  }, [inp]);

  /* Sales closed (for progress bar) */
  const [closed, setClosed] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const v = localStorage.getItem("seve.closed");
    return v ? Number(v) || 0 : 0;
  });
  useEffect(() => {
    try {
      localStorage.setItem("seve.closed", String(closed));
    } catch {}
  }, [closed]);

  /* Calculations */
  const d = useMemo(() => {
    const weeks = Math.round(inp.months * 4.333);
    const meetingsPerDay =
      inp.emailsPerDay * LOCK.emailToMeeting + inp.callsPerDay * LOCK.callToMeeting;
    const meetingsPerWeek = meetingsPerDay * LOCK.workdays * LOCK.team;
    const ordersPerWeek = meetingsPerWeek * LOCK.closeRate;
    const revenuePerWeek = ordersPerWeek * inp.aov;
    const revenuePerMonth = revenuePerWeek * 4.333;
    const revenueYear = revenuePerMonth * inp.months;
    const ordersYear = ordersPerWeek * weeks;

    const monthsArr = Array.from({ length: inp.months }, (_, i) => i);
    const monthlyGoal = inp.salesGoal / inp.months;

    let cum = 0;
    const data = monthsArr.map((i) => {
      cum += revenuePerMonth;
      const goalCum = monthlyGoal * (i + 1);
      const label = new Date(2000, i, 1).toLocaleString(undefined, { month: "short" });
      return { name: label, cumulative: Math.round(cum), goal: Math.round(goalCum) };
    });

    const maxY = Math.max(...data.map((r) => Math.max(r.cumulative, r.goal)), 1);
    const yFormat =
      maxY >= 1_000_000
        ? (v: number) => "CA$" + (v / 1_000_000).toFixed(1) + "M"
        : (v: number) => "CA$" + Math.round(v / 1000) + "K";
    const yDomain = [0, Math.ceil(maxY * 1.08)];

    return {
      meetingsPerDay,
      ordersPerWeek,
      revenuePerWeek,
      revenuePerMonth,
      revenueYear,
      ordersYear,
      data,
      yFormat,
      yDomain,
    };
  }, [inp]);

  /* Card + stat helpers */
  const Card = ({
    title,
    children,
    minHeight,
  }: {
    title: string;
    children: any;
    minHeight?: number;
  }) => (
    <div
      style={{
        background: brand.card,
        borderRadius: 14,
        border: `1px solid ${brand.border}`,
        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
        padding: 16,
        minHeight,
      }}
    >
      <div style={{ fontWeight: 800, color: brand.forest, marginBottom: 10, fontSize: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );

  const Stat = ({ k, v }: { k: string; v: string }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", marginBottom: 8 }}>
      <div style={{ color: brand.slate, fontSize: 12 }}>{k}</div>
      <div style={{ fontWeight: 800, color: brand.forest }}>{v}</div>
    </div>
  );

  /* Layout constants */
  const OUTER_MAX = 1220;
  const OUTER_PAD = 24;
  const TOP_SPACER = 8; // header already has padding
  const GRID_GAP = 16;
  const KPI_MIN_H = 140;

  /* Progress bar values */
  const progress = Math.max(0, Math.min(1, closed / Math.max(1, inp.salesGoal)));

  return (
    <div
      style={{
        maxWidth: OUTER_MAX,
        margin: "0 auto",
        padding: `${TOP_SPACER}px ${OUTER_PAD}px 48px`,
      }}
    >
      {/* Row: Inputs + KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.55fr 1fr 1fr 1fr",
          gap: GRID_GAP,
          alignItems: "stretch",
        }}
      >
        <Card title="Inputs">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              <div style={{ fontSize: 12, color: brand.slate, marginBottom: 6 }}>Sales Goal</div>
              <NumericInput
                value={inp.salesGoal}
                onCommit={(v) => setInp((s) => ({ ...s, salesGoal: v }))}
                min={1}
                max={50_000_000}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: brand.slate, marginBottom: 6 }}>
                Average Order Value
              </div>
              <NumericInput
                value={inp.aov}
                onCommit={(v) => setInp((s) => ({ ...s, aov: v }))}
                min={50}
                max={5_000}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: brand.slate, marginBottom: 6 }}>
                Timeline (months)
              </div>
              <NumericInput
                value={inp.months}
                onCommit={(v) => setInp((s) => ({ ...s, months: v }))}
                min={1}
                max={24}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: brand.slate, marginBottom: 6 }}>Emails / Day</div>
              <NumericInput
                value={inp.emailsPerDay}
                onCommit={(v) => setInp((s) => ({ ...s, emailsPerDay: v }))}
                min={0}
                max={500}
              />
            </label>
            <label>
              <div style={{ fontSize: 12, color: brand.slate, marginBottom: 6 }}>Calls / Day</div>
              <NumericInput
                value={inp.callsPerDay}
                onCommit={(v) => setInp((s) => ({ ...s, callsPerDay: v }))}
                min={0}
                max={500}
              />
            </label>
          </div>
        </Card>

        <Card title="Meetings / Day" minHeight={KPI_MIN_H}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
            {d.meetingsPerDay.toFixed(1)}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: brand.slate }}>
            Calculated from fixed assumptions
          </div>
        </Card>

        <Card title="Orders / Week" minHeight={KPI_MIN_H}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
            {Math.round(d.ordersPerWeek).toLocaleString()}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: brand.slate }}>
            Calculated from fixed assumptions
          </div>
        </Card>

        <Card title="Revenue / Week" minHeight={KPI_MIN_H}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
            {money(d.revenuePerWeek)}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: brand.slate }}>
            Calculated from fixed assumptions
          </div>
        </Card>
      </div>

      {/* Row: Monthly pace + Year pace + Closing sales */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr 1.1fr",
          gap: GRID_GAP,
          marginTop: GRID_GAP,
        }}
      >
        <Card title="Monthly Pace">
          <Stat k="Revenue / Month" v={money(d.revenuePerMonth)} />
          <div style={{ height: 1, background: "rgba(0,0,0,0.12)", margin: "8px 0 10px" }} />
          <Stat k="Cumulative (3 mo)" v={money(d.data[2]?.cumulative || 0)} />
          <div style={{ marginTop: 4, fontSize: 11, color: brand.slate }}>
            Assumes 4.333 weeks / month
          </div>
        </Card>

        <Card title="Year at Pace">
          <Stat k="Orders (year)" v={Math.round(d.ordersYear).toLocaleString()} />
          <Stat k="Revenue (year)" v={money(d.revenueYear)} />
          <div style={{ height: 1, background: "rgba(0,0,0,0.12)", margin: "8px 0 10px" }} />
          <Stat k="% of Year Goal" v={pct(d.revenueYear / inp.salesGoal)} />
        </Card>

        {/* Closing Sales (with progress) */}
        <Card title="Closing Sales">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10 }}>
            <NumericInput
              value={0}
              onCommit={(val) => {
                if (val > 0) setClosed((c) => c + val);
              }}
              min={0}
              max={1_000_000}
            />
            <button
              onClick={() => setClosed(0)}
              style={{
                borderRadius: 10,
                border: `1px solid ${brand.border}`,
                background: brand.off,
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Reset closed sales"
            >
              Reset
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 6,
                fontWeight: 800,
                color: brand.forest,
              }}
              title="Closed to date"
            >
              {money(closed)}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                height: 12,
                background: "#EDEDEB",
                borderRadius: 999,
                overflow: "hidden",
                border: `1px solid ${brand.border}`,
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: "100%",
                  background: brand.forest,
                  transition: "width .25s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: brand.slate,
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Progress toward Sales Goal</span>
              <span>{pct(progress)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card title="Cumulative Revenue vs Goal" >
        <div style={{ height: 380, marginTop: 6 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.data} margin={{ top: 6, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={brand.grid} />
              <XAxis dataKey="name" stroke={brand.slate} />
              <YAxis
                stroke={brand.slate}
                tickFormatter={d.yFormat as any}
                domain={d.yDomain as any}
              />
              <Tooltip
                formatter={(v: any, n: any) => [
                  money(Number(v)),
                  n === "cumulative" ? "Cumulative Revenue" : "Goal",
                ]}
              />
              <Legend verticalAlign="top" align="left" content={(p) => <CustomLegend {...p} />} />
              <Bar dataKey="cumulative" name="Cumulative Revenue" fill={brand.deepBlue} radius={[8, 8, 0, 0]} />
              <Line
                type="monotone"
                dataKey="goal"
                name="Goal"
                stroke={brand.gold}
                strokeDasharray="6 6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bottom: Assumptions (smaller) */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
        }}
      >
        <div style={miniBox()}>
          <div style={miniK()}>Close Rate</div>
          <div style={miniV()}>60%</div>
        </div>
        <div style={miniBox()}>
          <div style={miniK()}>Email → Meeting</div>
          <div style={miniV()}>10%</div>
        </div>
        <div style={miniBox()}>
          <div style={miniK()}>Call → Meeting</div>
          <div style={miniV()}>20%</div>
        </div>
        <div style={miniBox()}>
          <div style={miniK()}>Team Size</div>
          <div style={miniV()}>1</div>
        </div>
        <div style={miniBox()}>
          <div style={miniK()}>Workdays / Week</div>
          <div style={miniV()}>6</div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 18,
          color: "rgba(255,255,255,0.88)",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        All rights reserved — <strong>SÈVE Exclusive</strong>
      </div>
    </div>
  );
}

/* Small helper styles for assumptions band */
function miniBox(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 10,
    border: `1px solid ${brand.border}`,
    padding: "10px 12px",
  };
}
function miniK(): React.CSSProperties {
  return { color: brand.slate, fontSize: 11, marginBottom: 2 };
}
function miniV(): React.CSSProperties {
  return { color: brand.forest, fontWeight: 800, fontSize: 14 };
}
