"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CirclePlus, Moon, Pill, Sun, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DosePeriod = { id: number; dose: number | ""; start: string; end: string };
type PeriodErrors = { dose?: string; start?: string; end?: string };

const DAY_MS = 86_400_000;
const doseOptions = [20, 30, 40, 50, 60];
const dailyDoseOptions = [10, 20, 30, 40, 50, 60, 70, 80];

function DoseSelect({ value, label, autoFocus, invalid, onChange }: {
  value: number | "";
  label: string;
  autoFocus?: boolean;
  invalid?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <select
      aria-invalid={invalid}
      aria-label={label}
      autoFocus={autoFocus}
      className="h-11 w-full max-w-full min-w-0 box-border rounded-lg border border-input bg-white px-3 text-base shadow-xs outline-none transition-[color,background-color,box-shadow,border-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 dark:bg-[#303030] dark:text-white dark:[color-scheme:dark] sm:text-sm"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {dailyDoseOptions.map((dose) => <option key={dose} value={dose}>{dose} mg/day</option>)}
    </select>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("isotrack-theme", next);
    setIsDark(next === "dark");
  };

  return (
    <Button aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} className="size-9 rounded-lg print:hidden" onClick={toggleTheme} size="icon-lg" variant="ghost">
      {isDark ? <Moon /> : <Sun />}
    </Button>
  );
}

function inputDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

function addDays(value: string, days: number) {
  const date = parseDate(value);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return inputDate(date);
}

function formatDate(value: string) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date) : "—";
}

function daysInclusive(start: string, end: string) {
  const first = parseDate(start);
  const last = parseDate(end);
  if (!first || !last || last < first) return 0;
  return Math.floor((last.getTime() - first.getTime()) / DAY_MS) + 1;
}

function getPeriodErrors(periods: DosePeriod[]) {
  const errors = new Map<number, PeriodErrors>();
  periods.forEach((period) => {
    const item: PeriodErrors = {};
    if (period.dose === "" || !Number.isFinite(period.dose) || period.dose <= 0) item.dose = "Enter a dose greater than 0 mg.";
    if (!period.start) item.start = "Choose a start date.";
    if (!period.end) item.end = "Choose an end date.";
    if (period.start && period.end && period.end < period.start) item.end = "End date must be on or after the start date.";
    errors.set(period.id, item);
  });

  periods.forEach((period, index) => {
    periods.slice(0, index).forEach((previous) => {
      if (period.start && period.end && previous.start && previous.end && period.start <= previous.end && period.end >= previous.start) {
        errors.set(period.id, { ...errors.get(period.id), start: "This period overlaps an earlier dose period." });
      }
    });
  });
  return errors;
}

function visiblePeriodErrors(period: DosePeriod, errors: PeriodErrors): PeriodErrors {
  return {
    dose: period.dose === "" ? undefined : errors.dose,
    start: period.start ? errors.start : undefined,
    end: period.end ? errors.end : undefined,
  };
}

function Field({ label, unit, error, children }: { label: string; unit?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {unit && <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-400">{unit}</span>}
      </div>
      {children}
      {error && <motion.p initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} className="text-xs leading-5 text-red-600 dark:text-red-400">{error}</motion.p>}
    </div>
  );
}

const SummaryMetric = memo(function SummaryMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="min-w-0 border-l-2 border-slate-200 pl-3 first:border-teal-500 dark:border-neutral-600 sm:pl-4">
      <p className="text-xs font-medium leading-5 text-slate-500 dark:text-neutral-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-[-0.025em] text-slate-950 dark:text-white sm:text-xl">{value} <span className="text-xs font-medium tracking-normal text-slate-400 dark:text-neutral-400">{unit}</span></p>
    </div>
  );
});

