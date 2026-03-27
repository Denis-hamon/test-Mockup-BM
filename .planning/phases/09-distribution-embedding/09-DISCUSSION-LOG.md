# Phase 9: Distribution & Embedding - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-03-27
**Phase:** 09-distribution-embedding
**Areas discussed:** Widget embeddable, Pages hébergées avocat, Intégration & déploiement

---

## Widget embeddable

### Embed mode
| Option | Description | Selected |
|--------|-------------|----------|
| Shadow DOM inline | Script crée Shadow DOM, isolation CSS totale, pas d'iframe | ✓ |
| iframe embed | Iframe vers /intake/[slug] | |

### Display mode
| Option | Description | Selected |
|--------|-------------|----------|
| Modal (bouton flottant) | Bouton bas-droite, modal overlay, pattern Intercom | ✓ |
| Inline embed | Formulaire dans un div désigné | |
| Les deux modes | data-mode='modal' ou 'inline' | |

### Configuration
| Option | Description | Selected |
|--------|-------------|----------|
| Attributs data-* | data-slug, data-lang, data-color sur le script tag | ✓ |
| Objet JS global | window.LegalConnect = {...} | |

---

## Pages hébergées avocat

### Structure
| Option | Description | Selected |
|--------|-------------|----------|
| Landing page + intake | Présentation cabinet + CTA vers formulaire | ✓ |
| Intake direct | Formulaire directement | |
| Redirect | /cabinet-dupont → /intake/slug | |

### SEO
| Option | Description | Selected |
|--------|-------------|----------|
| Meta tags dynamiques | Title, description, OG image depuis profil avocat | ✓ |
| Meta tags génériques | Mêmes meta partout | |

---

## Intégration & déploiement

### Distribution widget JS
| Option | Description | Selected |
|--------|-------------|----------|
| Self-hosted /widget.js | Même domaine, pas de CDN tiers | ✓ |
| CDN externe | npm + unpkg/jsdelivr | |

### Documentation
| Option | Description | Selected |
|--------|-------------|----------|
| Page in-app + snippet copiable | /settings/cabinet/integration, 3 étapes, preview | ✓ |
| Documentation externe | Notion/GitBook séparé | |

---

## Claude's Discretion
- Architecture build Vite IIFE
- Communication Shadow DOM → API
- Cache/versioning widget.js
- OG image generation
- Responsive bouton flottant

## Deferred Ideas
- Widget iframe fallback
- Mode inline embed
- CDN externe
- Analytics widget
- A/B testing landing
- Multi-langue widget
