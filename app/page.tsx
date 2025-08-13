a"use client";

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

const brand = {
  ink: "#0F1112",
  forest: "#1E3B2F",
  slate: "#606468",
  stone: "#E8E5DC",
  off: "#FAFAF7",
  deepBlue: "#2D5C88",
  gold: "#D4A373",
  card: "#FFFFFF",
  border: "#E6E6E6",
  grid: "#ECECEC",
};

const LOCK = {
  closeRate: 0.6,
  emailToMeeting: 0.1,
  callToMeeting: 0.2,
  team: 1,
  workdays: 6,
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
        boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
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

  // unified layout constants
  const OUTER_MAX = 1220;               // page width
  const OUTER_PAD = 24;                 // left/right padding
  const TOP_SPACER = 48;                // space from top edge
  const GRID_GAP = 16;                  // consistent gap between cards
  const KPI_MIN_H = 140;

  return (
    <div
      style={{
        maxWidth: OUTER_MAX,
        margin: "0 auto",
        padding: `${TOP_SPACER}px ${OUTER_PAD}px 40px`,
      }}
    >
      {/* Row 1: Inputs + KPIs (consistent heights & spacing) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.55fr 1fr 1fr 1fr",
          gap: GRID_GAP,
          alignItems: "stretch",
        }}
      >
        <Card title="Inputs">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
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
            Calculated from fixed assumptions below
          </div>
        </Card>

        <Card title="Orders / Week" minHeight={KPI_MIN_H}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
            {Math.round(d.ordersPerWeek).toLocaleString()}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: brand.slate }}>
            Calculated from fixed assumptions below
          </div>
        </Card>

        <Card title="Revenue / Week" minHeight={KPI_MIN_H}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
            {money(d.revenuePerWeek)}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: brand.slate }}>
            Calculated from fixed assumptions below
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr 1fr",
          gap: GRID_GAP,
          marginTop: GRID_GAP,
        }}
      >
        <Card title="Assumptions (Fixed)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            <Stat k="Close Rate" v="60%" />
            <Stat k="Email→Meeting" v="10%" />
            <Stat k="Call→Meeting" v="20%" />
            <Stat k="Team Size" v="1" />
            <Stat k="Workdays / Week" v="6" />
          </div>
        </Card>

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
      </div>

      {/* Chart */}
      <Card title="Cumulative Revenue vs Goal" >
        <div style={{ height: 380, marginTop: 6 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.data} margin={{ top: 6, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={brand.grid} />
              <XAxis dataKey="name" stroke={brand.slate} />
              <YAxis stroke={brand.slate} tickFormatter={d.yFormat as any} domain={d.yDomain as any} />
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
    </div>
  );
}
