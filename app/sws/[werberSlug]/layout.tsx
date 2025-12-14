// app/sws/[werberSlug]/layout.tsx
export default function SwsLayout({ children }: { children: React.ReactNode }) {
  // Minimal layout for SWS page: no global navbar/header
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
