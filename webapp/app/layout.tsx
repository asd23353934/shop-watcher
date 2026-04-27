import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shop-watcher.vercel.app"),
  title: {
    default: "Shop Watcher",
    template: "%s | Shop Watcher",
  },
  description:
    "自動監控露天、PChome、MOMO、Animate、Yahoo拍賣、Mandarake、買動漫、金石堂、BOOTH、DLsite、Toranoana、Melonbooks 等多平台新品，Discord 即時通知。",
  applicationName: "Shop Watcher",
  appleWebApp: {
    capable: true,
    // 'default'（白底深字）讓 iOS 狀態列獨立於內容；改用 'black-translucent' 需搭配 safe-area-inset-top padding 才不會被瀏海蓋住
    statusBarStyle: "default",
    title: "Shop Watcher",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "Shop Watcher",
  },
  twitter: {
    card: "summary",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
