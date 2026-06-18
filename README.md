# SMChecklist

SMChecklist is a private preference checklist web app. It presents a structured questionnaire, records consent and interest levels, shows progress, and exports a clean PDF report for personal reference or discussion with a trusted partner.

Original AI Studio project:
https://ai.studio/apps/drive/1b3h5ju_AtSdf6_gg8VcKi8ytsEkytTsA

## What It Does

- Guides the user through a categorized checklist.
- Tracks answers and completion progress.
- Uses a polished, minimal interface for sensitive preference data.
- Exports a PDF report with `jsPDF` and `jspdf-autotable`.
- Keeps the app client-side and simple to run locally.

## Tech Stack

- React 18
- TypeScript
- Vite
- Lucide React icons
- `jsPDF`
- `jspdf-autotable`

## Project Structure

- `App.tsx` - Main questionnaire state, navigation, and export flow.
- `constants.ts` - Checklist categories and items.
- `components/QuestionCard.tsx` - Individual question UI.
- `components/ProgressBar.tsx` - Completion indicator.
- `utils/pdfGenerator.ts` - PDF report generation.
- `types.ts` - Shared checklist types.

## Requirements

- Node.js 18 or newer
- No API key is required

This project was created from an AI Studio bundle, but the current app does not call Gemini or require `GEMINI_API_KEY`.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Privacy Notes

- Checklist data is handled in the browser.
- Review the code before deploying publicly if you plan to store or transmit user answers.
- Treat exported PDF reports as sensitive personal documents.
