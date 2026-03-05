# Frontend - Maritime Compliance UI

React 19 + TypeScript + Vite + Tailwind CSS v4 single-page application.

## Commands
- **Dev server**: `npm run dev` (port 3000, proxies /api/ to localhost:8000)
- **Build**: `npm run build` (tsc + vite build)
- **Type check**: `npx tsc --noEmit`
- **Lint**: `npx eslint src/`
- **Install deps**: `npm install --legacy-peer-deps`

## Key Patterns

### Tailwind CSS v4
- Uses `@tailwindcss/postcss` plugin (NOT `tailwindcss` directly in PostCSS)
- Custom colors defined via `@theme` directive in `src/index.css` (NOT `tailwind.config.ts`)
- `tailwind.config.ts` exists but is NOT used by v4 - custom theme is in CSS
- Custom palette: `maritime-50` through `maritime-950`

### ESLint
- ESLint 9 flat config format (`eslint.config.js`, NOT `.eslintrc.*`)
- typescript-eslint for TS rules
- react-hooks plugin for hook rules
- `no-unused-vars` set to warn with `^_` ignore pattern

### State Management
- Zustand stores in `src/stores/` (authStore, fleetStore, voyageStore)
- API layer in `src/api/` using Axios with JWT interceptor

### Routing
- react-router-dom v7
- Routes defined in `src/App.tsx`
- Pages in `src/pages/`

### Maps
- react-leaflet with OpenStreetMap tiles
- Leaflet icon fix uses CDN URLs (not local imports) to avoid TS module errors
- Leaflet CSS loaded via CDN in `index.html`

### Charts
- Recharts for compliance projections and metrics
- `react-is` package required as peer dependency for recharts

### Component Organization
- `components/layout/` - Sidebar, TopBar
- `components/fleet/` - ShipCard, FleetSummaryBar
- `components/compliance/` - CIIRatingBadge, ComplianceGauge, MetricCard, EEXIStatusBadge
- `components/maps/` - MapView, PortMarkers, ECAOverlay, RouteDrawTool, CSVTrackImport
- `components/scenarios/` - SpeedSlider, FuelMixSlider, ProjectionChart
- `components/voyage/` - PortCallSequencer, LegFuelEntry, BerthFuelEntry
- `components/shared/` - DataTable, PortSearchCombobox
