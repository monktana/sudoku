# Sudoku

Meine eigene, werbefreie Sudoku-App – als PWA installierbar, läuft komplett
lokal im Browser ohne Backend. Deployt über Coolify auf dem `stuff`-Server,
erreichbar unter [sudoku.giebelmann.dev](https://sudoku.giebelmann.dev/).

## Warum

Keine Werbung, kein Tracking, kein Account-Zwang – einfach Sudoku spielen,
wann und wo man will. Als Progressive Web App auch offline nutzbar und aufs
Homescreen installierbar (Handy & Desktop).

## Tech-Stack

- [Svelte 5](https://svelte.dev/) + [Vite](https://vitejs.dev/) – UI & Build
- [TypeScript](https://www.typescriptlang.org/)
- CSS Grid fürs Spielfeld
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) – Offline-Support & Installierbarkeit
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) – Unit-Tests
- [Playwright](https://playwright.dev/) – End-to-End-Tests
- Nginx (im Container) für die statische Auslieferung im Produktivbetrieb

## Lokale Entwicklung

Voraussetzung: Node.js (LTS)

```bash
npm install
npm run dev
```

Weitere nützliche Befehle:

| Befehl | Zweck |
|---|---|
| `npm run build` | Produktions-Build erzeugen |
| `npm run preview` | Produktions-Build lokal testen |
| `npm run check` | Typen-/Svelte-Check |
| `npm run test` | Unit-Tests einmalig ausführen |
| `npm run test:watch` | Unit-Tests im Watch-Modus |
| `npm run test:coverage` | Unit-Tests mit Coverage-Report |
| `npm run test:e2e` | End-to-End-Tests (Playwright) |
| `npm run test:e2e:ui` | End-to-End-Tests mit Playwright-UI |

## Deployment über Coolify

Die App wird über den mitgelieferten `Dockerfile` gebaut (Multi-Stage:
Node-Build → statischer Nginx-Container) und läuft auf dem `stuff`-Server,
nach demselben Muster wie die übrigen selbst gehosteten Apps in diesem
Setup.

1. Neue Resource in Coolify: **Dockerfile** (nicht Docker Compose, da diese
   App keine externen Abhängigkeiten wie Datenbank/Redis hat) → dieses Repo
   als Quelle angeben.
2. Domain hinterlegen, Coolify übernimmt TLS via Let's Encrypt.
3. Deploy anstoßen.

Da die App rein statisch ausgeliefert wird (kein Backend, keine Datenbank),
sind **keine Environment Variables und kein persistentes Volume** nötig –
das schlankeste Deployment im gesamten Setup.

## Tests & CI

Unit-Tests laufen mit Vitest (inkl. jsdom für DOM-Simulation), End-to-End-
Tests mit Playwright gegen den gebauten Build. Ein GitHub-Actions-Workflow
unter `.github/workflows` führt das bei jedem Push automatisch aus.
