# Endcap: a brand ads platform (interview prototype)

Status: brand view, custom (format-first) builder and internal ops/sales view all built. Remaining: deploy (on hold until the user says so), polish.

## Why this exists

A front-end-only prototype of a quick commerce brand ads platform, built to (1) learn how retail ads
work by building the mechanics, and (2) show in a product designer interview. The design argument:
"an advertiser states a goal, the tool handles the tactics, constraints are fixed in one click,
and the shopper is protected by visible guardrails."

Framing for the demo: inspired by public objective-first tools (Instacart Ads Manager, Amazon Ads,
Blinkit Brand Central). It must not look like a copy of any company's unreleased work.
No real brand names, logos, or internal terms. Fictional platform: "Endcap". Fictional brand: "Crisp & Co" (snacks).

## Scope

In: full navigable platform with realistic mock data, persisted in the browser.
Out: auth, backend, payments, real data, file upload (creatives are picked from a mock library), mobile layout.

## Information architecture

```
QuickCart Ads
├── Overview            account health, spend, alerts, quick actions
├── Campaigns           list, filters, bulk actions
│   ├── Create          5-step goal-based wizard
│   └── Campaign detail performance, bundle breakdown, keywords, activity log
├── Creatives           library with review states
├── Reports             goal-specific report, export (mock)
├── Budget              account balance and spend by campaign (read-only, no payments)
└── Shopper preview     search page preview + auction simulator
```

One navigation model everywhere: left sidebar, page title + primary action top right,
filters under the title, table or cards below. Same pattern on every page (IA consistency is a demo point).

## User flow

```
                    ┌──────────────┐
                    │   Overview   │
                    └──────┬───────┘
          alert "fix" link │        "Create campaign"
        ┌──────────────────┤──────────────────────┐
        ▼                  ▼                      ▼
┌───────────────┐   ┌─────────────┐        ┌──────────────┐
│Campaign detail│◄──│  Campaigns  │───────►│ Create wizard│
└──────┬────────┘   └─────┬───────┘ dup.   └──────┬───────┘
       │ edit / pause     │ duplicate             │
       │                  └──────────────────────►│
       │                                          ▼
       │            1 Goal → 2 Bundle → 3 Products & audience
       │                 → 4 Budget & schedule → 5 Review
       │                                          │
       │                     save draft ◄─────────┤ (any step)
       │                                          ▼
       │                                   Submit → "In review"
       │                                          │ (auto-approves after a few seconds, simulated;
       │                                          │  one seeded campaign gets "Rejected: creative")
       │                                          ▼
       └──────────────────────────────────────►  Live
                                                  │
                    Paused ◄── pause/resume ──────┤
                    Out of budget ◄── spend hits cap ("Add budget" fix)
                    Ended ◄── end date passes
                                                  │
                                                  ▼
                                   Reports  ·  Shopper preview ("see where this ad appears")
```

## Wireframes

