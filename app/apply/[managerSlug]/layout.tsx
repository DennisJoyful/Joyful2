// Minimal wrapper layout to avoid overriding <html>/<body> from RootLayout
// Fixes first paint layout shift and giant logo on initial load.
// NOTE: Keep this file if you previously had an Apply sub-layout. If this file did not exist,
// you can add it safely. Do not render <html> or <body> here.
export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
