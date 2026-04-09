import React, { useEffect, useMemo, useRef, useState } from 'react';
import './BareMetalConfiguratorMockup.css';

const API_ENDPOINT = 'https://eu.api.ovh.com/v1/dedicated/server/datacenter/availabilities';
const TARGET_ADV_CODES = ['26adv01', '24adv01'];
const BASE_PRICE = 369.99;

const CPU_BY_SERVER = {
  '26adv01': {
    full: 'AMD EPYC 4245P - 6 c / 12 t - 3,9 GHz / 5,4 GHz',
    short: 'AMD EPYC 4245P',
  },
  '24adv01': {
    full: 'AMD EPYC 4244P - 6 c / 12 t - 3,8 GHz / 5,1 GHz',
    short: 'AMD EPYC 4244P',
  },
};

const DC_META = {
  bhs: { regionKey: 'na', regionLabel: 'North America', city: 'Beauharnois', country: 'Canada', flag: '🇨🇦' },
  ynm: { regionKey: 'na', regionLabel: 'North America', city: 'Montreal', country: 'Canada', flag: '🇨🇦' },
  gra: { regionKey: 'eu', regionLabel: 'Europe', city: 'Gravelines', country: 'France', flag: '🇫🇷' },
  rbx: { regionKey: 'eu', regionLabel: 'Europe', city: 'Roubaix', country: 'France', flag: '🇫🇷' },
  sbg: { regionKey: 'eu', regionLabel: 'Europe', city: 'Strasbourg', country: 'France', flag: '🇫🇷' },
  fra: { regionKey: 'eu', regionLabel: 'Europe', city: 'Limburg', country: 'Germany', flag: '🇩🇪' },
  waw: { regionKey: 'eu', regionLabel: 'Europe', city: 'Warsaw', country: 'Poland', flag: '🇵🇱' },
  lon: { regionKey: 'eu', regionLabel: 'Europe', city: 'Erith', country: 'United Kingdom', flag: '🇬🇧' },
  sgp: { regionKey: 'apac', regionLabel: 'Asia/Oceania', city: 'Singapore', country: 'Singapore', flag: '🇸🇬' },
  syd: { regionKey: 'apac', regionLabel: 'Asia/Oceania', city: 'Sydney', country: 'Australia', flag: '🇦🇺' },
};

const FALLBACK_REGIONS = [
  {
    key: 'eu',
    label: 'Europe',
    status: 'available_now',
    datacenters: [
      { code: 'fra', status: 'available_now', city: 'Limburg', country: 'Germany', flag: '🇩🇪', availabilityCode: '72H' },
      { code: 'gra', status: 'available_now', city: 'Gravelines', country: 'France', flag: '🇫🇷', availabilityCode: '72H' },
      { code: 'lon', status: 'available_now', city: 'Erith', country: 'United Kingdom', flag: '🇬🇧', availabilityCode: '1H-low' },
      { code: 'rbx', status: 'available_now', city: 'Roubaix', country: 'France', flag: '🇫🇷', availabilityCode: '72H' },
      { code: 'sbg', status: 'available_now', city: 'Strasbourg', country: 'France', flag: '🇫🇷', availabilityCode: '72H' },
      { code: 'waw', status: 'available_now', city: 'Warsaw', country: 'Poland', flag: '🇵🇱', availabilityCode: '1H-low' },
    ],
  },
  {
    key: 'na',
    label: 'North America',
    status: 'available_now',
    datacenters: [
      { code: 'bhs', status: 'available_now', city: 'Beauharnois', country: 'Canada', flag: '🇨🇦', availabilityCode: '72H' },
      { code: 'ynm', status: 'available_now', city: 'Montreal', country: 'Canada', flag: '🇨🇦', availabilityCode: '1H-low' },
    ],
  },
  {
    key: 'apac',
    label: 'Asia/Oceania',
    status: 'available_now',
    datacenters: [
      { code: 'sgp', status: 'available_now', city: 'Singapore', country: 'Singapore', flag: '🇸🇬', availabilityCode: '72H' },
      { code: 'syd', status: 'available_now', city: 'Sydney', country: 'Australia', flag: '🇦🇺', availabilityCode: '72H' },
    ],
  },
];

const MEMORY_AVAILABLE = [
  { id: 'ram-128', label: '128 Go DDR5 3600 MHz', badge: 'On-Die ECC', price: null },
  { id: 'ram-256', label: '256 Go DDR5 4800 MHz', badge: 'On-Die ECC', price: 200.0 },
];