### App shell + Overview

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│ QuickCart  │ Overview                               [ + Create campaign ] │
│ Ads        │ Last 7 days ▾                                                │
│            ├──────────────────────────────────────────────────────────────┤
│ ▸ Overview │ ┌─ Spend ──┐ ┌─ Sales ──┐ ┌─ ROAS ───┐ ┌─ New customers ─┐    │
│   Campaigns│ │ ₹4,82,000│ │₹19,10,000│ │  3.96    │ │   2,340         │    │
│   Creatives│ │ ▲ 12%    │ │ ▲ 8%     │ │ ▼ 0.2    │ │   ▲ 21%         │    │
│   Reports  │ └──────────┘ └──────────┘ └──────────┘ └─────────────────┘    │
│   Budget   │ ┌─ Needs attention (3) ──────────────────────────────────┐   │
│   Shopper  │ │ ⛔ Diwali Awareness: out of budget      [Add budget]   │   │
│   preview  │ │ ⚠ Win-back Sept: 2 products out of stock [Review]      │   │
│            │ │ ⛔ New flavours: creative rejected       [Fix creative] │   │
│ ────────── │ └────────────────────────────────────────────────────────┘   │
│ Crisp & Co │ ┌─ Spend vs sales (line chart) ─┐ ┌─ Active campaigns ────┐   │
│ Balance    │ │                               │ │ name · goal · pacing  │   │
│ ₹2,15,000  │ │                               │ │ ...                   │   │
│            │ └───────────────────────────────┘ └───────────────────────┘   │
└────────────┴──────────────────────────────────────────────────────────────┘
```

### Campaigns list

```
Campaigns                                              [ + Create campaign ]
[All 12] [Live 5] [In review 1] [Paused 2] [Draft 2] [Ended 2]   Goal ▾  Search…
┌──┬─────────────────────┬──────────────┬─────────┬────────────┬───────┬──────┬───┐
│☐ │ Campaign            │ Goal         │ Status  │ Budget used│ Sales │ ROAS │ ⋯ │
├──┼─────────────────────┼──────────────┼─────────┼────────────┼───────┼──────┼───┤
│☐ │ Diwali Awareness    │ Awareness    │● Out of │ ████████ 100%│ ...  │ ...  │ ⋯ │
│☐ │ Try Crisp           │ New customers│● Live   │ ████░░░  58% │ ...  │ ...  │ ⋯ │
│☐ │ Win-back Sept       │ Win back     │● Live ⚠ │ ██░░░░░  31% │ ...  │ ...  │ ⋯ │
└──┴─────────────────────┴──────────────┴─────────┴────────────┴───────┴──────┴───┘
⋯ menu: View · Edit · Pause/Resume · Duplicate · End          Bulk: Pause · Resume
Empty state: "No campaigns yet. Pick a goal and we'll set up the rest."  [Create campaign]
```

### Create wizard (shell, used for all 5 steps)

```
← Campaigns    New campaign                              [Save draft]  [✕]
① Goal ─── ② Bundle ─── ③ Products & audience ─── ④ Budget & schedule ─── ⑤ Review
┌──────────────────────────────────────────────┬───────────────────────────┐
│                                              │ Summary                   │
│   (step content)                             │ Goal       New customers  │
│                                              │ Formats    2              │
│                                              │ Products   6              │
│                                              │ Est. reach 1.2–1.5 lakh   │
│                                              │ Budget     ₹—             │
│                                              │ ─────────────────────     │
│                                              │ ⛔ 1 blocker  ⚠ 1 warning │
│                              [Back] [Next →] │ (click to jump to field)  │
└──────────────────────────────────────────────┴───────────────────────────┘
```

Step 1, Goal:
```
What do you want this campaign to do?
┌ Awareness ───────┐ ┌ New customers ───┐ ┌ Win back ────────┐
│ Be seen by many  │ │ First purchase   │ │ Bring back past  │
│ shoppers         │ │ from non-buyers  │ │ buyers           │
│ Judged on: reach │ │ Judged on: new-  │ │ Judged on: repeat│
│ Min ₹1,50,000    │ │ to-brand orders  │ │ orders           │
│                  │ │ Min ₹75,000      │ │ Min ₹50,000      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

Step 2, Bundle (locked formats, with reasons):
```
Your bundle for "New customers"                     🔒 Set by goal  [Why?]
┌──────────────────────────────────────────────────────────────────────┐
│ Search ads          Shown when shoppers search your category         │
│                     Why: highest intent, non-buyers comparing        │
│                     [see placement]                                  │
├──────────────────────────────────────────────────────────────────────┤
│ Category boost      Higher position on the category page             │
│                     Why: reaches browsers who haven't picked a brand │
├──────────────────────────────────────────────────────────────────────┤
│ Keywords (auto)     chips, namkeen, snacks +14   [Review keywords]   │
│                     Add negative keywords: [__________]              │
└──────────────────────────────────────────────────────────────────────┘
Want full control instead? [Build a custom campaign] (stub, shows "not in this demo")
```

