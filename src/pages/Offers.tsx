import { Button, Checkbox, Chip, Input, ProgressBar } from '@heroui/react'
import { AlertTriangle, ArrowLeft, Check, OctagonAlert, Plus, Zap } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { TODAY } from '../data/campaigns'
import { BRAND, PRODUCTS } from '../data/catalogue'
import { CITIES } from '../data/goals'
import { count, daysBetween, inr, percent } from '../lib/format'
import {
  blankOffer,
  depth,
  offerLabel,
  publishedStatus,
  redemption,
  redemptionsCovered,
  TEMPLATES,
  validateOffer,
  type Offer,
  type OfferIssue,
  type OfferStatus,
  type OfferTemplate,
} from '../lib/offers'
import { PageHeader } from '../shell/Layout'
import { Panel, SimulatedNote } from '../shell/ui'
import { useStore } from '../state/store'
import { IssueList } from '../wizard/IssueNote'

const STATUS: Record<OfferStatus, { label: string; color: 'default' | 'accent' | 'success' | 'warning' }> = {
  draft: { label: 'Draft', color: 'default' },
  scheduled: { label: 'Scheduled', color: 'accent' },
  live: { label: 'Live', color: 'success' },
  paused: { label: 'Paused', color: 'warning' },
  ended: { label: 'Ended', color: 'default' },
}

const DAY = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const day = (date: string) => DAY.format(new Date(date))

