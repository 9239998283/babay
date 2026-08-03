import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/store/cart-store";
import { ThemeProvider } from "@/store/theme-store";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://b-bay-menu.vercel.app";

export const viewport: Viewport = { themeColor: "#f7f7f6", colorScheme: "light dark" };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "B-Bay «Бабай» — электронное меню", template: "%s | B-Bay" },
  description: "Электронное меню кафе B-Bay «Бабай»: выберите блюда и отправьте заказ в WhatsApp.",
  applicationName: "B-Bay",
  keywords: ["B-Bay", "Бабай", "кафе", "меню", "Грозный", "заказ еды"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "B-Bay «Бабай»",
    title: "B-Bay «Бабай» — электронное меню",
    description: "Выберите блюда и отправьте заказ в WhatsApp кафе.",
    images: [{ url: "/og.png", width: 1734, height: 908, alt: "B-Bay — Вкус, к которому хочется вернуться" }],
  },
  twitter: { card: "summary_large_image", title: "B-Bay «Бабай»", description: "Электронное меню кафе B-Bay.", images: ["/og.png"] },
  icons: { icon: "/favicon.svg" },
};

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "B-Bay «Бабай»",
  description: "Кафе с пиццей, бургерами, суши и роллами в Грозном.",
  servesCuisine: ["Pizza", "Burgers", "Sushi"],
  priceRange: "₽₽",
  address: { "@type": "PostalAddress", addressLocality: "Грозный", addressCountry: "RU" },
  openingHours: "Mo-Su 10:00-23:00",
  url: siteUrl,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem("b-bay-theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark"}}catch(e){}` }} /></head><body><ThemeProvider><CartProvider>{children}</CartProvider></ThemeProvider><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }} /></body></html>;
}
