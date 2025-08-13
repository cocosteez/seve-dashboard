"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
} from "recharts";

// ---- Brand / tokens ---------------------------------------------------------
const brand = {
  bg: "#0E0F10",
  surface: "#FFFFFF",
  border: "#E9E9E9",
  grid: "#EFEFEF",
  ink: "#101315",
  sub: "#6B7075",
  forest: "#153A2A",
  blue: "#2C5E8A",
  gold: "#D4A373",
  off: "#FAFAF7",
};

// ---- Locks (fixed assumptions) ----------------------------------------------
const LOCK = {
  closeRate: 0.6,         // 60%
  emailToMeeting: 0.10,   // 10%
  callToMeeting: 0.20,    // 20%
  team: 1,
  workdays: 6,
};

// ---- Types ------------------------------------------------------------------
type Inputs = {
  salesGoal: number;
  months: number;
  aov: number;
  emailsPerDay: number;
  callsPerDay: number;
};

type MonthRow = { name: string; cumulative: number; goal: number };

// ---- Defaults ---------------------------------------------------------------
const DEFAULTS: Inputs = {
  salesGoal: 1_000_000,
  months: 12,
  aov: 288,
  emailsPerDay: 120,
  callsPerDay: 90,
};

// ---- Utils ------------------------------------------------------------------
const money0 = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

const pct0 = (n: number) => `${Math.round(n * 100)}%`;

// Numeric input that lets you type freely then commit on blur/Enter
function NumericInput({
  value,
  onCommit,
  min,
}: {
  value: number;
  onCommit: (n: number) => void;
  min?: number;
}) {
  const [raw, setRaw] = useState(() => value.toLocaleString());

  useEffect(() => setRaw(value.toLocaleString()), [value]);

  const commit = useCallback(() => {
    const cleaned = raw.replace(/,/g, "").trim();
    const parsed = cleaned === "" ? 0 : Number(cleaned);
    const next = Number.isFinite(parsed) ? parsed : 0;
    onCommit(min != null ? Math.max(next, min) : next);
    // normalize display with grouping
    setRaw((min != null ? Math.max(next, min) : next).toLocaleString());
  }, [raw, onCommit, min]);

  return (
    <input
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      inputMode="decimal"
      style={{
        width: "100%",
        border: `1px solid ${brand.border}`,
        borderRadius: 10,
        padding: "10px 12px",
        background: brand.off,
        fontWeight: 600,
        color: brand.ink,
      }}
    />
  );
}

// ---- Small UI atoms ---------------------------------------------------------
const Card = ({
  title,
  children,
  minHeight,
}: {
  title: string;
  children: React.ReactNode;
  minHeight?: number;
}) => (
  <div
    style={{
      background: brand.surface,
      border: `1px solid ${brand.border}`,
      borderRadius: 14,
      boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
      padding: 16,
      minHeight,
    }}
  >
    <div style={{ fontWeight: 800, color: brand.forest, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const KPI = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "grid", gap: 4 }}>
    <div style={{ color: brand.sub, fontSize: 12 }}>{label}</div>
    <div style={{ fontWeight: 900, fontSize: 28, color: brand.ink }}>{value}</div>
  </div>
);

const StatRow = ({ k, v }: { k: string; v: string }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr auto" }}>
    <div style={{ color: brand.sub, fontSize: 12 }}>{k}</div>
    <div style={{ fontWeight: 800, color: brand.ink }}>{v}</div>
  </div>
);

