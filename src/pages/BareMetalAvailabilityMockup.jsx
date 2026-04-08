import React, { useEffect, useMemo, useState } from 'react';
import './BareMetalAvailabilityMockup.css';

const SOURCE_URL = 'https://www.ovhcloud.com/fr/bare-metal/prices/?range=advance';

const AXES = ['location', 'ram', 'storage'];

const CATALOG = [
  {
    id: 'adv-core-1',
    name: 'Advance-1',
    generation: '2025',
    cpu: 'AMD EPYC 9354P - 32c/64t',
    basePrice: 289.99,
    options: {
      location: [
        { value: 'Gravelines', status: 'available_now' },
        { value: 'Roubaix', status: 'available_now' },
        { value: 'Frankfurt', status: 'on_request' },
      ],
      ram: [
        { value: '128 Go', status: 'available_now' },
        { value: '256 Go', status: 'on_request' },
        { value: '512 Go', status: 'on_request' },
      ],
      storage: [
        { value: '2 x 960 Go NVMe', status: 'available_now' },
        { value: '2 x 1.92 To NVMe', status: 'on_request' },
      ],
    },
  },
  {
    id: 'adv-core-2',
    name: 'Advance-2',
    generation: '2026',
    cpu: 'Intel Xeon Gold 5416S - 32c/64t',
    basePrice: 359.99,
    options: {
      location: [
        { value: 'Paris', status: 'available_now' },
        { value: 'Warsaw', status: 'on_request' },
        { value: 'Vint Hill', status: 'on_request' },
      ],
      ram: [
        { value: '256 Go', status: 'on_request' },
        { value: '512 Go', status: 'on_request' },
        { value: '1 To', status: 'on_request' },
      ],
      storage: [
        { value: '2 x 1.92 To NVMe', status: 'available_now' },
        { value: '4 x 1.92 To NVMe', status: 'on_request' },
      ],
    },
  },
  {
    id: 'adv-core-3',
    name: 'Advance-3',
    generation: '2025',
    cpu: 'AMD EPYC 9474F - 48c/96t',
    basePrice: 489.99,
    options: {
      location: [
        { value: 'London', status: 'available_now' },
        { value: 'Milan', status: 'available_now' },
        { value: 'Singapore', status: 'on_request' },
      ],
      ram: [
        { value: '256 Go', status: 'available_now' },
        { value: '512 Go', status: 'on_request' },
        { value: '1 To', status: 'on_request' },
      ],
      storage: [
        { value: '2 x 3.84 To NVMe', status: 'available_now' },
        { value: '8 x 3.84 To NVMe', status: 'on_request' },
      ],
    },
  },
];

function getVisibleOptions(optionList, mode) {
  if (mode === 'available_now') {
    return optionList.filter((opt) => opt.status === 'available_now');
  }
  return optionList;
}

function isServerOrderableNow(server) {
  return AXES.every((axis) => server.options[axis].some((opt) => opt.status === 'available_now'));
}

function sanitizeSelection(server, selection, mode) {
  const next = { ...(selection || {}) };
  AXES.forEach((axis) => {
    const visible = getVisibleOptions(server.options[axis], mode);
    const values = visible.map((entry) => entry.value);
    if (!values.length) {
      next[axis] = '';
      return;
    }
    if (!values.includes(next[axis])) {
      next[axis] = values[0];
    }
  });
  return next;
}

function shallowEqual(a, b) {
  const ka = Object.keys(a || {});
  const kb = Object.keys(b || {});
  if (ka.length !== kb.length) return false;
  return ka.every((key) => a[key] === b[key]);
}

function optionStatusLabel(status, axis) {
  if (status === 'available_now') return 'Disponible immediatement';
  if (axis === 'ram') return 'Disponibilite non garantie';
  return 'Sur demande';
}

