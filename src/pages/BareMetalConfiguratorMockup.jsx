import React, { useEffect, useMemo, useState } from 'react';
import './BareMetalListingMockup.css';
import './BareMetalConfiguratorMockup.css';

const MEMORY_OPTIONS = [
  {
    id: 'ram-128',
    label: '128 Go DDR5 3600 MHz',
    badge: 'On-Die ECC',
    monthly: 42.0,
    status: 'available',
  },
  {
    id: 'ram-256',
    label: '256 Go DDR5 4800 MHz',
    monthly: null,
    status: 'on_request',
  },
];

const BASE_PRICE = 369.99;

function formatPrice(value) {
  return `${value.toFixed(2).replace('.', ',')} EUR`;
}

export default function BareMetalConfiguratorMockup() {
  const [selectedRam, setSelectedRam] = useState('ram-128');

  useEffect(() => {
    document.body.classList.add('no-scanlines');
    return () => {
      document.body.classList.remove('no-scanlines');
    };
  }, []);

  const selectedRamOption = useMemo(
    () => MEMORY_OPTIONS.find((option) => option.id === selectedRam) || MEMORY_OPTIONS[0],
    [selectedRam]
  );
  const requiresCallback = selectedRamOption.status === 'on_request';

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
              <h1 className="ovh-config-title">Advance-1 dedicated server</h1>
              <p className="ovh-config-subtitle">
                Faites evoluer la configuration selon la disponibilite. Les options sur demande basculent vers
                un accompagnement commercial.
              </p>

              <a className="ovh-config-link" href="#0">
                Liste des systemes d exploitation compatibles
              </a>

              <article className="ovh-config-block">
                <h2>Localisation du datacenter</h2>
                <button type="button" className="ovh-config-choice is-selected">
                  <span className="ovh-config-radio is-selected" aria-hidden="true" />
                  <span className="ovh-config-choice-text">1x Europe (Pologne - Varsovie)</span>
                  <span className="ovh-config-choice-end">Inclus</span>
                </button>
              </article>

              <article className="ovh-config-block">
                <h2>Memoire</h2>
                <button
                  type="button"
                  className={`ovh-config-choice${selectedRam === 'ram-128' ? ' is-selected' : ''}`}
                  onClick={() => setSelectedRam('ram-128')}
                >
                  <span
                    className={`ovh-config-radio${selectedRam === 'ram-128' ? ' is-selected' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="ovh-config-choice-text">{MEMORY_OPTIONS[0].label}</span>
                  <span className="ovh-config-chip">{MEMORY_OPTIONS[0].badge}</span>
                  <span className="ovh-config-choice-price">
                    {formatPrice(MEMORY_OPTIONS[0].monthly)}
                    <small>HT/mois</small>
                  </span>
                </button>
              </article>

              <article className="ovh-config-block">
                <h2>Autres options de RAM sur demande</h2>
                <div className={`ovh-config-onrequest${requiresCallback ? ' is-selected' : ''}`}>
                  <button
                    type="button"
                    className="ovh-config-onrequest-select"
                    onClick={() => setSelectedRam('ram-256')}
                  >
                    <span
                      className={`ovh-config-radio${requiresCallback ? ' is-selected' : ''}`}
                      aria-hidden="true"
                    />
                    <span className="ovh-config-choice-text">{MEMORY_OPTIONS[1].label}</span>
                    <span className="ovh-config-chevron" aria-hidden="true">
                      v
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`ovh-config-onrequest-cta${requiresCallback ? ' is-active' : ''}`}
                    onClick={() => setSelectedRam('ram-256')}
                  >
                    Etre rappele
                  </button>
                </div>
              </article>

              <article className="ovh-config-block">
                <h2>Stockage systeme</h2>
                <button type="button" className="ovh-config-choice is-selected">
                  <span className="ovh-config-radio is-selected" aria-hidden="true" />
                  <span className="ovh-config-choice-text">2x 960 Go SSD NVMe Soft RAID</span>
                  <span className="ovh-config-choice-end">Inclus</span>
                </button>
              </article>

              <article className="ovh-config-block">
                <h2>Stockage</h2>
                <button type="button" className="ovh-config-choice is-selected">
                  <span className="ovh-config-radio is-selected" aria-hidden="true" />
                  <span className="ovh-config-choice-text">Aucun disque de stockage</span>
                  <span className="ovh-config-choice-end">Inclus</span>
                </button>
              </article>
            </div>

            <aside className="ovh-config-right">
              <article className="ovh-config-summary">
                <header className="ovh-config-summary-head">
                  <div>
                    <p>Serveur dedie</p>
                    <h3>Advance-1</h3>
                  </div>
                  <strong>{formatPrice(BASE_PRICE)}</strong>
                </header>

                <div className="ovh-config-summary-lines">
                  <div className="ovh-config-line">
                    <p>Localisation du datacenter</p>
                    <div>
                      <span>1x Europe (Pologne - Varsovie)</span>
                      <strong>{formatPrice(BASE_PRICE)}</strong>
                    </div>
                  </div>

                  <div className="ovh-config-line">
                    <p>Processeur</p>
                    <div>
                      <span>AMD EPYC 4245P</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>

                  <div className="ovh-config-line">
                    <p>Memoire</p>
                    <div>
                      <span>{selectedRamOption.label}</span>
                      <strong>{requiresCallback ? 'Nous contacter' : 'Inclus'}</strong>
                    </div>
                  </div>

                  <div className="ovh-config-line">
                    <p>Stockage systeme</p>
                    <div>
                      <span>2x 960 Go SSD NVMe Soft RAID</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>

                  <div className="ovh-config-line">
                    <p>Stockage</p>
                    <div>
                      <span>Aucun disque de stockage</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>

                  <div className="ovh-config-line">
                    <p>Bande passante publique</p>
                    <div>
                      <span>5 Gbit/s illimite et garanti</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>

                  <div className="ovh-config-line">
                    <p>Bande passante privee</p>
                    <div>
                      <span>25 Gbit/s illimite et garanti</span>
                      <strong>Inclus</strong>
                    </div>
                  </div>

                  <div className="ovh-config-line">
                    <p>Frais d installation</p>
                    <div>
                      <span>Frais d installation du serveur</span>
                      <strong className="free">Gratuit</strong>
                    </div>
                  </div>
                </div>

                <footer className="ovh-config-summary-foot">
                  <div className="ovh-config-total">
                    <div>
                      <p>Total</p>
                      <span>1 produit</span>
                    </div>
                    <strong>{formatPrice(BASE_PRICE)}</strong>
                  </div>

                  <button
                    type="button"
                    className={`ovh-config-main-cta${requiresCallback ? ' disabled' : ''}`}
                    disabled={requiresCallback}
                  >
                    {requiresCallback ? 'Continuer la commande' : 'Continuer la commande  ->'}
                  </button>
                </footer>
              </article>
            </aside>
          </section>
        </div>
      </main>

      <button type="button" className="ovh-config-floating-call">
        Planifier un appel
      </button>
    </div>
  );
}
