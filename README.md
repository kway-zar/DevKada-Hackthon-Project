# FilCare - DevKada Hackathon Project

FilCare is a healthcare-focused web application built with React, TypeScript, and Vite.  
It provides separate experiences for patients and providers, including triage-guided facility selection, queue tracking, patient records, and a health-education chatbot.

## Purpose

FilCare was built to reduce friction in outpatient care by helping patients decide where to go, register faster, and monitor queue status before arriving at a facility.

The app aims to:

- Improve early decision-making through symptom-guided triage flow
- Shorten waiting uncertainty with transparent virtual queue status
- Support providers with an operational dashboard for queue and patient monitoring
- Encourage safer public health behavior via a health-education chatbot

## What Problem It Solves

Many patients struggle with three common pain points before consultation:

- Not knowing which facility is appropriate for their condition
- Long, uncertain queue times with little visibility
- Fragmented handoff between initial symptom checking and provider intake

FilCare connects these steps into one workflow so patients can move from symptom input to facility selection to queue tracking in a single session.

## Features

- Patient portal with symptom triage workflow
- Facility finder and queue entry flow
- Live queue status view for patients
- Provider dashboard for queue and patient management
- Auth modal with patient and provider access
- Gabay chatbot for general health education

## User Workflows

### Patient Flow

1. User signs in and enters the Patient Portal.
2. User completes symptom triage.
3. App recommends urgency context and supports facility selection.
4. Queue entry is created and linked to patient and facility.
5. Patient monitors queue progression and wait estimates.
6. Patient can view profile and record-related information in the portal.

### Provider Flow

1. Provider signs in to the Provider Dashboard.
2. Dashboard displays queued patients and current statuses.
3. Provider can review patient details and update queue handling states.
4. Provider gains a clearer view of active demand and patient order.

## Core Modules

- Patient Portal: symptom intake, pre-registration, facility finder, queue tracking
- Provider Dashboard: queue operations and patient detail views
- Auth Modal: role-based login/signup handling
- Gabay Chatbot: general health education assistant (non-diagnostic)
- Supabase REST integration: persistence for accounts, patients, facilities, triage, and queue entries

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Supabase REST API
- Tailwind CSS + Radix UI components

## Project Structure

Application source code lives in the FilCare folder.

```text
DevKada-Hackthon-Project/
  README.md
  FilCare/
    src/
    api/
    supabase/
    package.json
```

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/kway-zar/DevKada-Hackthon-Project.git
cd DevKada-Hackthon-Project/FilCare
```

2. Install dependencies

```bash
npm install
```

3. Create environment variables in FilCare/.env

```env
VITE_SUPABASE_REST_API=your_supabase_rest_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional AI/chatbot variables:

```env
VITE_OPENAI_API_KEY=your_key
VITE_OPENAI_API_BASE=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o-mini
```

4. Run the development server

```bash
npm run dev
```

5. Build for production

```bash
npm run build
```

6. Preview production build

```bash
npm run preview
```

## Available Scripts

- npm run dev: Start Vite dev server
- npm run build: Type-check and build production assets
- npm run lint: Run ESLint
- npm run preview: Preview production build locally

## App Routes

- /: Landing page
- /patient: Patient portal
- /provider: Provider dashboard
- /provider/patient/:id: Provider patient details

## Provider Dashboard Test Credentials

To try out Provider's Dashboard use the following credentials:
E: doc.oc@filcare.ph
P: octavius123

## Notes

- This is a hackathon project and some backend/auth flows are simplified for demo purposes.
- Supabase SQL setup is in FilCare/supabase/filcare.sql.

## License

MIT
