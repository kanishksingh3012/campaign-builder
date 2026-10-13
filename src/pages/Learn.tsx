import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { SCENARIOS } from '../data/ads'
import { SEED_CAMPAIGNS } from '../data/campaigns'
import { APP_NAME, BRAND } from '../data/catalogue'
import { SNAPSHOT_DATE } from '../data/catalogueSnapshot'
import { FORMATS, GOALS } from '../data/goals'
import { CONVERSION_GUARDRAIL, rankAds } from '../lib/auction'
import { ORDER_RATE } from '../lib/estimate'
import { count, inr, percent } from '../lib/format'
import { performance } from '../lib/simulate'
import type { GoalId } from '../lib/types'
import { PageHeader } from '../shell/Layout'
import { GoalTag, Panel } from '../shell/ui'

const SECTIONS = [
  ['start', 'Start here'],
  ['exercises', 'Three exercises'],
  ['words', 'Words you need'],
  ['formats', 'Formats and goals'],
  ['auction', 'How the auction works'],
  ['numbers', 'Where numbers come from'],
  ['real', 'What is real'],
] as const

const EXERCISES: { title: string; time: string; to: string; cta: string; steps: string[]; lesson: string }[] = [
  {
    title: 'Break a budget, then fix it',
    time: '3 minutes',
    to: '/campaigns/new',
    cta: 'Start a campaign',
    steps: [
      'Pick the New customers goal and press Next twice.',
      'Tick a few products, including Peri Peri, which is out of stock. Choose one of the two fixes.',
      'On the budget step, type 60000 and drag the Category boost slider left.',
      'Clear each red message with the button beside it.',
    ],
    lesson: 'Red stops you because the campaign cannot work. Amber warns you and lets you decide. Every message carries its own fix.',
  },
  {
    title: 'Let a dish wash gel win a Diwali search',
    time: '2 minutes',
    to: '/preview?q=diwali-gift',
    cta: 'Open "diwali gift"',
    steps: [
      'Drag Ad load from 2 to 5.',
      'Drag Relevance floor all the way down to 0.',
      'Read the auction table: which ads won, and what do they have to do with gifts?',
      'Raise the floor again until the label turns green.',
    ],
    lesson: 'If only money decides, the highest bidder buys a place on any search. A relevance floor keeps ads that do not belong out of the auction.',
  },
  {
    title: 'Leave ad slots empty on purpose',
    time: '2 minutes',
    to: '/preview?q=ragi-chips',
    cta: 'Open "ragi chips"',
    steps: [
      'Drag Ad load to 5.',
      'Drag Relevance floor up to 0.80 and watch Fill rate.',
      'Now drag it down to 0 and watch Search conversion.',
    ],
    lesson: 'On a niche search few advertisers are truly relevant. A strict floor protects the shopper and leaves revenue unsold. That tension has no free answer.',
  },
]

const WORDS: [string, string][] = [
  ['Impression', 'One time an ad was shown to a shopper.'],
  ['Click rate', 'Clicks divided by impressions. 100 impressions and 4 clicks is 4%.'],
  ['Pay per click', 'The brand is charged only when someone clicks. Used for ads inside lists of products.'],
  ['Pay per 1,000 views', 'The brand is charged for being shown, clicked or not. Used for banners.'],
  ['Return on ad spend', 'Sales from ads divided by what the ads cost. Spend ₹100, sell ₹437: the return is 4.37×.'],
  ['New-to-brand', 'An order from a shopper who has not bought this brand in the last 12 months.'],
  ['Format', 'A type of ad placement, such as a home banner or a sponsored slot in search.'],
  ['Bundle', 'The set of formats that comes with a goal.'],
  ['Bid', 'The most a brand will pay for one click.'],
  ['Relevance', 'How well a product matches the search, from 0 to 1.'],
  ['Ad load', 'How many of the results on a page are ads.'],
  ['Fill rate', 'Of the ad slots on offer, the share that got an ad.'],
  ['Conversion', 'The share of searches that end with a purchase.'],
  ['Guardrail', 'A limit the platform will not cross to earn more.'],
  ['Pacing', 'How a budget is spread over the campaign: evenly, or more at the start.'],
  ['Lakh', '1,00,000. Indian number grouping is used throughout.'],
]

