import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LOCALE_MAP, DEFAULT_LOCALE } from './i18n/locale-map.js'
import { setLocale } from './i18n/index.js'

// Detect locale from URL path: /fr/, /en-gb/, /es/ etc.
const segments = window.location.pathname.split('/').filter(Boolean);
const urlLocale = segments[0];

if (!urlLocale || !LOCALE_MAP[urlLocale]) {
  // Try browser language, fallback to default
  const browserLang = (navigator.language || '').toLowerCase().split('-')[0];
  const target = Object.keys(LOCALE_MAP).find(k => k === browserLang) || DEFAULT_LOCALE;
  window.location.replace(`/${target}/`);
} else {
  // Set locale before any rendering
  setLocale(urlLocale);
  document.documentElement.lang = LOCALE_MAP[urlLocale];

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
