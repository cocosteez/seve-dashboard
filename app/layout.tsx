export const metadata = {
  title: "SÈVE Endurance — Sales Dashboard",
  description: "SÈVE performance dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background:
            "linear-gradient(180deg, #0D1B1A 0%, #17352F 40%, #142824 65%, #101818 100%)",
          color: "#0F1112",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <div
          style={{
            width: "100%",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
          }}
        >
          <div
            style={{
              maxWidth: 1220,
              margin: "0 auto",
              padding: "26px 24px 8px",
              display: "flex",
              alignItems: "flex-end",
              gap: 18,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: 42,
                letterSpacing: 2,
                color: "#F2F4F3",
                textShadow: "0 6px 26px rgba(0,0,0,0.3)",
              }}
            >
              SÈVE
            </div>
            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
              {new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}