const MEMORY_ON_REQUEST = [
  { id: 'ram-512-call', label: '512 Go - DDR5 4800 MHz - ECC' },
  { id: 'ram-1024-call', label: '1024 Go - DDR5 4800 MHz - ECC' },
];

const STORAGE_SYSTEM_OPTIONS = [
  { id: 'sto-960', label: '2x 960 Go SSD NVMe Soft RAID', included: true, price: null },
];

const STORAGE_OPTIONS = [{ id: 'sto-none', label: 'Aucun disque de stockage', included: true, price: null }];

const APP_OPTIONS = [
  { id: 'app-plesk', label: 'Plesk', price: 13.99 },
  { id: 'app-cpanel', label: 'cPanel', price: 29.99 },
  { id: 'app-ms', label: 'SQL Server', price: 39.99 },
];

function formatMoney(value) {
  return `${value.toFixed(2).replace('.', ',')} €`;
}

function availabilityCodeToStatus(code) {
  if (!code || code === 'unavailable' || code === 'comingSoon' || code === 'unknown') {
    return 'on_request';
  }
  return 'available_now';
}

function mergeStatus(existing, next) {
  if (existing === 'available_now' || next === 'available_now') return 'available_now';
  return next || existing || 'on_request';
}

function availabilityCodeRank(code) {
  if (!code) return 0;
  if (code === '1H-low' || code === '1H-high') return 3;
  if (code === '72H') return 2;
  return 1;
}

function mergeAvailabilityCode(existing, next) {
  return availabilityCodeRank(next) > availabilityCodeRank(existing) ? next : existing;
}

function availabilityCodeToDelivery(code, status) {
  if (status !== 'available_now') return 'Delivery on request';
  if (code === '72H') return 'Delivery in 3 days';
  return 'Delivery in 120s';
}

function dcMeta(code) {
  return DC_META[code] || {
    regionKey: 'other',
    regionLabel: 'Other regions',
    city: code.toUpperCase(),
    country: 'Datacenter OVHcloud',
    flag: '🏳️',
  };
}

const DC_ORDER_BY_REGION = {
  eu: ['fra', 'gra', 'lon', 'rbx', 'sbg', 'waw'],
  na: ['bhs', 'ynm'],
  apac: ['sgp', 'syd'],
};

function buildRegionAvailability(items) {
  const allCodes = new Set(items.map((entry) => (entry.server || '').toLowerCase()));
  const serverCode = TARGET_ADV_CODES.find((code) => allCodes.has(code)) || TARGET_ADV_CODES[0];
  const scoped = items.filter((entry) => (entry.server || '').toLowerCase() === serverCode);

  const dcStatusMap = new Map();
  scoped.forEach((entry) => {
    (entry.datacenters || []).forEach((dc) => {
      const code = (dc.datacenter || '').toLowerCase();
      if (!code) return;
      const dcStatus = availabilityCodeToStatus(dc.availability);
      const previous = dcStatusMap.get(code) || { status: 'on_request', availabilityCode: 'unavailable' };
      dcStatusMap.set(code, {
        status: mergeStatus(previous.status, dcStatus),
        availabilityCode: mergeAvailabilityCode(previous.availabilityCode, dc.availability || 'unavailable'),
      });
    });
  });

  const regionMap = new Map();
  dcStatusMap.forEach((dcState, code) => {
    const meta = dcMeta(code);
    if (!regionMap.has(meta.regionKey)) {
      regionMap.set(meta.regionKey, {
        key: meta.regionKey,
        label: meta.regionLabel,
        status: 'on_request',
        datacenters: [],
      });
    }
    const region = regionMap.get(meta.regionKey);
    region.status = mergeStatus(region.status, dcState.status);
    region.datacenters.push({
      code,
      status: dcState.status,
      availabilityCode: dcState.availabilityCode,
      city: meta.city,
      country: meta.country,
      flag: meta.flag,
    });
  });

  const REGION_ORDER = ['eu', 'na', 'apac', 'other'];
  const regions = Array.from(regionMap.values())
    .map((region) => ({
      ...region,
      datacenters: region.datacenters.sort((a, b) => {
        const regionOrder = DC_ORDER_BY_REGION[region.key] || [];
        const indexA = regionOrder.indexOf(a.code);
        const indexB = regionOrder.indexOf(b.code);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.city.localeCompare(b.city);
      }),
    }))
    .sort((a, b) => REGION_ORDER.indexOf(a.key) - REGION_ORDER.indexOf(b.key));

  return { serverCode, regions };
}

