/**
 * Standalone layout for /intake/[slug] — no sidebar, no app navigation.
 * Public-facing: no auth required.
 * Root layout already provides html/body/font/Toaster, so this is just a wrapper.
 */
export default function IntakeSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
