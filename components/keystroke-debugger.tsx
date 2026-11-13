'use client'

import { useRef, useState } from 'react'
import { Bug, Check, Copy, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type KeyEvent = { key: string; code: string; mods: string; delta: number; repeat: boolean }

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock'])
const SLOW_GAP_MS = 100

function describeMods(event: React.KeyboardEvent) {
  const mods = [event.shiftKey && 'shift', event.altKey && 'alt', event.ctrlKey && 'ctrl', event.metaKey && 'meta'].filter(Boolean)
  return mods.length ? mods.join('+') : '-'
}

// Plain-language findings the hook's behavior depends on.
function diagnose(events: KeyEvent[]) {
  if (!events.length) return []
  const findings: { label: string; tone: 'ok' | 'warn' }[] = []
  const modifierCount = events.filter((e) => MODIFIER_KEYS.has(e.key)).length
  const digitCount = events.filter((e) => /^(Digit|Numpad)\d$/.test(e.code)).length
  const hasEnter = events.some((e) => e.key === 'Enter')
  const maxGap = events.slice(1).reduce((max, e) => Math.max(max, e.delta), 0)

  findings.push({ label: `${digitCount} digit keys`, tone: 'ok' })
  findings.push(hasEnter ? { label: 'ends with Enter', tone: 'ok' } : { label: 'no Enter received', tone: 'warn' })
  findings.push(modifierCount ? { label: `${modifierCount} modifier keydowns inside the burst`, tone: 'warn' } : { label: 'no modifier keys', tone: 'ok' })
  findings.push({ label: `largest gap ${maxGap} ms`, tone: maxGap > SLOW_GAP_MS ? 'warn' : 'ok' })
  return findings
}

export function KeystrokeDebugger() {
  const [events, setEvents] = useState<KeyEvent[]>([])
  const [value, setValue] = useState('')
  const [copied, setCopied] = useState(false)
  const lastKeyTime = useRef<number | null>(null)

  const record = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const now = performance.now()
    const delta = lastKeyTime.current === null ? 0 : Math.round(now - lastKeyTime.current)
    lastKeyTime.current = now
    setEvents((items) => [...items, { key: event.key, code: event.code, mods: describeMods(event), delta, repeat: event.repeat }])
  }

  const clear = () => {
    setEvents([])
    setValue('')
    lastKeyTime.current = null
  }

  const copyReport = async () => {
    const report = JSON.stringify({ ua: navigator.userAgent, platform: navigator.platform, content: value, events }, null, 1)
    await navigator.clipboard?.writeText(report)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  const findings = diagnose(events)

  return (
    <Card className="mt-5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Bug /> Keystroke debugger</CardTitle>
            <CardDescription className="mt-1.5">Click the field, scan one label, then copy the report. It records every keydown the scanner sends: key, physical code, modifiers and the gap between keys.</CardDescription>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" onClick={copyReport} disabled={!events.length}>{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}{copied ? 'Copied' : 'Copy report'}</Button>
            <Button variant="ghost" size="icon" aria-label="Clear keystrokes" onClick={clear}><Trash2 /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={record} autoComplete="off" spellCheck={false} placeholder="Scan here" aria-label="Scan here" className="font-mono" />
        {findings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {findings.map((finding) => <Badge key={finding.label} variant={finding.tone === 'warn' ? 'destructive' : 'secondary'}>{finding.label}</Badge>)}
          </div>
        )}
        {events.length ? (
          <div className="max-h-80 overflow-auto rounded-lg border">
            <table className="w-full font-mono text-xs">
              <thead className="sticky top-0 bg-muted text-left text-muted-foreground"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">key</th><th className="px-3 py-2">code</th><th className="px-3 py-2">mods</th><th className="px-3 py-2">+ms</th></tr></thead>
              <tbody>
                {events.map((e, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-3 py-1.5">{index + 1}</td>
                    <td className="px-3 py-1.5">{JSON.stringify(e.key)}</td>
                    <td className="px-3 py-1.5">{e.code}</td>
                    <td className="px-3 py-1.5">{e.mods}</td>
                    <td className={`px-3 py-1.5 ${index > 0 && e.delta > SLOW_GAP_MS ? 'font-semibold text-destructive' : ''}`}>{e.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">No keys received yet.</div>
        )}
      </CardContent>
    </Card>
  )
}
