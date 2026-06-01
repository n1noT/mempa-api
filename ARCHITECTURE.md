# Architecture MEMPA API

## Vue d'ensemble
L'API MEMPA est construite avec Node.js et Express. Elle suit une architecture RESTful et utilise Prisma comme ORM pour interagir avec une base de données PostgreSQL.

## Structure du projet
- `bin/www` : Point d'entrée du serveur HTTP.
- `app.js` : Configuration globale de l'application (middlewares, routes principales).
- `routes/` : Contient les définitions des endpoints par ressource.
- `prisma/` :
  - `schema.prisma` : Modèle de données.
  - `client.js` : Instance partagée du Prisma Client.
- `generated/prisma` : Client Prisma généré à partir du schéma.

## Flux de données
1. **Requête HTTP** : Reçue par le serveur (ex: `GET /playlists`).
2. **Router Express** : Oriente la requête vers le contrôleur/route approprié dans `routes/`.
3. **Logique métier & ORM** : La route utilise `prisma/client.js` pour interagir avec PostgreSQL.
4. **Réponse JSON** : Les données sont renvoyées au format JSON avec le code HTTP approprié.

## Tests
Les tests d'intégration sont situés dans `tests/` et utilisent Jest et Supertest. La base de données est mockée pour les tests unitaires.