Step 3, Products & audience:
```
Products (6 selected)                         Audience  🔒 Set by goal
┌─────────────────────────────────────┐       ┌──────────────────────────┐
│☑ Classic Salted 52g    In stock     │       │ Shoppers who never bought│
│☑ Masala Crunch 52g     In stock     │       │ Crisp & Co (last 12 mo)  │
│☑ Peri Peri 90g      ⚠ Out of stock  │       │ Est. size 1.2–1.5 lakh   │
│   [Remove] [Keep, pause till back]  │       │ Cities: [Bengaluru ✕]    │
│☐ Cheese Rings 60g      In stock     │       │         [Mumbai ✕] [+]   │
└─────────────────────────────────────┘       └──────────────────────────┘
```

Step 4, Budget & schedule (the guardrail showcase):
```
Total budget   [ ₹ 60,000 ]
⛔ Minimum for New customers is ₹75,000.                 [Set to ₹75,000]

Split across formats                               Remaining: 10%
  Search ads       [====60%====     ]  ₹36,000
  Category boost   [==30%==         ]  ₹18,000   ⚠ Below ₹20,000 floor [Raise to floor]
⛔ Split must add up to 100%.                        [Distribute remaining]
   [Use recommended split 65 / 35]

Schedule   [14 Oct] → [20 Oct]   Daily pacing: ● Even  ○ Front-loaded
⚠ Under 7 days: may not gather enough data to optimise. You can still continue.

Est. results (simulated): 1.1–1.4 lakh impressions · 2,800–3,600 clicks · 380–520 new customers
```

Step 5, Review:
```
You'll spend ₹75,000 over 14 days to reach about 1.3 lakh shoppers who've never bought Crisp & Co.
Goal · Bundle · Products · Audience · Budget · Schedule      (each row has [Edit])
☐ I understand formats are fixed for this goal
                                        [Save draft]  [Submit for review]
After submit: toast + status "In review" → "Live" (simulated)
```

Duplicate flow: opens wizard prefilled, with a banner:
"Copied from Try Crisp. Kept: goal, bundle, products, audience. Reset: dates, budget. [Review reset fields]"

### Campaign detail

```
← Campaigns   Try Crisp   ● Live                [Pause] [Edit] [Duplicate] [⋯]
New customers · 1–14 Oct · ₹75,000 · Pacing: on track ████░░ 58%
[Performance] [Bundle] [Keywords] [Products] [Activity]
┌ Spend ┐ ┌ New customers ┐ ┌ Cost per new customer ┐ ┌ ROAS ┐
└───────┘ └───────────────┘ └───────────────────────┘ └──────┘
Funnel:  Impressions → Clicks → Add to cart → Orders → New-to-brand orders
Chart: daily spend vs new customers
Bundle tab: per-format table (spend, share of budget, clicks, orders) + "see placement"
Keywords tab: keyword · match · impressions · clicks · CPC · orders · [pause]
Activity tab: created, submitted, approved, budget edited, paused… (audit trail)
```

### Creatives

```
Creatives                                              [ + Add from library ]
[All] [Approved] [In review] [Rejected]
┌─────────┐ ┌─────────┐ ┌─────────┐
│ banner  │ │ banner  │ │ banner  │
│● Approved│ │● Review │ │● Rejected│  Reason: text covers >30% of image
│Used in 2│ │         │ │ [Fix and resubmit]         │
└─────────┘ └─────────┘ └─────────┘
```

### Reports

```
Reports     Goal: [New customers ▾]   Campaign: [All ▾]   1–14 Oct ▾   [Export CSV]
Headline metric changes with goal: reach & frequency / new-to-brand orders / repeat orders
Table: campaign × format × key metrics.  Note: "Attribution: 7-day click, simulated."
```

### Budget (read-only)

