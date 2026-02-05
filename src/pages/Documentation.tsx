import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Rocket,
  FolderKanban,
  Rss,
  FileText,
  Sparkles,
  Languages,
  Target,
  BarChart3,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Globe,
  Brain,
  Clock,
  Filter,
  Download,
  Trash2,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react";

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Documentation</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Guide complet pour utiliser Content Pipeline OVHcloud
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <Card className="lg:col-span-1 h-fit sticky top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <nav className="space-y-1 p-4 pt-0">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.title}
                  </button>
                ))}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === "getting-started" && <GettingStarted />}
          {activeSection === "authentication" && <AuthenticationSection />}
          {activeSection === "projects" && <ProjectsSection />}
          {activeSection === "collection-points" && <CollectionPointsSection />}
          {activeSection === "content-repository" && <ContentRepositorySection />}
          {activeSection === "article-editor" && <ArticleEditorSection />}
          {activeSection === "ai-transformation" && <AITransformationSection />}
          {activeSection === "relevance-scoring" && <RelevanceScoringSection />}
          {activeSection === "translations" && <TranslationsSection />}
          {activeSection === "live-monitor" && <LiveMonitorSection />}
          {activeSection === "reporting" && <ReportingSection />}
          {activeSection === "settings" && <SettingsSection />}
          {activeSection === "faq" && <FAQSection />}
        </div>
      </div>
    </div>
  );
}

const sections = [
  { id: "getting-started", title: "Prise en main", icon: Rocket },
  { id: "authentication", title: "Authentification", icon: Settings },
  { id: "projects", title: "Projets", icon: FolderKanban },
  { id: "collection-points", title: "Points de collecte", icon: Rss },
  { id: "content-repository", title: "Repository", icon: FileText },
  { id: "article-editor", title: "Éditeur d'article", icon: FileText },
  { id: "ai-transformation", title: "Transformation IA", icon: Sparkles },
  { id: "relevance-scoring", title: "Score de pertinence", icon: Target },
  { id: "translations", title: "Traductions", icon: Languages },
  { id: "live-monitor", title: "Live Monitor", icon: Zap },
  { id: "reporting", title: "Reporting", icon: BarChart3 },
  { id: "settings", title: "Paramètres", icon: Settings },
  { id: "faq", title: "FAQ", icon: AlertCircle },
];

