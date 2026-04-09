import React, { useEffect, useMemo, useState } from 'react';
import './BareMetalListingMockup.css';
import './BareMetalConfiguratorMockup.css';

const BASE_PRICE = 104.99;

const MEMORY_AVAILABLE = [
  { id: 'ram-128', label: '128 Go DDR5 3600 MHz', badge: 'On-Die ECC', price: null },
  { id: 'ram-192', label: '192 Go DDR5 4800 MHz', badge: 'On-Die ECC', price: 21.0 },
  { id: 'ram-256', label: '256 Go DDR5 4800 MHz', badge: 'On-Die ECC', price: 42.0 },
  { id: 'ram-384', label: '384 Go DDR5 4800 MHz', badge: 'On-Die ECC', price: 84.0 },
];

const MEMORY_ON_REQUEST = [{ id: 'ram-512-call', label: '512 Go DDR5 4800 MHz', mode: 'on_request' }];

const STORAGE_OPTIONS = [
  { id: 'sto-960', label: '2 x 960 Go SSD NVMe Soft RAID', included: true, price: null },
  { id: 'sto-2t', label: '2 x 1,92 To SSD NVMe Soft RAID', included: false, price: 65.0 },
  { id: 'sto-3t', label: '2 x 3,84 To SSD NVMe Soft RAID', included: false, price: 139.0 },
  { id: 'sto-7t', label: '2 x 7,68 To SSD NVMe Soft RAID', included: false, price: 298.0 },
];

const APP_OPTIONS = [
  { id: 'app-plesk', label: 'Plesk', price: 13.99 },
  { id: 'app-cpanel', label: 'cPanel', price: 29.99 },
  { id: 'app-ms', label: 'SQL Server', price: 39.99 },
];

function formatMoney(value) {
  return `${value.toFixed(2).replace('.', ',')} €`;
}

function OptionRow({ selected = false, label, badge, included = false, price = null }) {
  return (
    <button type="button" className={`ovh-conf-row${selected ? ' selected' : ''}`}>
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

  useEffect(() => {
    document.body.classList.add('no-scanlines');
    return () => {
      document.body.classList.remove('no-scanlines');
    };
  }, []);

  const callbackMode = selectedMemory === 'ram-512-call';
  const selectedMemoryLabel = useMemo(() => {
    if (callbackMode) return MEMORY_ON_REQUEST[0].label;
    const match = MEMORY_AVAILABLE.find((item) => item.id === selectedMemory);
    return match ? match.label : MEMORY_AVAILABLE[0].label;
  }, [callbackMode, selectedMemory]);

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
              <p className="ovh-config-breadcrumb">Dedicated servers &gt; Advance &gt; Advance-1</p>
              <p className="ovh-config-kicker">ADVANCE-1</p>
              <h1 className="ovh-config-title">Configure your server</h1>
              <p className="ovh-config-subtitle">
                Select hardware options. Some RAM upgrades may require outbound callback handling.
              </p>

              <article className="ovh-conf-group">
                <h2>Sign location</h2>
                <OptionRow selected label="1x Europe (Pologne - Varsovie)" included />
              </article>

              <article className="ovh-conf-group">
                <h2>Processor</h2>
                <OptionRow selected label="AMD EPYC 4245P - 6 c / 12 t - 3,9 GHz / 5,4 GHz" badge="NEW" included />
              </article>

              <article className="ovh-conf-group">
                <h2>Memory</h2>
                {MEMORY_AVAILABLE.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    className={`ovh-conf-row${!callbackMode && selectedMemory === option.id ? ' selected' : ''}`}
                    onClick={() => setSelectedMemory(option.id)}
                  >
                    <span
                      className={`ovh-conf-radio${!callbackMode && selectedMemory === option.id ? ' selected' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="ovh-conf-label">{option.label}</span>
                    <span className="ovh-conf-badge">{option.badge}</span>
                    <span className="ovh-conf-right">
                      {option.price === null ? (
                        <strong>Included</strong>
                      ) : (
                        <>
                          <strong>{formatMoney(option.price)}</strong>
                          <small>HT/mois</small>
                        </>
                      )}
                    </span>
                  </button>
                ))}

                <h3 className="ovh-conf-subheading">Autres options de RAM sur demande</h3>
                <div className={`ovh-conf-request${callbackMode ? ' active' : ''}`}>
                  <button
                    type="button"
                    className="ovh-conf-request-select"
                    onClick={() => setSelectedMemory('ram-512-call')}
                  >
                    <span className={`ovh-conf-radio${callbackMode ? ' selected' : ''}`} aria-hidden="true" />
                    <span className="ovh-conf-label">{MEMORY_ON_REQUEST[0].label}</span>
                    <span className="ovh-conf-chevron" aria-hidden="true">
                      v
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`ovh-conf-request-cta${callbackMode ? ' active' : ''}`}
                    onClick={() => setSelectedMemory('ram-512-call')}
                  >
                    Etre rappele
                  </button>
                </div>
              </article>

              <article className="ovh-conf-group">
                <h2>Storage</h2>
                {STORAGE_OPTIONS.map((option, index) => (
                  <OptionRow
                    key={option.id}
                    selected={index === 0}
                    label={option.label}
                    included={option.included}
                    price={option.price}
                  />
                ))}
              </article>

              <article className="ovh-conf-group">
                <h2>Public bandwidth</h2>
                <OptionRow selected label="5 Gbit/s - unmetered and guaranteed" included />
              </article>

              <article className="ovh-conf-group">
                <h2>Private bandwidth</h2>
                <OptionRow selected label="25 Gbit/s - unlimited" included />
              </article>

              <article className="ovh-conf-group">
                <h2>Add options</h2>
                <OptionRow label="Operating system: Linux Ubuntu 24.04" price={0.0} />
              </article>

              <article className="ovh-conf-group">
                <h2>Applications and licenses</h2>
                {APP_OPTIONS.map((app) => (
                  <OptionRow key={app.id} label={app.label} price={app.price} />
                ))}
              </article>

              <article className="ovh-conf-group">
                <h2>Use cases</h2>
                <div className="ovh-conf-usecases">
                  <div>
                    <strong>Professional website</strong>
                    <p>Host your website with predictable performance.</p>
                  </div>
                  <div>
                    <strong>Business applications</strong>
                    <p>Deploy internal business apps with dedicated resources.</p>
                  </div>
                  <div>
                    <strong>SaaS solutions</strong>
                    <p>Run containerised SaaS workloads with stable latency.</p>
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
                      <span>1x Europe (Pologne - Varsovie)</span>
                      <strong>{formatMoney(BASE_PRICE)}</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Processeur</p>
                    <div>
                      <span>AMD EPYC 4245P</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Memoire</p>
                    <div>
                      <span>{selectedMemoryLabel}</span>
                      <strong>{callbackMode ? 'Nous contacter' : 'Inclus'}</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Stockage systeme</p>
                    <div>
                      <span>2 x 960 Go SSD NVMe Soft RAID</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>
                  <div className="ovh-conf-summary-line">
                    <p>Bande passante privee</p>
                    <div>
                      <span>25 Gbit/s - unlimited</span>
                      <strong>Inclus</strong>
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
                  <button type="button" className={`ovh-conf-main-cta${callbackMode ? ' disabled' : ''}`}>
                    Continuer la commande
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
