import { Button } from '@heroui/react'
import { AlertTriangle, OctagonAlert } from 'lucide-react'
import type { Draft, Issue } from '../lib/types'

/** One problem, stated beside the field it belongs to, with its fixes one click away. */
export function IssueNote({ issue, onFix }: { issue: Issue; onFix: (apply: (draft: Draft) => Draft) => void }) {
  const blocker = issue.severity === 'blocker'
  return (
    <div
      role={blocker ? 'alert' : 'status'}
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2 text-sm ${
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

export function IssueList({ issues, onFix }: { issues: Issue[]; onFix: (apply: (draft: Draft) => Draft) => void }) {
  if (issues.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {issues.map((issue) => (
        <IssueNote key={issue.code} issue={issue} onFix={onFix} />
      ))}
    </div>
  )
}
