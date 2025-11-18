import { NextResponse } from 'next/server'

export async function GET() {
  const manifest = {
    "name": "AgriCredit Africa - Decentralized Agricultural Platform",
    "short_name": "AgriCredit",
    "description": "AI-Blockchain platform for decentralized microcredit and sustainable agriculture",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#22c55e",
    "orientation": "portrait-primary",
    "categories": ["finance", "productivity", "business"],
    "icons": [
      {
        "src": "/favicon.ico",
        "sizes": "48x48",
        "type": "image/x-icon"
      },
      {
        "src": "/favicon.ico",
        "sizes": "192x192",
        "type": "image/x-icon",
        "purpose": "any maskable"
      }
    ],
    "shortcuts": [
      {
        "name": "Dashboard",
        "short_name": "Dashboard",
        "description": "View your farm dashboard",
        "url": "/dashboard",
        "icons": [{ "src": "/favicon.ico", "sizes": "96x96" }]
      },
      {
        "name": "Marketplace",
        "short_name": "Marketplace",
        "description": "Browse agricultural marketplace",
        "url": "/marketplace",
        "icons": [{ "src": "/favicon.ico", "sizes": "96x96" }]
      },
      {
        "name": "Carbon Dashboard",
        "short_name": "Carbon",
        "description": "Track carbon credits",
        "url": "/carbon-dashboard",
        "icons": [{ "src": "/favicon.ico", "sizes": "96x96" }]
      }
    ]
  }

  return NextResponse.json(manifest)
}