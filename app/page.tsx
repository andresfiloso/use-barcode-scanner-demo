'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Barcode,
  Camera,
  Check,
  CircleHelp,
  Clipboard,
  Copy,
  GitBranch,
  Keyboard,
  LifeBuoy,
  ListRestart,
  Package,
  Play,
  ScanLine,
  Smartphone,
  Trash2,
  Usb,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const demoValues = ['8901030897617', 'https://acme.dev/scan/42', 'SKU-RED-XL-009']

type Scan = { value: string; format: string; source: string; time: string }

function formatTime() {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date())
}

export default function Page() {
  const [mode, setMode] = useState('handheld')
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<Scan | null>(null)
  const [history, setHistory] = useState<Scan[]>([])
  const [copied, setCopied] = useState(false)
  const scannerBuffer = useRef('')
  const lastKeyAt = useRef(0)

  const addScan = useCallback((value: string, source = mode === 'handheld' ? 'Handheld' : 'Camera') => {
    if (!value.trim()) return
    const scan: Scan = { value: value.trim(), format: value.startsWith('http') ? 'QR_CODE' : 'CODE_128', source, time: formatTime() }
    setLastScan(scan)
    setHistory((items) => [scan, ...items].slice(0, 6))
    setScanning(false)
  }, [mode])

  useEffect(() => {
    if (mode !== 'handheld') return
    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now()
      if (now - lastKeyAt.current > 100) scannerBuffer.current = ''
      lastKeyAt.current = now
      if (event.key === 'Enter') {
        addScan(scannerBuffer.current, 'Handheld')
        scannerBuffer.current = ''
      } else if (event.key.length === 1) {
        scannerBuffer.current += event.key
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, addScan])

  const simulateScan = () => {
    setScanning(true)
    window.setTimeout(() => addScan(demoValues[history.length % demoValues.length]), 700)
  }

  const copyValue = async () => {
    if (!lastScan) return
    await navigator.clipboard?.writeText(lastScan.value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ScanLine /></div>
            <div><p className="font-semibold tracking-tight">use-barcode-scanner</p><p className="text-xs text-muted-foreground">interactive test bench</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><a href="https://www.npmjs.com/package/use-barcode-scanner" target="_blank" rel="noreferrer"><Package data-icon="inline-start" /> npm</a></Button>
            <Button asChild variant="outline" size="sm"><a href="https://github.com" target="_blank" rel="noreferrer"><GitBranch data-icon="inline-start" /> GitHub</a></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 max-w-2xl">
          <Badge variant="secondary" className="mb-4 gap-1.5"><Check /> ready to scan</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Test your barcode scanner setup.</h1>
          <p className="mt-3 text-base text-muted-foreground">A small playground for trying <code className="rounded bg-muted px-1.5 py-0.5 text-sm">use-barcode-scanner</code> with the hardware and camera workflows your app needs.</p>
        </div>

        <Tabs value={mode} onValueChange={setMode} className="space-y-5">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="handheld"><Usb data-icon="inline-start" /> Handheld scanner</TabsTrigger>
            <TabsTrigger value="mobile"><Smartphone data-icon="inline-start" /> Mobile scanner</TabsTrigger>
          </TabsList>

          <TabsContent value="handheld" className="mt-0">
            <Card>
              <CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Keyboard /> Keyboard-wedge input</CardTitle><CardDescription className="mt-1.5">Connect a USB or Bluetooth scanner. It behaves like a keyboard and ends with Enter.</CardDescription></div><Badge variant="outline" className="shrink-0">listening</Badge></div></CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center"><Barcode className="mx-auto mb-3 text-muted-foreground" /><p className="font-medium">Scan a barcode now</p><p className="mt-1 text-sm text-muted-foreground">Focus this page, then pull the trigger on your scanner.</p><Button className="mt-5" variant="outline" onClick={simulateScan}><Play data-icon="inline-start" /> Simulate scan</Button></div>
                <div className="grid gap-3 sm:grid-cols-3"><Stat label="Input mode" value="Keyboard" /><Stat label="Terminator" value="Enter" /><Stat label="Debounce" value="100 ms" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="mt-0">
            <Card>
              <CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Camera /> Camera input</CardTitle><CardDescription className="mt-1.5">Use your phone camera to scan QR codes and common 1D barcodes.</CardDescription></div><Badge variant={scanning ? 'default' : 'outline'}>{scanning ? 'scanning' : 'idle'}</Badge></div></CardHeader>
              <CardContent className="space-y-5">
                <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-xl border bg-muted/30"><div className="absolute inset-x-14 top-1/2 border-t border-primary" /><div className="absolute inset-10 rounded-lg border-2 border-primary/50" />{scanning ? <div className="z-10 flex flex-col items-center gap-3 text-sm text-muted-foreground"><div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />Looking for a barcode…</div> : <div className="z-10 flex flex-col items-center gap-3 text-sm text-muted-foreground"><Camera />Camera preview will appear here</div>}</div>
                <div className="flex flex-wrap gap-2"><Button onClick={simulateScan} disabled={scanning}><Camera data-icon="inline-start" /> {scanning ? 'Scanning…' : 'Start camera scan'}</Button><Button variant="outline" onClick={() => setScanning(false)}>Stop</Button></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Latest result</CardTitle><CardDescription>The value your hook callback receives.</CardDescription></div>{lastScan && <Button variant="ghost" size="sm" onClick={copyValue}>{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}{copied ? 'Copied' : 'Copy'}</Button>}</div></CardHeader><CardContent>{lastScan ? <div className="rounded-lg border bg-muted/30 p-4"><p className="break-all font-mono text-sm">{lastScan.value}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{lastScan.format}</Badge><Badge variant="outline">{lastScan.source}</Badge><span className="text-xs text-muted-foreground">{lastScan.time}</span></div></div> : <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">Your next scan will show up here.</div>}</CardContent></Card>
          <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Scan history</CardTitle><CardDescription>Last six successful reads.</CardDescription></div><Button variant="ghost" size="icon" aria-label="Clear history" onClick={() => { setHistory([]); setLastScan(null) }}><Trash2 /></Button></div></CardHeader><CardContent>{history.length ? <div className="flex flex-col gap-3">{history.map((scan, index) => <div key={`${scan.time}-${index}`} className="flex items-center gap-3 text-sm"><div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted"><Barcode /></div><div className="min-w-0 flex-1"><p className="truncate font-mono">{scan.value}</p><p className="text-xs text-muted-foreground">{scan.format} · {scan.time}</p></div></div>)}</div> : <p className="py-5 text-center text-sm text-muted-foreground">No scans yet.</p>}</CardContent></Card>
        </div>

        <Separator className="my-10" />
        <div className="grid gap-5 md:grid-cols-3"><InfoCard icon={<ListRestart />} title="Simple callback flow" text="Get a value, format, and timestamp from every successful scan." /><InfoCard icon={<CircleHelp />} title="Multiple formats" text="Try QR_CODE, CODE_128, EAN_13, and more in one hook." /><InfoCard icon={<LifeBuoy />} title="Made for testing" text="Switch input modes to verify behavior before shipping." /></div>
        <Card className="mt-10 overflow-hidden"><CardHeader><CardTitle>Install and try it</CardTitle><CardDescription>Drop the hook into a client component and connect your callback.</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3 font-mono text-sm"><span>pnpm add use-barcode-scanner</span><Button size="icon" variant="ghost" aria-label="Copy install command" onClick={() => navigator.clipboard?.writeText('pnpm add use-barcode-scanner')}><Clipboard /></Button></div><pre className="mt-4 overflow-x-auto rounded-lg border bg-card p-4 text-xs leading-6 text-muted-foreground"><code>{`const { lastScan } = useBarcodeScanner({\n  onScan: ({ value, format }) => {\n    console.log(value, format)\n  },\n})`}</code></pre></CardContent></Card>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div> }
function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</div><div><h3 className="font-medium">{title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p></div></div> }
