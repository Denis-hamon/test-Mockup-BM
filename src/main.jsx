import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import BareMetalAvailabilityMockup from './pages/BareMetalAvailabilityMockup.jsx'
import BareMetalListingMockup from './pages/BareMetalListingMockup.jsx'
import BareMetalListingMockupV2 from './pages/BareMetalListingMockupV2.jsx'
import { LOCALE_MAP, DEFAULT_LOCALE } from './i18n/locale-map.js'
import { setLocale } from './i18n/index.js'

function normalizeBase(baseUrl) {
  if (!baseUrl) return '/'
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

function stripBaseFromPath(pathname, baseUrl) {
  const base = normalizeBase(baseUrl)
  if (base === '/') return pathname
  const baseNoTrailing = base.slice(0, -1)
  if (pathname === baseNoTrailing) return '/'
  if (pathname.startsWith(base)) {
    return pathname.slice(base.length - 1)
  }
  return pathname
}

function withBase(baseUrl, relativePath) {
  const base = normalizeBase(baseUrl)
  const rel = relativePath.replace(/^\/+/, '')
  return `${base}${rel}`
}

const baseUrl = import.meta.env.BASE_URL || '/'
const pathInApp = stripBaseFromPath(window.location.pathname, baseUrl)

// Detect locale from URL path inside app base: /fr/, /en-gb/, /es/ etc.
const segments = pathInApp.split('/').filter(Boolean);
const urlLocale = segments[0];

if (!urlLocale || !LOCALE_MAP[urlLocale]) {
  // Try browser language, fallback to default
  const browserLang = (navigator.language || '').toLowerCase().split('-')[0];
  const target = Object.keys(LOCALE_MAP).find(k => k === browserLang) || DEFAULT_LOCALE;
  window.location.replace(withBase(baseUrl, `${target}/`));
} else {
  // Set locale before any rendering
  setLocale(urlLocale);
  document.documentElement.lang = LOCALE_MAP[urlLocale];
  const route = segments[1] || '';
  const RootComponent =
    route === 'maquette-baremetal'
      ? BareMetalAvailabilityMockup
      : route === 'maquette-baremetal-listing'
        ? BareMetalListingMockup
        : route === 'maquette-baremetal-listing-v2'
          ? BareMetalListingMockupV2
        : App;

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <RootComponent />
    </React.StrictMode>,
  )
}
