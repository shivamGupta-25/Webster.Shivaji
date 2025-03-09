import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Jost } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
const jost = Jost({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata = {
  title: "Websters - The Computer Science Society",
  description: "Websters is the official Computer Science Society of Shivaji College, University of Delhi. We are a group of tech enthusiasts who aim to provide a platform for students to learn and grow in the field of technology.",
  type: "website",
  site_name: "Websters",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={jost.className}>{children}
        <Analytics />
        <SpeedInsights />
        <Toaster
          position="top-center"
          reverseOrder={false}
        />
      </body>
    </html>
  );
}
