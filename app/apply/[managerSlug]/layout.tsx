// app/apply/[managerSlug]/layout.tsx
export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  // Minimal layout for application page: no global navbar/header
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
