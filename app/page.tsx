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

// ── fixed assumptions (locked) ────────────────────────────────────────────────
const LOCK = {
  closeRate: 0.6, // 60%
  emailToMeeting: 0.10, // 10%
  callToMeeting: 0.20, // 20%
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
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
function pct(n: number) {
  return (n * 100).toFixed(0) + "%";
}

/** Numeric input that won't reset while typing */
function NumericInput({
  value,
  onCommit,
  placeholder,
}: {
  value: number;
  onCommit: (n: number) => void;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState<string>(() => String(value));

  // keep raw in sync if parent changes externally
  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  const commit = useCallback(() => {
    const cleaned = raw.replace(/,/g, "").trim();
    const n = cleaned === "" ? 0 : Number(cleaned);
    onCommit(Number.isFinite(n) ? n : 0);
    setRaw(
      (Number.isFinite(n) ? n : 0).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })
    );
  }, [raw, onCommit]);

  return (
    <input
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
      inputMode="decimal"
      placeholder={placeholder}
      style={{
        border: `1px solid ${brand.stone}`,
        borderRadius: 10,
        padding: "10px 12px",
        background: brand.off,
        fontWeight: 600,
      }}
    />
  );
}

export default function Page() {
  const [inp, setInp] = useState<Inputs>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const saved = localStorage.getItem("seve.fixed.inputs.v2");
      return saved ? JSON.parse(saved) : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("seve.fixed.inputs.v2", JSON.stringify(inp));
    } catch {}
  }, [inp]);

  const d = useMemo(() => {
    const weeks = Math.round(inp.months * 4.333);

    const meetingsPerDay =
      inp.emailsPerDay * LOCK.emailToMeeting +
      inp.callsPerDay * LOCK.callToMeeting;

    const meetingsPerWeekTeam = meetingsPerDay * LOCK.workdays * LOCK.team;
    const ordersPerWeek = meetingsPerWeekTeam * LOCK.closeRate;
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
      const label = new Date(2000, i, 1).toLocaleString(undefined, {
        month: "short",
      });
      return { name: label, cumulative: Math.round(cum), goal: Math.round(goalCum) };
    });

    const maxY = Math.max(...data.map((r) => Math.max(r.cumulative, r.goal)));
    const yFormat =
      maxY >= 1_000_000
        ? (v: number) => "$" + (v / 1_000_000).toFixed(1) + "M"
        : (v: number) => "$" + (v / 1000).toFixed(0) + "k";

    return {
      meetingsPerDay,
      ordersPerWeek,
      revenuePerWeek,
      revenuePerMonth,
      revenueYear,
      ordersYear,
      data,
      yFormat,
    };
  }, [inp]);

  // UI helpers
  const Card = ({
    title,
    children,
    style,
  }: {
    title: string;
    children: any;
    style?: React.CSSProperties;
  }) => (
    <div
      style={{
        background: brand.card,
        borderRadius: 14,
        border: `1px solid ${brand.border}`,
        boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
        padding: 16,
        ...style,
      }}
    >
      <div style={{ fontWeight: 800, color: brand.forest, marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );

  const InputField = ({
    label,
    value,
    onCommit,
  }: {
    label: string;
    value: number;
    onCommit: (n: number) => void;
  }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ color: brand.slate, fontSize: 12 }}>{label}</div>
      <NumericInput value={value} onCommit={onCommit} />
    </div>
  );

  const Stat = ({ k, v }: { k: string; v: string }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <div style={{ color: brand.slate, fontSize: 12 }}>{k}</div>
      <div style={{ textAlign: "right", fontWeight: 800, color: brand.forest }}>
        {v}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 18px 28px" }}>
      {/* Top row: Inputs (wide) → KPI1 → KPI2 → KPI3 (sequenced L→R) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
          gap: 14,
          marginTop: -44,
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
            <InputField
              label="Sales Goal"
              value={inp.salesGoal}
              onCommit={(v) => setInp((s) => ({ ...s, salesGoal: v }))}
            />
            <InputField
              label="Average Order Value"
              value={inp.aov}
              onCommit={(v) => setInp((s) => ({ ...s, aov: v }))}
            />
            <InputField
              label="Timeline (months)"
              value={inp.months}
              onCommit={(v) => setInp((s) => ({ ...s, months: v }))}
            />
            <div />
            <InputField
              label="Emails / Day"
              value={inp.emailsPerDay}
              onCommit={(v) => setInp((s) => ({ ...s, emailsPerDay: v }))}
            />
            <InputField
              label="Calls / Day"
              value={inp.callsPerDay}
              onCommit={(v) => setInp((s) => ({ ...s, callsPerDay: v }))}
            />
          </div>
        </Card>

        <Card title="Meetings / Day">
          <div style={{ fontSize: 28, fontWeight: 900 }}>
            {Number(d.meetingsPerDay.toFixed(2)).toLocaleString()}
          </div>
        </Card>
        <Card title="Orders / Week">
          <div style={{ fontSize: 28, fontWeight: 900 }}>
            {Math.round(d.ordersPerWeek).toLocaleString()}
          </div>
        </Card>
        <Card title="Revenue / Week">
          <div style={{ fontSize: 28, fontWeight: 900 }}>{money(d.revenuePerWeek)}</div>
        </Card>
      </div>

      {/* Second row: Assumptions → Monthly → Year */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        <Card title="Assumptions (Fixed)">
          <Assumptions />
        </Card>

        <Card title="Monthly Pace">
          <Stat k="Revenue / Month" v={money(d.revenuePerMonth)} />
          <Stat
            k="3‑Month Cumulative"
            v={money(
              d.data
                .slice(0, 3)
                .reduce(
                  (acc, cur, i) =>
                    i === 0 ? cur.cumulative : acc + cur.cumulative - d.data[i - 1].cumulative,
                  0
                )
            )}
          />
        </Card>

        <Card title="Year at Pace">
          <Stat k="Orders (year)" v={d.ordersYear.toLocaleString()} />
          <Stat k="Revenue (year)" v={money(d.revenueYear)} />
          <Stat k="% of Goal" v={pct(d.revenueYear / inp.salesGoal)} />
        </Card>
      </div>

      {/* Chart */}
      <Card title="Cumulative Revenue vs Goal" style={{ marginTop: 14 }}>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={brand.grid} />
              <XAxis dataKey="name" stroke={brand.slate} />
              <YAxis stroke={brand.slate} tickFormatter={d.yFormat as any} />
              <Tooltip
                formatter={(v: any, n: any) =>
                  [`${money(Number(v))}`, n === "cumulative" ? "Cumulative Revenue" : "Goal"]
                }
              />
              <Legend
                verticalAlign="top"
                align="left"
                wrapperStyle={{ paddingBottom: 6 }}
                payload={[
                  { value: "Cumulative Revenue", type: "rect", color: brand.deepBlue, id: "cum" },
                  { value: "Goal", type: "line", color: brand.gold, id: "goal" },
                ]}
              />
              <Bar dataKey="cumulative" fill={brand.deepBlue} radius={[8, 8, 0, 0]} />
              <Line
                type="monotone"
                dataKey="goal"
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

function Assumptions() {
  const rowStyle: React.CSSProperties = {
    background: "#F6F6F4",
    border: "1px solid #E6E4DE",
    borderRadius: 12,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };
  const labelStyle: React.CSSProperties = { color: "#6A6E72", fontSize: 11 };

  const Item = ({ k, v }: { k: string; v: string }) => (
    <div style={rowStyle}>
      <div style={labelStyle}>{k}</div>
      <div style={{ fontWeight: 800 }}>{v}</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
      <Item k="Close Rate" v="60%" />
      <Item k="Email→Meeting" v="10%" />
      <Item k="Call→Meeting" v="20%" />
      <Item k="Team Size" v="1" />
      <Item k="Workdays / Week" v="6" />
    </div>
  );
}
