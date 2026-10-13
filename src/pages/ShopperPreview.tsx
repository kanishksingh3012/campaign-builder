import { Button, Chip, Popover, Slider, Switch } from '@heroui/react'
import { Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { SCENARIOS } from '../data/ads'
import { APP_NAME } from '../data/catalogue'
import { SNAPSHOT_DATE } from '../data/catalogueSnapshot'
import { CONVERSION_GUARDRAIL, runAuction, verdict, type AuctionSettings, type RankedAd } from '../lib/auction'
import { inr, percent } from '../lib/format'
import { PageHeader } from '../shell/Layout'
import { AnimatedNumber, Panel, SimulatedNote } from '../shell/ui'

/** The setup every change is compared against. */
const DEFAULT_SETTINGS: AuctionSettings = { slots: 2, relevanceFloor: 0.5 }

export function ShopperPreview() {
  // The Learn page links straight to a search, e.g. /preview?q=diwali-gift.
  const [params] = useSearchParams()
  const [scenarioId, setScenarioId] = useState(() => SCENARIOS.find((s) => s.id === params.get('q'))?.id ?? SCENARIOS[0].id)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [highlight, setHighlight] = useState(false)
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!
  const result = useMemo(() => runAuction(scenario, settings), [scenario, settings])
  const baseline = useMemo(() => runAuction(scenario, DEFAULT_SETTINGS), [scenario])
  const pastGuardrail = result.conversionChange < CONVERSION_GUARDRAIL
  const ctrGap = result.winners.length ? result.sponsoredCtr / result.organicCtr - 1 : 0

  return (
    <>
      <PageHeader title="Shopper preview" subtitle="What a shopper sees for a search, and what each ad setting costs them." />
      <div className="grid grid-cols-[22rem_1fr] items-start gap-5">
        <div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted">{result.winners.length} of {result.page.length} results are ads</span>
            <Switch isSelected={highlight} onChange={setHighlight}>
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                Highlight ads</Switch.Content>
            </Switch>
          </div>
          <div className="rounded-[2.25rem] border-[7px] border-ink bg-surface p-3 shadow-lift">
          <div className="mb-3 flex items-center gap-2 rounded-full bg-default px-3.5 py-2 text-sm">
            <Search size={15} className="text-muted" />
            {scenario.query}
          </div>
          <ul className="grid grid-cols-2 gap-2" aria-label="Search results">
            {result.page.map((item) => {
              const card = item.kind === 'sponsored' ? item.ad : item.result
              return (
                <li
                  key={`${item.kind}-${card.id}`}
                  className={`flex flex-col rounded-xl border p-2.5 text-sm transition-colors ${
                    item.kind === 'sponsored' ? `pop-in ${highlight ? 'border-accent bg-accent-soft' : 'border-border'}` : `border-border ${highlight ? 'opacity-55' : ''}`
                  }`}
                >
                  <DrawnPack seed={card.brand} />
                  <span className="flex min-h-5 items-center justify-between gap-1">
                    <span className="truncate text-xs text-muted">{card.brand}</span>
                    {item.kind === 'sponsored' && <WhyThisAd ad={item.ad} eligible={result.eligible.length} />}
                  </span>
                  <span className="line-clamp-2 min-h-10 font-medium leading-5">{card.product}</span>
                  <span className="min-h-4 text-xs text-muted">{card.pack}</span>
                  <span className="tabular mt-1 flex items-center justify-between">
                    {inr(card.price)}
                    <span className="rounded-lg border border-accent px-2.5 py-0.5 text-xs font-medium text-accent">Add</span>
                  </span>
                </li>
              )
            })}
          </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Controls">
            <div className="mb-5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Search query">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={s.id === scenarioId}
                  onClick={() => setScenarioId(s.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors active:scale-[0.97] ${
                    s.id === scenarioId ? 'border-accent bg-accent-soft text-accent-soft-foreground' : 'border-border text-muted hover:bg-surface-secondary'
                  }`}
                >
                  "{s.query}"
                </button>
              ))}
            </div>
            <p className="mb-5 text-sm text-muted">{scenario.note}</p>
            <div className="grid grid-cols-2 gap-8">
              <Control
                label="Ad load"
                value={`${settings.slots} of 10 results`}
                hint="How many sponsored slots the page offers."
                slider={{ value: settings.slots, min: 0, max: 5, step: 1, onChange: (slots) => setSettings((s) => ({ ...s, slots })) }}
              />
              <Control
                label="Relevance floor"
                value={settings.relevanceFloor.toFixed(2)}
                hint="Ads less relevant than this can't enter the auction, whatever they bid."
                slider={{ value: settings.relevanceFloor, min: 0, max: 1, step: 0.05, onChange: (relevanceFloor) => setSettings((s) => ({ ...s, relevanceFloor })) }}
              />
            </div>
          </Panel>

          <Panel
            title="What this setup does"
            aside={
              <Chip size="sm" variant="soft" color={pastGuardrail ? 'danger' : result.fillRate < 1 ? 'warning' : 'success'} className="whitespace-nowrap">
                {pastGuardrail ? 'Past the guardrail' : result.fillRate < 1 ? 'Slots unfilled' : 'Within the guardrail'}
              </Chip>
            }
          >
            <dl className="grid grid-cols-4 gap-4">
              <Readout label="Revenue per 1,000 searches" value={<AnimatedNumber value={result.revenuePer1000} format={inr} />} />
              <Readout label="Fill rate" value={<AnimatedNumber value={result.fillRate} format={(v) => percent(v)} />} note={`${result.winners.length} of ${settings.slots} slots`} />
              <Readout
                label="Sponsored vs organic click rate"
                value={result.winners.length ? `${ctrGap >= 0 ? '+' : '−'}${Math.abs(Math.round(ctrGap * 100))}%` : '—'}
                note={result.winners.length ? `${percent(result.sponsoredCtr, 1)} vs ${percent(result.organicCtr, 1)}` : 'No ads shown'}
              />
              <Readout label="Search conversion" value={<AnimatedNumber value={result.conversion} format={(v) => percent(v, 1)} />} note={`${signedPercent(result.conversionChange)} vs no ads`} />
            </dl>
            <p className="mt-4 rounded-xl bg-default px-3 py-2 text-sm">
              <span className="font-medium">{verdict(result, baseline)}.</span>{' '}
              <span className="text-muted">
                Revenue is compared with the default setup (2 slots, floor 0.50); conversion with a page that has no ads. The guardrail is a {Math.abs(CONVERSION_GUARDRAIL * 100)}% conversion drop.
              </span>
            </p>
          </Panel>

          <Panel title="The auction" hint="Ads are ranked by bid × predicted click rate. The winner pays just enough to beat the next ad, never more than its bid.">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Ad</th>
                  <th className="tabular px-3 py-2 text-right font-medium">Bid</th>
                  <th className="tabular px-3 py-2 text-right font-medium">Predicted click rate</th>
                  <th className="tabular px-3 py-2 text-right font-medium">Score</th>
                  <th className="tabular px-3 py-2 text-right font-medium">Relevance</th>
                  <th className="tabular px-3 py-2 text-right font-medium">Pays per click</th>
                  <th className="py-2 pl-3 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {result.eligible.map((ad) => {
                  const won = ad.rank <= result.winners.length
                  return (
                    <tr key={ad.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3">
                        <span className="block font-medium">{ad.product}</span>
                        <span className="block text-xs text-muted">{[ad.pack, ad.brand].filter(Boolean).join(' · ')}</span>
                      </td>
                      <td className="tabular px-3 py-2 text-right">{inr(ad.bid)}</td>
                      <td className="tabular px-3 py-2 text-right">{percent(ad.pCtr, 1)}</td>
                      <td className="tabular px-3 py-2 text-right font-medium">{ad.score.toFixed(2)}</td>
                      <td className="tabular px-3 py-2 text-right">{ad.relevance.toFixed(2)}</td>
                      <td className="tabular px-3 py-2 text-right">{won ? `₹${ad.cpc.toFixed(2)}` : '—'}</td>
                      <td className="py-2 pl-3">
                        <Chip size="sm" variant="soft" color={won ? 'success' : 'default'} className="whitespace-nowrap">
                          {won ? `Slot ${ad.rank}` : 'No slot left'}
                        </Chip>
                      </td>
                    </tr>
                  )
                })}
                {result.filtered.map((ad) => (
                  <tr key={ad.id} className="border-b border-border text-muted last:border-0">
                    <td className="py-2 pr-3">
                      <span className="block">{ad.product}</span>
                      <span className="block text-xs">{[ad.pack, ad.brand].filter(Boolean).join(' · ')}</span>
                    </td>
                    <td className="tabular px-3 py-2 text-right">{inr(ad.bid)}</td>
                    <td className="tabular px-3 py-2 text-right">{percent(ad.pCtr, 1)}</td>
                    <td className="tabular px-3 py-2 text-right">{(ad.bid * ad.pCtr).toFixed(2)}</td>
                    <td className="tabular px-3 py-2 text-right">{ad.relevance.toFixed(2)}</td>
                    <td className="tabular px-3 py-2 text-right">—</td>
                    <td className="py-2 pl-3">
                      <Chip size="sm" variant="soft" color="danger" className="whitespace-nowrap">
                        Below relevance floor
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
      <SimulatedNote />
      <p className="mt-1 max-w-3xl text-xs text-muted">
        Organic results use real product names and prices from a catalogue snapshot taken on {SNAPSHOT_DATE}, shown for learning only. Sponsored ads are fictional. {APP_NAME} is not affiliated with any of these brands or with any retailer.
      </p>
    </>
  )
}

/** A drawn pack tinted by brand. Every card uses one, so an ad differs from an organic result only by its label. */
function DrawnPack({ seed }: { seed: string }) {
  let hue = 0
  for (const char of seed) hue = (hue * 31 + char.charCodeAt(0)) % 360
  return (
    <span aria-hidden className="mb-2 grid h-20 place-items-center rounded-lg bg-packshot">
      <svg viewBox="0 0 44 60" className="h-[4.25rem]">
        <path d="M5 4 L8 1 L11 4 L14 1 L17 4 L20 1 L23 4 L26 1 L29 4 L32 1 L35 4 L38 1 L40 4 Q43 30 40 56 L37 59 L34 56 L31 59 L28 56 L25 59 L22 56 L19 59 L16 56 L13 59 L10 56 L7 59 L5 56 Q1 30 5 4 Z" fill={`oklch(0.68 0.15 ${hue})`} />
        <rect x="3.6" y="20" width="37" height="15" fill={`oklch(0.97 0.02 ${hue})`} />
        <text x="22" y="30.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={`oklch(0.38 0.12 ${hue})`}>
          {seed.length > 9 ? seed.slice(0, 8) + '…' : seed}
        </text>
        <circle cx="22" cy="45" r="5" fill={`oklch(0.86 0.1 ${hue})`} />
      </svg>
    </span>
  )
}

function signedPercent(fraction: number): string {
  const value = Math.round(fraction * 100)
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value)}%`
}

function WhyThisAd({ ad, eligible }: { ad: RankedAd; eligible: number }) {
  return (
    <Popover>
      <Button size="sm" variant="ghost" className="h-5 min-w-0 shrink-0 px-1.5 text-xs text-muted" aria-label={`Sponsored. Why this ad: ${ad.product}`}>
        Sponsored
      </Button>
      <Popover.Content placement="bottom end" className="w-64">
        <Popover.Dialog className="text-sm">
          <Popover.Heading className="font-semibold">Why this ad?</Popover.Heading>
          <p className="tabular mt-2">
            Bid {inr(ad.bid)} × predicted click rate {percent(ad.pCtr, 1)} = score {ad.score.toFixed(2)}
          </p>
          <p className="mt-1 text-muted">
            Ranked {ad.rank} of {eligible} eligible ads. Relevance {ad.relevance.toFixed(2)}. Pays ₹{ad.cpc.toFixed(2)} per click.
          </p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}

function Control({
  label,
  value,
  hint,
  slider,
}: {
  label: string
  value: string
  hint: string
  slider: { value: number; min: number; max: number; step: number; onChange: (value: number) => void }
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular text-muted">{value}</span>
      </div>
      <Slider aria-label={label} value={slider.value} minValue={slider.min} maxValue={slider.max} step={slider.step} onChange={(v) => slider.onChange(v as number)}>
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  )
}

function Readout({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tabular mt-1 text-xl font-semibold tracking-tight">{value}</dd>
      {note && <dd className="tabular text-xs text-muted">{note}</dd>}
    </div>
  )
}
