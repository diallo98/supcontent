# supcontent
Projet de fin d'année
Réseau social de critiques de films, type Letterboxd, développé avec React et Node.js/Express.

## Fonctionnalités

- Authentification (JWT + Google OAuth2 via Passport.js)
- Profils utilisateurs (avatar uploadable, galerie d'avatars prédéfinis, bio)
- Fiches médias via l'API TMDB (films, affiches, bandes-annonces)
- Notes, critiques, commentaires et likes
- Listes personnelles et publiques de films
- Recherche avancée (titre, genre, année, listes publiques)
- Fil d'actualité (activité des utilisateurs suivis)
- Système d'abonnements (suivre/ne plus suivre)
- Messagerie privée entre utilisateurs qui se suivent mutuellement
- Notifications in-app (follow, like, commentaire)
- Modération et rôles (admin)
- Thème clair/sombre
- Export des données personnelles (RGPD) en JSON/CSV

## Stack technique

**Backend**
- Node.js, Express
- Prisma v5 (ORM) + PostgreSQL
- bcrypt (hash mots de passe)
- JWT (authentification)
- Passport.js (Google OAuth2)
- express-validator, express-rate-limit
- Multer (upload avatars)
- Axios (appels API TMDB)

**Frontend**
- React + Vite
- React Router
- Context API (Auth, Theme)
- react-markdown
- Styles inline (JSX)

**Base de données**
- PostgreSQL via Docker

**API externe**
- TMDB (The Movie Database)

## Prérequis

- Node.js 18+
- Docker et Docker Compose
- Une clé API TMDB (https://www.themoviedb.org/settings/api)

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/diallo98/supcontent.git
cd supcontent
```

### 2. Variables d'environnement

Créer un fichier `.env` dans `backend/` avec :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/supcontent"
JWT_SECRET="votre_secret_jwt"
TMDB_API_KEY="votre_cle_tmdb"
GOOGLE_CLIENT_ID="votre_client_id_google"
GOOGLE_CLIENT_SECRET="votre_secret_google"
PORT=3000
```

### 3. Lancer la base de données

```bash
docker compose up -d
```

### 4. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

Le serveur démarre sur `http://localhost:3000`.

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

## Architecture
supcontent/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   └── app.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── uploads/
│       └── avatars/
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── services/
└── docker-compose.yml

## Sécurité

- Mots de passe hashés avec bcrypt
- Authentification par JWT
- Rate limiting sur les routes d'authentification
- Validation des entrées avec express-validator
- Le client ne contacte jamais TMDB directement, tout passe par le backend

## Points d'attention techniques

- Les routes `/genres` et `/:id/videos` sont placées avant `/:id` dans `mediaRoutes.js` (sinon Express interprète "genres" comme un ID)
- Le modèle `List` n'a pas de champ `createdAt` : le tri se fait sur `id`
- `[data-theme="light"]` surcharge les variables CSS `:root` pour le thème clair

## Documentation

- `SUPCONTENT_Documentation_Technique.docx` — installation, déploiement, choix techniques, diagrammes UML, schéma BDD, référence API REST, sécurité
- `SUPCONTENT_Manuel_Utilisateur.docx` — guide utilisateur complet

## Auteur

Souleymane Diallo — [github.com/diallo98/supcontent](https://github.com/diallo98/supcontent)