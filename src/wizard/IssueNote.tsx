import { Button } from '@heroui/react'
import { AlertTriangle, CircleCheck, OctagonAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** The part of an issue this component needs; `T` is whatever the fix edits (a campaign draft, an offer). */
export interface FixableIssue<T> {
  code: string
  severity: 'blocker' | 'warning'
  message: string
  fixes: { label: string; apply: (value: T) => T }[]
}

/** One problem, stated beside the field it belongs to, with its fixes one click away. */
export function IssueNote<T>({ issue, onFix }: { issue: FixableIssue<T>; onFix: (apply: (value: T) => T) => void }) {
  const blocker = issue.severity === 'blocker'
  return (
    <div
      role={blocker ? 'alert' : 'status'}
      className={`issue-in flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2 text-sm ${
        blocker ? 'bg-danger-soft text-danger-soft-foreground' : 'bg-warning-soft text-warning-soft-foreground'
      }`}
    >
      {blocker ? <OctagonAlert size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
      <span className="min-w-0 flex-1 basis-64">{issue.message}</span>
      <span className="flex gap-2">
        {issue.fixes.map((fix, i) => (
          <Button key={fix.label} size="sm" variant={i === 0 ? 'secondary' : 'ghost'} onPress={() => onFix(fix.apply)}>
            {fix.label}
          </Button>
        ))}
      </span>
    </div>
  )
}

export function IssueList<T>({ issues, onFix }: { issues: FixableIssue<T>[]; onFix: (apply: (value: T) => T) => void }) {
  // When an issue here goes away, say so briefly: the fix should be felt, not just vanish.
  const previous = useRef(issues.length)
  const [justFixed, setJustFixed] = useState(false)
  useEffect(() => {
    const dropped = issues.length < previous.current
    previous.current = issues.length
    if (!dropped) return
    setJustFixed(true)
    const timer = setTimeout(() => setJustFixed(false), 1400)
    return () => clearTimeout(timer)
  }, [issues.length])

  if (issues.length === 0 && !justFixed) return null
  return (
    <div className="flex flex-col gap-2">
      {issues.map((issue) => (
        <IssueNote key={issue.code} issue={issue} onFix={onFix} />
      ))}
      {justFixed && (
        <p role="status" className="fixed-out flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2 text-sm text-success-soft-foreground">
          <CircleCheck size={16} /> Fixed
        </p>
      )}
    </div>
  )
}
