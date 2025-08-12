"use client";

import { useMemo, useState, useEffect } from "react";
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

const brand = {
  ink: "#0F1112",
  forest: "#1E3B2F",
  slate: "#4F4F4F",
  stone: "#D9D6CB",
  deepBlue: "#2D5C88",
  gold: "#D4A373",
  card: "#FFFFFF",
};

// ───────────────────────────────── assumptions (locked) ─────────────────────────
const LOCK = {
  closeRate: 0.6, // 60%
  emailToMeeting: 0.10, // 10%
  callToMeeting: 0.20, // 20%
  team: 1, // always 1
  workdays: 6, // days/week
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
  callsPerDay: 0,
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

export default function Page() {
  const [inp, setInp] = useState<Inputs>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const saved = localStorage.getItem("seve.fixed.inputs");
      return saved ? JSON.parse(saved) : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("seve.fixed.inputs", JSON.stringify(inp));
    } catch {}
  }, [inp]);

  const d = useMemo(() => {
    const weeks = Math.round(inp.months * 4.333);

    const meetingsPerDay =
      inp.emailsPerDay * LOCK.emailToMeeting +
      inp.callsPerDay * LOCK.callToMeeting;

    const meetingsPerWeekTeam =
      meetingsPerDay * LOCK.workdays * LOCK.team;

    const ordersPerWeek = meetingsPerWeekTeam * LOCK.closeRate;
    const revenuePerWeek = ordersPerWeek * inp.aov;

    const revenuePerMonth = revenuePerWeek * 4.333;
    const revenueYear = revenuePerMonth * inp.months;

    const months = Array.from({ length: inp.months }, (_, i) => i);
    const monthlyGoal = inp.salesGoal / inp.months;

    let cum = 0;
    const data = months.map((i) => {
      cum += revenuePerMonth;
      const goalCum = monthlyGoal * (i + 1);
      const label = new Date(2000, i, 1).toLocaleString(undefined, {
        month: "short",
      });
      return { name: label, cumulative: Math.round(cum), goal: Math.round(goalCum) };
    });

    const ordersYear = ordersPerWeek * weeks;

    return {
      meetingsPerDay,
      meetingsPerWeekTeam,
      ordersPerWeek,
      ordersYear,
      revenuePerWeek,
      revenuePerMonth,
      revenueYear,
      data,
    };
  }, [inp]);

  const Field = ({
    label,
    value,
    onChange,
    moneyField = false,
  }: {
    label: string;
    value: number;
    onChange: (n: number) => void;
    moneyField?: boolean;
  }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ color: brand.slate, fontSize: 13 }}>{label}</div>
      <input
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        inputMode="decimal"
        style={{
          border: `1px solid ${brand.stone}`,
          borderRadius: 12,
          padding: "10px 12px",
          background: "#FAFAFA",
          fontWeight: 600,
        }}
        placeholder={moneyField ? "$" : undefined}
      />
    </div>
  );

  const Badge = ({ k, v }: { k: string; v: string }) => (
    <div
      style={{
        background: "#0F1112",
        color: "white",
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
      }}
    >
      <div style={{ opacity: 0.8, fontSize: 12 }}>{k}</div>
      <div style={{ fontWeight: 800 }}>{v}</div>
    </div>
  );

  const Card = ({
    title,
    children,
    dark = false,
    style,
  }: {
    title: string;
    children: any;
    dark?: boolean;
    style?: React.CSSProperties;
  }) => (
    <div
      style={{
        background: dark ? brand.ink : brand.card,
        color: dark ? "white" : brand.ink,
        borderRadius: 16,
        border: `1px solid ${dark ? "#1F2326" : brand.stone}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
        padding: 18,
        ...style,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          color: dark ? "white" : brand.forest,
          marginBottom: 10,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );

  const KPI = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div
      style={{
        background: brand.forest,
        color: "white",
        borderRadius: 16,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ opacity: 0.9, fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 18px 28px" }}>
      {/* top row: inputs + KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 14,
          marginTop: -40,
        }}
      >
        <Card title="Inputs" style={{ gridColumn: "1 / span 1" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Field
              label="Sales Goal"
              value={inp.salesGoal}
              onChange={(v) => setInp((s) => ({ ...s, salesGoal: v }))}
              moneyField
            />
            <Field
              label="Average Order Value"
              value={inp.aov}
              onChange={(v) => setInp((s) => ({ ...s, aov: v }))}
              moneyField
            />
            <Field
              label="Timeline (months)"
              value={inp.months}
              onChange={(v) => setInp((s) => ({ ...s, months: v }))}
            />
            <div />
            <Field
              label="Emails / Day"
              value={inp.emailsPerDay}
              onChange={(v) => setInp((s) => ({ ...s, emailsPerDay: v }))}
            />
            <Field
              label="Calls / Day"
              value={inp.callsPerDay}
              onChange={(v) => setInp((s) => ({ ...s, callsPerDay: v }))}
            />
          </div>
        </Card>

        <KPI label="Meetings / Day" value={Number(d.meetingsPerDay.toFixed(2))} />
        <KPI label="Orders / Week" value={Math.round(d.ordersPerWeek)} />
        <KPI label="Revenue / Week" value={money(d.revenuePerWeek)} />
      </div>

      {/* mid row: assumptions + monthly + yearly */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        <Card title="Assumptions (Fixed)" dark>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Badge k="Close Rate" v={pct(LOCK.closeRate)} />
            <Badge k="Email→Meeting" v={pct(LOCK.emailToMeeting)} />
            <Badge k="Call→Meeting" v={pct(LOCK.callToMeeting)} />
            <Badge k="Team Size" v={String(LOCK.team)} />
            <Badge k="Workdays / Week" v={String(LOCK.workdays)} />
            <Badge k="Brand AOV" v={money(inp.aov)} />
          </div>
        </Card>

        <Card title="Monthly Pace">
          <div style={{ display: "grid", gap: 8 }}>
            <Row k="Revenue / Month" v={money(d.revenuePerMonth)} />
            <Row
              k="3‑Month Cumulative"
              v={money(
                d.data.slice(0, 3).reduce((acc, cur, i) => (i === 0 ? cur.cumulative : acc + cur.cumulative - d.data[i - 1].cumulative), 0)
              )}
            />
          </div>
        </Card>

        <Card title="Year at Pace">
          <div style={{ display: "grid", gap: 8 }}>
            <Row k="Orders (year)" v={d.ordersYear.toLocaleString()} />
            <Row k="Revenue (year)" v={money(d.revenueYear)} />
            <Row k="% of Goal" v={pct(d.revenueYear / inp.salesGoal)} />
          </div>
        </Card>
      </div>

      {/* chart */}
      <Card title="Cumulative Revenue vs Goal" style={{ marginTop: 14 }}>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
              <XAxis dataKey="name" stroke={brand.slate} />
              <YAxis
                stroke={brand.slate}
                tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"}
              />
              <Tooltip formatter={(v: any) => money(Number(v))} />
              <Bar dataKey="cumulative" fill={brand.deepBlue} radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="goal" stroke={brand.gold} strokeWidth={3} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        alignItems: "center",
      }}
    >
      <div style={{ color: "#616161", fontSize: 13 }}>{k}</div>
      <div style={{ textAlign: "right", fontWeight: 800, color: "#1E3B2F" }}>{v}</div>
    </div>
  );
}
