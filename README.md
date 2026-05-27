# 🎯 Motive (Momentum and Reflective)

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Local--First-blueviolet?style=for-the-badge&logo=sqlite)](https://dexie.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Google_Cloud-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

> **Motive** is a premium, reflective productivity platform designed as a unified ecosystem for high-focus task management (To-do List) and emotional journaling (Notes). Unlike conventional productivity apps that focus solely on checkboxes, Motive bridges the gap between what you accomplish and how you feel.

---

## 🌟 The ERA Cycle Framework

The core engine of Motive is the automated **ERA Cycle**, which synthesizes daily actions and feelings into structured, strategic insights:

*   **Experience (E):** Concrete events or activities you completed throughout the day.
*   **Reflection (R):** The process of rethinking those events, evaluating feelings, and identifying emotional split patterns.
*   **Action (A):** Practical, actionable steps or habits to implement tomorrow to sustain momentum or mitigate friction.

---

## ✨ Key Features

1.  **Flexible Task Management (Momentum):** Organize daily tasks across custom focus pillars (Work, Personal, Health, Study) with deadlines, priority tags, and complete historical timestamps.
2.  **Bilingual Localized UI:** Real-time support for **English** and **Bahasa Indonesia** across all dashboard elements, landing page containers, and mockups.
3.  **Local-First & Offline-Ready (Sanctuary):** High-speed local database using **IndexedDB (via Dexie.js)**. Your data stays entirely in your browser.
4.  **Google Gemini AI Synthesis:** Secure AI proxies aggregate daily notes and checklists into clean, structured daily reflections.
5.  **Export/Import Portability:** Backup your database locally as a validated `.json` file anytime.
6.  **Multi-Channel Sharing:** Directly download daily ERA reports as professional PDFs or trigger instant email routing via Nodemailer/SMTP.
7.  **Theme Adaptation**: Adaptive Light Mode, Dark Mode, and System Default matching our minimalist, high-focus brand palette.

---

## 🛠️ Technology Stack

| Category | Technology Used | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router, React 19) | Modern, fast SSR/SSG foundation with API route support. |
| **Styling** | Vanilla CSS + CSS Variables | Strict adherence to the *Reflective Precision* brand system. |
| **Database** | IndexedDB (Dexie.js Wrapper) | Lightning-fast local storage for offline-first privacy. |
| **Auth** | Firebase Auth (Google Sign-In) | Secured global user authentication. |
| **AI Integration** | Google Gemini 1.5 Flash API | Proxy endpoint synthesizes daily context safely. |
| **Email Relay** | Nodemailer / SMTP | Automated daily summary email delivery. |
| **PDF Engine** | jsPDF | On-the-fly local PDF generation for offline reports. |

---

## 🚀 Getting Started

Follow these steps to clone, configure, and run the Motive platform on your local machine:

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18.x or later) and `npm` installed.

### 2. Clone the Repository

```bash
git clone https://github.com/anisanursekararum/motive.git
cd motive
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a file named `.env.local` in the root of the project directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Gemini AI API Key
GEMINI_API_KEY=your_google_gemini_api_key

# Email SMTP Setup (for ERA reports routing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password
```

> 💡 *Note: For Gmail SMTP, generate a 16-character **App Password** inside your Google Account Security dashboard.*

### 5. Run the Development Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to explore the Motive landing page and dashboard.

---

## 📦 Production & Deployment

### Build for Production

Before launching, compile a minified production bundle to optimize speed and bundle size:

```bash
npm run build
```

To run the production build locally:

```bash
npm run start
```

### Deploy to Vercel

The easiest way to deploy Motive is to use the [Vercel Platform](https://vercel.com/new):

1.  Push your code to a GitHub repository.
2.  Import the repository on Vercel.
3.  Add all environment variables from `.env.local` inside the Vercel Project Settings.
4.  Click **Deploy** — Vercel will automatically construct and serve the build.

---

## 🔒 Privacy & Architecture

Motive is built on a **Sanctuary Architecture**:
*   No personal notes or diaries are sent to centralized databases. All entries reside safely inside IndexedDB on your device.
*   The Google Gemini model is accessed via backend Route Proxies, ensuring your API key is never exposed on the client side. No personal data is used to train AI models.
