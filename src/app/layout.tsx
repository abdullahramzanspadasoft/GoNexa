import "./globals.css";

export const metadata = {
  title: "GoNexa",
  description: "GoNexa landing and auth",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