// ---- Page -------------------------------------------------------------------
export default function Page() {
  // inputs with localStorage persistence
  const [inp, setInp] = useState<Inputs>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    try {
      const saved = localStorage.getItem("seve.inputs");
      return saved ? JSON.parse(saved) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("seve.inputs", JSON.stringify(inp));
    } catch {}
  }, [inp]);

  // calculations derived from inputs + locks
  const calc = useMemo(() => {
    const weeks = Math.round(inp.months * 4.333);
    const meetingsPerDay =
      inp.emailsPerDay * LOCK.emailToMeeting + inp.callsPerDay * LOCK.callToMeeting;
    const meetingsPerWeek = meetingsPerDay * LOCK.workdays * LOCK.team;
    const ordersPerWeek = meetingsPerWeek * LOCK.closeRate;
    const revenuePerWeek = ordersPerWeek * inp.aov;
    const revenuePerMonth = revenuePerWeek * 4.333;
    const revenueYear = revenuePerMonth * inp.months;
    const ordersYear = ordersPerWeek * weeks;

    // chart rows
    const monthlyGoal = inp.salesGoal / inp.months;
    let cum = 0;
    const data: MonthRow[] = Array.from({ length: inp.months }, (_, i) => {
      cum += revenuePerMonth;
      const goalCum = monthlyGoal * (i + 1);
      const label = new Date(2000, i, 1).toLocaleString(undefined, { month: "short" });
      return { name: label, cumulative: Math.round(cum), goal: Math.round(goalCum) };
    });

    const maxY = Math.max(...data.flatMap((r) => [r.cumulative, r.goal]));
    const yTickFmt =
      maxY >= 1_000_000
        ? (v: number) => "$" + (v / 1_000_000).toFixed(1) + "M"
        : (v: number) => "$" + Math.round(v / 1_000) + "k";

    return {
      meetingsPerDay,
      ordersPerWeek,
      revenuePerWeek,
      revenuePerMonth,
      ordersYear,
      revenueYear,
      data,
      yTickFmt,
    };
  }, [inp]);

  // common card height for the three KPIs
  const KPI_HEIGHT = 126;

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "20px 18px 28px",
      }}
    >
      {/* Row 1: Inputs (wider) + three KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
          gap: 14,
        }}
      >
        <Card title="Inputs">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: brand.sub, fontSize: 12, marginBottom: 6 }}>Sales Goal</div>
              <NumericInput
                value={inp.salesGoal}
                onCommit={(n) => setInp((s) => ({ ...s, salesGoal: n }))}
                min={0}
              />
            </div>
            <div>
              <div style={{ color: brand.sub, fontSize: 12, marginBottom: 6 }}>
                Average Order Value
              </div>
              <NumericInput value={inp.aov} onCommit={(n) => setInp((s) => ({ ...s, aov: n }))} min={1} />
            </div>

            <div>
              <div style={{ color: brand.sub, fontSize: 12, marginBottom: 6 }}>
                Timeline (months)
              </div>
              <NumericInput
                value={inp.months}
                onCommit={(n) => setInp((s) => ({ ...s, months: Math.max(1, Math.round(n)) }))}
                min={1}
              />
            </div>
            <div>
              <div style={{ color: brand.sub, fontSize: 12, marginBottom: 6 }}>Emails / Day</div>
              <NumericInput
                value={inp.emailsPerDay}
                onCommit={(n) => setInp((s) => ({ ...s, emailsPerDay: Math.max(0, Math.round(n)) }))}
                min={0}
              />
            </div>

            <div>
              <div style={{ color: brand.sub, fontSize: 12, marginBottom: 6 }}>Calls / Day</div>
              <NumericInput
                value={inp.callsPerDay}
                onCommit={(n) => setInp((s) => ({ ...s, callsPerDay: Math.max(0, Math.round(n)) }))}
                min={0}
              />
            </div>
          </div>
        </Card>

        <Card title="Meetings / Day" minHeight={KPI_HEIGHT}>
          <KPI label="" value={calc.meetingsPerDay.toFixed(2)} />
        </Card>

        <Card title="Orders / Week" minHeight={KPI_HEIGHT}>
          <KPI label="" value={Math.round(calc.ordersPerWeek).toLocaleString()} />
        </Card>

        <Card title="Revenue / Week" minHeight={KPI_HEIGHT}>
          <KPI label="" value={money0(calc.revenuePerWeek)} />
        </Card>
      </div>

      {/* Row 2: Assumptions (fixed) + Monthly Pace + Year at Pace */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.35fr 1fr 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        <Card title="Assumptions (Fixed)">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 10,
              alignItems: "start",
            }}
          >
            <div
              style={{
                border: `1px solid ${brand.border}`,
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div style={{ color: brand.sub, fontSize: 11, marginBottom: 6 }}>Close Rate</div>
              <div style={{ fontWeight: 900 }}>{pct0(LOCK.closeRate)}</div>
            </div>
            <div
              style={{
                border: `1px solid ${brand.border}`,
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div style={{ color: brand.sub, fontSize: 11, marginBottom: 6 }}>Email → Meeting</div>
              <div style={{ fontWeight: 900 }}>{pct0(LOCK.emailToMeeting)}</div>
            </div>
            <div
              style={{
                border: `1px solid ${brand.border}`,
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div style={{ color: brand.sub, fontSize: 11, marginBottom: 6 }}>Call → Meeting</div>
              <div style={{ fontWeight: 900 }}>{pct0(LOCK.callToMeeting)}</div>
            </div>
            <div
              style={{
                border: `1px solid ${brand.border}`,
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div style={{ color: brand.sub, fontSize: 11, marginBottom: 6 }}>Team Size</div>
              <div style={{ fontWeight: 900 }}>{LOCK.team}</div>
            </div>
            <div
              style={{
                border: `1px solid ${brand.border}`,
                borderRadius: 10,
                padding: 12,
                textAlign: "center",
              }}
            >
              <div style={{ color: brand.sub, fontSize: 11, marginBottom: 6 }}>Workdays / Week</div>
              <div style={{ fontWeight: 900 }}>{LOCK.workdays}</div>
            </div>
          </div>
        </Card>

        <Card title="Monthly Pace">
          <div style={{ display: "grid", gap: 8 }}>
            <StatRow k="Revenue / Month" v={money0(calc.revenuePerMonth)} />
            <StatRow
              k="3‑Month Cumulative"
              v={money0(calc.data[Math.min(2, calc.data.length - 1)]?.cumulative || 0)}
            />
          </div>
        </Card>

        <Card title="Year at Pace">
          <div style={{ display: "grid", gap: 8 }}>
            <StatRow k="Orders (year)" v={Math.round(calc.ordersYear).toLocaleString()} />
            <StatRow k="Revenue (year)" v={money0(calc.revenueYear)} />
            <StatRow k="% of Goal" v={pct0(calc.revenueYear / inp.salesGoal)} />
          </div>
        </Card>
      </div>

      {/* Row 3: Chart */}
      <Card title="Cumulative Revenue vs Goal" minHeight={420} >
        {/* Custom legend */}
        <div style={{ display: "flex", gap: 16, padding: "0 4px 8px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, background: brand.blue, borderRadius: 3 }} />
            <span style={{ fontSize: 12, color: brand.sub }}>Cumulative Revenue</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 18, height: 0, borderTop: `3px dashed ${brand.gold}` }} />
            <span style={{ fontSize: 12, color: brand.sub }}>Goal</span>
          </div>
        </div>

        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calc.data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={brand.grid} />
              <XAxis dataKey="name" stroke={brand.sub} />
              <YAxis stroke={brand.sub} tickFormatter={calc.yTickFmt as any} />
              <Tooltip
                formatter={(v: any, k: any) => [
                  money0(Number(v)),
                  k === "cumulative" ? "Cumulative Revenue" : "Goal",
                ]}
              />
              <Bar dataKey="cumulative" name="Cumulative Revenue" fill={brand.blue} radius={[8, 8, 0, 0]} />
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
    </div>
  );
}