export function Offers() {
  const navigate = useNavigate()
  const { offers, dispatch } = useStore()
  const create = (
    <Button variant="primary" onPress={() => navigate('/offers/new')}>
      <Plus size={16} />
      Create offer
    </Button>
  )

  return (
    <>
      <PageHeader title="Offers" subtitle="Price offers you fund yourself. Set one up today and it's live today." actions={create} />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">Offer</th>
              <th className="px-3 py-2.5 font-medium">Shoppers see</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Dates</th>
              <th className="w-56 px-3 py-2.5 font-medium">Discounts funded</th>
              <th className="px-4 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className="border-b border-border last:border-0 hover:bg-surface-secondary">
                <td className="px-4 py-3">
                  <Link to={`/offers/${offer.id}/edit`} className="font-medium hover:underline">
                    {offer.name || 'Untitled offer'}
                  </Link>
                  <span className="block text-xs text-muted">
                    {PRODUCTS.filter((p) => offer.productIds.includes(p.id)).map((p) => p.name).join(', ')}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <OfferBadge>{offerLabel(offer)}</OfferBadge>
                </td>
                <td className="px-3 py-3">
                  <Chip size="sm" variant="soft" color={STATUS[offer.status].color} className="whitespace-nowrap">
                    {STATUS[offer.status].label}
                  </Chip>
                </td>
                <td className="tabular px-3 py-3 whitespace-nowrap text-muted">
                  {day(offer.startDate)} – {day(offer.endDate)}
                </td>
                <td className="px-3 py-3">
                  <ProgressBar aria-label={`${offer.name} budget used`} value={(offer.funded / offer.budgetCap) * 100} size="sm">
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                  <p className="tabular mt-1 text-xs text-muted">
                    {inr(offer.funded)} of {inr(offer.budgetCap)} cap
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  {offer.status === 'live' && (
                    <Button size="sm" variant="secondary" onPress={() => dispatch({ type: 'set_offer_status', id: offer.id, status: 'paused' })}>
                      Pause
                    </Button>
                  )}
                  {offer.status === 'paused' && (
                    <Button size="sm" variant="secondary" onPress={() => dispatch({ type: 'set_offer_status', id: offer.id, status: 'live' })}>
                      Resume
                    </Button>
                  )}
                  {(offer.status === 'draft' || offer.status === 'scheduled') && (
                    <Button size="sm" variant="secondary" onPress={() => navigate(`/offers/${offer.id}/edit`)}>
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {offers.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium">No offers yet</p>
            <p className="mt-1 text-sm text-muted">Pick a template, choose products, set a cap. No app update needed.</p>
            <div className="mt-4 flex justify-center">{create}</div>
          </div>
        )}
      </div>
      <SimulatedNote />
    </>
  )
}

const OfferBadge = ({ children }: { children: ReactNode }) => (
  <span className="inline-block rounded-md bg-success-soft px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-success-soft-foreground">{children}</span>
)

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function NumberInput({ label, value, onChange, width = 'w-20' }: { label: string; value: number; onChange: (value: number) => void; width?: string }) {
  return (
    <Input
      aria-label={label}
      inputMode="numeric"
      className={`tabular ${width}`}
      value={value ? value.toLocaleString('en-IN') : ''}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')))}
    />
  )
}

/** One page: every choice updates the shopper preview beside it, so the brand sees the offer before it exists. */
export function OfferBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { offers, dispatch } = useStore()
  const editing = offers.find((o) => o.id === id)
  const [offer, setOffer] = useState<Offer>(() => (editing ? { ...editing } : blankOffer()))

  const issues = useMemo(() => validateOffer(offer, PRODUCTS, offers), [offer, offers])
  const blockerCount = issues.filter((i) => i.severity === 'blocker').length
  const update = (apply: (o: Offer) => Offer) => setOffer(apply)
  const set = (change: Partial<Offer>) => update((o) => ({ ...o, ...change }))
  const at = (field: OfferIssue['field']) => issues.filter((i) => i.field === field)
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const items = PRODUCTS.filter((p) => offer.productIds.includes(p.id))
  const r = redemption(offer, PRODUCTS)
  const covered = redemptionsCovered(offer, PRODUCTS)
  const days = offer.endDate >= offer.startDate ? daysBetween(offer.startDate, offer.endDate) : 0
  const goesLiveNow = offer.startDate <= TODAY
  const full = items.reduce((sum, p) => sum + p.price, 0)

  function save(status: OfferStatus) {
    dispatch({ type: 'upsert_offer', offer: { ...offer, name: offer.name.trim() || `${BRAND} ${offerLabel(offer)}`, status } })
    navigate('/offers')
  }

  return (
    <div className="pb-20">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/offers" aria-label="Back to offers" className="rounded-lg p-1.5 text-muted hover:bg-default">
            <ArrowLeft size={18} />
          </Link>
          <Input aria-label="Offer name" value={offer.name} placeholder="Name this offer" className="w-72 font-medium" onChange={(e) => set({ name: e.target.value })} />
        </div>
        {(offer.status === 'draft' || !editing) && (
          <Button variant="secondary" onPress={() => save('draft')}>
            Save draft
          </Button>
        )}
      </header>

      <div className="grid grid-cols-[1fr_20rem] items-start gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Offer type" hint="These three are already built into the app, so a new offer needs no app update.">
            <div role="radiogroup" aria-label="Offer type" className="grid grid-cols-3 gap-3">
              {(Object.keys(TEMPLATES) as OfferTemplate[]).map((template) => {
                const selected = offer.template === template
                return (
                  <button
                    key={template}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set({ template })}
                    className={`rounded-xl border p-3.5 text-left text-sm transition-colors ${selected ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface-secondary'}`}
                  >
                    <span className="flex items-center justify-between font-semibold">
                      {TEMPLATES[template].name}
                      {selected && <Check size={15} className="text-accent" />}
                    </span>
                    <span className="mt-1 block text-muted">e.g. {TEMPLATES[template].example}</span>
                    <span className="mt-2 block text-xs text-muted">{TEMPLATES[template].needs}</span>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card title="Products" hint={`${items.length} selected`}>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
              {PRODUCTS.map((product) => (
                <li key={product.id} className="py-1">
                  <Checkbox className="flex-row items-center gap-2.5" isSelected={offer.productIds.includes(product.id)} onChange={() => set({ productIds: toggle(offer.productIds, product.id) })}>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content>
                      <span className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{product.name}</span>
                        <span className="tabular text-muted">
                          {product.size} · {inr(product.price)}
                        </span>
                        {!product.inStock && (
                          <Chip size="sm" variant="soft" color="warning" className="whitespace-nowrap">
                            Out of stock
                          </Chip>
                        )}
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                </li>
              ))}
            </ul>
            <div className="mt-3 empty:hidden">
              <IssueList issues={at('products')} onFix={update} />
            </div>
          </Card>

          <Card title="Terms">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {offer.template === 'bxgy' && (
                <>
                  Buy <NumberInput label="Quantity to buy" value={offer.buyQty} onChange={(buyQty) => set({ buyQty })} width="w-16" /> get{' '}
                  <NumberInput label="Quantity free" value={offer.getQty} onChange={(getQty) => set({ getQty })} width="w-16" /> free
                </>
              )}
              {offer.template === 'percent' && (
                <>
                  <NumberInput label="Percent off" value={offer.percent} onChange={(value) => set({ percent: value })} width="w-16" /> % off each product
                </>
              )}
              {offer.template === 'bundle' && (
                <>
                  All {items.length || 'selected'} products together for ₹
                  <NumberInput label="Bundle price in rupees" value={offer.bundlePrice} onChange={(bundlePrice) => set({ bundlePrice })} width="w-24" />
                  {items.length >= 2 && <span className="tabular text-muted">(separately {inr(full)})</span>}
                </>
              )}
            </div>
            <div className="mt-3 empty:hidden">
              <IssueList issues={at('terms')} onFix={update} />
            </div>
          </Card>

          <Card title="Budget cap" hint="You fund the discount. The offer stops by itself when the cap is reached, so it can never cost more than this.">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">₹</span>
              <NumberInput label="Budget cap in rupees" value={offer.budgetCap} onChange={(budgetCap) => set({ budgetCap })} width="w-40" />
              {covered > 0 && (
                <span className="tabular text-muted">
                  covers about {count(covered)} uses at {inr(r.saves)} each
                </span>
              )}
            </div>
            <div className="mt-3 empty:hidden">
              <IssueList issues={at('budget')} onFix={update} />
            </div>
          </Card>

          <Card title="Where and when" hint={days > 0 ? `${days} days` : undefined}>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cities">
              {CITIES.map((city) => {
                const on = offer.cityIds.includes(city.id)
                return (
                  <button
                    key={city.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ cityIds: toggle(offer.cityIds, city.id) })}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${on ? 'border-accent bg-accent-soft text-accent-soft-foreground' : 'border-border text-muted hover:bg-surface-secondary'}`}
                  >
                    {city.name}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 empty:hidden">
              <IssueList issues={at('cities')} onFix={update} />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="font-medium">Starts</span>
                <Input type="date" value={offer.startDate} onChange={(e) => set({ startDate: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">Ends</span>
                <Input type="date" value={offer.endDate} onChange={(e) => set({ endDate: e.target.value })} />
              </label>
            </div>
            <div className="mt-3 empty:hidden">
              <IssueList issues={at('schedule')} onFix={update} />
            </div>
          </Card>
        </div>

        <aside className="sticky top-6 flex flex-col gap-4" aria-label="Preview and summary">
          <Panel title="What shoppers see">
            {items.length === 0 ? (
              <p className="text-sm text-muted">Choose a product to preview the offer.</p>
            ) : (
              <>
                <div className="rounded-xl border border-border p-3 text-sm">
                  <span className="mb-2 block h-20 rounded-lg bg-default" aria-hidden />
                  <OfferBadge>{offerLabel(offer)}</OfferBadge>
                  <p className="mt-1.5 text-xs text-muted">{BRAND}</p>
                  <p className="font-medium">{offer.template === 'bundle' ? items.map((p) => p.name).join(' + ') : items[0].name}</p>
                  <p className="tabular mt-1 flex items-baseline gap-2">
                    <span className="font-semibold">{inr(r.pays)}</span>
                    {r.saves > 0 && <span className="text-xs text-muted line-through">{inr(r.full)}</span>}
                    {r.units > 1 && <span className="text-xs text-muted">for {r.units}</span>}
                  </p>
                </div>
                <dl className="tabular mt-3 grid grid-cols-[1fr_auto] gap-y-1.5 text-sm">
                  <dt className="text-muted">In the cart</dt>
                  <dd className="text-right">
                    {r.units} item{r.units === 1 ? '' : 's'}
                  </dd>
                  <dt className="text-muted">Shelf price</dt>
                  <dd className="text-right">{inr(r.full)}</dd>
                  <dt className="text-muted">Offer saving</dt>
                  <dd className="text-right text-success">−{inr(r.saves)}</dd>
                  <dt className="font-medium">Shopper pays</dt>
                  <dd className="text-right font-semibold">{inr(r.pays)}</dd>
                </dl>
                <p className="mt-3 text-xs text-muted">
                  That's {percent(depth(offer, PRODUCTS))} off, funded by you.
                  {offer.template === 'percent' && items.length > 1 && ' Shown for an average-priced product.'}
                </p>
              </>
            )}
          </Panel>

          <Panel>
            {issues.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-success">
                <Check size={15} /> Ready to publish
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {issues.map((issue) => (
                  <li key={issue.code} className={`flex items-start gap-2 ${issue.severity === 'blocker' ? 'text-danger' : 'text-warning'}`}>
                    {issue.severity === 'blocker' ? <OctagonAlert size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                    <span className="text-foreground">{issue.message.split('.')[0]}.</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      <footer className="fixed right-0 bottom-0 left-56 border-t border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-3">
          <p className="flex items-center gap-2 text-sm text-muted">
            {blockerCount > 0 ? (
              `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} to fix before you can publish.`
            ) : (
              <>
                <Zap size={14} />
                {goesLiveNow ? 'Checks pass. Goes live in the app within minutes, no app update needed.' : `Checks pass. Goes live on ${day(offer.startDate)}.`}
              </>
            )}
          </p>
          <Button variant="primary" isDisabled={blockerCount > 0} onPress={() => save(editing && editing.status !== 'draft' ? editing.status : publishedStatus(offer))}>
            {editing && editing.status !== 'draft' ? 'Save changes' : goesLiveNow ? 'Publish now' : 'Schedule offer'}
          </Button>
        </div>
      </footer>
    </div>
  )
}
