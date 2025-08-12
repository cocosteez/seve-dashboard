export const metadata = { title: "SÈVE Endurance — Sales Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#0E0E0E",
          color: "#0E0E0E",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(135deg, #0F1112 0%, #1E3B2F 30%, #2D5C88 60%, #D9D6CB 100%)",
            padding: "28px 18px 80px 18px",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                color: "white",
                fontWeight: 900,
                letterSpacing: 1,
                fontSize: 34,
              }}
            >
              SÈVE
            </div>
            <div style={{ color: "rgba(255,255,255,.8)" }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        <div style={{ marginTop: -60 }}>{children}</div>
      </body>
    </html>
  );
}
