# 🛒 Courses Ensemble — PWA (Supabase)

Projet Supabase : https://gdaltmiyflupgihectin.supabase.co (clés déjà dans `config.js`)

## 1. Base de données (obligatoire)
Supabase → **SQL Editor** → coller tout `supabase/schema.sql` → **Run**.

> Problème d'ajout d'articles ? Lancez `supabase/fix.sql` (SQL Editor).

## 2. Authentification
Supabase → **Authentication → Providers → Email** : activé.
- Pour tester vite : désactiver **Confirm email** (sinon l'utilisateur doit cliquer le lien reçu par mail).
- **Authentication → URL Configuration** : mettre l'URL de votre site (Vercel/Netlify) dans *Site URL*.

## 3. Héberger (gratuit)
- **Netlify** : https://app.netlify.com/drop → glisser ce dossier (sans `supabase/`).
- **Vercel** : `npm i -g vercel && vercel --prod` (Framework : *Other*).

## 4. Notifications push (pour les articles urgents)
```bash
npx web-push generate-vapid-keys       # -> clé publique + clé privée
```
1. Clé **publique** → `vapidPublicKey` dans `config.js`.
2. Déployer la fonction :
```bash
npm i -g supabase
supabase login
supabase link --project-ref gdaltmiyflupgihectin
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:vous@exemple.fr WEBHOOK_SECRET=un-secret-long
supabase functions deploy notify-urgent --no-verify-jwt
```
3. Supabase → **Database → Webhooks → Create**: table `items`, event **Insert**, type **Supabase Edge Functions** → `notify-urgent`, ajouter l'en-tête HTTP `x-webhook-secret` = votre WEBHOOK_SECRET.

## 5. Installer sur le téléphone
- **iOS (Safari)** : Partager ⬆️ → « Sur l'écran d'accueil » (push : iOS 16.4+, app installée, puis bouton 🔔).
- **Android (Chrome/Honor)** : bannière « Installer » ou menu ⋮ → « Installer l'application », puis 🔔.

## Sécurité
La clé `sb_publishable_…` est faite pour être publique. Les données sont protégées par les règles RLS : seuls les membres d'un groupe voient ses articles, et les mots de passe de groupe sont hachés (bcrypt) côté serveur.

## Mise à jour v4
1. SQL Editor → coller `supabase/update_v4.sql` → Run.
2. `supabase functions deploy notify-urgent --no-verify-jwt` (push à chaque nouvel article).
3. Redéployer le dossier (Netlify/Vercel), puis réinstaller l'app sur l'écran d'accueil.

## Mise à jour finale (v7) : WhatsApp, membres, modération
1. SQL Editor -> coller **tout** `supabase/update_v7.sql` -> Run (il inclut les versions précédentes, aucune donnée supprimée).
2. Créez le compte `charton.hugo1001@gmail.com` (super-admin) puis activez *Confirm email*.
3. `supabase functions deploy notify-urgent --no-verify-jwt`, redéployez le dossier, réinstallez l'app.

### Modérer depuis le tableau de bord Supabase
Table Editor -> `group_members` : `custom_display_name` (renommer), `is_banned` = true (blocage définitif) ou `banned_until` = date (bannissement temporaire).
