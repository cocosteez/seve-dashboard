"use client";

import { useEffect, useMemo, useState } from "react";
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
  forest: "#1E3B2F",
  slate: "#4F4F4F",
  sand: "#E7E4D9",
  deepBlue: "#2D5C88",
  gold: "#D4A373",
  off: "#FAF9F6",
};

type Inputs = {
  salesGoal: number;
  months: number;
  startISO: string;
  aov: number;
  closeRate: number;
  emailToMeeting: number;
  callToMeeting: number;
  reorderRate: number;
  workdays: number;
  team: number;
  emailShare: number;
};

const defaults: Inputs = {
  salesGoal: 1_000_000,
  months: 12,
  startISO: new Date().toISOString(),
  aov: 288,
  closeRate: 0.6,
  emailToMeeting: 0.1,
  callToMeeting: 0.2,
  reorderRate: 0.29,
  workdays: 6,
  team: 3,
  emailShare: 0.6,
};

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function pct(n: number) {
  return (n * 100).toFixed(0) + "%";
}

export default function Page() {
  const [inputs, setInputs] = useState<Inputs>(() => {
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
      localStorage.setItem("seve.inputs", JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const d = useMemo(() => {
    const weeks = Math.round(inputs.months * 4.333);
    const ordersNeeded = inputs.salesGoal / (inputs.aov * (1 + inputs.reorderRate));
    const meetingsNeeded = ordersNeeded / inputs.closeRate;

    const meetingsPerDayPerPerson = meetingsNeeded / (weeks * inputs.workdays * inputs.team);
    const emailsPerDayPerPerson = (meetingsPerDayPerPerson * inputs.emailShare) / inputs.emailToMeeting;
    const callsPerDayPerPerson = (meetingsPerDayPerPerson * (1 - inputs.emailShare)) / inputs.callToMeeting;

    const meetingsPerWeekTeam = meetingsPerDayPerPerson * inputs.workdays * inputs.team;
    const weeklyOrders = meetingsPerWeekTeam * inputs.closeRate;
    const weeklyRevenue = weeklyOrders * inputs.aov;

    const monthlyRevenue = weeklyRevenue * 4.333;
    const yearlyRevenue = monthlyRevenue * inputs.months;
    const reorderRevenue = yearlyRevenue * inputs.reorderRate;
    const totalRevenue = yearlyRevenue + reorderRevenue;

    const months = Array.from({ length: inputs.months }, (_, i) => i);
    const monthlyGoal = inputs.salesGoal / inputs.months;

    let cum = 0;
    const data = months.map((i) => {
      cum += monthlyRevenue;
      const goalCum = monthlyGoal * (i + 1);
      const label = new Date(
        new Date(inputs.startISO).getFullYear(),
        new Date(inputs.startISO).getMonth() + i,
        1
      ).toLocaleString(undefined, { month: "short" });
      return { name: label, cumulative: Math.round(cum), goal: Math.round(goalCum) };
    });

    return {
      emailsPerDayPerPerson,
      callsPerDayPerPerson,
      meetingsPerDayPerPerson,
      meetingsPerWeekTeam,
      weeklyOrders,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      reorderRevenue,
      totalRevenue,
      data,
    };
  }, [inputs]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 0.5, color: brand.forest }}>SÈVE Endurance</div>
        <div style={{ color: brand.slate }}>{new Date().toLocaleDateString()}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 14 }}>
        <Card title="Inputs">
          <Grid>
            <Money label="Sales Goal" v={inputs.salesGoal} on={v=>setInputs(s=>({...s,salesGoal:v}))}/>
            <Num   label="Timeline (months)" v={inputs.months} on={v=>setInputs(s=>({...s,months:v}))}/>
            <Money label="Average Order Value" v={inputs.aov} on={v=>setInputs(s=>({...s,aov:v}))}/>
            <Perc  label="Close Rate" v={inputs.closeRate} on={v=>setInputs(s=>({...s,closeRate:v}))}/>
            <Perc  label="Email → Meeting" v={inputs.emailToMeeting} on={v=>setInputs(s=>({...s,emailToMeeting:v}))}/>
            <Perc  label="Call → Meeting" v={inputs.callToMeeting} on={v=>setInputs(s=>({...s,callToMeeting:v}))}/>
            <Perc  label="Re‑order Rate" v={inputs.reorderRate} on={v=>setInputs(s=>({...s,reorderRate:v}))}/>
            <Num   label="Team Size" v={inputs.team} on={v=>setInputs(s=>({...s,team:v}))}/>
            <Num   label="Workdays / Week" v={inputs.workdays} on={v=>setInputs(s=>({...s,workdays:v}))}/>
            <Perc  label="Email Share of Meetings" v={inputs.emailShare} on={v=>setInputs(s=>({...s,emailShare:v}))}/>
          </Grid>
        </Card>

        <KPI title="Emails / Day per Person" value={Math.max(0, Math.round(d.emailsPerDayPerPerson))}/>
        <KPI title="Calls / Day per Person"   value={Math.max(0, Math.round(d.callsPerDayPerPerson))}/>
        <KPI title="Meetings / Day per Person" value={Math.max(0, Number(d.meetingsPerDayPerPerson.toFixed(2)))}/>

        <Card title="Weekly">
          <Rows rows={[
            ["Meetings / Week (team)", d.meetingsPerWeekTeam.toFixed(0)],
            ["Orders Closed / Week", d.weeklyOrders.toFixed(0)],
            ["Revenue / Week", money(d.weeklyRevenue)]
          ]}/>
        </Card>

        <Card title="Monthly">
          <Rows rows={[
            ["Revenue / Month", money(d.monthlyRevenue)],
            ["Pace (3 mo cumulative)", money(d.data.slice(0,3).reduce((a,b)=>a+b.cumulative-(a?d.data[0].cumulative:0),0))]
          ]}/>
        </Card>

        <Card title="Yearly Summary">
          <Rows rows={[
            ["Revenue (new)", money(d.yearlyRevenue)],
            ["Re‑order Revenue", money(d.reorderRevenue)],
            ["Total Revenue (incl. reorders)", money(d.totalRevenue)],
            ["% of Goal", pct(d.totalRevenue / inputs.salesGoal)]
          ]}/>
        </Card>
      </div>

      <Card title="Cumulative Revenue vs Goal" style={{ marginTop: 18 }}>
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E6E6" />
              <XAxis dataKey="name" stroke={brand.slate} />
              <YAxis stroke={brand.slate} tickFormatter={(v)=>"$"+(v/1000).toFixed(0)+"k"} />
              <Tooltip formatter={(v:any)=>money(Number(v))} />
              <Bar dataKey="cumulative" fill={brand.deepBlue} radius={[6,6,0,0]} />
              <Line type="monotone" dataKey="goal" stroke={brand.gold} strokeWidth={3} dot={false}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children, style }: { title: string; children: any; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", borderRadius: 14, border: `1px solid ${brand.sand}`, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", padding: 16, ...style }}>
      <div style={{ fontWeight: 800, color: brand.forest, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
function Grid({ children }: { children: any }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", marginBottom: 8 }}>
      <div style={{ color: brand.slate, fontSize: 13 }}>{label}</div>
      <div style={{ textAlign: "right", fontWeight: 700, color: brand.forest }}>{value}</div>
    </div>
  );
}
function Rows({ rows }: { rows: [string, string | number][] }) {
  return (
    <div>
      {rows.map(([k, v]) => (
        <Row key={k} label={k} value={typeof v === "number" ? v.toString() : v} />
      ))}
    </div>
  );
}
function KPI({ title, value }: { title: string; value: number | string }) {
  return (
    <div style={{ background: brand.forest, color: "white", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ opacity: 0.9, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}
function Num({ label, v, on }: { label: string; v: number; on: (n: number) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", alignItems: "center", gap: 6 }}>
      <div style={{ color: brand.slate, fontSize: 13 }}>{label}</div>
      <input
        value={String(v)}
        onChange={(e) => on(Number(e.target.value || 0))}
        inputMode="decimal"
        style={{ border: `1px solid ${brand.sand}`, borderRadius: 10, padding: "8px 10px", background: brand.off }}
      />
    </div>
  );
}
function Money({ label, v, on }: { label: string; v: number; on: (n: number) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", alignItems: "center", gap: 6 }}>
      <div style={{ color: brand.slate, fontSize: 13 }}>{label}</div>
      <input
        value={String(v)}
        onChange={(e) => on(Number(e.target.value || 0))}
        inputMode="decimal"
        style={{ border: `1px solid ${brand.sand}`, borderRadius: 10, padding: "8px 10px", background: brand.off }}
      />
    </div>
  );
}
function Perc({ label, v, on }: { label: string; v: number; on: (n: number) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", alignItems: "center", gap: 6 }}>
      <div style={{ color: brand.slate, fontSize: 13 }}>{label}</div>
      <input
        value={String(Math.round(v * 100))}
        onChange={(e) => on((Number(e.target.value || 0)) / 100)}
        inputMode="decimal"
        style={{ border: `1px solid ${brand.sand}`, borderRadius: 10, padding: "8px 10px", background: brand.off }}
      />
    </div>
  );
}