export function Learn() {
  const chips = SCENARIOS[0]
  const { ranked, filtered } = rankAds(chips.ads, 0.5)
  const [first, second] = ranked
  const tryCrisp = SEED_CAMPAIGNS.find((c) => c.id === 'cmp2')!
  const result = performance(tryCrisp)

  return (
    <>
      <PageHeader title="Learn" subtitle="How retail ads work, using this app as the worked example." />

      <nav aria-label="On this page" className="mb-4 flex flex-wrap gap-1.5">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-border px-3 py-1 text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
            {label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-4">
        <Panel title="Start here">
          <div id="start" className="max-w-3xl scroll-mt-4 text-sm leading-6">
            <p>
              {APP_NAME} is a practice version of the tool a brand uses to buy advertising inside a quick commerce app. You play {BRAND}, a made-up snack company with ₹6,00,000 to spend. Nothing here is
              connected to a real account, so you cannot break anything, and <strong className="font-medium">Reset demo data</strong> in the sidebar puts everything back.
            </p>
            <p className="mt-3">Three parties are always involved, and each wants something different:</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              <li>
                <strong className="font-medium">The brand</strong> pays to be seen more. It wants sales.
              </li>
              <li>
                <strong className="font-medium">The platform</strong> sells that visibility. It wants revenue without making the app worse to shop on.
              </li>
              <li>
                <strong className="font-medium">The shopper</strong> searched for chips and wants good chips. Every ad takes a place a better result could have had.
              </li>
            </ul>
            <p className="mt-3 text-muted">
              This is a learning prototype. The brand and advertisers are fictional, every figure is simulated, and it is not affiliated with any company. The ideas (goal-first campaigns, second-price
              auctions, relevance thresholds) come from publicly documented retail ad tools, simplified.
            </p>
          </div>
        </Panel>

        <section id="exercises" className="scroll-mt-4">
          <h2 className="mb-3 text-sm font-semibold">Three exercises</h2>
          <ol className="grid grid-cols-3 gap-4">
            {EXERCISES.map((exercise, i) => (
              <li key={exercise.title} className="flex flex-col rounded-2xl border border-border bg-surface p-5 text-sm shadow-card">
                <span className="flex items-center justify-between">
                  <span className="tabular grid size-7 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-soft-foreground">{i + 1}</span>
                  <span className="text-xs text-muted">{exercise.time}</span>
                </span>
                <h3 className="mt-3 font-semibold text-balance">{exercise.title}</h3>
                <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 text-muted">
                  {exercise.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="mt-3 rounded-xl bg-default px-3 py-2">{exercise.lesson}</p>
                <Link to={exercise.to} className="mt-4 inline-flex items-center gap-1.5 self-start pt-1 font-medium text-accent hover:underline">
                  {exercise.cta}
                  <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted">
            Want a fourth? Switch to <strong className="font-medium text-foreground">Internal view</strong> in the top bar, submit a campaign, and approve or reject it yourself in the review queue.
          </p>
        </section>

        <Panel title="Words you need" hint="If you can explain each of these in a sentence, you can explain the product.">
          <dl id="words" className="grid scroll-mt-4 grid-cols-2 gap-x-10 gap-y-3 text-sm">
            {WORDS.map(([term, meaning]) => (
              <div key={term} className="grid grid-cols-[9rem_1fr] gap-3">
                <dt className="font-medium">{term}</dt>
                <dd className="text-muted">{meaning}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Formats and goals" hint="A format is where an ad appears. A goal is the outcome the brand wants, and it decides which formats are used.">
          <div id="formats" className="grid scroll-mt-4 grid-cols-2 items-start gap-8">
            <Table head={['Format', 'Where the shopper sees it', 'Charged', 'Usual cost']} numeric={[3]}>
              {Object.values(FORMATS).map((format) => (
                <tr key={format.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium">{format.name}</td>
                  <td className="px-3 py-2 text-muted">{format.placement}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted">{format.pricing === 'CPC' ? 'Per click' : 'Per 1,000 views'}</td>
                  <td className="tabular py-2 pl-3 text-right">{inr(format.avgCost)}</td>
                </tr>
              ))}
            </Table>
            <Table head={['Goal', 'Judged on', 'Formats it uses', 'Minimum']} numeric={[3]}>
              {(Object.keys(GOALS) as GoalId[]).map((id) => {
                const goal = GOALS[id]
                return (
                  <tr key={id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3">
                      <GoalTag goal={id} />
                    </td>
                    <td className="px-3 py-2 text-muted">{goal.judgedOn}</td>
                    <td className="px-3 py-2 text-muted">{goal.bundle.length ? goal.bundle.map((item) => `${FORMATS[item.format].name} ${item.share}%`).join(', ') : 'Any, chosen by you'}</td>
                    <td className="tabular py-2 pl-3 text-right">{inr(goal.minBudget)}</td>
                  </tr>
                )
              })}
            </Table>
          </div>
        </Panel>

        <Panel title="How the auction works" hint={`Run on every search. The numbers below are from the "${chips.query}" search at the starting settings.`}>
          <div id="auction" className="grid scroll-mt-4 grid-cols-2 gap-8 text-sm leading-6">
            <ol className="flex list-decimal flex-col gap-3 pl-5">
              <li>
                <strong className="font-medium">Filter by relevance.</strong> Any ad below the relevance floor is removed, whatever it bid. At a floor of 0.50, {filtered.map((ad) => ad.product).join(' and ')}{' '}
                are out, even though {filtered.reduce((a, b) => (a.bid > b.bid ? a : b)).product} bid the most ({inr(Math.max(...filtered.map((ad) => ad.bid)))}).
              </li>
              <li>
                <strong className="font-medium">Score the rest.</strong> Score = bid × predicted click rate. {first.product} bids {inr(first.bid)} and is clicked {percent(first.pCtr, 1)} of the time:{' '}
                <span className="tabular">{first.score.toFixed(2)}</span>. {second.product} bids only {inr(second.bid)} but is clicked {percent(second.pCtr, 1)} of the time:{' '}
                <span className="tabular">{second.score.toFixed(2)}</span>.
              </li>
              <li>
                <strong className="font-medium">Hand out the slots.</strong> The highest scores take the available slots in order.
              </li>
              <li>
                <strong className="font-medium">Charge the winners.</strong> Each pays just enough to beat the ad below it, never more than its bid. {first.product} must beat a score of{' '}
                {second.score.toFixed(2)} with a click rate of {percent(first.pCtr, 1)}, so it pays <span className="tabular">₹{first.cpc.toFixed(2)}</span> a click, not the {inr(first.bid)} it bid.
              </li>
            </ol>
            <div className="flex flex-col gap-3">
              <p>
                Two things follow. The score is what the platform expects to earn each time it shows the ad, so <strong className="font-medium">an ad people click can beat a higher bid</strong>. And
                because a winner pays the price needed to win, not its own bid, a brand has no reason to bid below what a click is worth to it. This is called a second-price auction.
              </p>
              <p>
                The shopper's side is measured as search conversion. A page with no ads converts at 34%. Putting a less relevant ad in a high position lowers it; an ad more relevant than what it
                replaced raises it. The guardrail here is a {Math.abs(CONVERSION_GUARDRAIL * 100)}% drop.
              </p>
              <p className="text-muted">Real platforms rank with more signals than these two, and research on how much extra ads hurt conversion is mixed. This model shows the direction, not the size.</p>
              <Link to="/preview" className="inline-flex items-center gap-1.5 self-start font-medium text-accent hover:underline">
                Try it in the shopper preview
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Panel>

        <Panel title="Where numbers come from" hint="Nothing is measured. Each figure is calculated from spend with fixed assumptions, so you can trace any of them.">
          <div id="numbers" className="grid scroll-mt-4 grid-cols-[3fr_2fr] items-start gap-8">
            <Table head={[`${tryCrisp.name}, after a reset`, 'How it is calculated', 'Result']} numeric={[2]}>
              {result.byFormat.flatMap((row) => {
                const format = FORMATS[row.format]
                return [
                  <Row key={`${row.format}-spend`} label={`Spend on ${format.name}`} how={`${inr(tryCrisp.spent)} spent × ${tryCrisp.split[row.format]}% share`} value={inr(row.spend)} />,
                  <Row key={`${row.format}-clicks`} label={`${format.name} clicks`} how={`${inr(row.spend)} ÷ ${inr(format.avgCost)} a click`} value={count(row.clicks)} />,
                  <Row key={`${row.format}-orders`} label={`${format.name} orders`} how={`${count(row.clicks)} clicks × ${percent(ORDER_RATE[row.format])} become orders`} value={count(row.orders)} />,
                ]
              })}
              <Row label="New customers" how={`${count(result.orders)} orders × 82% are new-to-brand`} value={count(result.headline)} />
              <Row label="Sales from ads" how={`${count(result.orders)} orders × ₹165 average`} value={inr(result.sales)} />
              <Row label="Return on ad spend" how={`${inr(result.sales)} ÷ ${inr(tryCrisp.spent)}`} value={`${result.roas.toFixed(2)}×`} />
              <Row label="Cost per new customer" how={`${inr(tryCrisp.spent)} ÷ ${count(result.headline)}`} value={inr(tryCrisp.spent / result.headline)} />
            </Table>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted">
              <li>Formats closer to the moment of buying turn more clicks into orders: 6% for a home banner, 30% for the buy again slot.</li>
              <li>Banners are bought by views, so their clicks are views × click rate.</li>
              <li>An awareness campaign's reach is its impressions ÷ 3, assuming each shopper sees the ad about three times.</li>
              <li>Estimates in the campaign wizard use the same sums on the planned budget, shown as a range 12% either side.</li>
              <li>Today is fixed at 14 Oct 2026 inside the app, so the sample data never goes stale.</li>
            </ul>
          </div>
        </Panel>

        <Panel title="What is real and what is not">
          <div id="real" className="scroll-mt-4">
            <Table head={['Thing', 'Status']}>
              <Row label={`${APP_NAME}, ${BRAND} and every advertiser in the auction`} how="Invented" />
              <Row label="Campaigns, spend, sales, orders, audiences and estimates" how="Invented, then calculated by fixed formulas" />
              <Row label="Bids, click rates and relevance scores" how="Invented to make the trade-off visible" />
              <Row label="Organic product names, pack sizes and prices in the shopper preview" how={`Real, from a one-time catalogue snapshot on ${SNAPSHOT_DATE}. Shown for learning only; no affiliation with those brands.`} />
              <Row label="Sign-in, payments, file upload, a server" how="Not built. Everything runs and is saved in your browser." />
              <Row label="Goal-first campaigns, second-price auction, relevance floor, new-to-brand" how="Real ideas from public retail ad tools, simplified" />
            </Table>
          </div>
        </Panel>
      </div>
    </>
  )
}

function Table({ head, numeric = [], children }: { head: string[]; numeric?: number[]; children: ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted">
          {head.map((label, i) => (
            <th key={label} className={`py-2 font-medium ${i === 0 ? 'pr-3' : i === head.length - 1 ? 'pl-3' : 'px-3'} ${numeric.includes(i) ? 'text-right' : ''}`}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

function Row({ label, how, value }: { label: string; how: string; value?: string }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-3 font-medium">{label}</td>
      <td className={`py-2 text-muted ${value === undefined ? 'pl-3' : 'px-3'}`}>{how}</td>
      {value !== undefined && <td className="tabular py-2 pl-3 text-right whitespace-nowrap">{value}</td>}
    </tr>
  )
}