function OptionRow({ selected = false, label, badge, included = false, price = null, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`ovh-conf-row${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={`ovh-conf-radio${selected ? ' selected' : ''}`} aria-hidden="true" />
      <span className="ovh-conf-label">{label}</span>
      {badge ? <span className="ovh-conf-badge">{badge}</span> : null}
      <span className="ovh-conf-right">
        {included ? (
          <strong>Inclus</strong>
        ) : (
          <>
            <strong>{formatMoney(price || 0)}</strong>
            <small>HT/mois</small>
          </>
        )}
      </span>
    </button>
  );
}

export default function BareMetalConfiguratorMockup() {
  const [selectedMemory, setSelectedMemory] = useState('ram-128');
  const [requestDropdownOpen, setRequestDropdownOpen] = useState(false);
  const [selectedRequestMemory, setSelectedRequestMemory] = useState(MEMORY_ON_REQUEST[MEMORY_ON_REQUEST.length - 1].id);
  const [liveServerCode, setLiveServerCode] = useState('26adv01');
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [regionsError, setRegionsError] = useState('');
  const [regions, setRegions] = useState(FALLBACK_REGIONS);
  const [selectedRegionKey, setSelectedRegionKey] = useState('eu');
  const [selectedDatacenterCode, setSelectedDatacenterCode] = useState('waw');
  const requestDropdownRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('no-scanlines');
    return () => {
      document.body.classList.remove('no-scanlines');
    };
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!requestDropdownRef.current) return;
      if (!requestDropdownRef.current.contains(event.target)) {
        setRequestDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRegionAvailability() {
      try {
        setRegionsLoading(true);
        setRegionsError('');
        const response = await fetch(API_ENDPOINT, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const { serverCode, regions: nextRegions } = buildRegionAvailability(data);
        setLiveServerCode(serverCode);
        setRegions(nextRegions);

        const resolvedRegions = nextRegions.length ? nextRegions : FALLBACK_REGIONS;
        setRegions(resolvedRegions);

        if (resolvedRegions.length) {
          const defaultRegion = resolvedRegions.find((region) => region.status === 'available_now') || resolvedRegions[0];
          const defaultDc =
            defaultRegion.datacenters.find((dc) => dc.status === 'available_now') || defaultRegion.datacenters[0];
          setSelectedRegionKey(defaultRegion.key);
          setSelectedDatacenterCode(defaultDc?.code || '');
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setRegionsError(`Donnees indisponibles (${String(error?.message || error)})`);
        setRegions(FALLBACK_REGIONS);
      } finally {
        setRegionsLoading(false);
      }
    }

    loadRegionAvailability();
    return () => controller.abort();
  }, []);

  const callbackMode = MEMORY_ON_REQUEST.some((item) => item.id === selectedMemory);
  const selectedRequestOption = MEMORY_ON_REQUEST.find((item) => item.id === selectedRequestMemory) || MEMORY_ON_REQUEST[0];
  const cpuInfo = CPU_BY_SERVER[liveServerCode] || CPU_BY_SERVER['26adv01'];
  const selectedRegion = regions.find((region) => region.key === selectedRegionKey) || regions[0] || null;
  const selectedDatacenter =
    (selectedRegion?.datacenters || []).find((dc) => dc.code === selectedDatacenterCode) ||
    selectedRegion?.datacenters?.[0] ||
    null;
  const regionUiLabel = (regionKey) => {
    if (regionKey === 'eu') return 'Europe';
    if (regionKey === 'na') return 'North America';
    if (regionKey === 'apac') return 'Asia/Oceania';
    return 'Other regions';
  };
  const visibleRegionTabs = regions.filter((region) => ['eu', 'na', 'apac'].includes(region.key));
  const datacenterLabel = selectedRegion && selectedDatacenter
    ? `1x ${regionUiLabel(selectedRegion.key)} (${selectedDatacenter.country} - ${selectedDatacenter.city})`
    : '1x Europe (Pologne - Varsovie)';

  const selectedMemoryLabel = useMemo(() => {
    if (callbackMode) {
      const requestMatch = MEMORY_ON_REQUEST.find((item) => item.id === selectedMemory);
      return requestMatch ? requestMatch.label : MEMORY_ON_REQUEST[0].label;
    }
    const match = MEMORY_AVAILABLE.find((item) => item.id === selectedMemory);
    return match ? match.label : MEMORY_AVAILABLE[0].label;
  }, [callbackMode, selectedMemory]);

  const mainCtaLabel = callbackMode ? 'Etre recontacte' : 'Continuer la commande';

  return (
    <div className="ovh-config-page">
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

      <main className="ovh-config-main">
        <div className="ovh-config-shell">
          <section className="ovh-config-layout">
            <div className="ovh-config-left">
              <p className="ovh-config-breadcrumb">Serveurs dedies &gt; Advance &gt; Advance-1</p>
              <p className="ovh-config-kicker">ADVANCE-1</p>
              <p className="ovh-config-promo">Promotion: installation offerte sur cette configuration</p>
              <h1 className="ovh-config-title">Configure your server</h1>

              <article className="ovh-conf-group ovh-location-group">
                <h2>Region location</h2>
                <p className="ovh-location-hint">Bandwidth and traffic may change depending on the selected region.</p>
                <div className="ovh-location-tabs">
                  {(visibleRegionTabs.length ? visibleRegionTabs : regions).map((region) => (
                    <button
                      key={region.key}
                      type="button"
                      className={`ovh-location-tab${selectedRegion?.key === region.key ? ' active' : ''}`}
                      onClick={() => {
                        const nextDc =
                          region.datacenters.find((dc) => dc.status === 'available_now') || region.datacenters[0];
                        setSelectedRegionKey(region.key);
                        setSelectedDatacenterCode(nextDc?.code || '');
                      }}
                    >
                      {regionUiLabel(region.key)}
                    </button>
                  ))}
                </div>
                <div className="ovh-location-list">
                  {(selectedRegion?.datacenters || []).map((dc) => {
                    return (
                      <div
                        key={dc.code}
                        role="button"
                        tabIndex={0}
                        className="ovh-location-card"
                        onClick={() => setSelectedDatacenterCode(dc.code)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') setSelectedDatacenterCode(dc.code);
                        }}
                      >
                        <div className="ovh-location-card-head">
                          <span className="ovh-location-checkbox" aria-hidden="true" />
                          <span className="ovh-location-flag" aria-hidden="true">{dc.flag || '🏳️'}</span>
                          <span className="ovh-location-name">
                            {`${regionUiLabel(selectedRegion.key)} (${dc.country} - ${dc.city})`}
                          </span>
                          <div className="ovh-location-qty" onClick={(event) => event.stopPropagation()}>
                            <button type="button" className="minus" aria-label="Decrease quantity">
                              −
                            </button>
                            <span>0</span>
                            <button
                              type="button"
                              className="plus"
                              aria-label="Increase quantity"
                              onClick={() => setSelectedDatacenterCode(dc.code)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className={`ovh-location-delivery${dc.status === 'available_now' ? ' available' : ' request'}`}>
                          <span className="ovh-location-delivery-icon" aria-hidden="true">◌</span>
                          {availabilityCodeToDelivery(dc.availabilityCode, dc.status)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {regionsLoading ? <p className="ovh-regions-meta">Loading OVHcloud region availabilities...</p> : null}
                {regionsError ? <p className="ovh-regions-meta error">{regionsError}</p> : null}
              </article>

              <article className="ovh-conf-group">
                <h2>Processeur</h2>
                <OptionRow selected label={cpuInfo.full} included />
                <a href="#0" className="ovh-conf-helper-link">
                  Liste des systemes d'exploitation compatibles
                </a>
              </article>

              <article className="ovh-conf-group">
                <h2>Memoire</h2>
                {MEMORY_AVAILABLE.map((option) => (
                  <OptionRow
                    key={option.id}
                    selected={!callbackMode && selectedMemory === option.id}
                    label={option.label}
                    badge={option.badge}
                    included={false}
                    price={option.price}
                    onClick={() => {
                      setSelectedMemory(option.id);
                      setRequestDropdownOpen(false);
                    }}
                  />
                ))}

                <div className={`ovh-conf-request${callbackMode ? ' active' : ''}`}>
                  <div className="ovh-conf-request-head">
                    <span className="ovh-conf-radio selected" aria-hidden="true" />
                    <strong>Autres tailles de mémoire</strong>
                    <span className="ovh-conf-request-head-sub">Sur demande</span>
                  </div>
                  <p className="ovh-conf-request-note">
                    <span className="ovh-conf-request-note-icon" aria-hidden="true">☎</span>
                    Vous serez recontacté(e) par un conseiller
                  </p>
                  <div className="ovh-conf-request-select-wrap" ref={requestDropdownRef}>
                    <button
                      type="button"
                      className="ovh-conf-request-select"
                      onClick={() => setRequestDropdownOpen((current) => !current)}
                    >
                      <span className={`ovh-conf-radio${callbackMode ? ' selected' : ''}`} aria-hidden="true" />
                      <span className="ovh-conf-label">{selectedRequestOption.label}</span>
                      <span className={`ovh-conf-chevron${requestDropdownOpen ? ' open' : ''}`} aria-hidden="true" />
                    </button>
                    {requestDropdownOpen ? (
                      <div className="ovh-conf-request-list">
                        {MEMORY_ON_REQUEST.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={`ovh-conf-request-item${selectedRequestMemory === option.id ? ' selected' : ''}`}
                            onClick={() => {
                              setSelectedRequestMemory(option.id);
                              setSelectedMemory(option.id);
                              setRequestDropdownOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>

              <article className="ovh-conf-group">
                <h2>Stockage systeme</h2>
                {STORAGE_SYSTEM_OPTIONS.map((option) => (
                  <OptionRow
                    key={option.id}
                    selected
                    label={option.label}
                    included={option.included}
                    price={option.price}
                  />
                ))}
              </article>

              <article className="ovh-conf-group">
                <h2>Stockage</h2>
                {STORAGE_OPTIONS.map((option) => (
                  <OptionRow
                    key={option.id}
                    selected
                    label={option.label}
                    included={option.included}
                    price={option.price}
                  />
                ))}
              </article>

              <article className="ovh-conf-group">
                <h2>Bande passante publique</h2>
                <OptionRow selected label="5 Gbit/s illimite et garanti" included />
              </article>

              <article className="ovh-conf-group">
                <h2>Bande passante privee</h2>
                <OptionRow selected label="50 Gbit/s illimite et garanti" included />
              </article>

              <article className="ovh-conf-group">
                <h2>Applications et licences</h2>
                {APP_OPTIONS.map((app, index) => (
                  <OptionRow key={app.id} selected={index === 0} label={app.label} price={app.price} />
                ))}
              </article>

              <article className="ovh-conf-group">
                <h2>Cas d'usage</h2>
                <div className="ovh-conf-usecases">
                  <div>
                    <strong>Site web professionnel</strong>
                    <p>Hebergez votre site vitrine ou e-commerce avec des performances stables.</p>
                  </div>
                  <div>
                    <strong>Applications metier</strong>
                    <p>Deploiement applicatif internalise avec ressources dediees.</p>
                  </div>
                  <div>
                    <strong>Solutions SaaS</strong>
                    <p>Execution de workloads SaaS avec isolation et latence maitrisee.</p>
                  </div>
                </div>
              </article>
            </div>

            <aside className="ovh-config-right">
              <article className="ovh-conf-summary">
                <header className="ovh-conf-summary-head">
                  <div>
                    <p>Serveur Dedie</p>
                    <h3>Advance-1</h3>
                  </div>
                  <strong>{formatMoney(BASE_PRICE)}</strong>
                </header>

                <div className="ovh-conf-summary-body">
                  <div className="ovh-conf-summary-line">
                    <p>Localisation du datacenter</p>
                    <div>
                      <span>{datacenterLabel}</span>
                      <strong>{formatMoney(BASE_PRICE)}</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Processeur</p>
                    <div>
                      <span>{cpuInfo.short}</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Memoire</p>
                    <div>
                      <span>{selectedMemoryLabel}</span>
                      <strong>{callbackMode ? 'Sur demande' : 'Inclus'}</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Stockage systeme</p>
                    <div>
                      <span>2x 960 Go SSD NVMe Soft RAID</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Stockage</p>
                    <div>
                      <span>Aucun disque de stockage</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Bande passante publique</p>
                    <div>
                      <span>5 Gbit/s illimite et garanti</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Bande passante privee</p>
                    <div>
                      <span>50 Gbit/s illimite et garanti</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Frais d'installation du serveur</p>
                    <div>
                      <span className="ovh-conf-install-old">369,99 €</span>
                      <strong className="ovh-conf-install-free">Gratuit</strong>
                    </div>
                  </div>
                </div>

                <footer className="ovh-conf-summary-foot">
                  <div className="ovh-conf-total">
                    <div>
                      <p>Total</p>
                      <span>1 produit</span>
                    </div>
                    <strong>{formatMoney(BASE_PRICE)}</strong>
                  </div>
                  <button type="button" className={`ovh-conf-main-cta${callbackMode ? ' contact' : ''}`}>
                    {mainCtaLabel}
                  </button>
                </footer>
              </article>
            </aside>
          </section>
        </div>
      </main>

      <button type="button" className="ovh-conf-float-call">
        Planifier un appel
      </button>
    </div>
  );
}
