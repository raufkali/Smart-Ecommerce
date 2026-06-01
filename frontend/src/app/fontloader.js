// app/fonts.js
import localFont from "next/font/local";

export const cormorantGaramond = localFont({
  src: [
    {
      path: "./fonts/cormorant/CormorantGaramond-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/cormorant/CormorantGaramond-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

export const dmSans = localFont({
  src: [
    {
      path: "./fonts/dm-sans/DMSans-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "./fonts/dm-sans/DMSans-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "./fonts/dm-sans/DMSans-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/dm-sans/DMSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/dm-sans/DMSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/dm-sans/DMSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "./fonts/dm-sans/DMSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/dm-sans/DMSans-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "./fonts/dm-sans/DMSans-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/dm-sans/DMSans-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-body",
  display: "swap",
});