```
Balance ₹2,15,000 · Committed ₹1,40,000 · Available ₹75,000
Table: campaign · budget · spent · remaining · ends
[Add funds] → dialog "Payments aren't part of this demo"
```

### Shopper preview + auction simulator

```
Shopper preview         Query: [chips ▾]   Campaign: [Try Crisp ▾]
┌─ Phone frame: search results ──────┐  ┌─ Controls ─────────────────────┐
│ 🔍 chips                           │  │ Ad load   ●──────○  2 of 10    │
│ ┌──────┐ ┌──────┐                  │  │ Relevance floor ○──●───  0.4   │
│ │Spons.│ │      │  ← same card,    │  ├─ Readouts (simulated) ─────────┤
│ │ card │ │ card │    labelled      │  │ Revenue / 1,000 searches ₹…    │
│ └──────┘ └──────┘                  │  │ Fill rate            …%        │
│ ┌──────┐ ┌──────┐                  │  │ Sponsored vs organic CTR  gap  │
│ │      │ │Spons.│ [Why this ad?]   │  │ Search conversion    …%        │
│ └──────┘ └──────┘                  │  │ Verdict: "Revenue +18%,        │
└────────────────────────────────────┘  │  conversion −4%: past guardrail"│
                                        └────────────────────────────────┘
"Why this ad?" popover: bid ₹6 × predicted click rate 4.2% = score 0.25 (rank 1 of 7 eligible)
```

## Guardrail rules

| Rule | Type | Behaviour |
|---|---|---|
| Total budget below goal minimum | Blocker | Inline error, "Set to minimum" |
| Split does not sum to 100% | Blocker | Live remainder, "Distribute remaining" |
| Format below its floor | Warning | "Raise to floor" |
| Budget exceeds available balance | Blocker | Shows shortfall, "Lower to available" |
| Out-of-stock product | Warning | "Remove" or "Keep, pause until restocked" |
| No products selected | Blocker | Prevents Next, explains why |
| Schedule under 7 days | Warning | Reason given, can continue |
| Dates overlap another campaign with same goal + products | Warning | Shows the other campaign, "Change dates" |
| Rejected creative attached | Blocker | "Swap creative" |

Principles: prevent before validating; validate inline before submit; every error has a one-click fix;
blockers (red) and warnings (amber) look different; nothing is lost on error; summary rail counts issues and links to them.

## Mechanics (pure functions, tested)

- `auction.ts`: eligible = relevance ≥ floor; score = bid × predicted click rate; top N fill slots; rest organic.
- `estimate.ts`: reach, clicks, new customers from budget, goal, cities (simple illustrative formulas).
- `validate.ts`: takes a draft campaign, returns `{field, severity, message, fix}` list.
- `simulate.ts`: generates daily performance for seeded campaigns; advances statuses (in review → live, out of budget, ended).

## Stack

