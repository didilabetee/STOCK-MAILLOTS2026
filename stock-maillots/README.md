# 📦 Stock Maillots 2026

## 🚀 Déploiement sur Vercel (5 minutes)

### Étape 1 — Firebase (base de données gratuite)
1. Va sur **firebase.google.com** et connecte-toi avec Google
2. Clique **"Créer un projet"** → nomme-le `stock-maillots` → Continue
3. Dans le menu gauche : **Realtime Database** → **Créer une base de données**
4. Choisis **"Démarrer en mode test"** → Activer
5. Copie l'URL de ta base (format : `https://stock-maillots-XXXXX-default-rtdb.firebaseio.com`)
6. Ouvre le fichier `src/App.jsx` et remplace la ligne :
   ```
   const FIREBASE_URL = "https://stock-maillots-default-rtdb.firebaseio.com";
   ```
   par ton URL à toi.

### Étape 2 — GitHub
1. Va sur **github.com** → New repository → nomme-le `stock-maillots`
2. Upload tous les fichiers de ce dossier
3. Clique **Commit changes**

### Étape 3 — Vercel
1. Va sur **vercel.com** → Sign up avec GitHub
2. Clique **"Add New Project"**
3. Sélectionne ton repo `stock-maillots`
4. Dans **Project Name** tape : `stock-maillots`
5. Clique **Deploy** → attends 1 minute
6. ✅ Ton site est en ligne sur **stock-maillots.vercel.app**

---

## 🔐 Accès admin
- Clique sur **⚙ ADMIN** en bas de la page
- Mot de passe : **Jesuislepatron**
- Modifie les quantités → Sauvegarde
- Toutes les personnes qui ont le lien voient la mise à jour en moins de 10 secondes

---

## ❓ Sans Firebase ?
L'app fonctionne quand même avec localStorage mais le stock ne sera pas partagé entre les appareils. Firebase est recommandé pour la synchro en temps réel.
