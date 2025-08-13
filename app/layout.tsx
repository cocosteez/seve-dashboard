export const metadata = { title: "SÈVE Endurance — Sales Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          // Full-page gradient background (subtle SÈVE vibe)
          background:
            "linear-gradient(180deg, #1f3d34 0%, #17323c 40%, #0f1418 100%)",
          // Smooth font rendering
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          color: "#0F1112",
        }}
      >
        {children}
      </body>
    </html>
  );
}