- Vite + React 19 + TypeScript, Tailwind CSS v4, HeroUI v3 (`@heroui/react`), React Router, Recharts
- HeroUI v3 is new: read its docs (https://heroui.com/docs) before using a component; don't rely on v2 memory
- Mock data in `src/data/*.ts`; state in a reducer + context, persisted to localStorage; "Reset demo data" in sidebar footer
- Vitest for `src/lib/`

```
src/
  data/      goals, catalogue, campaigns, creatives, ads
  lib/       auction, estimate, validate, simulate, format (₹ Indian grouping)
  shell/     Sidebar, PageHeader, StatusChip, IssueList
  pages/     Overview, Campaigns, CampaignDetail, Creatives, Reports, Budget, ShopperPreview
  wizard/    Wizard, GoalStep, BundleStep, ProductsStep, BudgetStep, ReviewStep, SummaryRail
```

## Design direction

- Warm orange brand on warm neutrals, framed by a deep ink sidebar and a slim top bar. Tokens live in `src/index.css`; never hard-code colours in components.
- Light and dark themes (toggle in the top bar, `.dark` on `<html>`). Any new colour needs both.
- One hue per campaign goal (`--goal-*`); show a goal with `GoalTag`, and tint goal-specific charts and bars with it.
- Top bar owns the global Create menu, the Brand/Internal switch and the balance. Pages don't repeat a primary Create button.
- Motion is purposeful only: `.pressable` on selectable cards, `.bar-fill` on bars, `.rise-in` between wizard steps, `AnimatedNumber` where a control changes a figure, a brief "Fixed" note when an issue is resolved. Respect reduced motion.
- Shared pieces in `src/shell/ui.tsx`: Panel, Stat, GoalTag, Thumb, BannerArt, Bar, AnimatedNumber.
- Sponsored cards match organic cards except a clear "Sponsored" label.
- Sentence case. Indian number formatting (₹1,00,000; lakh for large reach numbers). Font: Inter (user's choice).
- Every simulated number is labelled "simulated" once per page.

## Build order and cut line

1. Data + lib with tests
2. Shell + Campaigns list + seeded data
3. Create wizard with all guardrails  ← the core
4. Shopper preview + auction simulator  ← the learning piece
5. Campaign detail
6. Overview
   ───────── cut line if time is short ─────────
7. Creatives, Reports, Budget
8. Polish: empty states, duplicate banner, activity log

Estimate: stages 1–6 about 4–5 hours of build and review; 7–8 another 1–2 hours.

## Working rules for Claude

- Each stage must run and be checked in the browser before the next starts.
- No new dependencies beyond the stack above without asking.
- No real brands, no internal company terms.

## Demo script (3 minutes)

1. Overview: three alerts, each with a fix. "The tool tells you what to do next."
2. Create → New customers → locked bundle with reasons.
3. Budget step: enter ₹60,000, break the split; fix both in one click each.
4. Submit → In review → Live. Open detail: funnel ends in new-to-brand orders, the goal's metric.
5. Shopper preview: ad load 2 → 5, revenue up, conversion down. Raise the relevance floor; gap closes.
   "This is the trade-off I'd design around."

## Decisions

- UI library: HeroUI v3. Look: sleek, clean, rounded, dense enough for many elements per screen.
- Custom (format-first) campaigns: built as a single-page builder (`src/wizard/CustomBuilder.tsx`); goal `custom`, formats/audiences/keywords/bids in `campaign.custom`. Always read a campaign's formats through `bundleOf()` in `src/lib/bundle.ts`.
- Combined audiences: custom campaigns only (union, capped at everyone). Goal-based audiences stay locked.
- Offers: brand-funded price offers from three fixed templates (buy X get Y, percent off, bundle price), built in `src/pages/Offers.tsx` with rules in `src/lib/offers.ts`. Publishing needs no review; an offer starting today goes live at once.
- Internal view (ops and sales): same shell, switched by the Brand/Internal control in the sidebar. Pages in `src/pages/Internal.tsx`: review queue, accounts, inventory. In the internal view submissions wait for manual review; in the brand view they auto-approve after a few seconds.
- Repo: public on GitHub. Demo: deploy to a public URL at the end.
- Platform name: Endcap (the paid display at the end of a store aisle). Set once in `APP_NAME` in `src/data/catalogue.ts`.
- Commit after each stage and push.
- `docs/` holds private study notes and is git-ignored.

## Pending: real products in the shopper preview

Decided by the user, not yet built (needs the Swiggy Instamart MCP, `https://mcp.swiggy.com/im`, connected and signed in):

- Take a one-time snapshot of real Instamart products (name, brand, pack size, price) for the three preview searches in `src/data/ads.ts` ("chips", "diwali gift", "ragi chips") and save it as a data file. No live calls from the app.
- Real brand names are fine for the **organic** results. **Sponsored ads stay fictional**: invented brands, bids, click rates and relevance.
- Label the page "catalogue snapshot" next to the existing "simulated" note.
- Use search/read tools only. Never call cart, checkout or order tools.

## Commands

- `npm run dev`, `npm test`, `npm run build`