function GettingStarted() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Bienvenue sur Content Pipeline
          </CardTitle>
          <CardDescription>
            Plateforme de collecte, transformation et gestion de contenu alimentée par l'IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>
            Content Pipeline est une solution complète pour automatiser votre workflow de contenu :
            collecte automatique depuis des sources RSS/web, transformation par IA, scoring de pertinence,
            traduction multilingue et publication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                Créer un projet
              </h4>
              <p className="text-sm text-muted-foreground">
                Organisez votre contenu par thématique ou client. Définissez l'intention du projet pour le scoring IA.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                Configurer les sources
              </h4>
              <p className="text-sm text-muted-foreground">
                Ajoutez des points de collecte (RSS, sites web) pour alimenter automatiquement votre repository.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
                Transformer avec l'IA
              </h4>
              <p className="text-sm text-muted-foreground">
                L'IA Llama 3.3 réécrit vos articles selon vos guidelines : ton, style, structure, SEO.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">4</span>
                Publier
              </h4>
              <p className="text-sm text-muted-foreground">
                Exportez vos contenus transformés et traduits vers vos plateformes de publication.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
              <Brain className="h-4 w-4" />
              Propulsé par OVHcloud AI Endpoints
            </h4>
            <p className="text-sm text-muted-foreground">
              Cette plateforme utilise Llama 3.3 70B hébergé sur OVHcloud AI Endpoints pour la transformation
              et le scoring de pertinence. Vos données restent en Europe et sont traitées en toute confidentialité.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline de traitement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <Badge variant="outline" className="py-2 px-4">
              <Rss className="h-4 w-4 mr-2" />
              Collecte
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="py-2 px-4">
              <Target className="h-4 w-4 mr-2" />
              Scoring
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="py-2 px-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Transformation
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="py-2 px-4">
              <Languages className="h-4 w-4 mr-2" />
              Traduction
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="py-2 px-4">
              <Globe className="h-4 w-4 mr-2" />
              Publication
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthenticationSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Authentification
          </CardTitle>
          <CardDescription>
            Accès sécurisé réservé aux utilisateurs OVHcloud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Content Pipeline est accessible uniquement aux employés OVHcloud. L'inscription
            est réservée aux adresses email @ovhcloud.com avec vérification par email obligatoire.
          </p>

          <h4 className="font-semibold">Créer un compte</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Accédez à la page d'inscription</li>
            <li>Entrez votre email @ovhcloud.com et un mot de passe (8 caractères min.)</li>
            <li>Un email de confirmation est envoyé automatiquement</li>
            <li>Cliquez sur le lien dans l'email pour activer votre compte</li>
            <li>Connectez-vous avec vos identifiants</li>
          </ol>

          <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <h5 className="font-medium flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
              Vérification par email
            </h5>
            <p className="text-sm text-muted-foreground mt-1">
              Pour des raisons de sécurité, chaque nouveau compte doit être vérifié par email.
              Le lien de confirmation expire après 24 heures. Si vous n'avez pas reçu l'email,
              vérifiez vos spams ou utilisez le bouton "Renvoyer l'email" sur la page de connexion.
            </p>
          </div>

          <h4 className="font-semibold mt-6">Restrictions d'accès</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Domaine autorisé</strong> : @ovhcloud.com uniquement</li>
            <li><strong>Mot de passe</strong> : 8 caractères minimum</li>
            <li><strong>Session</strong> : Expiration automatique après 24h d'inactivité</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Gestion des Projets
          </CardTitle>
          <CardDescription>
            Organisez votre contenu par projet pour une meilleure gestion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">Créer un projet</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Accédez à la page <strong>Projects</strong> depuis le menu</li>
            <li>Cliquez sur <strong>New Project</strong></li>
            <li>Renseignez le nom et la description du projet</li>
            <li>Choisissez une couleur et une icône pour l'identifier</li>
            <li>Définissez les langues cibles pour les traductions</li>
          </ol>

          <h4 className="font-semibold mt-6">Intention du projet</h4>
          <p className="text-sm text-muted-foreground">
            L'intention du projet est cruciale pour le scoring de pertinence. Elle décrit le type de contenu
            recherché et permet à l'IA d'évaluer si un article correspond à vos objectifs.
          </p>
          <div className="p-3 rounded-lg bg-muted text-sm">
            <strong>Exemple d'intention :</strong><br />
            "Articles sur le cloud computing, l'infrastructure IT et les solutions OVHcloud pour les entreprises.
            Focus sur les cas d'usage techniques et les tutoriels pratiques pour développeurs et DevOps."
          </div>

          <h4 className="font-semibold mt-6">Navigation dans un projet</h4>
          <p className="text-sm text-muted-foreground">
            Chaque projet donne accès à trois sous-sections :
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Collection Points</strong> - Gérer les sources de contenu</li>
            <li><strong>Live Monitor</strong> - Suivre les jobs en cours</li>
            <li><strong>Repository</strong> - Voir et gérer tous les articles</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function CollectionPointsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rss className="h-5 w-5" />
            Points de Collecte
          </CardTitle>
          <CardDescription>
            Configurez vos sources de contenu automatiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">Ajouter un point de collecte</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Dans un projet, accédez à <strong>Collection Points</strong></li>
            <li>Cliquez sur <strong>Add Provider</strong></li>
            <li>Configurez les paramètres :</li>
          </ol>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded-lg border">
              <h5 className="font-medium mb-2">Informations de base</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Nom</strong> - Identifiant du provider</li>
                <li><strong>URL de base</strong> - Site source par langue</li>
                <li><strong>Slug</strong> - Identifiant unique</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg border">
              <h5 className="font-medium mb-2">Configuration avancée</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Profondeur</strong> - Niveaux de crawl</li>
                <li><strong>Patterns d'URL</strong> - Filtrage des pages</li>
                <li><strong>Sélecteurs</strong> - Extraction du contenu</li>
              </ul>
            </div>
          </div>

          <h4 className="font-semibold mt-6">Lancer une collecte</h4>
          <p className="text-sm text-muted-foreground">
            Cliquez sur le bouton <strong>Play</strong> d'un provider pour démarrer la collecte.
            Le job apparaîtra dans le Live Monitor où vous pourrez suivre sa progression.
          </p>

          <h4 className="font-semibold mt-6">Méthodes de scraping</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Trois méthodes de collecte sont disponibles selon le site source :
          </p>
          <div className="space-y-2 text-sm">
            <div className="p-2 rounded border">
              <strong>Firecrawl</strong> - Service de scraping cloud (recommandé par défaut)
            </div>
            <div className="p-2 rounded border">
              <strong>Direct HTTP</strong> - Requêtes HTTP simples pour sites statiques
            </div>
            <div className="p-2 rounded border">
              <strong>Playwright</strong> - Navigateur headless pour sites avec JavaScript
            </div>
          </div>

          <h4 className="font-semibold mt-6">JavaScript Rendering</h4>
          <p className="text-sm text-muted-foreground">
            Activez cette option pour les sites qui nécessitent l'exécution de JavaScript
            pour afficher leur contenu (Single Page Applications, contenu dynamique).
          </p>

          <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 mt-4">
            <h5 className="font-medium flex items-center gap-2 text-blue-600">
              <Zap className="h-4 w-4" />
              Auto-Switch intelligent
            </h5>
            <p className="text-sm text-muted-foreground mt-1">
              Si la collecte détecte une protection anti-bot (Cloudflare, DDoS protection) après
              3 échecs consécutifs, le système bascule automatiquement vers Playwright avec
              JavaScript Rendering pour contourner la protection.
            </p>
          </div>

          <h4 className="font-semibold mt-6">Options automatiques</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Auto-Transform</strong> - Transforme automatiquement les articles collectés</li>
            <li><strong>Auto-Translate</strong> - Traduit automatiquement après transformation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentRepositorySection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Repository
          </CardTitle>
          <CardDescription>
            Gérez tous vos articles collectés et transformés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">Vue d'ensemble</h4>
          <p className="text-sm text-muted-foreground">
            Le repository affiche tous les articles avec leur statut dans le pipeline :
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border text-center">
              <div className="text-2xl font-bold text-muted-foreground">Collected</div>
              <p className="text-xs text-muted-foreground">Articles bruts</p>
            </div>
            <div className="p-3 rounded-lg border text-center">
              <div className="text-2xl font-bold text-yellow-600">Transformed</div>
              <p className="text-xs text-muted-foreground">Réécrits par IA</p>
            </div>
            <div className="p-3 rounded-lg border text-center">
              <div className="text-2xl font-bold text-green-600">To Publish</div>
              <p className="text-xs text-muted-foreground">Prêts à publier</p>
            </div>
          </div>

          <h4 className="font-semibold mt-6">Actions rapides</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-600" />
              <span><strong>Transform</strong> - Réécrit l'article avec l'IA</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span><strong>To Publish</strong> - Marque l'article prêt à publier et lance la traduction</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span><strong>Score</strong> - Évalue la pertinence avec l'IA</span>
            </div>
          </div>

          <h4 className="font-semibold mt-6">Rubrique (Tag)</h4>
          <p className="text-sm text-muted-foreground">
            Chaque article peut avoir une rubrique associée pour déterminer dans quelle catégorie
            il sera publié. Cliquez sur la rubrique dans le détail d'un article pour la modifier.
            Exemples : "Tech", "Cloud", "Tutoriel", "Actualités", etc.
          </p>

          <h4 className="font-semibold mt-6">Actions batch</h4>
          <p className="text-sm text-muted-foreground">
            Sélectionnez plusieurs articles avec les cases à cocher pour effectuer des actions en masse :
            Transform, Translate, Score ou Delete.
          </p>

          <h4 className="font-semibold mt-6">Filtres disponibles</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline"><Filter className="h-3 w-3 mr-1" /> Statut</Badge>
            <Badge variant="outline"><Filter className="h-3 w-3 mr-1" /> Langue</Badge>
            <Badge variant="outline"><Filter className="h-3 w-3 mr-1" /> Provider</Badge>
            <Badge variant="outline"><Filter className="h-3 w-3 mr-1" /> Date</Badge>
            <Badge variant="outline"><Filter className="h-3 w-3 mr-1" /> Longueur</Badge>
            <Badge variant="outline"><Filter className="h-3 w-3 mr-1" /> Pertinence</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArticleEditorSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Éditeur d'article
          </CardTitle>
          <CardDescription>
            Éditeur riche avec support des code snippets et assistance IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            L'éditeur d'article offre une expérience de rédaction complète avec formatage riche,
            insertion de code avec coloration syntaxique, et assistance IA intégrée.
          </p>

          <h4 className="font-semibold">Commandes slash (/)</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Tapez <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">/</kbd> pour accéder aux commandes rapides :
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <div className="p-2 rounded border"><strong>/text</strong> - Paragraphe</div>
            <div className="p-2 rounded border"><strong>/heading1-3</strong> - Titres</div>
            <div className="p-2 rounded border"><strong>/bullet</strong> - Liste à puces</div>
            <div className="p-2 rounded border"><strong>/numbered</strong> - Liste numérotée</div>
            <div className="p-2 rounded border"><strong>/quote</strong> - Citation</div>
            <div className="p-2 rounded border"><strong>/code</strong> - Bloc de code</div>
          </div>

          <h4 className="font-semibold mt-6">Code Snippets</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Insérez des blocs de code avec coloration syntaxique. Langages supportés :
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">JavaScript</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">Python</Badge>
            <Badge variant="outline">Bash/Shell</Badge>
            <Badge variant="outline">SQL</Badge>
            <Badge variant="outline">YAML</Badge>
            <Badge variant="outline">JSON</Badge>
            <Badge variant="outline">HTML/CSS</Badge>
            <Badge variant="outline">PHP</Badge>
            <Badge variant="outline">Go</Badge>
            <Badge variant="outline">Rust</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Utilisez le bouton <strong>Code</strong> dans la barre d'outils pour choisir le langage,
            ou tapez <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">/javascript</kbd>,
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">/python</kbd>, etc.
          </p>

          <h4 className="font-semibold mt-6">Assistance IA</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Sélectionnez du texte pour accéder au menu IA avec les actions :
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 rounded border">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Améliorer l'écriture</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Corriger grammaire</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border">
              <ArrowRight className="h-4 w-4 text-blue-500" />
              <span>Raccourcir / Allonger</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border">
              <FileText className="h-4 w-4 text-orange-500" />
              <span>Simplifier</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border">
              <Languages className="h-4 w-4 text-indigo-500" />
              <span>Traduire</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border">
              <FileText className="h-4 w-4 text-cyan-500" />
              <span>Convertir en code</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 mt-4">
            <h5 className="font-medium flex items-center gap-2 text-yellow-600">
              <Zap className="h-4 w-4" />
              Raccourcis clavier
            </h5>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
              <div><kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">⌘S</kbd> Sauvegarder</div>
              <div><kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">⌘B</kbd> Gras</div>
              <div><kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">⌘I</kbd> Italique</div>
              <div><kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">⌘U</kbd> Souligné</div>
              <div><kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">⌘K</kbd> Lien</div>
              <div><kbd className="px-1 py-0.5 rounded bg-muted font-mono text-xs">⌘E</kbd> Code inline</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AITransformationSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Transformation IA
          </CardTitle>
          <CardDescription>
            Réécriture automatique de vos contenus avec Llama 3.3
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La transformation IA réécrit vos articles collectés selon vos guidelines.
            Le modèle Llama 3.3 70B d'OVHcloud AI Endpoints génère un contenu unique, optimisé SEO
            et adapté à votre audience.
          </p>

          <h4 className="font-semibold">Ce que fait la transformation</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Réécriture complète du contenu</li>
            <li>Optimisation de la structure (H1 unique, H2/H3 pour sections)</li>
            <li>Paragraphes courts et aérés (2-4 phrases max)</li>
            <li><strong>Suppression automatique des hyperliens</strong></li>
            <li><strong>Détection et formatage des blocs de code</strong></li>
            <li>Ajout d'un résumé TL;DR</li>
            <li>Ajout d'un disclaimer si configuré</li>
            <li>Optimisation SEO (mots-clés, méta-description)</li>
          </ul>

          <h4 className="font-semibold mt-6">Règles de formatage éditorial</h4>
          <div className="p-3 rounded-lg bg-muted text-sm space-y-2">
            <p><strong>Structure HTML :</strong></p>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              <li>Un seul H1 (titre principal)</li>
              <li>2-4 H2 pour les sections principales</li>
              <li>H3 pour les sous-sections si nécessaire</li>
              <li>Pas de H4, H5, H6</li>
            </ul>
            <p className="mt-2"><strong>Nettoyage automatique :</strong></p>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              <li>Suppression de tous les hyperliens (texte conservé)</li>
              <li>Suppression des paramètres de tracking (UTM, etc.)</li>
              <li>Pas de listes à puces excessives</li>
              <li>Pas de syntaxe markdown (**, __, []())</li>
            </ul>
          </div>

          <h4 className="font-semibold mt-6">Blocs de code</h4>
          <p className="text-sm text-muted-foreground">
            L'IA détecte automatiquement les blocs de code dans le contenu source et les formate
            correctement avec le langage approprié (bash, python, javascript, sql, yaml, etc.).
            Les commandes terminal, exemples de configuration et snippets de code sont préservés intacts.
          </p>

          <h4 className="font-semibold mt-6">Configurer les guidelines</h4>
          <p className="text-sm text-muted-foreground">
            Dans les paramètres du projet, vous pouvez définir des guidelines IA :
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Ton</strong> - Formel, professionnel, casual, technique</li>
            <li><strong>Audience</strong> - Développeurs, décideurs, grand public</li>
            <li><strong>Style</strong> - Concis, détaillé, conversationnel</li>
            <li><strong>Brand voice</strong> - Identité de marque à respecter</li>
            <li><strong>Mots-clés</strong> - Termes SEO à inclure</li>
          </ul>

          <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 mt-4">
            <h5 className="font-medium flex items-center gap-2 text-yellow-600">
              <Clock className="h-4 w-4" />
              Temps de traitement
            </h5>
            <p className="text-sm text-muted-foreground mt-1">
              Chaque article prend environ 10-20 secondes à transformer.
              Pour de grands volumes, utilisez le batch processing et surveillez le Live Monitor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RelevanceScoringSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Score de Pertinence
          </CardTitle>
          <CardDescription>
            Évaluez automatiquement la pertinence de vos articles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le scoring de pertinence utilise Llama 3.3 pour évaluer si un article correspond
            à l'intention de votre projet. Cela vous aide à identifier rapidement le contenu
            à garder ou à supprimer.
          </p>

          <h4 className="font-semibold">Échelle de scoring</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded bg-green-500/10">
              <Badge className="bg-green-500">80-100%</Badge>
              <span className="text-sm">Très pertinent - À garder</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded bg-blue-500/10">
              <Badge className="bg-blue-500">60-79%</Badge>
              <span className="text-sm">Pertinent - Recommandé</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded bg-yellow-500/10">
              <Badge className="bg-yellow-500">40-59%</Badge>
              <span className="text-sm">Modéré - À revoir</span>
            </div>
            <div className="flex items-center gap-3 p-2 rounded bg-red-500/10">
              <Badge className="bg-red-500">0-39%</Badge>
              <span className="text-sm">Peu pertinent - À supprimer</span>
            </div>
          </div>

          <h4 className="font-semibold mt-6">Comment scorer</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Définissez l'intention du projet (obligatoire)</li>
            <li>Dans le Repository, cliquez sur <strong>Relevance AI</strong></li>
            <li>Cliquez sur <strong>Score Articles</strong> pour lancer le scoring</li>
            <li>Ou sélectionnez des articles et utilisez le bouton <strong>Score</strong></li>
            <li>Ou cliquez sur l'icône <Target className="h-3 w-3 inline" /> d'un article individuel</li>
          </ol>

          <h4 className="font-semibold mt-6">Filtrer par pertinence</h4>
          <p className="text-sm text-muted-foreground">
            Utilisez le filtre "Relevance" dans les filtres avancés pour afficher uniquement
            les articles d'un certain niveau de pertinence. Vous pouvez aussi trier par
            "Most Relevant" ou "Least Relevant".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TranslationsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Traductions
          </CardTitle>
          <CardDescription>
            Traduisez vos contenus dans plusieurs langues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La traduction automatique utilise Llama 3.3 pour traduire vos articles transformés
            dans les langues cibles définies dans votre projet.
          </p>

          <h4 className="font-semibold">Langues supportées</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">FR - Français</Badge>
            <Badge variant="outline">EN - English</Badge>
            <Badge variant="outline">DE - Deutsch</Badge>
            <Badge variant="outline">ES - Español</Badge>
            <Badge variant="outline">IT - Italiano</Badge>
            <Badge variant="outline">PT - Português</Badge>
            <Badge variant="outline">NL - Nederlands</Badge>
            <Badge variant="outline">PL - Polski</Badge>
          </div>

          <h4 className="font-semibold mt-6">Processus de traduction</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>L'article doit d'abord être transformé (statut "transformed")</li>
            <li>Cliquez sur <strong>Translate</strong> pour lancer la traduction</li>
            <li>L'article sera traduit dans toutes les langues cibles du projet</li>
            <li>Les traductions apparaissent dans le détail de l'article</li>
          </ol>

          <h4 className="font-semibold mt-6">Configurer les langues cibles</h4>
          <p className="text-sm text-muted-foreground">
            Dans les paramètres du projet, définissez les langues dans lesquelles
            vous souhaitez traduire vos contenus. La langue par défaut est celle
            de la source collectée.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LiveMonitorSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Live Monitor
          </CardTitle>
          <CardDescription>
            Suivez vos jobs de collecte et de traitement en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le Live Monitor affiche tous les jobs en cours : collecte de contenu,
            transformation IA et traduction. Suivez la progression et gérez vos jobs.
          </p>

          <h4 className="font-semibold">Types de jobs</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded border">
              <Rss className="h-4 w-4 text-blue-500" />
              <div>
                <span className="font-medium">Scraping Jobs</span>
                <p className="text-xs text-muted-foreground">Collecte de contenu depuis les sources</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded border">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <div>
                <span className="font-medium">Pipeline Jobs</span>
                <p className="text-xs text-muted-foreground">Transformation et traduction IA</p>
              </div>
            </div>
          </div>

          <h4 className="font-semibold mt-6">Actions disponibles</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              <span>Reprendre un job en pause</span>
            </div>
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-yellow-500" />
              <span>Mettre en pause</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <span>Redémarrer un job</span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Annuler/Archiver</span>
            </div>
          </div>

          <h4 className="font-semibold mt-6">Diagnostics</h4>
          <p className="text-sm text-muted-foreground">
            En cas d'erreur, cliquez sur un job pour voir les détails et les logs.
            Le système affiche les URLs en échec et les recommandations pour résoudre les problèmes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportingSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reporting
          </CardTitle>
          <CardDescription>
            Analysez vos métriques de contenu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le dashboard de reporting vous donne une vue d'ensemble de votre activité :
            volume d'articles, répartition par statut, tendances et performance par provider.
          </p>

          <h4 className="font-semibold">Métriques disponibles</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Total d'articles par projet</li>
            <li>Répartition par statut (collected, transformed, etc.)</li>
            <li>Volume de mots traités</li>
            <li>Articles par provider</li>
            <li>Tendances sur 30 jours</li>
            <li>Taux de succès des collectes</li>
          </ul>

          <h4 className="font-semibold mt-6">Export</h4>
          <p className="text-sm text-muted-foreground">
            Exportez vos articles en CSV depuis le Repository pour les analyser
            dans vos outils de BI ou les importer dans d'autres systèmes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres
          </CardTitle>
          <CardDescription>
            Configurez votre instance Content Pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">Paramètres globaux</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Auto-Transform</strong> - Active la transformation automatique après collecte</li>
            <li><strong>Auto-Translate</strong> - Active la traduction automatique après transformation</li>
            <li><strong>API OVH AI</strong> - Configuration des endpoints IA</li>
            <li><strong>Firecrawl</strong> - Configuration du service de scraping</li>
          </ul>

          <h4 className="font-semibold mt-6">Paramètres par projet</h4>
          <p className="text-sm text-muted-foreground">
            Chaque projet peut avoir ses propres paramètres :
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Intention du projet (pour le scoring)</li>
            <li>Guidelines IA (ton, style, audience)</li>
            <li>Langues cibles pour la traduction</li>
            <li>Mots-clés SEO</li>
            <li>Disclaimer personnalisé</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function FAQSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Questions fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Pourquoi mes transformations échouent ?</AccordionTrigger>
              <AccordionContent>
                Les erreurs 403 indiquent généralement un problème de clé API OVH AI.
                Vérifiez que votre token est valide et non expiré. Les erreurs 429
                signifient un rate limiting - attendez quelques minutes avant de réessayer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Comment améliorer la qualité des transformations ?</AccordionTrigger>
              <AccordionContent>
                Configurez des guidelines IA détaillées dans les paramètres du projet :
                ton, audience cible, style d'écriture, mots-clés à utiliser. Plus vos
                instructions sont précises, meilleur sera le résultat.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Comment fonctionne le scoring de pertinence ?</AccordionTrigger>
              <AccordionContent>
                Le scoring compare le contenu de chaque article à l'intention définie
                pour votre projet. L'IA évalue la correspondance thématique, les mots-clés
                présents et la pertinence globale pour donner un score de 0 à 100%.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Puis-je scorer tous mes articles en une fois ?</AccordionTrigger>
              <AccordionContent>
                Oui ! Dans le Repository, cliquez sur "Relevance AI" puis "Score Articles"
                pour scorer tous les articles non-scorés. Vous pouvez aussi sélectionner
                plusieurs articles et utiliser le bouton "Score" de la barre d'actions.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Comment exporter mes articles ?</AccordionTrigger>
              <AccordionContent>
                Dans le Repository, cliquez sur "Export CSV" en haut à droite.
                Vous pouvez filtrer les articles avant l'export pour n'exporter
                que ceux qui vous intéressent (par statut, langue, provider, etc.).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>Quelle est la différence entre Transform et Translate ?</AccordionTrigger>
              <AccordionContent>
                <strong>Transform</strong> réécrit l'article dans sa langue originale selon vos
                guidelines (ton, style, structure). <strong>Translate</strong> traduit l'article
                transformé dans les langues cibles définies dans le projet.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>Mes données sont-elles sécurisées ?</AccordionTrigger>
              <AccordionContent>
                Oui. L'IA est hébergée sur OVHcloud AI Endpoints en Europe. Vos données
                ne quittent pas l'infrastructure OVHcloud et ne sont pas utilisées pour
                entraîner des modèles. La base de données est également hébergée sur OVHcloud.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger>Ma collecte échoue avec "Bot protection détectée"</AccordionTrigger>
              <AccordionContent>
                Certains sites utilisent des protections anti-bot (Cloudflare, DDoS Guard).
                Le système bascule automatiquement vers Playwright avec JavaScript Rendering
                après 3 échecs consécutifs. Vous pouvez aussi activer manuellement "JavaScript
                Rendering" dans la configuration du point de collecte. Un diagnostic détaillé
                est disponible dans le panneau de l'article pour identifier la cause exacte.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-9">
              <AccordionTrigger>À quoi sert la rubrique d'un article ?</AccordionTrigger>
              <AccordionContent>
                La rubrique (tag) permet de catégoriser vos articles pour la publication.
                Elle indique dans quelle section ou catégorie l'article devrait être publié
                sur votre site. Vous pouvez la modifier en cliquant dessus dans le détail
                de l'article. Exemples : "Tech", "Cloud", "Tutoriel", "Actualités".
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
