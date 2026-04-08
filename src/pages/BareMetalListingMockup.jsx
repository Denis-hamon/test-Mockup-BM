import React, { useEffect, useMemo, useState } from 'react';
import './BareMetalListingMockup.css';

const SOURCE_URL = 'https://www.ovhcloud.com/fr/bare-metal/prices/?range=advance';
const API_ENDPOINT = 'https://eu.api.ovh.com/v1/dedicated/server/datacenter/availabilities';
const ADV_SERVER_RE = /^(24adv|26adv)/i;
const FILTERS = ['Region', 'Gamme (1)', 'Hardware', 'Reseau', 'Prix', "Cas d'usage", 'OS Available'];

const SERVER_META = {
  '24adv01': {
    name: 'Advance-1',
    cpu: ['AMD EPYC 4244P', '6 c / 12 t', '3,8 GHz / 5,1 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 89.99,
    priceTtc: 107.99,
    setupFee: 'Offert',
    setupOriginal: 89.99,
  },
  '26adv01': {
    name: 'Advance-1',
    cpu: ['AMD EPYC 4245P', '6 c / 12 t', '3,9 GHz / 5,4 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 104.99,
    priceTtc: 125.99,
    setupFee: 'Offert',
    setupOriginal: 104.99,
  },
  '24adv02': {
    name: 'Advance-2',
    cpu: ['AMD EPYC 4344P', '8 c / 16 t', '3,8 GHz / 5,3 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 124.99,
    priceTtc: 149.99,
    setupFee: 'Offert',
    setupOriginal: 124.99,
  },
  '26adv02': {
    name: 'Advance-2',
    cpu: ['AMD EPYC 4345P', '8 c / 16 t', '3,8 GHz / 5,5 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 134.99,
    priceTtc: 161.99,
    setupFee: 'Offert',
    setupOriginal: 134.99,
  },
  '24adv03': {
    name: 'Advance-3',
    cpu: ['AMD EPYC 4464P', '12 c / 24 t', '3,7 GHz / 5,4 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 169.99,
    priceTtc: 203.99,
    setupFee: 'Offert',
    setupOriginal: 169.99,
  },
  '26adv03': {
    name: 'Advance-3',
    cpu: ['AMD EPYC 4465P', '12 c / 24 t', '4,3 GHz / 5,4 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 199.99,
    priceTtc: 239.99,
    setupFee: 'Offert',
    setupOriginal: 199.99,
  },
  '24adv04': {
    name: 'Advance-4',
    cpu: ['AMD EPYC 4584PX', '16 c / 32 t', '4,2 GHz / 5,7 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 219.99,
    priceTtc: 263.99,
    setupFee: 'Offert',
    setupOriginal: 219.99,
  },
  '26adv04': {
    name: 'Advance-4',
    cpu: ['AMD EPYC 4585PX', '16 c / 32 t', '4,3 GHz / 5,7 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 239.99,
    priceTtc: 287.99,
    setupFee: 'Offert',
    setupOriginal: 239.99,
  },
  '24adv05': {
    name: 'Advance-5',
    cpu: ['AMD EPYC 8224P', '24 c / 48 t', '2,55 GHz / 3 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 289.99,
    priceTtc: 347.99,
    setupFee: 'Offert',
    setupOriginal: 289.99,
  },
  '24advstor01': {
    name: 'Advance-STOR',
    cpu: ['AMD EPYC 4344P', '8 c / 16 t', '3,8 GHz / 5,3 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 199.99,
    priceTtc: 239.99,
    setupFee: 'Offert',
    setupOriginal: 199.99,
  },
  '26advstor01': {
    name: 'Advance-STOR',
    cpu: ['AMD EPYC 4345P', '8 c / 16 t', '3,8 GHz / 5,5 GHz'],
    bandwidth: ['Publique: 1 Gbit/s - 5 Gbit/s', 'Privee: 25 Gbit/s'],
    priceHt: 229.99,
    priceTtc: 275.99,
    setupFee: 'Offert',
    setupOriginal: 229.99,
  },
};

function availabilityCodeToStatus(code) {
  if (!code || code === 'unavailable' || code === 'comingSoon' || code === 'unknown') {
    return 'on_request';
  }
  return 'available_now';
}

function mergeStatus(existing, next) {
  if (existing === 'available_now' || next === 'available_now') return 'available_now';
  return 'on_request';
}

function formatMemoryOption(raw) {
  const direct = raw.match(/ram-(\d+)([tg])/i);
  if (direct) {
    const value = Number(direct[1]);
    const unit = direct[2].toLowerCase() === 't' ? 'To' : 'Go';
    return `${value} ${unit}`;
  }
  const fallback = raw.match(/ram-(\d+)/i);
  if (fallback) {
    return `${Number(fallback[1])} Go`;
  }
  return raw;
}

function formatDiskSize(size, unitCode) {
  const unit = (unitCode || 'g').toLowerCase();
  if (unit === 't') return `${size} To`;
  if (size >= 1000) {
    const toValue = (size / 1000).toFixed(size % 1000 === 0 ? 0 : 2).replace('.', ',');
    return `${toValue} To`;
  }
  return `${size} Go`;
}

function formatStorageOption(raw) {
  const matches = [...raw.matchAll(/(\d+)x(\d+)([tg])?/gi)];
  if (!matches.length) return raw;

  return matches
    .map((match) => {
      const count = Number(match[1]);
      const size = Number(match[2]);
      const sizeLabel = formatDiskSize(size, match[3]);
      return `${count} x ${sizeLabel}`;
    })
    .join(' + ');
}

function parseNumericAmount(label) {
  const normalized = label.replace(',', '.');
  const m = normalized.match(/(\d+(?:\.\d+)?)\s*(Go|To)/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const value = Number(m[1]);
  const unit = m[2].toLowerCase();
  return unit === 'to' ? value * 1024 : value;
}

function parseStorageAmount(label) {
  const values = [...label.matchAll(/(\d+(?:,\d+)?)\s*(Go|To)/gi)].map((m) => {
    const value = Number(m[1].replace(',', '.'));
    return m[2].toLowerCase() === 'to' ? value * 1024 : value;
  });
  if (!values.length) return Number.MAX_SAFE_INTEGER;
  return values.reduce((acc, current) => acc + current, 0);
}

function formatTotalStorageGo(goValue) {
  const toValue = goValue / 1024;
  const raw =
    toValue >= 100 ? toValue.toFixed(0) : toValue >= 10 ? toValue.toFixed(1) : toValue.toFixed(2);
  const normalized = raw
    .replace('.', ',')
    .replace(/,0+$/, '')
    .replace(/(\,\d*[1-9])0+$/, '$1');
  return `${normalized} To`;
}

function buildStorageRange(storageOptions) {
  const totals = storageOptions
    .map((option) => parseStorageAmount(option.label))
    .filter((value) => Number.isFinite(value) && value !== Number.MAX_SAFE_INTEGER);

  if (!totals.length) return 'Selon configuration';
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  if (min === max) return formatTotalStorageGo(min);
  return `de ${formatTotalStorageGo(min)} a ${formatTotalStorageGo(max)}`;
}

function getStorageRangeForListing(serverName, storageOptions) {
  if (serverName !== 'Advance-STOR') {
    return 'de 960 GB a 7.7 TB';
  }
  return buildStorageRange(storageOptions);
}

function getYearFromServerCode(serverCode) {
  const m = serverCode.match(/^(\d{2})/);
  if (!m) return '';
  return `20${m[1]}`;
}

function normalizeServerCode(serverCode) {
  return (serverCode || '').toLowerCase();
}

function getDisplayName(serverCode) {
  const key = normalizeServerCode(serverCode);
  if (SERVER_META[key]?.name) return SERVER_META[key].name;
  if (key.includes('stor')) return 'Advance-STOR';
  const m = key.match(/adv0*(\d+)/);
  if (m) return `Advance-${Number(m[1])}`;
  return serverCode.toUpperCase();
}

function summarizeFromApi(items) {
  const grouped = new Map();
  const filtered = items.filter((entry) => ADV_SERVER_RE.test(entry.server || ''));

  filtered.forEach((entry) => {
    const serverCode = normalizeServerCode(entry.server || entry.planCode || entry.fqn);
    const entryStatus = (entry.datacenters || []).some(
      (dc) => availabilityCodeToStatus(dc.availability) === 'available_now'
    )
      ? 'available_now'
      : 'on_request';

    if (!grouped.has(serverCode)) {
      const meta = SERVER_META[serverCode] || {};
      grouped.set(serverCode, {
        id: serverCode,
        serverCode: serverCode.toUpperCase(),
        name: getDisplayName(serverCode),
        year: getYearFromServerCode(serverCode),
        cpu: meta.cpu || ['Caracteristiques detaillees sur fiche produit'],
        bandwidth: meta.bandwidth || ['Publique: selon configuration', 'Privee: selon configuration'],
        priceHt: meta.priceHt ?? null,
        priceTtc: meta.priceTtc ?? null,
        setupFee: meta.setupFee ?? 'Selon offre',
        setupOriginal: meta.setupOriginal ?? null,
        globalStatus: 'on_request',
        memoryMap: new Map(),
        storageMap: new Map(),
        datacenterSet: new Set(),
      });
    }

    const row = grouped.get(serverCode);
    row.globalStatus = mergeStatus(row.globalStatus, entryStatus);

    (entry.datacenters || []).forEach((dc) => {
      if (dc.datacenter) row.datacenterSet.add(dc.datacenter);
    });

    const memoryLabel = formatMemoryOption(entry.memory || 'RAM inconnue');
    row.memoryMap.set(memoryLabel, mergeStatus(row.memoryMap.get(memoryLabel), entryStatus));

    const storageSource = entry.storage || entry.systemStorage || 'Stockage inconnu';
    const storageLabel = formatStorageOption(storageSource);
    row.storageMap.set(storageLabel, mergeStatus(row.storageMap.get(storageLabel), entryStatus));
  });

  return Array.from(grouped.values())
    .map((row) => {
      const memoryOptions = Array.from(row.memoryMap.entries())
        .map(([label, status]) => ({ label, status }))
        .sort((a, b) => parseNumericAmount(a.label) - parseNumericAmount(b.label));
      const storageOptions = Array.from(row.storageMap.entries())
        .map(([label, status]) => ({ label, status }))
        .sort((a, b) => parseStorageAmount(a.label) - parseStorageAmount(b.label));

      return {
        ...row,
        memoryOptions,
        storageOptions,
        storageRange: getStorageRangeForListing(row.name, storageOptions),
        datacenterCount: row.datacenterSet.size,
      };
    })
    .sort((a, b) => a.serverCode.localeCompare(b.serverCode));
}

function requiresContact(server) {
  return server.globalStatus === 'on_request';
}

function statusLabel(status) {
  return status === 'available_now' ? 'Disponible' : 'Sur demande';
}

function formatPrice(value) {
  if (typeof value !== 'number') return 'N/A';
  return `${value.toFixed(2).replace('.', ',')} EUR`;
}

export default function BareMetalListingMockup() {
  const [mode, setMode] = useState('on_request');
  const [payloadPreview, setPayloadPreview] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [contact, setContact] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiRows, setApiRows] = useState([]);
  const [apiUpdatedAt, setApiUpdatedAt] = useState('');

  useEffect(() => {
    document.body.classList.add('no-scanlines');
    return () => {
      document.body.classList.remove('no-scanlines');
    };
  }, []);

  async function loadApiAvailability(signal) {
    try {
      setApiLoading(true);
      setApiError('');
      const response = await fetch(API_ENDPOINT, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const summary = summarizeFromApi(data);
      setApiRows(summary);
      setApiUpdatedAt(new Date().toISOString());
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setApiError(`Echec chargement API OVHcloud: ${String(error?.message || error)}`);
    } finally {
      setApiLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadApiAvailability(controller.signal);
    return () => controller.abort();
  }, []);

  const visibleServers = useMemo(() => {
    if (mode === 'available_now') {
      return apiRows.filter(
        (server) => !requiresContact(server) && server.year !== '2024'
      );
    }
    return apiRows;
  }, [apiRows, mode]);

  function makePayload(server, extra = {}) {
    const onRequestAxes = [];
    if (!server.memoryOptions.some((option) => option.status === 'available_now')) onRequestAxes.push('ram');
    if (!server.storageOptions.some((option) => option.status === 'available_now')) onRequestAxes.push('storage');
    if (server.globalStatus === 'on_request') onRequestAxes.push('location');

    return {
      queue: 'CRO_ADVANCE_ON_REQUEST',
      sla: 'Reponse sous 4h ouvrees',
      sourceUrl: SOURCE_URL,
      apiEndpoint: API_ENDPOINT,
      pageType: 'listing',
      availabilityMode: mode,
      range: 'Advance',
      serverReference: `${server.name}-${server.year || server.serverCode}`,
      serverCode: server.serverCode,
      datacenterCount: server.datacenterCount,
      selection: {
        ram: server.memoryOptions.map((option) => `${option.label}:${option.status}`),
        storage: {
          range: server.storageRange,
          optionCount: server.storageOptions.length,
          hasOnRequest: server.storageOptions.some((option) => option.status === 'on_request'),
        },
      },
      globalStatus: server.globalStatus,
      onRequestAxes,
      requiresSalesContact: onRequestAxes.length > 0,
      timestamp: new Date().toISOString(),
      ...extra,
    };
  }

  function handleAction(server) {
    const payload = makePayload(server);
    setPayloadPreview(JSON.stringify(payload, null, 2));
    const shouldContact = mode === 'on_request' || requiresContact(server);
    if (shouldContact) {
      setSelectedServer(server);
      setIsModalOpen(true);
      return;
    }
    window.alert('Configuration disponible: redirection checkout (simulation).');
  }

  function handleCallbackSubmit(event) {
    event.preventDefault();
    if (!selectedServer) return;
    if (!contact.name || !contact.company || !contact.email || !contact.phone) return;

    const payload = makePayload(selectedServer, {
      contact,
      salesProcess: {
        expectedAction:
          "Proposer une alternative viable, pas seulement confirmer l'indisponibilite",
      },
    });
    setPayloadPreview(JSON.stringify(payload, null, 2));
    setIsModalOpen(false);
    window.alert('Demande callback envoyee (simulation).');
  }

  return (
    <div className="ovh-page">
      <header className="ovh-topbar">
        <div className="ovh-topbar-inner">
          <div className="ovh-logo">
            <span className="ovh-logo-mark" aria-hidden="true" />
            <span>OVHcloud</span>
          </div>
          <nav className="ovh-links">
            <span>Mon compte client</span>
            <span>Contact commercial</span>
            <span>Support</span>
            <span className="ovh-flag-fr" aria-hidden="true" />
          </nav>
        </div>
      </header>

      <div className="ovh-nav">
        <div className="ovh-nav-inner">
          <a className="home" href="#0" aria-label="Accueil">
            <span className="home-glyph" aria-hidden="true" />
          </a>
          <a className="active" href="#0">
            Serveurs dedies
          </a>
          <a href="#0">VPS</a>
          <a href="#0">Stockage & sauvegarde</a>
          <a href="#0">Network</a>
          <a href="#0">Securite & identite</a>
          <a href="#0">Operations</a>
        </div>
      </div>

      <section className="ovh-hero">
        <div className="ovh-hero-inner">
          <div>
            <p className="ovh-eyebrow">Tous nos serveurs</p>
            <p className="ovh-breadcrumb">Serveurs dedies | Tous nos serveurs</p>
            <h1>Tous nos serveurs Bare Metal</h1>
            <p>
              Decouvrez l ensemble de notre offre de serveurs dedies. Trouvez en quelques clics la reference
              adaptee a vos besoins et caracteristiques techniques.
            </p>
          </div>
          <div className="ovh-hero-illustration" aria-hidden="true">
            <img
              src="https://www.ovhcloud.com/sites/default/files/styles/text_media/public/2023-12/ovhcloud_dedicated_server_600x400.png"
              alt=""
            />
          </div>
        </div>
      </section>

      <section className="ovh-filters-wrap">
        <div className="ovh-filters">
          <div className="ovh-filter-row">
            {FILTERS.map((label) => (
              <button type="button" className="ovh-filter-pill" key={label}>
                {label}
                <span className="caret" aria-hidden="true">
                  v
                </span>
              </button>
            ))}
          </div>
          <div className="ovh-filter-row lower">
            <span className="ovh-chip">Advance</span>
            <button type="button" className="ovh-reset">
              Reinitialiser
            </button>
          </div>
        </div>

        <div className="ovh-controls">
          <div className="ovh-mode-toggle">
            <button
              type="button"
              className={mode === 'available_now' ? 'active' : ''}
              onClick={() => setMode('available_now')}
            >
              Disponible
            </button>
            <button
              type="button"
              className={mode === 'on_request' ? 'active' : ''}
              onClick={() => setMode('on_request')}
            >
              Sur demande
            </button>
          </div>
          <div className="ovh-sort-wrap">
            <div className="ovh-view-switch" aria-hidden="true">
              <span className="active icon-list" />
              <span className="icon-grid" />
            </div>
            <span className="ovh-sort-label">Trier par</span>
            <div className="ovh-sort">Prix croissant v</div>
          </div>
        </div>
      </section>

      <section className="ovh-results">
        <div className="ovh-results-head">
          <h2>
            Resultats <span>({visibleServers.length} serveur(s))</span>
          </h2>
          <button type="button" className="ovh-open-all" onClick={() => loadApiAvailability()}>
            {apiLoading ? 'Rafraichissement...' : 'Rafraichir'}
          </button>
        </div>
        {mode === 'available_now' ? (
          <p className="ovh-api-meta-inline">
            Mode Disponible: les references 2024 sont masquees pour privilegier les generations recentes.
          </p>
        ) : null}
        {apiError ? <p className="ovh-api-error">{apiError}</p> : null}

        <div className="ovh-table">
          <div className="ovh-row ovh-head">
            <div>Nom</div>
            <div>CPU</div>
            <div>RAM</div>
            <div>Stockage</div>
            <div>Bande passante</div>
            <div>
              Prix HT/mois
              <small>(A partir de)</small>
            </div>
            <div>Comparer</div>
            <div />
          </div>

          {visibleServers.map((server) => {
            const contactRequired = mode === 'on_request' || requiresContact(server);
            return (
              <div className="ovh-row" key={server.id}>
                <div className="ovh-name-cell">
                  <span className="ovh-check">v</span>
                  <span className="ovh-name">{server.name}</span>
                  {server.year ? <span className="ovh-year">{server.year}</span> : null}
                </div>
                <div className="ovh-cell-stack">
                  {server.cpu.map((line) => (
                    <span key={`${server.id}-cpu-${line}`}>{line}</span>
                  ))}
                </div>
                <div className="ovh-cell-stack">
                  {server.memoryOptions.map((option) => (
                    <span
                      key={`${server.id}-ram-${option.label}`}
                      className={`ovh-option-line ovh-option-line-${option.status}`}
                      title={`RAM: ${statusLabel(option.status)}`}
                      aria-label={`RAM: ${statusLabel(option.status)}`}
                    >
                      <span>{option.label}</span>
                    </span>
                  ))}
                </div>
                <div className="ovh-cell-stack">
                  <span className="ovh-storage-range">{server.storageRange}</span>
                </div>
                <div className="ovh-cell-stack">
                  {server.bandwidth.map((line) => (
                    <span key={`${server.id}-bw-${line}`}>{line}</span>
                  ))}
                  <span className="ovh-dc-count">{server.datacenterCount} DC</span>
                </div>
                <div className="ovh-price-cell">
                  <strong>{formatPrice(server.priceHt)}</strong>
                  <span>
                    {typeof server.priceTtc === 'number'
                      ? `soit ${formatPrice(server.priceTtc)} TTC/mois`
                      : 'Tarification detaillee sur fiche'}
                  </span>
                  {typeof server.setupOriginal === 'number' ? (
                    <span>
                      Frais d installation: <s>{formatPrice(server.setupOriginal)}</s> {server.setupFee}
                    </span>
                  ) : (
                    <span>Frais d installation: {server.setupFee}</span>
                  )}
                </div>
                <div className="ovh-compare">
                  <input type="checkbox" aria-label={`Comparer ${server.name}`} />
                </div>
                <div className="ovh-action">
                  <button
                    type="button"
                    className={contactRequired ? 'contact' : 'configure'}
                    onClick={() => handleAction(server)}
                  >
                    {contactRequired ? 'Nous contacter' : 'Configurer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {payloadPreview ? <pre className="ovh-payload">{payloadPreview}</pre> : null}

        <article className="ovh-bottom-info">
          <h3>Combien coute un serveur dedie ?</h3>
          <p>
            Le prix d un serveur varie selon les ressources techniques, le type de gamme, la quantite de
            memoire, le stockage et les options reseau. Certaines references peuvent aussi necessiter une
            preparation en datacenter pour appliquer la configuration demandee.
          </p>
          <p>
            Le mode "Sur demande" permet de conserver la visibilite sur l offre complete tout en orientant
            les configurations contraintes vers un accompagnement commercial avec proposition d alternative.
          </p>
        </article>
      </section>

      <div
        className={`ovh-modal-backdrop${isModalOpen ? ' open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsModalOpen(false);
        }}
      >
        <div className="ovh-modal" role="dialog" aria-modal="true" aria-labelledby="ovh-modal-title">
          <div className="ovh-modal-head">
            <h3 id="ovh-modal-title">Contactez-nous</h3>
            <p>Demande transmise a la file CRO "ADVANCE_ON_REQUEST".</p>
          </div>
          <form className="ovh-modal-body" onSubmit={handleCallbackSubmit}>
            <div className="ovh-form-grid">
              <label>
                Nom
                <input
                  value={contact.name}
                  onChange={(event) => setContact((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Societe
                <input
                  value={contact.company}
                  onChange={(event) => setContact((prev) => ({ ...prev, company: event.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={contact.email}
                  onChange={(event) => setContact((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Telephone
                <input
                  value={contact.phone}
                  onChange={(event) => setContact((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                />
              </label>
              <label className="full">
                Contexte client
                <textarea
                  value={contact.notes}
                  onChange={(event) => setContact((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Contrainte de latence, deadline, alternatives souhaitees..."
                />
              </label>
            </div>
            <div className="ovh-modal-actions">
              <button type="button" onClick={() => setIsModalOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="primary">
                Envoyer au sales
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
