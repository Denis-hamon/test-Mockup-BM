import React, { useState } from 'react';

const ContentPipeline = () => {
  const [activeTab, setActiveTab] = useState('scrape');
  const [scrapedArticles, setScrapedArticles] = useState([]);
  const [transformedArticles, setTransformedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [sourceUrl, setSourceUrl] = useState('https://www.hostinger.fr/tutoriels/');
  const [transformConfig, setTransformConfig] = useState({
    brandReplacements: true,
    addOvhLinks: true,
    adaptTone: true,
    addDisclaimer: true
  });

  // Simulated article data for demonstration
  const mockArticles = [
    { id: 1, title: "Comment créer un site WordPress en 2024", category: "WordPress", url: "/tutoriels/creer-site-wordpress", wordCount: 2450, lastUpdated: "2024-01-15" },
    { id: 2, title: "Guide complet : Hébergement web pour débutants", category: "Hébergement", url: "/tutoriels/hebergement-web-debutants", wordCount: 3200, lastUpdated: "2024-01-12" },
    { id: 3, title: "Comment configurer un VPS Linux", category: "VPS", url: "/tutoriels/configurer-vps-linux", wordCount: 1890, lastUpdated: "2024-01-10" },
    { id: 4, title: "SSL/TLS : Sécuriser votre site web", category: "Sécurité", url: "/tutoriels/ssl-tls-securite", wordCount: 2100, lastUpdated: "2024-01-08" },
    { id: 5, title: "Optimiser les performances de votre serveur", category: "Performance", url: "/tutoriels/optimiser-serveur", wordCount: 2780, lastUpdated: "2024-01-05" },
    { id: 6, title: "Migration de site : Guide étape par étape", category: "Migration", url: "/tutoriels/migration-site", wordCount: 1950, lastUpdated: "2024-01-03" },
    { id: 7, title: "Docker : Déployer vos applications", category: "DevOps", url: "/tutoriels/docker-deploiement", wordCount: 3400, lastUpdated: "2023-12-28" },
    { id: 8, title: "Base de données MySQL : Les fondamentaux", category: "Database", url: "/tutoriels/mysql-fondamentaux", wordCount: 2650, lastUpdated: "2023-12-22" },
  ];

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const handleScrape = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog('Initialisation du scraping...', 'info');
    
    await new Promise(r => setTimeout(r, 800));
    addLog(`Connexion à ${sourceUrl}`, 'info');
    
    await new Promise(r => setTimeout(r, 600));
    addLog('Analyse de la structure du sitemap...', 'info');
    
    await new Promise(r => setTimeout(r, 1000));
    addLog(`${mockArticles.length} articles détectés`, 'success');
    
    for (let i = 0; i < mockArticles.length; i++) {
      await new Promise(r => setTimeout(r, 300));
      addLog(`Extraction: ${mockArticles[i].title}`, 'info');
    }
    
    addLog('Scraping terminé avec succès!', 'success');
    setScrapedArticles(mockArticles);
    setIsLoading(false);
  };

  const handleTransform = async () => {
    if (selectedArticles.size === 0) {
      addLog('Veuillez sélectionner au moins un article', 'error');
      return;
    }
    
    setIsLoading(true);
    addLog('Démarrage de la transformation...', 'info');
    
    const selected = scrapedArticles.filter(a => selectedArticles.has(a.id));
    const transformed = [];
    
    for (const article of selected) {
      await new Promise(r => setTimeout(r, 500));
      
      let newTitle = article.title;
      if (transformConfig.brandReplacements) {
        newTitle = newTitle.replace(/Hostinger/gi, 'OVHcloud');
        addLog(`Remplacement marque: ${article.title}`, 'info');
      }
      
      transformed.push({
        ...article,
        originalTitle: article.title,
        title: newTitle,
        status: 'transformed',
        ovhLinks: transformConfig.addOvhLinks ? ['docs.ovh.com', 'help.ovhcloud.com'] : [],
        hasDisclaimer: transformConfig.addDisclaimer
      });
    }
    
    addLog(`${transformed.length} articles transformés`, 'success');
    setTransformedArticles(transformed);
    setActiveTab('export');
    setIsLoading(false);
  };

  const toggleArticle = (id) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedArticles(newSelected);
  };

  const selectAll = () => {
    if (selectedArticles.size === scrapedArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(scrapedArticles.map(a => a.id)));
    }
  };

  const categoryColors = {
    'WordPress': '#21759b',
    'Hébergement': '#0050d8',
    'VPS': '#ff6b35',
    'Sécurité': '#10b981',
    'Performance': '#8b5cf6',
    'Migration': '#ec4899',
    'DevOps': '#06b6d4',
    'Database': '#f59e0b'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #13131a 50%, #0f0f15 100%)',
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      color: '#e4e4e7',
      padding: '32px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '40px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #0050d8, #00d4aa)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📡
          </div>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              margin: 0,
              background: 'linear-gradient(90deg, #fff, #a1a1aa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Content Intelligence Pipeline
            </h1>
            <p style={{ margin: '4px 0 0', color: '#71717a', fontSize: '14px' }}>
              Scraping • Transformation • Export — Outil interne OVHcloud
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '32px',
        background: 'rgba(255,255,255,0.03)',
        padding: '6px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        {[
          { id: 'scrape', label: '1. Scraping', icon: '🔍' },
          { id: 'transform', label: '2. Transformation', icon: '⚙️' },
          { id: 'export', label: '3. Export', icon: '📤' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, #0050d8, #0040b0)'
                : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#71717a'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '32px' }}>
        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {/* Scrape Tab */}
          {activeTab === 'scrape' && (
            <div>
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '500' }}>
                  Source à scraper
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '14px 18px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder="URL de la base de tutoriels"
                  />
                  <button
                    onClick={handleScrape}
                    disabled={isLoading}
                    style={{
                      padding: '14px 28px',
                      background: isLoading 
                        ? 'rgba(255,255,255,0.1)'
                        : 'linear-gradient(135deg, #0050d8, #00d4aa)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      minWidth: '160px'
                    }}
                  >
                    {isLoading ? '⏳ Scraping...' : '🚀 Lancer le scraping'}
                  </button>
                </div>
              </div>

              {scrapedArticles.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                      Articles collectés ({scrapedArticles.length})
                    </h3>
                    <button
                      onClick={selectAll}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#a1a1aa',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedArticles.size === scrapedArticles.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {scrapedArticles.map(article => (
                      <div
                        key={article.id}
                        onClick={() => toggleArticle(article.id)}
                        style={{
                          padding: '16px 24px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          background: selectedArticles.has(article.id) 
                            ? 'rgba(0,80,216,0.15)'
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: selectedArticles.has(article.id)
                            ? '2px solid #0050d8'
                            : '2px solid rgba(255,255,255,0.2)',
                          background: selectedArticles.has(article.id)
                            ? '#0050d8'
                            : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          {selectedArticles.has(article.id) && '✓'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '500',
                            marginBottom: '6px',
                            color: '#f4f4f5'
                          }}>
                            {article.title}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{
                              padding: '3px 10px',
                              background: categoryColors[article.category] || '#666',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {article.category}
                            </span>
                            <span style={{ color: '#52525b', fontSize: '12px' }}>
                              {article.wordCount.toLocaleString()} mots
                            </span>
                            <span style={{ color: '#52525b', fontSize: '12px' }}>
                              {article.lastUpdated}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedArticles.size > 0 && (
                    <div style={{
                      padding: '16px 24px',
                      background: 'rgba(0,80,216,0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
                        {selectedArticles.size} article(s) sélectionné(s)
                      </span>
                      <button
                        onClick={() => setActiveTab('transform')}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #0050d8, #0040b0)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Continuer vers Transformation →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transform Tab */}
          {activeTab === 'transform' && (
            <div>
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '500' }}>
                  Configuration de transformation
                </h3>
                
                <div style={{ display: 'grid', gap: '16px' }}>
                  {[
                    { key: 'brandReplacements', label: 'Remplacements de marque', desc: 'Hostinger → OVHcloud, etc.' },
                    { key: 'addOvhLinks', label: 'Ajouter liens OVHcloud', desc: 'Insérer liens vers docs.ovh.com' },
                    { key: 'adaptTone', label: 'Adapter le ton éditorial', desc: 'Aligner avec la charte OVHcloud' },
                    { key: 'addDisclaimer', label: 'Ajouter disclaimer', desc: 'Mention légale en bas d\'article' }
                  ].map(option => (
                    <label
                      key={option.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={transformConfig[option.key]}
                        onChange={(e) => setTransformConfig({
                          ...transformConfig,
                          [option.key]: e.target.checked
                        })}
                        style={{ 
                          width: '20px', 
                          height: '20px',
                          accentColor: '#0050d8'
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#f4f4f5' }}>
                          {option.label}
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
                          {option.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                <button
                  onClick={handleTransform}
                  disabled={isLoading || selectedArticles.size === 0}
                  style={{
                    marginTop: '24px',
                    padding: '14px 28px',
                    background: (isLoading || selectedArticles.size === 0)
                      ? 'rgba(255,255,255,0.1)'
                      : 'linear-gradient(135deg, #0050d8, #00d4aa)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (isLoading || selectedArticles.size === 0) ? 'not-allowed' : 'pointer',
                    width: '100%'
                  }}
                >
                  {isLoading ? '⏳ Transformation en cours...' : `🔄 Transformer ${selectedArticles.size} article(s)`}
                </button>
              </div>

              {selectedArticles.size === 0 && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#71717a'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <p>Aucun article sélectionné</p>
                  <button
                    onClick={() => setActiveTab('scrape')}
                    style={{
                      marginTop: '12px',
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#a1a1aa',
                      cursor: 'pointer'
                    }}
                  >
                    ← Retour au scraping
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div>
              {transformedArticles.length > 0 ? (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                      Articles prêts à exporter ({transformedArticles.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#a1a1aa',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}>
                        📄 Export JSON
                      </button>
                      <button style={{
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#a1a1aa',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}>
                        📊 Export CSV
                      </button>
                      <button style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #0050d8, #0040b0)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}>
                        🚀 Push vers CMS
                      </button>
                    </div>
                  </div>
                  
                  {transformedArticles.map(article => (
                    <div
                      key={article.id}
                      style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: '500',
                            marginBottom: '4px',
                            color: '#f4f4f5'
                          }}>
                            {article.title}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#52525b',
                            textDecoration: 'line-through',
                            marginBottom: '8px'
                          }}>
                            Original: {article.originalTitle}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '3px 10px',
                              background: 'rgba(16,185,129,0.2)',
                              color: '#10b981',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              ✓ Marque adaptée
                            </span>
                            {article.ovhLinks.length > 0 && (
                              <span style={{
                                padding: '3px 10px',
                                background: 'rgba(0,80,216,0.2)',
                                color: '#60a5fa',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                ✓ {article.ovhLinks.length} liens OVH
                              </span>
                            )}
                            {article.hasDisclaimer && (
                              <span style={{
                                padding: '3px 10px',
                                background: 'rgba(139,92,246,0.2)',
                                color: '#a78bfa',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                ✓ Disclaimer
                              </span>
                            )}
                          </div>
                        </div>
                        <button style={{
                          padding: '8px 14px',
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: '#71717a',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          👁️ Preview
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: '#71717a'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📤</div>
                  <p>Aucun article transformé</p>
                  <p style={{ fontSize: '13px', marginTop: '8px' }}>
                    Complétez d'abord les étapes de scraping et transformation
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logs Panel */}
        <div style={{
          width: '320px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          overflow: 'hidden',
          height: 'fit-content',
          maxHeight: '600px'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#a1a1aa' }}>
              📋 Logs d'exécution
            </h3>
            <button
              onClick={() => setLogs([])}
              style={{
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: '#52525b',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
          <div style={{
            padding: '12px',
            maxHeight: '500px',
            overflowY: 'auto',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '12px'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#52525b', padding: '20px', textAlign: 'center' }}>
                En attente d'actions...
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    padding: '6px 8px',
                    marginBottom: '4px',
                    borderRadius: '4px',
                    background: log.type === 'error' 
                      ? 'rgba(239,68,68,0.1)'
                      : log.type === 'success'
                        ? 'rgba(16,185,129,0.1)'
                        : 'rgba(255,255,255,0.02)',
                    color: log.type === 'error'
                      ? '#f87171'
                      : log.type === 'success'
                        ? '#34d399'
                        : '#a1a1aa'
                  }}
                >
                  <span style={{ color: '#52525b' }}>[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        padding: '20px 0',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#52525b',
        fontSize: '12px'
      }}>
        <div>
          Content Intelligence Pipeline v1.0 — Outil interne OVHcloud
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>⚠️ Usage interne uniquement</span>
          <span>📧 Contact: product-team@ovhcloud.com</span>
        </div>
      </div>
    </div>
  );
};

export default ContentPipeline;
