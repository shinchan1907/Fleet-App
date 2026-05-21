# 🚚 Fleet Master — Serverless Logistics Management System

A state-of-the-art, **100% serverless single-page application (SPA)** designed for fleet operators, logistics managers, and drivers. This application features high-performance dynamic SVG charts, real-time service interval threshold warning cards, SaaS roles management, and an interactive step-by-step database migration assistant.

Deployable **100% free, forever** on **Vercel** (Static Frontend) and **Google Firebase / Cloud Firestore** (Serverless Database).

---

## ⚡ Tech Stack Architecture
*   **Core Logic:** React 19 + Vite (Ultra-fast Hot Module Replacement)
*   **Database Sync:** Client-Side Firebase SDK (Spark/Free Tier)
*   **Styles & Theme Engine:** Premium Vanilla CSS (custom HSL variables, fluid animations, dynamic Light/Dark mode transitions, Electric Cyan theme)
*   **Visual Analytics:** Zero-dependency, sub-1ms React-driven inline responsive SVG Graphs (0kb bundle footprint)

---

## 🎨 Key Features
1.  **Direct-to-Database Sync:** React connects directly to Firestore. No node/express active backend server required, reducing hosting costs to $0.
2.  **Zero-Day Secure First-Run Setup:** Out of the box, no static pre-seeded default master backdoor accounts exist. On first startup, the app automatically converts the login screen into a master administrator credential creator, prompting the user to initialize a secure username/password.
3.  **Self-Healing Local Sandbox Fallback:** Automatically operates in offline/sandbox mode if no Cloud database configuration is loaded or connected.
4.  **Cloud Setup Stepper Assistant:** A gorgeous step-by-step wizard embedded directly in the Settings console that guides users on creating projects, enabling Firestore in Test Mode, registering apps, and configuring default accounts.
5.  **Live Config Validator:** Parses and checks pasted Firebase config blocks in real-time.
6.  **Calculated Maintenance Alerts Algorithm:** Auto-calculates aggregate distance driven by assets since their last logged service date. Illuminates detailed overdue/due-soon warning cards if distance exceeds custom mileage milestones.
7.  **Fully Mobile-Responsive:** Highly polished grid layouts stack automatically on mobile chrome/safari. Hides non-essential items on narrow phone viewports for high-density, native-feeling app interactions.

---

## 💻 Local Setup & Development

To test the application locally on your machine, follow these simple steps:

### 1. Install Dependencies
Make sure you have Node.js installed, then open your terminal in the project directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in the root folder to a new file named `.env`:
```bash
cp .env.example .env
```
Fill in the exact values of your Firebase project Web App Web SDK configuration block inside this `.env` file.

### 3. Start the Development Server
Launch the super-fast Vite server:
```bash
npm run dev
```

### 4. Open in Browser
Open the local server URL (usually **[http://localhost:5173](http://localhost:5173)**) in Chrome, Edge, or Safari.

---

## 🔑 Dynamic Initial Credential Setup (No Default Backdoors)
*   On first load, if the active database is empty, the login screen will automatically transform into the **Initialize Administrator** page.
*   **Username:** Choose any administrative name or email (e.g. `admin@fleetmaster.com` or `admin`).
*   **Password:** Choose any secure password. *Note: Firebase Authentication strictly requires passwords to be at least 6 characters long.*
*   Once created, this account is securely stored in your active cloud console. All future sessions will load the standard **Sign In** screen.

---

## ☁️ Zero-Cost Cloud Deployment (Production Grade)

### 1. Deploy Frontend & Configure Variables (Vercel)
Vercel integrates seamlessly with Vite environment variables:
1.  Create a free account on [Vercel](https://vercel.com/).
2.  Push this codebase to a new repository on your GitHub.
3.  Import the repository on the Vercel dashboard.
4.  Navigate to the **Settings > Environment Variables** tab on Vercel.
5.  Add the exact environment variables listed below from your Firebase project:
    *   `VITE_FIREBASE_API_KEY`
    *   `VITE_FIREBASE_AUTH_DOMAIN`
    *   `VITE_FIREBASE_PROJECT_ID`
    *   `VITE_FIREBASE_STORAGE_BUCKET`
    *   `VITE_FIREBASE_MESSAGING_SENDER_ID`
    *   `VITE_FIREBASE_APP_ID`
6.  Click **Deploy** / **Rebuild**! Vercel automatically detects the variables, compiles using `npm run build`, and serves the static assets in the `dist` folder.

### 2. Connect Database (Firebase)
1.  Create a project in the [Firebase Console](https://console.firebase.google.com/).
2.  Add a **Web App** (`</>`) to get your Web SDK credentials.
3.  Go to **Firestore Database** in the left menu and click **Create Database** (Choose *Start in Test Mode* and select your local region).
4.  Go to **Authentication** in the left menu, click **Get Started**, navigate to the **Sign-in method** tab, click **Email/Password**, and toggle **Enable > Save**.
5.  Launch your live Vercel app link and the dynamic administrator setup wizard will automatically open, prompting you to set your credentials and initialize the live database instantly.

*That's it! Your system is now active in the cloud!*
