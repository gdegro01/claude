# SPIN — Reserveringssysteem prototype

> Premium reserveringssysteem-prototype voor SPIN: hybride horecaconcept in
> Amsterdam (pool · dining · listening bar · cocktails). Volledige briefing:
> `docs/briefing.md`.

## Hoofddoel
Live demonstreerbaar prototype voor eigenaren en investeerders. Moet bewijzen:
**productgevoel**, **operationele intelligentie**, **doordachte edge cases**.
Mag NIET aanvoelen als OpenTable / SaaS-dashboard / generieke booking form.

## Sfeer
Boutique hotel software × Japanse listening bars × premium airline ops × moderne nightlife.
Vermijd: gaming UI · nightclub neon · startup SaaS · flashy startup-animaties.

## Primary deliverable
**Coded web prototype** — geen Figma. De briefing noemt "primair Figma",
maar we draaien dat om: het volledige prototype wordt in code gebouwd en
live in de browser gedemonstreerd tijdens de pitch.

### Stack
- Next.js 15 (App Router) · TypeScript · React 19
- Tailwind CSS v4 (design tokens uit de SPIN-kleurtabel)
- Motion (motion/react) voor alle animatie — shared layout, AnimatePresence
- next/font local voor Parabolica + Fragment Mono
- pnpm als package manager

### Routes
- `/` · landing
- `/book/*` · gast-flow (mobile-first)
- `/ops/*` · operator dashboard (desktop/tablet)
- `/demo/*` · losstaande hero-momenten voor in de pitch (waitlist claim, occupancy rings, …)

## Brand — typografie
- **Headings · buttons · timers · grote nummers** → Parabolica Bold / SemiBold
- **Body · system UI · labels · metadata · tabellen** → Fragment Mono

Contrast tussen de twee is essentieel voor de SPIN-identiteit.

## Brand — kleurtokens
| Token              | Hex       | Gebruik |
|--------------------|-----------|---------|
| main-dark          | `#261C0D` | booking screens, overlays, navigatie, waitlist |
| main-light         | `#F7ECD9` | dashboard, tabellen, ops-panels (geen puur wit) |
| accent-purple      | `#8874D9` | geselecteerd, actieve filters, waitlist, timers, system-states |
| accent-orange      | `#D95125` | ALLEEN claim / check-in / release / primary CTA (zeldzaam) |
| error-critical     | `#3E0E14` | no-shows, fraude, herhaalde annuleringen (geen fel rood) |
| supporting-dark    | `#65230C` | layered surfaces, hover, gradients |
| supporting-neutral | `#87808F` | secundaire metadata, inactieve states |

## Flows
- **Gast** (mobile-first · cinematografisch · tactiel · rustig):
  landing → datum/tijd → gasten+activiteit → koelkastpakket → contact →
  aanbetaling → bevestigd → waitlist-claim
- **Operator** (desktop/tablet · rustig · scanbaar · ops-geloofwaardig):
  dashboard · plattegrond · reserveringen · wachtlijst · inbox · instellingen · QR check-in

## Hero demo-momenten
1. **Waitlist claim** — notificatie → fullscreen → countdown → claim → dashboard reordert live
2. **Live dashboard** — vloeiende layout-animaties, geen harde refreshes
3. **Plattegrond** — architecturale top-down, geen UI-cards
4. **Bar seating** — horizontale counter met radial occupancy rings

## Occupancy-taal
Geen statische tijden ("17:30"). Wel: "Speelt · 47m", "Start over · 18m",
"Ingecheckt · 1u 12m", "Overtijd · +22m".

## Motion-principes
- Native · tactiel · vloeiend · licht cinematografisch · operationeel betekenisvol.
- Motion legt status uit / communiceert urgentie / begeleidt focus — nooit puur decoratief.
- Foundation-refs: Motion.dev shared-layout, AnimatePresence, GSAP-timing.
  Gebruiken als basis, niet letterlijk kopiëren — alles naar SPIN-identiteit.

## Assets (verwacht in repo)
- Logo (SVG)
- Fonts: Parabolica, Fragment Mono
- Mogelijk sfeerfoto's voor hero/welcome
- (nu nog niet in repo — uploaden voordat we tokens/exports genereren)

## Conventions
- Branch: `claude/<short-slug>` voor AI-werk.
- Commits: imperative mood, focus op *why*.
- Geen comments tenzij de *why* niet vanzelfsprekend is.

## Multi-agent workflow
- **Subagents** (`Agent` tool) voor parallel werk binnen één workstream.
- **Parallelle web-sessies** voor onafhankelijke workstreams.
- Parallel alleen bij ≥3 taken op disjoint files. Anders sequentieel.
- Zware/risico-volle taken: spawn met `isolation: "worktree"`.
- Subagents draaien standaard op Sonnet (zie `.claude/settings.json`).

## Custom subagents (`.claude/agents/`)
- `explorer` — read-only deep code/asset exploration
- `planner` — architectuur, plan, geen code
- `implementer` — implementatie in een worktree
- `tester` — tests in een worktree
- `reviewer` — second-opinion review

## Never
- Push direct naar `main`.
- `--no-verify`, `--force` push, of amend van gepushte commits zonder expliciete ask.
- Commit secrets, `.env`, credentials, grote binaries, of font-licenties zonder check.
