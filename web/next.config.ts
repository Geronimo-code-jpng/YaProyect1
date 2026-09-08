import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las imágenes de producto viven en Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Fallbacks/placeholders que todavía se usan en algunas tarjetas.
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
    // Formatos modernos primero (más chicos que WebP en muchos casos).
    formats: ["image/avif", "image/webp"],
    // Mantené las variantes optimizadas en la CDN ~31 días para que Blob casi
    // no se vuelva a consultar.
    minimumCacheTTL: 2678400,
    // El placeholder local es un SVG propio y confiable.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
