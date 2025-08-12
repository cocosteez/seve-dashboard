export const metadata = { title: "SÈVE Endurance — Sales Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "#FAF9F6", margin: 0 }}>{children}</body>
    </html>
  );
}
