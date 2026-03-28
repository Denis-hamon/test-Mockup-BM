# LegalConnect - Guide de deploiement v0

## 1. Prerequis

- Docker et Docker Compose v2+
- Node.js 22+ (pour le seed uniquement)
- pnpm 10+
- Acces au serveur `ubuntu@141.95.99.214`

## 2. Configuration

```bash
cp .env.example .env
```

Editez `.env` et renseignez :

| Variable | Comment l'obtenir |
|----------|-------------------|
| `POSTGRES_PASSWORD` | Choisir un mot de passe fort |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Token OVH AI Endpoints (voir ci-dessous) |
| `OPENAI_BASE_URL` | URL du modele choisi dans le catalogue OVH |
| `OVH_S3_ACCESS_KEY` | Depuis la console OVHcloud Public Cloud > Object Storage |
| `OVH_S3_SECRET_KEY` | Idem |
| `CRON_SECRET` | `openssl rand -base64 32` |

### OVH AI Endpoints

1. Allez sur le [catalogue AI Endpoints](https://www.ovhcloud.com/en/public-cloud/ai-endpoints/catalog/)
2. Choisissez un modele (ex: Qwen 2.5 72B Instruct)
3. Generez un token d'acces
4. Copiez l'URL du endpoint dans `OPENAI_BASE_URL`
5. Copiez le token dans `OPENAI_API_KEY`

Le SDK utilise `AI_PROVIDER=openai` car les endpoints OVH sont compatibles OpenAI.

## 3. Ajouter le mode standalone

Avant de builder, ajoutez `output: "standalone"` dans `apps/web/next.config.ts` :

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@legalconnect/shared",
    "@legalconnect/crypto",
    "@legalconnect/email",
  ],
};
```

Cet ajout est necessaire pour que le Dockerfile produise un build autonome.

## 4. Demarrage

```bash
docker compose up -d
```

Verifiez que les services sont sains :

```bash
docker compose ps
```

Les 3 services (db, valkey, web) doivent afficher `healthy`.

Consultez les logs en cas de probleme :

```bash
docker compose logs web
docker compose logs db
```

## 5. Seed (donnees de test)

Depuis la racine du monorepo :

```bash
pnpm install
npx tsx scripts/seed.ts
```

Le script applique le schema Drizzle puis insere les donnees de test.

### Comptes de test

| Role | Email | Mot de passe |
|------|-------|-------------|
| Avocat | `avocat@test.legalconnect.fr` | `Test1234!` |
| Client | `client@test.legalconnect.fr` | `Test1234!` |

### Donnees creees

- **Avocat** : Me Sophie Martin (Cabinet Martin & Associes)
- **Client** : Jean Dupont
- **3 templates** : famille, travail, penal
- **1 dossier** : divorce amiable (statut: soumis)
- **1 resume IA** : synthese automatique du dossier

## 6. Verification

1. Ouvrez `http://141.95.99.214:3000` (ou `http://localhost:3000` en local)
2. Connectez-vous avec `avocat@test.legalconnect.fr` / `Test1234!`
3. Le dashboard doit afficher 1 dossier (Jean Dupont - famille)
4. Connectez-vous avec `client@test.legalconnect.fr` / `Test1234!`
5. Le dossier soumis doit etre visible
