import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incident Copilot | Operations",
  description: "Evidence-grounded incident investigation and response workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
