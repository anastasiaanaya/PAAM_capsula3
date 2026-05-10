# PAAM_capsula3
# 💬 Càpsula 3 — Xat en Temps Real

Aplicació mòbil de xat en temps real desenvolupada amb **React Native (Expo)** i **Supabase**. Permet als usuaris registrar-se, iniciar sessió i enviar missatges en un xat grupal que s'actualitza automàticament sense necessitat de refrescar la pantalla.

---

## 📱 Captures de pantalla

| Login | Registre | Xat |
|-------|----------|-----|
| ![Login][screenshot-login] | ![Registre][screenshot-register] | ![Xat][screenshot-chat] |

[screenshot-login]: ./screenshots/login.png
[screenshot-register]: ./screenshots/register.png
[screenshot-chat]: ./screenshots/chat.png


---

## 📁 Estructura del projecte

```
├── app/
│   ├── _layout.jsx          # Layout arrel amb lògica d'autenticació
│   ├── (auth)/
│   │   ├── _layout.jsx      # Layout del grup auth
│   │   ├── login.jsx        # Pantalla de login
│   │   └── register.jsx     # Pantalla de registre
│   └── (app)/
│       ├── _layout.jsx      # Layout del grup app (protegit)
│       └── index.jsx        # Pantalla principal del xat
├── context/
│   └── useAuthStore.js      # Store de Zustand per la sessió
├── lib/
│   └── supabase.js          # Client de Supabase configurat
└── .env                     # Variables d'entorn 
```

## 🚀 Executar localment

### Requisits previs

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Android Studio (emulador) o dispositiu físic amb Expo Go

### 1. Clona el repositori

```bash
git clone https://github.com/anastasiaanaya/PAAM_capsula3.git
cd capsula3
```

### 2. Instal·la les dependències

```bash
npx expo install
```

> ⚠️ Utilitza sempre `npx expo install` en lloc de `npm install` per garantir compatibilitat de versions.

### 3. Configura les variables d'entorn

Crea un fitxer `.env` a l'arrel del projecte:

```env
EXPO_PUBLIC_SUPABASE_URL=https://el-teu-projecte.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=la-teva-anon-key
```

Trobaràs aquests valors a **Supabase → Settings → API**.

### 4. Executa l'app

```bash
npx expo start
```

Prem `a` per obrir l'emulador Android o escaneja el QR amb Expo Go.

---

## 🔐 Variables d'entorn

| Variable | Descripció | On trobar-la |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del projecte Supabase | Supabase → Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clau pública de Supabase | Supabase → Settings → API → anon public |


## 👩‍💻 Autora

Desenvolupat per **Anastasia** com a projecte de l'assignatura Programació Avançada d'Aplicacions Mòbils.