export default function BareMetalAvailabilityMockup() {
  const [mode, setMode] = useState('available_now');
  const [selectedServerId, setSelectedServerId] = useState(CATALOG[0].id);
  const [selections, setSelections] = useState({});
  const [payloadPreview, setPayloadPreview] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contact, setContact] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    document.body.classList.add('no-scanlines');
    return () => {
      document.body.classList.remove('no-scanlines');
    };
  }, []);

  const visibleServers = useMemo(
    () => (mode === 'available_now' ? CATALOG.filter(isServerOrderableNow) : CATALOG),
    [mode]
  );

  useEffect(() => {
    if (!visibleServers.some((server) => server.id === selectedServerId) && visibleServers.length) {
      setSelectedServerId(visibleServers[0].id);
    }
  }, [visibleServers, selectedServerId]);

  const currentServer = useMemo(() => {
    return CATALOG.find((server) => server.id === selectedServerId) || visibleServers[0] || CATALOG[0];
  }, [selectedServerId, visibleServers]);

  useEffect(() => {
    if (!currentServer) return;
    setSelections((prev) => {
      const current = prev[currentServer.id] || {};
      const sanitized = sanitizeSelection(currentServer, current, mode);
      if (shallowEqual(current, sanitized)) return prev;
      return { ...prev, [currentServer.id]: sanitized };
    });
  }, [currentServer, mode]);

  const currentSelection = sanitizeSelection(currentServer, selections[currentServer.id], mode);

  const needsContact = useMemo(() => {
    return AXES.some((axis) => {
      const selectedValue = currentSelection[axis];
      const option = currentServer.options[axis].find((entry) => entry.value === selectedValue);
      return option && option.status === 'on_request';
    });
  }, [currentServer, currentSelection]);

  const onRequestAxes = useMemo(() => {
    return AXES.filter((axis) => {
      const selectedValue = currentSelection[axis];
      const option = currentServer.options[axis].find((entry) => entry.value === selectedValue);
      return option && option.status === 'on_request';
    });
  }, [currentServer, currentSelection]);

  function countByStatus(server, status) {
    return Object.values(server.options)
      .flat()
      .filter((option) => option.status === status).length;
  }

  function handleSelectOption(axis, value) {
    setSelections((prev) => ({
      ...prev,
      [currentServer.id]: { ...(prev[currentServer.id] || {}), [axis]: value },
    }));
  }

  function buildPayload(extra = {}) {
    return {
      queue: 'CRO_ADVANCE_ON_REQUEST',
      sla: 'Reponse sous 4h ouvrees',
      sourceUrl: SOURCE_URL,
      availabilityMode: mode,
      range: 'Advance',
      server: {
        id: currentServer.id,
        name: `${currentServer.name} ${currentServer.generation}`,
        cpu: currentServer.cpu,
        basePriceEurHtMonthly: currentServer.basePrice,
      },
      selection: {
        location: currentSelection.location,
        ram: currentSelection.ram,
        storage: currentSelection.storage,
      },
      requiresSalesContact: onRequestAxes.length > 0,
      onRequestAxes,
      timestamp: new Date().toISOString(),
      ...extra,
    };
  }

  function handlePrimaryAction() {
    const payload = buildPayload();
    setPayloadPreview(JSON.stringify(payload, null, 2));
    if (needsContact) {
      setIsModalOpen(true);
      return;
    }
    window.alert('Commande immediate simulee: configuration eligible.');
  }

  function handleReset() {
    setSelections((prev) => ({ ...prev, [currentServer.id]: {} }));
    setPayloadPreview('');
  }

  function handleSubmitCallback(event) {
    event.preventDefault();
    if (!contact.name || !contact.company || !contact.email || !contact.phone) {
      return;
    }
    const payload = buildPayload({
      contact,
      salesProcess: {
        dedicatedOwner: 'Equipe Sales Bare Metal Advance',
        expectedAction:
          "Proposer une alternative viable, pas seulement confirmer l'indisponibilite",
      },
    });
    setPayloadPreview(JSON.stringify(payload, null, 2));
    setIsModalOpen(false);
    window.alert('Demande callback envoyee (simulation).');
  }

  return (
    <div className="bm-page">
      <main className="bm-shell">
        <section className="bm-headline">
          <p className="bm-kicker">Maquette UX Bare Metal - Tier Advance</p>
          <h1>Disponibilite reelle, parcours commercial sans effet magasin vide</h1>
          <p className="bm-subtitle">
            Les options "Sur demande" restent visibles et selectionnables. Le CTA s adapte a la
            configuration choisie et bascule automatiquement vers un callback sales quand necessaire.
          </p>
          <div className="bm-mode-wrap">
            <div className="bm-mode-control" role="tablist" aria-label="Mode de disponibilite">
              <button
                type="button"
                className={`bm-mode-btn${mode === 'available_now' ? ' active' : ''}`}
                onClick={() => setMode('available_now')}
              >
                Disponible immediatement
              </button>
              <button
                type="button"
                className={`bm-mode-btn${mode === 'on_request' ? ' active' : ''}`}
                onClick={() => setMode('on_request')}
              >
                Sur demande
              </button>
            </div>
            <p className="bm-mode-caption">
              {mode === 'available_now'
                ? 'Seules les options commandables sur-le-champ sont affichees.'
                : 'Le catalogue complet est visible. Les options sur demande restent selectionnables.'}
            </p>
          </div>
        </section>

        <section className="bm-layout">
          <article className="bm-panel">
            <div className="bm-panel-head">
              <h2>Listing catalogue</h2>
              <p>{mode === 'available_now' ? 'Vue "Disponible immediatement"' : 'Vue "Sur demande"'}</p>
            </div>
            <div className="bm-cards">
              {visibleServers.map((server) => {
                const availableCount = countByStatus(server, 'available_now');
                const requestCount = countByStatus(server, 'on_request');
                return (
                  <button
                    type="button"
                    key={server.id}
                    className={`bm-server-card${selectedServerId === server.id ? ' active' : ''}`}
                    onClick={() => setSelectedServerId(server.id)}
                  >
                    <div className="bm-server-top">
                      <div>
                        <p className="bm-server-name">
                          {server.name} <small>{server.generation}</small>
                        </p>
                        <p className="bm-server-meta">{server.cpu}</p>
                      </div>
                      <span className={`bm-badge ${requestCount ? 'request' : 'available'}`}>
                        {requestCount ? 'Sur demande possible' : 'Dispo immediate'}
                      </span>
                    </div>
                    <p className="bm-price">
                      A partir de {server.basePrice.toFixed(2).replace('.', ',')} EUR HT/mois
                    </p>
                    <p className="bm-server-meta">
                      {availableCount} options immediates / {requestCount} options sur demande
                    </p>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="bm-panel">
            <div className="bm-panel-head">
              <h2>Configurateur</h2>
              <p>CTA intelligent + callback pre-rempli</p>
            </div>
            <div className="bm-config-body">
              <p className="bm-config-title">
                {currentServer.name} {currentServer.generation} / {currentServer.cpu}
              </p>
              <p className={`bm-helper${needsContact ? ' alert' : ''}`}>
                {needsContact
                  ? 'Cette configuration contient des options sur demande. Le parcours passe en contact sales.'
                  : 'Cette configuration est commandable en ligne immediatement.'}
              </p>

              {AXES.map((axis) => (
                <div className="bm-section" key={axis}>
                  <p className="bm-section-label">
                    {axis === 'location' ? 'Localisation' : axis === 'ram' ? 'Memoire RAM' : 'Stockage'}
                  </p>
                  <div className="bm-options">
                    {getVisibleOptions(currentServer.options[axis], mode).map((option) => (
                      <button
                        type="button"
                        key={`${axis}-${option.value}`}
                        className={`bm-option${
                          currentSelection[axis] === option.value ? ' selected' : ''
                        }${option.status === 'on_request' ? ' on-request' : ''}`}
                        onClick={() => handleSelectOption(axis, option.value)}
                      >
                        {option.value}
                        <small>{optionStatusLabel(option.status, axis)}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bm-summary">
                <strong>Configuration selectionnee</strong>
                <ul>
                  <li>
                    <strong>Serveur:</strong> {currentServer.name} {currentServer.generation}
                  </li>
                  <li>
                    <strong>Localisation:</strong> {currentSelection.location}
                  </li>
                  <li>
                    <strong>RAM:</strong> {currentSelection.ram}
                  </li>
                  <li>
                    <strong>Stockage:</strong> {currentSelection.storage}
                  </li>
                  <li>
                    <strong>Mode client:</strong>{' '}
                    {mode === 'available_now' ? 'Disponible immediatement' : 'Sur demande'}
                  </li>
                </ul>
              </div>

              <div className="bm-cta-wrap">
                <button
                  type="button"
                  className={`bm-cta ${needsContact ? 'warning' : 'primary'}`}
                  onClick={handlePrimaryAction}
                >
                  {needsContact ? 'Contactez-nous' : 'Continuer la commande'}
                </button>
                <button type="button" className="bm-cta secondary" onClick={handleReset}>
                  Reinitialiser
                </button>
              </div>
              <p className="bm-inline-note">
                Si une option "Sur demande" est active, la demande est routee vers la file CRO dediee avec SLA.
              </p>

              {payloadPreview ? <pre className="bm-payload">{payloadPreview}</pre> : null}
            </div>
          </article>
        </section>
      </main>

      <div
        className={`bm-modal-backdrop${isModalOpen ? ' open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsModalOpen(false);
        }}
      >
        <div className="bm-modal" role="dialog" aria-modal="true" aria-labelledby="bm-callback-title">
          <div className="bm-modal-head">
            <h3 id="bm-callback-title">Contactez-nous - Demande callback sales</h3>
            <p>La configuration est pre-remplie et envoyee vers la file CRO "ADVANCE_ON_REQUEST".</p>
          </div>
          <form className="bm-modal-body" onSubmit={handleSubmitCallback}>
            <div className="bm-grid">
              <div className="bm-field">
                <label htmlFor="bm-name">Nom</label>
                <input
                  id="bm-name"
                  value={contact.name}
                  onChange={(event) => setContact((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="bm-field">
                <label htmlFor="bm-company">Societe</label>
                <input
                  id="bm-company"
                  value={contact.company}
                  onChange={(event) =>
                    setContact((prev) => ({ ...prev, company: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="bm-field">
                <label htmlFor="bm-email">Email</label>
                <input
                  id="bm-email"
                  type="email"
                  value={contact.email}
                  onChange={(event) => setContact((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="bm-field">
                <label htmlFor="bm-phone">Telephone</label>
                <input
                  id="bm-phone"
                  value={contact.phone}
                  onChange={(event) => setContact((prev) => ({ ...prev, phone: event.target.value }))}
                  required
                />
              </div>
              <div className="bm-field full">
                <label htmlFor="bm-notes">Contexte client</label>
                <textarea
                  id="bm-notes"
                  value={contact.notes}
                  onChange={(event) => setContact((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Usage, deadline, contraintes de latence..."
                />
              </div>
            </div>
            <div className="bm-modal-foot">
              <button type="button" className="bm-cta secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="bm-cta warning">
                Envoyer au sales
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
