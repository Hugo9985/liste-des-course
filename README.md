# 🛒 Courses Ensemble — PWA collaborative

## 1. Créer le projet Firebase (gratuit)
1. https://console.firebase.google.com → **Ajouter un projet**.
2. **Authentication** → Commencer → activer **Adresse e-mail / Mot de passe**.
3. **Firestore Database** → Créer (mode production, région `eur3`).
4. **Paramètres du projet** → *Vos applications* → icône **Web `</>`** → copier la config dans `config.js`.
5. **Paramètres → Cloud Messaging → Certificats Web Push → Générer une paire de clés** → copier dans `vapidKey` de `config.js`.

## 2. Déployer règles + notifications (Firebase CLI)
```bash
npm i -g firebase-tools
firebase login
firebase use --add            # choisir votre projet
firebase deploy --only firestore
firebase deploy --only functions   # nécessite le plan Blaze (gratuit dans les quotas, carte demandée)
```
Sans les Functions, tout marche sauf les notifications push.

## 3. Héberger l'app (Vercel ou Netlify, gratuit)
- **Netlify** : https://app.netlify.com/drop → glisser le dossier (sans `functions/`) → terminé.
- **Vercel** : `npm i -g vercel && vercel --prod` dans ce dossier (Framework : *Other*, pas de build).

Puis Firebase Console → **Authentication → Paramètres → Domaines autorisés** → ajouter votre domaine (`xxx.vercel.app` / `xxx.netlify.app`).

## 4. Installer sur le téléphone
- **iOS (Safari)** : Partager ⬆️ → « Sur l'écran d'accueil ». Les push exigent iOS 16.4+ et l'app **installée** ; appuyer sur 🔔 pour autoriser.
- **Android (Chrome/Honor)** : bannière « Installer » ou menu ⋮ → « Installer l'application ». Appuyer sur 🔔.

## Notes
- Mot de passe de groupe : stocké haché (SHA-256 + sel), vérifié côté client. Suffisant pour un usage familial/amis ; pour une sécurité stricte, passer par une Cloud Function.
- Les noms de groupe sont uniques (ils servent d'identifiant).
- Le service worker est `sw.js` (cache hors-ligne + réception des push).
