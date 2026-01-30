import React, { useState, useEffect, useRef } from 'react';

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

const LANGUAGES = [
  { code: 'fr', name: 'Francais', flag: 'FR' },
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'es', name: 'Espanol', flag: 'ES' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'it', name: 'Italiano', flag: 'IT' },
  { code: 'pt', name: 'Portugues', flag: 'PT' },
  { code: 'nl', name: 'Nederlands', flag: 'NL' },
  { code: 'pl', name: 'Polski', flag: 'PL' }
];

// Simple markdown to HTML renderer
const renderMarkdown = (text) => {
  if (!text) return '';

  let html = text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 style="font-size:15px;font-weight:600;margin:16px 0 8px;color:#00185e">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;margin:20px 0 10px;color:#00185e">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size:18px;font-weight:600;margin:24px 0 12px;color:#00185e">$1</h2>')
    .replace(/^=+$/gm, '') // Remove === underlines
    .replace(/^-+$/gm, '') // Remove --- underlines
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links - show text only, not the URL
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '<span style="color:#0050d7">$1</span>')
    // Bullet lists
    .replace(/^\* (.+)$/gm, '<li style="margin-left:20px;margin-bottom:4px">$1</li>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:20px;margin-bottom:4px">$1</li>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```\w*\n?/g, '').replace(/```/g, '');
      return `<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;font-size:12px">${code}</pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;font-size:12px">$1</code>')
    // Paragraphs (double newlines)
    .replace(/\n\n+/g, '</p><p style="margin-bottom:12px">')
    // Single newlines to breaks
    .replace(/\n/g, '<br/>');

  return `<p style="margin-bottom:12px">${html}</p>`;
};

const ContentPipeline = () => {
  const [activeSection, setActiveSection] = useState('sources');
  const [providers, setProviders] = useState([]);
  const [articles, setArticles] = useState([]);
  const [articleCounts, setArticleCounts] = useState({});
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('fr');
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [stats, setStats] = useState(null);

  // Scraping state
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedScrapeLanguage, setSelectedScrapeLanguage] = useState('fr');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const pollingRef = useRef(null);

  // Fetch providers
  useEffect(() => {
    fetchProviders();
    fetchStats();
  }, []);

  // Fetch articles when language changes
  useEffect(() => {
    if (activeSection === 'library') {
      fetchArticles();
    }
  }, [activeSection, selectedLanguage]);

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/providers`);
      const data = await res.json();
      setProviders(data);
    } catch (e) {
      console.error('Error fetching providers:', e);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch(`${API_URL}/api/articles?language=${selectedLanguage}&limit=100`);
      const data = await res.json();
      setArticles(data.articles || []);
      setArticleCounts(data.counts || {});
    } catch (e) {
      console.error('Error fetching articles:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchArticleDetail = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/articles/${id}`);
      const data = await res.json();
      setSelectedArticle(data);
      setActiveSection('studio');
    } catch (e) {
      console.error('Error fetching article:', e);
    }
  };

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  // Start scraping
  const startScraping = async () => {
    if (!selectedProvider) return;

    const providerData = providers.find(p => p.id === selectedProvider);
    const baseUrls = providerData?.base_urls || {};
    const url = baseUrls[selectedScrapeLanguage];

    if (!url) {
      addLog(`Pas d'URL pour ${selectedScrapeLanguage}`, 'error');
      return;
    }

    setIsLoading(true);
    setLogs([]);
    addLog(`Demarrage collecte ${providerData.name} (${selectedScrapeLanguage.toUpperCase()})`, 'info');

    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          language: selectedScrapeLanguage,
          url: url
        })
      });

      if (res.ok) {
        pollingRef.current = setInterval(pollProgress, 2000);
      } else {
        const error = await res.json();
        addLog(`Erreur: ${error.error}`, 'error');
        setIsLoading(false);
      }
    } catch (e) {
      addLog(`Erreur: ${e.message}`, 'error');
      setIsLoading(false);
    }
  };

  const pollProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/api/scrape/progress`);
      const data = await res.json();

      if (data.logs) setLogs(data.logs);
      setProgress({ current: data.current, total: data.total });

      if (data.status === 'completed' || data.status === 'error') {
        clearInterval(pollingRef.current);
        setIsLoading(false);
        fetchProviders();
        fetchStats();
      }
    } catch (e) {
      console.error('Polling error:', e);
    }
  };

  // Transform articles
  const transformSelected = async () => {
    if (selectedArticles.size === 0) return;

    setIsLoading(true);
    addLog(`Transformation de ${selectedArticles.size} articles...`, 'info');

    try {
      const res = await fetch(`${API_URL}/api/transform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: Array.from(selectedArticles) })
      });

      if (res.ok) {
        pollingRef.current = setInterval(pollTransformProgress, 1500);
      }
    } catch (e) {
      addLog(`Erreur: ${e.message}`, 'error');
      setIsLoading(false);
    }
  };

  const pollTransformProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transform/progress`);
      const data = await res.json();

      if (data.logs) setLogs(data.logs);

      if (data.status === 'completed' || data.status === 'error') {
        clearInterval(pollingRef.current);
        setIsLoading(false);
        fetchArticles();
        setSelectedArticles(new Set());
      }
    } catch (e) {
      console.error('Polling error:', e);
    }
  };

  // Translate article
  const translateArticle = async (targetLang) => {
    if (!selectedArticle) return;

    addLog(`Traduction vers ${targetLang.toUpperCase()}...`, 'info');

    try {
      await fetch(`${API_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: selectedArticle.id,
          targetLanguage: targetLang
        })
      });
      addLog(`Traduction ${targetLang.toUpperCase()} lancee`, 'success');
    } catch (e) {
      addLog(`Erreur: ${e.message}`, 'error');
    }
  };

  const toggleArticleSelection = (id) => {
    const newSet = new Set(selectedArticles);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedArticles(newSet);
  };

  const selectAllArticles = () => {
    if (selectedArticles.size === articles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(articles.map(a => a.id)));
    }
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #00185e 0%, #0050d7 100%)',
      fontFamily: "'Source Sans Pro', sans-serif",
      color: '#fff',
      padding: '24px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid rgba(255,255,255,0.2)'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      background: '#bef1ff',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00185e',
      fontWeight: 'bold',
      fontSize: '20px'
    },
    nav: {
      display: 'flex',
      gap: '4px',
      background: 'rgba(255,255,255,0.1)',
      padding: '4px',
      borderRadius: '8px'
    },
    navBtn: (active) => ({
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      background: active ? '#fff' : 'transparent',
      color: active ? '#0050d7' : 'rgba(255,255,255,0.7)',
      transition: 'all 0.2s'
    }),
    mainContent: {
      display: 'flex',
      gap: '24px'
    },
    leftPanel: {
      flex: 1
    },
    rightPanel: {
      width: '300px',
      background: '#00185e',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.2)',
      padding: '16px',
      maxHeight: '600px',
      overflow: 'auto'
    },
    card: {
      background: '#fff',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#00185e',
      marginBottom: '16px'
    },
    providerCard: (active) => ({
      padding: '16px',
      background: active ? '#0050d7' : '#f8f9fa',
      border: active ? 'none' : '1px solid #ececec',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '8px',
      color: active ? '#fff' : '#00185e'
    }),
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #ccc',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '8px'
    },
    btn: (variant = 'primary', disabled = false) => ({
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      background: disabled ? '#ccc' : variant === 'primary' ? '#0050d7' : variant === 'success' ? '#268403' : '#fff',
      color: variant === 'outline' ? '#4d5592' : '#fff',
      border: variant === 'outline' ? '1px solid #ccc' : 'none'
    }),
    langTabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    langTab: (active, count) => ({
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      background: active ? '#0050d7' : '#f0f0f0',
      color: active ? '#fff' : '#00185e',
      opacity: count > 0 || active ? 1 : 0.5
    }),
    articleRow: (selected) => ({
      padding: '12px 16px',
      borderBottom: '1px solid #ececec',
      background: selected ? '#bef1ff' : '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }),
    checkbox: (checked) => ({
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      border: checked ? '2px solid #0050d7' : '2px solid #ccc',
      background: checked ? '#0050d7' : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '12px',
      flexShrink: 0
    }),
    badge: (color) => ({
      padding: '2px 8px',
      background: color,
      color: '#fff',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '600'
    }),
    log: (type) => ({
      padding: '6px 8px',
      marginBottom: '4px',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace',
      background: type === 'error' ? 'rgba(255,100,100,0.2)' : type === 'success' ? 'rgba(100,255,100,0.2)' : 'rgba(255,255,255,0.05)',
      color: type === 'error' ? '#ff6b6b' : type === 'success' ? '#7cfc00' : '#bef1ff'
    }),
    studioPanel: {
      flex: 1,
      background: '#fff',
      borderRadius: '8px',
      overflow: 'hidden'
    },
    studioHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #ececec',
      background: '#f8f9fa'
    },
    studioContent: {
      display: 'flex',
      height: '500px'
    },
    studioColumn: {
      flex: 1,
      padding: '16px',
      overflow: 'auto',
      borderRight: '1px solid #ececec'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>CI</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>Content Intelligence Pipeline</div>
            <div style={{ fontSize: '12px', color: '#bef1ff' }}>OVHcloud Internal Tool</div>
          </div>
        </div>
        <nav style={styles.nav}>
          <button style={styles.navBtn(activeSection === 'sources')} onClick={() => setActiveSection('sources')}>
            Sources
          </button>
          <button style={styles.navBtn(activeSection === 'library')} onClick={() => setActiveSection('library')}>
            Bibliotheque
          </button>
          <button style={styles.navBtn(activeSection === 'studio')} onClick={() => setActiveSection('studio')}>
            Studio
          </button>
        </nav>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#bef1ff' }}>Articles total</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.transformed}</div>
            <div style={{ fontSize: '12px', color: '#bef1ff' }}>Transformes</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.totalWords?.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#bef1ff' }}>Mots total</div>
          </div>
          {stats.byLanguage?.slice(0, 4).map(l => (
            <div key={l.language} style={{ background: 'rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{l.count}</div>
              <div style={{ fontSize: '12px', color: '#bef1ff' }}>{l.language.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>

          {/* ========== SOURCES SECTION ========== */}
          {activeSection === 'sources' && (
            <>
              {/* Providers */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Sources de contenu</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {providers.map(provider => (
                    <div
                      key={provider.id}
                      style={styles.providerCard(selectedProvider === provider.id)}
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{provider.name}</div>
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {Object.keys(provider.base_urls || {}).map(l => l.toUpperCase()).join(' - ')}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        {provider.articles_count || 0} articles
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Collection */}
              {selectedProvider && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Nouvelle collecte</h3>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#808080', marginBottom: '8px' }}>Langue a collecter:</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {LANGUAGES.map(lang => {
                        const provider = providers.find(p => p.id === selectedProvider);
                        const hasUrl = provider?.base_urls?.[lang.code];
                        return (
                          <button
                            key={lang.code}
                            onClick={() => hasUrl && setSelectedScrapeLanguage(lang.code)}
                            disabled={!hasUrl}
                            style={{
                              ...styles.btn(selectedScrapeLanguage === lang.code ? 'primary' : 'outline', !hasUrl),
                              opacity: hasUrl ? 1 : 0.4
                            }}
                          >
                            {lang.flag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={startScraping}
                    disabled={isLoading}
                    style={{ ...styles.btn('success', isLoading), width: '100%' }}
                  >
                    {isLoading ? `Collecte en cours... ${progress.current}/${progress.total}` : 'Lancer la collecte'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ========== LIBRARY SECTION ========== */}
          {activeSection === 'library' && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Bibliotheque ({articles.length})</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={selectAllArticles} style={styles.btn('outline')}>
                    {selectedArticles.size === articles.length ? 'Deselectionner' : 'Tout selectionner'}
                  </button>
                  {selectedArticles.size > 0 && (
                    <button onClick={transformSelected} disabled={isLoading} style={styles.btn('success', isLoading)}>
                      Transformer ({selectedArticles.size})
                    </button>
                  )}
                </div>
              </div>

              {/* Language Tabs */}
              <div style={styles.langTabs}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    style={styles.langTab(selectedLanguage === lang.code, articleCounts[lang.code] || 0)}
                  >
                    {lang.flag} ({articleCounts[lang.code] || 0})
                  </button>
                ))}
              </div>

              {/* Articles List */}
              <div style={{ maxHeight: '450px', overflow: 'auto', border: '1px solid #ececec', borderRadius: '8px' }}>
                {articles.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#808080' }}>
                    Aucun article pour cette langue
                  </div>
                ) : (
                  articles.map(article => (
                    <div
                      key={article.id}
                      style={styles.articleRow(selectedArticles.has(article.id))}
                    >
                      <div
                        style={styles.checkbox(selectedArticles.has(article.id))}
                        onClick={() => toggleArticleSelection(article.id)}
                      >
                        {selectedArticles.has(article.id) && '✓'}
                      </div>
                      <div style={{ flex: 1 }} onClick={() => fetchArticleDetail(article.id)}>
                        <div style={{ fontWeight: '600', color: '#00185e', marginBottom: '4px' }}>
                          {article.transformed_title || article.original_title}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={styles.badge('#4d5592')}>{article.provider_name}</span>
                          <span style={styles.badge(article.status === 'transformed' ? '#268403' : '#808080')}>
                            {article.status}
                          </span>
                          <span style={{ fontSize: '12px', color: '#808080' }}>
                            {article.word_count?.toLocaleString()} mots
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========== STUDIO SECTION ========== */}
          {activeSection === 'studio' && (
            selectedArticle ? (
              <div style={styles.studioPanel}>
                <div style={styles.studioHeader}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#00185e', fontSize: '16px' }}>
                        {selectedArticle.transformed_title || selectedArticle.original_title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#808080', marginTop: '4px' }}>
                        {selectedArticle.provider_name} - {selectedArticle.language?.toUpperCase()} - {selectedArticle.word_count} mots
                      </div>
                    </div>
                    <button onClick={() => setActiveSection('library')} style={styles.btn('outline')}>
                      Retour
                    </button>
                  </div>
                </div>

                <div style={styles.studioContent}>
                  {/* Original */}
                  <div style={styles.studioColumn}>
                    <div style={{ fontWeight: '600', color: '#00185e', marginBottom: '12px', fontSize: '14px' }}>
                      ORIGINAL ({selectedArticle.provider_name})
                    </div>
                    <div
                      style={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(selectedArticle.original_content?.substring(0, 5000))
                      }}
                    />
                    {selectedArticle.original_content?.length > 5000 && (
                      <div style={{ color: '#808080', fontStyle: 'italic', marginTop: '8px' }}>
                        ... (contenu tronque)
                      </div>
                    )}
                  </div>

                  {/* Transformed */}
                  <div style={{ ...styles.studioColumn, borderRight: 'none', background: '#f8fff8' }}>
                    <div style={{ fontWeight: '600', color: '#268403', marginBottom: '12px', fontSize: '14px' }}>
                      TRANSFORME (OVHcloud)
                    </div>
                    {selectedArticle.transformed_content ? (
                      <>
                        <div
                          style={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(selectedArticle.transformed_content?.substring(0, 5000))
                          }}
                        />
                        {selectedArticle.transformed_content?.length > 5000 && (
                          <div style={{ color: '#808080', fontStyle: 'italic', marginTop: '8px' }}>
                            ... (contenu tronque)
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: '#808080', fontStyle: 'italic' }}>
                        Pas encore transforme
                      </div>
                    )}
                  </div>
                </div>

                {/* Translations */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid #ececec', background: '#f8f9fa' }}>
                  <div style={{ fontWeight: '600', color: '#00185e', marginBottom: '12px', fontSize: '14px' }}>
                    VERSIONS LINGUISTIQUES
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {LANGUAGES.map(lang => {
                      const hasTranslation = selectedArticle.translations?.some(t => t.language === lang.code);
                      const isCurrent = selectedArticle.language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => !hasTranslation && !isCurrent && translateArticle(lang.code)}
                          disabled={hasTranslation || isCurrent}
                          style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: hasTranslation || isCurrent ? 'default' : 'pointer',
                            background: isCurrent ? '#0050d7' : hasTranslation ? '#268403' : '#e0e0e0',
                            color: isCurrent || hasTranslation ? '#fff' : '#333',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        >
                          {lang.flag} {hasTranslation && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.card}>
                <div style={{ padding: '60px', textAlign: 'center', color: '#808080' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>Studio</div>
                  <p>Selectionnez un article dans la Bibliotheque pour le visualiser</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Logs Panel */}
        <div style={styles.rightPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontWeight: '600', color: '#bef1ff' }}>Logs</div>
            <button onClick={() => setLogs([])} style={{ ...styles.btn('outline'), padding: '4px 8px', fontSize: '11px' }}>
              Clear
            </button>
          </div>
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                En attente...
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={styles.log(log.type)}>
                  <span style={{ opacity: 0.6 }}>[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '24px', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', color: '#bef1ff', display: 'flex', justifyContent: 'space-between' }}>
        <span>Content Intelligence Pipeline v2.0</span>
        <span>OVHcloud Internal Tool</span>
      </div>
    </div>
  );
};

export default ContentPipeline;
