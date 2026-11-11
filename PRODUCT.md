# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Audience:** Friends, shared-housing roommates, and international travel companions managing shared group expenses together across domestic and cross-border trips.
- **Core Jobs to Be Done:** Log bills quickly (including offline while traveling), split amounts fairly across subsets of people, check net "who owes whom" balances transparently, settle up in the fewest transfers via VietQR, and share playful post-trip summaries.
- **Language & Currency Needs:** Balanced Vietnamese and English (`vi`/`en`) support with multi-currency expense entry (`11` currencies supported) converted to base `VND`.

## Product Purpose

Spliqo ("Split expenses. Stay friends.") eliminates spreadsheet friction and awkward money chases after group trips or shared living expenses. Success means accurate zero-sum debt conservation (`SUM(balances) === 0`), minimum settlement transfers via greedy debt minimization, verifiable edit history for financial trust, and a warm, approachable social experience rather than cold corporate accounting.

## Positioning

Unlike generic expense spreadsheets or strictly domestic payment apps, Spliqo pairs a deterministic Greedy Debt Minimization engine and itemized edit history with localized Vietnamese settlement ergonomics (pre-filled VietQR codes + copyable bank details + multi-tone Smart Nudge reminders), real-time SSE trip synchronization, offline expense queueing, and social group rituals (Lucky Wheel and Spliqo Wrapped 5-slide story export).

## Operating Context

- **Dual Form Factor:** Progressive Web App (`client/public/manifest.webmanifest`, service worker `spliqo-pwa-v2`) running as an installable standalone mobile PWA with safe-area awareness and bottom navigation pill, as well as a desktop web app with a floating left sidebar rail and top capsule header.
- **Architecture & Cold-Start Resilience:** React 19 + Vite 8 + Tailwind CSS v3 + Firebase v13 SPA (`client/`) backed by an Express + Firestore API (`server/`), including Cloudinary media uploads and `ServerWakeBanner` cold-start recovery against Render hosting.
- **Cross-Border Conversion:** Foreign expenses convert to base `VND` using cached/refreshed rates from `open.er-api.com` (`client/src/services/currencyService.js`).

## Capabilities and Constraints

- **Confirmed Capabilities:**
  - Google and Email/Password authentication; public shareable trip invites via 6-character codes, links, and QR (`/join/:code`, `/trips/join/:code`).
  - Trip workspaces with Overview (`TripOverviewTab`), Expense ledger with foreign-currency badges & live split calculation (`TripExpensesTab`, `ExpenseFormModal`, `ExpenseDetailModal`), Member management (`TripMembersTab`), 2-step Settlement workflow (`TripSettlementsTab`, `VietQRModal`, `SmartNudgeModal`), Budget pacing (`TripBudgetGauge`), and Audit log (`TripHistoryModal`).
  - Offline expense creation queue (`offlineSyncService`) and SSE live updates (`createRealtimeStream`).
  - Complete Trip safeguard (`CompleteTripModal`) blocking trip closure until all settlements are mutually confirmed.
  - Interactive social extras: `LuckyWheelModal` (canvas spinner) and `TripWrappedModal` (5-slide recap + 1080x1920 PNG export).
- **Hard Product Constraints:**
  - **Financial Conservation:** All debt calculations and settlements must prioritize accuracy and zero-sum balance conservation above visual flourish.
  - **PWA Mobile Ergonomics:** Primary creation, bill capture, and settlement checks must work comfortably on small mobile viewports and intermittent connections.
  - **Bilingual Parity & Display Currency:** UI flows across all pages, modals, and `ErrorBoundary` support both `vi` and `en` (`LanguageContext`), alongside a preferred display currency switcher (`formatDisplayCurrency` for VND and 10 foreign currencies) in user settings.

## Brand Commitments

- **Name & Motto:** **Spliqo** — *"Split expenses. Stay friends."*
- **Visual Direction:** Retain the warm cream **Tactile Clay** theme (`#f4f3ec` ground, `#ffffff` cards, `#18181b` obsidian primary actions) and **"Warm Social Utility"** character across core financial views and `TripWrappedModal` recap stories; `LuckyWheelModal` remains an explicitly permitted arcade entertainment canvas outside the calm clay baseline.

## Evidence on Hand

- Implemented frontend codebase (`client/src/`) and backend codebase (`server/`), with repository overview (`README.md`) referencing sample trip code `DL26A8`.
- Bilingual translation map in `client/src/contexts/LanguageContext.jsx` and multi-currency lookup in `client/src/services/currencyService.js`.
- **Absences Not to Fabricate:** No verified customer testimonials, press quotes, user-study metrics, or financial SLA certifications exist in the repository; future UX copy must never invent them.

## Product Principles

1. **Zero-Sum Clarity Builds Group Trust:** Every expense edit, split weight, exchange rate, and settlement state must stay inspectable so no friend ever wonders how their balance was calculated.
2. **Minimize Transfers, Respect Relationships:** Reduce the payment graph to minimal transactions and give members polite, playful, customizable ways (`SmartNudgeModal`) to settle without tension.
3. **Resilient Mobile Utility First:** Never lose a logged bill on weak vacation Wi-Fi or slow cold-starts; queue offline and confirm clearly when synced.
4. **Warmth Without Spreadsheet Sterility:** Keep numbers crisp (`JetBrains Mono`), while framing everyday money management inside tactile, celebratory surfaces fit for friends.

## Accessibility & Inclusion

- Supports persistent Light and Dark modes (`ThemeContext` via `html.dark`) and `Escape`-key modal/popover dismissal (`Modal.jsx`, `ConfirmContext.jsx`, `MainLayout.jsx`).
- **Accessibility Baseline:** Targets WCAG 2.1 Level AA across interactive semantics, readable contrast in both modes, keyboard reachability with focus traps and live regions (`ToastContext.jsx`), unlocked pinch-zoom scalability (`width=device-width, initial-scale=1.0, viewport-fit=cover` in `client/index.html`), dynamic `<html lang>`, and `prefers-reduced-motion` support.

