# Deploy

## Doelhost

| | |
|---|---|
| Provider | Hetzner CX22 (Helsinki, Ubuntu 24.04) |
| IP | `89.167.125.42` |
| Domain | `gerkedegroot.duckdns.org` |
| Live URL | `https://gerkedegroot.duckdns.org/spin-app/` |
| Remote path | `/var/www/dashboard/spin-app/` |

We delen de VPS met andere projecten — zie `vps.md` voor de volledige lijst.
De bestaande `/var/www/spin/` (oude HTML-pitch op `/spin/gerke_pitch_spin.html`)
laten we met rust; deze nieuwe app komt op `/spin-app/`.

## Strategie

Static export (`output: "export"` in `next.config.ts`). Geen Node-runtime op de
VPS, geen systemd-unit, geen nginx-edit. Past in het bestaande pattern uit
`deployreference.md`: alles in `/var/www/dashboard/{naam}/` is direct
bereikbaar via `https://gerkedegroot.duckdns.org/{naam}/`.

Trade-offs:
- ✅ Geen backend-onderhoud, supersnel, makkelijk te rollbacken.
- ❌ Geen server-actions, geen API routes, geen `next/image` optimisation.
  Voor een pitch met mock-data prima.

## Eenmalige setup op je Mac

```bash
ssh-add ~/Developer/vps/hi   # passphrase staat in je 1Password / vps.md
```

Daarna draait deploy zonder prompts.

## Deploy

```bash
pnpm run deploy
```

Wat dat doet (zie `scripts/deploy.sh`):

1. Check of er een SSH-key in je agent zit.
2. `pnpm install --frozen-lockfile`
3. `pnpm build` → `out/`
4. `rsync --delete out/ root@89.167.125.42:/var/www/dashboard/spin-app/`
5. Klaar — live op `https://gerkedegroot.duckdns.org/spin-app/`

## Rollback

Maak vóór elke deploy automatisch een snapshot? Voor nu: nee, te veel
overhead voor een prototype. Als het misgaat:

```bash
# Vanaf je Mac, met een eerdere git commit
git checkout <eerdere-commit> -- .
pnpm run deploy
```

## Lokaal testen vóór deploy

```bash
pnpm build && pnpm dlx serve out -l 3000
# Of: pnpm dev voor de hot-reload variant
```

## Twee-device test (zonder VPS)

```bash
pnpm dev
# Mac toont IP zelf met `ipconfig getifaddr en0`. Telefoon op zelfde WiFi:
# http://<mac-lan-ip>:3000/spin-app
```

`hostname 0.0.0.0` in het `dev`-script staat al ingesteld.

## Niet doen

- Geen aparte nginx `location /spin-app/ { alias ... }` block. De dashboard-root
  vangt 'm al op via `/var/www/dashboard/spin-app/`. Zie `deployreference.md`
  voor waarom dat kapot gaat.
- Niet `/var/www/spin/` overschrijven — daar staat een oude pitch nog.
- Geen `--no-verify` of `--force` push op gepushte branches.