function DosePeriodCard({ period, index, total, today, errors, focusDose, onChange, onRemove }: {
  period: DosePeriod;
  index: number;
  total: number;
  today: string;
  errors: PeriodErrors;
  focusDose: boolean;
  onChange: (id: number, field: keyof Omit<DosePeriod, "id">, value: string | number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 12, height: 0 }} transition={{ duration: 0.16 }} className="relative grid min-w-0 grid-cols-[16px_minmax(0,1fr)] gap-3 pb-4 last:pb-0">
      {index < total - 1 && <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} className="absolute bottom-0 left-[8px] top-4 w-px origin-top bg-slate-200 dark:bg-neutral-600" />}
      <div className="relative z-10 mt-2 size-4 rounded-full border-[5px] border-[#f7f8fa] bg-teal-600 shadow-[0_0_0_1px_rgba(15,23,42,0.1)] dark:border-[#212121] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.16)]" />
      <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white/80 p-3.5 dark:border-neutral-600/80 dark:bg-[#2f2f2f] sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-neutral-400">Dose #{index + 1}</p>
            <p className="mt-0.5 text-sm font-medium tracking-tight">{period.dose === "" ? "—" : period.dose} mg/day</p>
          </div>
          {total > 1 && <Button aria-label={`Remove dose period ${index + 1}`} className="print:hidden" onClick={() => onRemove(period.id)} size="icon-sm" variant="ghost"><Trash2 className="text-slate-400" /></Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr_1.2fr]">
          <Field label="Daily dose" unit="mg" error={errors.dose}><DoseSelect autoFocus={focusDose} invalid={Boolean(errors.dose)} label={`Dose period ${index + 1} daily dose`} value={period.dose} onChange={(value) => onChange(period.id, "dose", value)} /></Field>
          <Field label="Start date" error={errors.start}><Input aria-invalid={Boolean(errors.start)} aria-label={`Dose period ${index + 1} start date`} type="date" value={period.start} onChange={(event) => onChange(period.id, "start", event.target.value)} /></Field>
          <Field label="End date" error={errors.end}>
            <div className="date-input-row flex min-w-0 max-w-full gap-2"><Input className="min-w-0 flex-1" aria-invalid={Boolean(errors.end)} aria-label={`Dose period ${index + 1} end date`} min={period.start} type="date" value={period.end} onChange={(event) => onChange(period.id, "end", event.target.value)} /><Button className="h-11 shrink-0 rounded-lg px-2.5 print:hidden" onClick={() => onChange(period.id, "end", today)} size="sm" variant="outline"><CalendarDays /> Today</Button></div>
          </Field>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const today = useMemo(() => inputDate(new Date()), []);
  const [weight, setWeight] = useState<number | "">("");
  const [plannedDose, setPlannedDose] = useState<number | "">(20);
  const [plannedStart, setPlannedStart] = useState(today);
  const [periods, setPeriods] = useState<DosePeriod[]>([{ id: 1, dose: 20, start: today, end: today }]);
  const [focusPeriodId, setFocusPeriodId] = useState<number | null>(null);

  const numericWeight = weight === "" ? 0 : weight;
  const numericPlannedDose = plannedDose === "" ? 0 : plannedDose;
  const target120 = Math.max(0, numericWeight) * 120;
  const target150 = Math.max(0, numericWeight) * 150;
  const plannedEnd120 = numericPlannedDose > 0 && numericWeight > 0 ? addDays(plannedStart, Math.ceil(target120 / numericPlannedDose) - 1) : "";
  const plannedEnd150 = numericPlannedDose > 0 && numericWeight > 0 ? addDays(plannedStart, Math.ceil(target150 / numericPlannedDose) - 1) : "";
  const errors = useMemo(() => getPeriodErrors(periods), [periods]);
  const cumulativeDose = useMemo(() => periods.reduce((total, period) => {
    const itemErrors = errors.get(period.id);
    return itemErrors && Object.keys(itemErrors).length > 0 ? total : total + Number(period.dose) * daysInclusive(period.start, period.end);
  }, 0), [errors, periods]);
  const dosePerKg = numericWeight > 0 ? cumulativeDose / numericWeight : 0;
  const remaining120 = Math.max(0, target120 - cumulativeDose);
  const remaining150 = Math.max(0, target150 - cumulativeDose);
  const rulerPosition = Math.min(100, Math.max(0, (dosePerKg / 150) * 100));
  const progressTone = dosePerKg < 120 ? "neutral" : dosePerKg <= 150 ? "target" : "high";
  const indicatorClass = progressTone === "target" ? "bg-emerald-600 text-white" : progressTone === "high" ? "bg-orange-500 text-white" : "bg-slate-800 text-white";

  const updatePeriod = useCallback((id: number, field: keyof Omit<DosePeriod, "id">, value: string | number) => {
    setPeriods((current) => current.map((period) => period.id === id ? { ...period, [field]: value } : period));
  }, []);

  const removePeriod = useCallback((id: number) => {
    setPeriods((current) => current.length > 1 ? current.filter((period) => period.id !== id) : current);
  }, []);

  function addDosePeriod() {
    const previous = periods[periods.length - 1];
    const start = previous.end ? addDays(previous.end, 1) : "";
    const id = Math.max(...periods.map((period) => period.id)) + 1;
    setPeriods((current) => [...current, { id, dose: previous.dose, start, end: start }]);
    setFocusPeriodId(id);
  }

  return (
    <main className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-[#f7f8fa] text-slate-950 transition-colors duration-150 dark:bg-[#212121] dark:text-white">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.22 }} className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header className="flex items-start justify-between gap-3 pb-3">
          <div><div className="flex items-center gap-2"><Pill className="size-4 text-teal-700 dark:text-teal-400" /><p className="text-base font-medium tracking-[-0.02em]">IsoTrack</p></div>
          <h1 className="mt-1 text-lg font-normal tracking-[-0.025em] text-slate-700 dark:text-neutral-300 sm:text-xl">Isotretinoin Treatment Calculator</h1></div>
          <ThemeToggle />
        </header>

        <nav aria-label="Section navigation" className="sticky top-0 z-30 -mx-4 border-y border-slate-200/90 bg-[#f7f8fa]/95 px-4 py-2 backdrop-blur-md transition-colors duration-150 dark:border-neutral-700/90 dark:bg-[#212121]/95 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 print:hidden">
          <div className="flex gap-1"><a className="min-h-9 rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-white hover:text-teal-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-teal-400" href="#planning">Planning</a><a className="min-h-9 rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-white hover:text-teal-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-teal-400" href="#history">History</a><a className="min-h-9 rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-white hover:text-teal-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-teal-400" href="#summary">Summary</a></div>
        </nav>

        <div className="grid items-start gap-8 pt-5 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10">
          <motion.section id="planning" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03, duration: 0.2 }} aria-label="Treatment Planning" className="scroll-mt-14">
            <div className="space-y-3.5">
              <Field label="Weight" unit="kg" error={weight !== "" && weight <= 0 ? "Enter a weight greater than 0 kg." : undefined}><Input aria-invalid={weight !== "" && weight <= 0} aria-label="Weight in kilograms" inputMode="decimal" min="1" placeholder="Enter weight (kg)" step="any" type="number" value={weight} onChange={(event) => setWeight(event.target.value === "" ? "" : Number(event.target.value))} /></Field>
              <Field label="Planned daily dose" unit="mg/day" error={plannedDose !== "" && plannedDose <= 0 ? "Enter a dose greater than 0 mg." : undefined}><DoseSelect invalid={plannedDose !== "" && plannedDose <= 0} label="Planned daily dose" value={plannedDose} onChange={setPlannedDose} /></Field>
              <Field label="Treatment start date"><Input aria-label="Treatment start date" type="date" value={plannedStart} onChange={(event) => setPlannedStart(event.target.value)} /></Field>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-neutral-600 dark:bg-[#2f2f2f]">
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">Target cumulative dose</p><p className="mt-0.5 text-lg font-medium tracking-tight">{numericWeight > 0 ? `${target120.toLocaleString()}–${target150.toLocaleString()} mg` : "—"}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-[11px] dark:border-neutral-600"><div><p className="text-slate-400 dark:text-neutral-400">Reach 120 mg/kg</p><p className="mt-1 text-teal-700 dark:text-teal-400">{formatDate(plannedEnd120)}</p></div><div><p className="text-slate-400 dark:text-neutral-400">Reach 150 mg/kg</p><p className="mt-1 text-teal-700 dark:text-teal-400">{formatDate(plannedEnd150)}</p></div></div>
            </div>
          </motion.section>

          <motion.section id="history" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.2 }} aria-labelledby="history-title" className="scroll-mt-14">
            <div className="mb-4 border-b border-slate-200 pb-2.5 dark:border-neutral-700"><h2 id="history-title" className="text-base font-semibold tracking-tight">Current cumulative dose</h2></div>
            <div className="relative">
              <AnimatePresence initial={false} mode="popLayout">
                {periods.map((period, index) => <DosePeriodCard key={period.id} period={period} index={index} total={periods.length} today={today} errors={visiblePeriodErrors(period, errors.get(period.id) ?? {})} focusDose={focusPeriodId === period.id} onChange={updatePeriod} onRemove={removePeriod} />)}
              </AnimatePresence>
            </div>
            <Button onClick={addDosePeriod} variant="ghost" className="mt-2 h-11 w-full justify-start rounded-lg text-teal-700 dark:text-teal-400 print:hidden"><CirclePlus /> Dose changed</Button>

            <section aria-labelledby="progress-title" className="mt-6 border-t border-slate-200 pt-5 dark:border-neutral-700">
              <div className="flex items-center justify-between"><h3 id="progress-title" className="text-sm font-semibold">Progress</h3><span className="text-[11px] text-slate-400 dark:text-neutral-400">mg/kg</span></div>
              <div className="relative mb-1 mt-10 h-1.5 rounded-full bg-slate-300 dark:bg-neutral-600">
                <div className="absolute left-[80%] top-1/2 h-4 w-px -translate-y-1/2 bg-emerald-600" />
                <div className="absolute inset-y-0 left-[80%] right-0 rounded-r-full bg-emerald-200" />
                <motion.div animate={{ left: `${rulerPosition}%` }} transition={{ type: "spring", stiffness: 220, damping: 27 }} className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                  <div className={`mb-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${indicatorClass}`}>{numericWeight > 0 ? dosePerKg.toFixed(1) : "—"}</div>
                  <div className={`mx-auto size-4 rounded-full border-[3px] border-white shadow-sm dark:border-neutral-900 ${progressTone === "target" ? "bg-emerald-600" : progressTone === "high" ? "bg-orange-500" : "bg-slate-700"}`} />
                </motion.div>
              </div>
              <div className="grid grid-cols-[1fr_auto_20%] text-[10px] text-slate-500 dark:text-neutral-400"><span>0</span><span className="text-emerald-700 dark:text-emerald-400">120</span><span className="text-right">150</span></div>
            </section>

            <section id="summary" aria-labelledby="summary-title" className="mt-5 scroll-mt-14 border-t border-slate-200 pt-5 dark:border-neutral-700">
              <h3 id="summary-title" className="mb-3 text-sm font-semibold">Summary</h3>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                <SummaryMetric label="Current cumulative dose" value={Math.round(cumulativeDose).toLocaleString()} unit="mg" />
                <SummaryMetric label="Current mg/kg" value={numericWeight > 0 ? dosePerKg.toFixed(1) : "—"} unit="mg/kg" />
                <SummaryMetric label="Remaining to 120" value={numericWeight > 0 ? Math.ceil(remaining120).toLocaleString() : "—"} unit="mg" />
                <SummaryMetric label="Remaining to 150" value={numericWeight > 0 ? Math.ceil(remaining150).toLocaleString() : "—"} unit="mg" />
              </div>
              <div className="mb-2 mt-5">
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">Estimated days to cumulative dose targets</p>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-neutral-500">Assuming a constant daily dose from today.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {doseOptions.map((dose) => <div key={dose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-[#2f2f2f]"><p className="text-[11px] text-slate-500 dark:text-neutral-400">{dose} mg/day</p><div className="mt-1 space-y-0.5 text-[11px] font-medium leading-4 tabular-nums"><p><span className="text-slate-400 dark:text-neutral-500">120 mg/kg →</span> {numericWeight > 0 ? `${Math.ceil(remaining120 / dose)} days` : "—"}</p><p><span className="text-slate-400 dark:text-neutral-500">150 mg/kg →</span> {numericWeight > 0 ? `${Math.ceil(remaining150 / dose)} days` : "—"}</p></div></div>)}
              </div>
            </section>

          </motion.section>
        </div>

        <footer className="mt-auto pb-1 pt-12 text-center text-[11px] text-slate-400 dark:text-neutral-500 sm:pt-16">© By Abdulelah Alghamdi</footer>
        <div className="print-footer hidden">© By Abdulelah Alghamdi</div>
      </motion.div>
    </main>
  );
}
