import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Camera, Check, Cloud, CloudOff, Droplets, Dumbbell, Flame, HeartPulse, Laptop, Scale, Sparkles, Trophy } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  createSummerStrongAccount,
  loadSummerStrongData,
  saveSummerStrongData,
  signInToSummerStrong,
  signOutOfSummerStrong,
  watchAuth,
  type FirebaseUser,
} from './firebase'
import './App.css'

type Tab = 'today' | 'progress' | 'weekly' | 'stats'
type WorkoutType = 'walk' | 'strength' | 'cardio' | 'stretch' | 'mobility' | 'bike' | 'swim' | 'other'
type Location = 'indoor' | 'outdoor'
type ProteinSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2' | 'snack3'

type WorkoutEntry = {
  complete: boolean
  durationMinutes: number
  type: WorkoutType
  location: Location
  notes: string
}

type ProteinEntry = {
  slot: ProteinSlot
  grams: number
  note: string
}

type LearningEntry = {
  minutes: number
  type: string
  note: string
}

type DailyEntry = {
  date: string
  workouts: [WorkoutEntry, WorkoutEntry]
  protein: ProteinEntry[]
  waterOz: number
  electrolytes: boolean
  noAlcohol: boolean
  learning: LearningEntry
  energy: string
  mood: string
  note: string
}

type WeeklyEntry = {
  weekNumber: number
  weight: string
  photoTaken: boolean
  biggestWin: string
  hardestPart: string
  adjustment: string
}

type ChallengeData = {
  daily: Record<string, DailyEntry>
  weekly: Record<string, WeeklyEntry>
}

const config = {
  name: 'Summer Strong',
  tagline: '75 days. Body strong. Brain sharp.',
  startDate: '2026-05-25',
  totalDays: 75,
  proteinGoal: 100,
  waterGoalOz: 128,
  workoutMinutesGoal: 45,
  learningMinutesGoal: 20,
}

const proteinSlots: { slot: ProteinSlot; label: string }[] = [
  { slot: 'breakfast', label: 'Breakfast' },
  { slot: 'lunch', label: 'Lunch' },
  { slot: 'dinner', label: 'Dinner' },
  { slot: 'snack1', label: 'Snack 1' },
  { slot: 'snack2', label: 'Snack 2' },
  { slot: 'snack3', label: 'Snack 3' },
]

const learningPrompts = [
  'Build one tiny thing.',
  'Watch or read 20 minutes about coding/AI.',
  'Refactor one small component.',
  'Try one AI workflow or prompt.',
  'Read docs and write down what clicked.',
  'Practice one TypeScript or React concept.',
]

const storageKey = 'summer-strong-v1'
const dayMs = 24 * 60 * 60 * 1000

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateForDay(dayNumber: number) {
  const start = parseDate(config.startDate)
  start.setDate(start.getDate() + dayNumber - 1)
  return toDateOnly(start)
}

function shortDateLabel(date: string) {
  const parsed = parseDate(date)
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`
}

function weekdayLabel(date: string) {
  return parseDate(date).toLocaleDateString(undefined, { weekday: 'short' })
}

function monthLabel(date: string) {
  return parseDate(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function getChallengeDay(date = new Date()) {
  const start = parseDate(config.startDate)
  const current = parseDate(toDateOnly(date))
  return Math.floor((current.getTime() - start.getTime()) / dayMs) + 1
}

function defaultWorkout(): WorkoutEntry {
  return { complete: false, durationMinutes: 45, type: 'walk', location: 'indoor', notes: '' }
}

function defaultDailyEntry(date: string): DailyEntry {
  return {
    date,
    workouts: [defaultWorkout(), defaultWorkout()],
    protein: proteinSlots.map(({ slot }) => ({ slot, grams: 0, note: '' })),
    waterOz: 0,
    electrolytes: false,
    noAlcohol: false,
    learning: { minutes: 0, type: 'learn', note: '' },
    energy: '',
    mood: '',
    note: '',
  }
}

function defaultWeeklyEntry(weekNumber: number): WeeklyEntry {
  return { weekNumber, weight: '', photoTaken: false, biggestWin: '', hardestPart: '', adjustment: '' }
}

function loadData(): ChallengeData {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { daily: {}, weekly: {} }
    return JSON.parse(raw)
  } catch {
    return { daily: {}, weekly: {} }
  }
}

function mergeChallengeData(cloudData: ChallengeData | null, localData: ChallengeData): ChallengeData {
  if (!cloudData) return localData
  return {
    daily: { ...(cloudData.daily ?? {}), ...(localData.daily ?? {}) },
    weekly: { ...(cloudData.weekly ?? {}), ...(localData.weekly ?? {}) },
  }
}

function isChallengeData(value: unknown): value is ChallengeData {
  return !!value && typeof value === 'object' && 'daily' in value && 'weekly' in value
}

function proteinTotal(entry: DailyEntry) {
  return entry.protein.reduce((sum, item) => sum + (Number(item.grams) || 0), 0)
}

function workoutsComplete(entry: DailyEntry) {
  return entry.workouts.filter((workout) => workout.complete && workout.durationMinutes >= config.workoutMinutesGoal).length
}

function hasOutdoorWorkout(entry: DailyEntry) {
  return entry.workouts.some((workout) => workout.complete && workout.durationMinutes >= config.workoutMinutesGoal && workout.location === 'outdoor')
}

function taskStatus(entry: DailyEntry) {
  return {
    workout1: entry.workouts[0].complete && entry.workouts[0].durationMinutes >= config.workoutMinutesGoal,
    workout2: entry.workouts[1].complete && entry.workouts[1].durationMinutes >= config.workoutMinutesGoal,
    outdoor: hasOutdoorWorkout(entry),
    protein: proteinTotal(entry) >= config.proteinGoal,
    water: entry.waterOz >= config.waterGoalOz,
    noAlcohol: entry.noAlcohol,
    learning: entry.learning.minutes >= config.learningMinutesGoal,
  }
}

function completionPercent(entry: DailyEntry) {
  const statuses = Object.values(taskStatus(entry))
  return Math.round((statuses.filter(Boolean).length / statuses.length) * 100)
}

function dayStatus(entry?: DailyEntry, dayNumber?: number) {
  if (dayNumber && dayNumber > getChallengeDay()) return 'upcoming'
  if (!entry) return 'missed'
  if (completionPercent(entry) === 100) return 'complete'
  const hasAnyLog = proteinTotal(entry) > 0 || entry.waterOz > 0 || entry.noAlcohol || entry.learning.minutes > 0 || entry.workouts.some((w) => w.complete)
  return hasAnyLog ? 'partial' : 'missed'
}

function dayRingProgress(entry?: DailyEntry) {
  if (!entry) return { workouts: 0, protein: 0, water: 0, learning: false, noAlcohol: false }
  const statuses = taskStatus(entry)
  return {
    workouts: [statuses.workout1, statuses.workout2, statuses.outdoor].filter(Boolean).length / 3,
    protein: Math.min(proteinTotal(entry) / config.proteinGoal, 1),
    water: Math.min(entry.waterOz / config.waterGoalOz, 1),
    learning: statuses.learning,
    noAlcohol: statuses.noAlcohol,
  }
}

function buildChallengeMonths() {
  const months: Record<string, { label: string; dates: string[] }> = {}
  Array.from({ length: config.totalDays }, (_, index) => {
    const date = dateForDay(index + 1)
    const parsed = parseDate(date)
    const key = `${parsed.getFullYear()}-${parsed.getMonth()}`
    months[key] ??= { label: monthLabel(date), dates: [] }
    months[key].dates.push(date)
  })
  return Object.values(months)
}

function weekForDay(dayNumber: number) {
  return Math.ceil(Math.max(dayNumber, 1) / 7)
}

function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [data, setData] = useState<ChallengeData>(() => loadData())
  const [cloudUser, setCloudUser] = useState<FirebaseUser | null>(null)
  const [cloudReady, setCloudReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState('Local save active')
  const localDataRef = useRef(data)
  const todayDay = Math.min(Math.max(getChallengeDay(), 1), config.totalDays)
  const rawChallengeDay = getChallengeDay()
  const todayDate = dateForDay(todayDay)
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const currentEntry = data.daily[selectedDate] ?? defaultDailyEntry(selectedDate)
  const selectedDay = Math.floor((parseDate(selectedDate).getTime() - parseDate(config.startDate).getTime()) / dayMs) + 1
  const currentWeek = weekForDay(todayDay)
  const weeklyEntry = data.weekly[String(currentWeek)] ?? defaultWeeklyEntry(currentWeek)
  const prompt = learningPrompts[(selectedDay - 1) % learningPrompts.length]

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data))
    localDataRef.current = data
  }, [data])

  useEffect(() => {
    return watchAuth(async (user) => {
      setCloudUser(user)
      setCloudReady(false)
      if (!user) {
        setSyncStatus('Local save active')
        return
      }

      setSyncStatus('Loading cloud backup…')
      try {
        const cloudData = await loadSummerStrongData(user.uid)
        const merged = mergeChallengeData(isChallengeData(cloudData) ? cloudData : null, localDataRef.current)
        setData(merged)
        localStorage.setItem(storageKey, JSON.stringify(merged))
        setCloudReady(true)
        setSyncStatus(cloudData ? 'Cloud sync connected' : 'Cloud sync ready — first backup pending')
      } catch (error) {
        console.error(error)
        setSyncStatus('Cloud load failed — still saving locally')
      }
    })
  }, [])

  useEffect(() => {
    if (!cloudUser || !cloudReady) return
    const timeout = window.setTimeout(async () => {
      setSyncStatus('Saving to cloud…')
      try {
        await saveSummerStrongData(cloudUser.uid, data)
        setSyncStatus('Cloud sync saved')
      } catch (error) {
        console.error(error)
        setSyncStatus('Cloud save failed — still saving locally')
      }
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [data, cloudReady, cloudUser])

  const updateDaily = (date: string, updater: (entry: DailyEntry) => DailyEntry) => {
    setData((prev) => ({
      ...prev,
      daily: {
        ...prev.daily,
        [date]: updater(prev.daily[date] ?? defaultDailyEntry(date)),
      },
    }))
  }

  const updateWeekly = (weekNumber: number, updater: (entry: WeeklyEntry) => WeeklyEntry) => {
    setData((prev) => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [String(weekNumber)]: updater(prev.weekly[String(weekNumber)] ?? defaultWeeklyEntry(weekNumber)),
      },
    }))
  }

  const stats = useMemo(() => buildStats(data), [data])
  const percent = completionPercent(currentEntry)
  const isViewingToday = selectedDate === todayDate
  const heroDayLabel = rawChallengeDay < 1 ? 'Starts tomorrow · Day 1 is ready' : rawChallengeDay > config.totalDays ? 'Challenge complete' : `Day ${todayDay} of ${config.totalDays}`

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow"><Sparkles size={16} /> Summer Strong</p>
          <h1>{config.tagline}</h1>
          <p className="hero-copy">{heroDayLabel} · Ends Friday, August 7</p>
        </div>
        <div className="progress-orb" aria-label={`${percent}% complete`}>
          <span>{percent}%</span>
          <small>{isViewingToday ? 'today' : `day ${selectedDay}`}</small>
        </div>
      </section>

      <nav className="tabs" aria-label="Primary">
        {([
          ['today', 'Today', Flame],
          ['progress', 'Progress', CalendarDays],
          ['weekly', 'Weekly', Scale],
          ['stats', 'Stats', Trophy],
        ] as const).map(([value, label, Icon]) => (
          <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>

      {tab === 'today' && (
        <TodayPage
          date={selectedDate}
          dayNumber={selectedDay}
          entry={currentEntry}
          prompt={prompt}
          update={(updater) => updateDaily(selectedDate, updater)}
          resetToday={() => {
            if (window.confirm('Reset this day? This clears the logs for the selected date.')) {
              updateDaily(selectedDate, () => defaultDailyEntry(selectedDate))
            }
          }}
          cloudUser={cloudUser}
          syncStatus={syncStatus}
          onSyncStatus={setSyncStatus}
        />
      )}

      {tab === 'progress' && (
        <ProgressPage
          data={data}
          selectedDate={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date)
            setTab('today')
          }}
        />
      )}

      {tab === 'weekly' && (
        <WeeklyPage
          weekNumber={currentWeek}
          entry={weeklyEntry}
          update={(updater) => updateWeekly(currentWeek, updater)}
          data={data}
        />
      )}

      {tab === 'stats' && <StatsPage stats={stats} data={data} />}
    </main>
  )
}

function TodayPage({ date, dayNumber, entry, prompt, update, resetToday, cloudUser, syncStatus, onSyncStatus }: { date: string; dayNumber: number; entry: DailyEntry; prompt: string; update: (updater: (entry: DailyEntry) => DailyEntry) => void; resetToday: () => void; cloudUser: FirebaseUser | null; syncStatus: string; onSyncStatus: (status: string) => void }) {
  const statuses = taskStatus(entry)
  return (
    <section className="screen-stack">
      <div className="section-title">
        <div>
          <p className="eyebrow">{date}</p>
          <h2>Day {dayNumber} mission</h2>
        </div>
        <button className="ghost" onClick={resetToday}>Reset day</button>
      </div>

      <Card className="mission-card">
        {[
          ['Workout 1', statuses.workout1],
          ['Workout 2', statuses.workout2],
          ['One outside', statuses.outdoor],
          ['100g protein', statuses.protein],
          ['1 gallon water', statuses.water],
          ['No alcohol', statuses.noAlcohol],
          ['20 min coding/AI', statuses.learning],
        ].map(([label, done]) => (
          <div className={done ? 'mission-item done' : 'mission-item'} key={String(label)}>
            <span><Check size={14} /></span>{label}
          </div>
        ))}
      </Card>

      <CloudSyncCard user={cloudUser} syncStatus={syncStatus} onSyncStatus={onSyncStatus} />

      <ProteinCard entry={entry} update={update} />
      <WaterCard entry={entry} update={update} />
      <WorkoutCard index={0} entry={entry} update={update} />
      <WorkoutCard index={1} entry={entry} update={update} />
      <LearningCard entry={entry} prompt={prompt} update={update} />
      <Card className="simple-card">
        <div className="card-heading"><HeartPulse /> No alcohol</div>
        <label className="check-row">
          <input type="checkbox" checked={entry.noAlcohol} onChange={(event) => update((draft) => ({ ...draft, noAlcohol: event.target.checked }))} />
          <span>{entry.noAlcohol ? 'Clear-headed queen behavior.' : 'Check this when alcohol stays off the board.'}</span>
        </label>
      </Card>
      <DailyCheckIn entry={entry} update={update} />
    </section>
  )
}

function ProteinCard({ entry, update }: { entry: DailyEntry; update: (updater: (entry: DailyEntry) => DailyEntry) => void }) {
  const total = proteinTotal(entry)
  const remaining = Math.max(config.proteinGoal - total, 0)
  const message = total >= 100 ? 'Protein goal handled.' : total >= 80 ? 'So close. One snack can finish this.' : total >= 50 ? 'Halfway there. Respectable.' : 'Let’s get protein on the board.'

  const setSlot = (slot: ProteinSlot, patch: Partial<ProteinEntry>) => {
    update((draft) => ({
      ...draft,
      protein: draft.protein.map((item) => item.slot === slot ? { ...item, ...patch } : item),
    }))
  }

  return (
    <Card>
      <div className="card-heading"><Flame /> Protein</div>
      <ProgressLine value={total} goal={config.proteinGoal} label={`${total} / 100g`} />
      <p className="helper">{remaining}g left · {message}</p>
      <div className="protein-grid">
        {entry.protein.map((item) => (
          <div className="protein-row" key={item.slot}>
            <label>{proteinSlots.find((slot) => slot.slot === item.slot)?.label}</label>
            <input type="number" min="0" value={item.grams || ''} placeholder="0g" onChange={(event) => setSlot(item.slot, { grams: Number(event.target.value) })} />
            <div className="quick-buttons">
              {[10, 15, 20, 25, 30].map((amount) => <button key={amount} onClick={() => setSlot(item.slot, { grams: (Number(item.grams) || 0) + amount })}>+{amount}</button>)}
            </div>
            <input className="protein-note" value={item.note} placeholder="optional food note" onChange={(event) => setSlot(item.slot, { note: event.target.value })} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function CloudSyncCard({ user, syncStatus, onSyncStatus }: { user: FirebaseUser | null; syncStatus: string; onSyncStatus: (status: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (mode: 'sign-in' | 'create') => {
    if (!email || !password) {
      onSyncStatus('Enter email + password to turn on cloud sync')
      return
    }

    setBusy(true)
    onSyncStatus(mode === 'sign-in' ? 'Signing in…' : 'Creating sync account…')
    try {
      if (mode === 'sign-in') {
        await signInToSummerStrong(email, password)
      } else {
        await createSummerStrongAccount(email, password)
      }
      setPassword('')
    } catch (error) {
      console.error(error)
      onSyncStatus('Cloud sign-in failed — check email/password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className={user ? 'sync-card connected' : 'sync-card'}>
      <div className="card-heading">{user ? <Cloud /> : <CloudOff />} Cloud backup</div>
      <p className="helper">{syncStatus}</p>
      {user ? (
        <div className="sync-row">
          <span>Signed in as <strong>{user.email}</strong></span>
          <button className="ghost" onClick={() => signOutOfSummerStrong()}>Sign out</button>
        </div>
      ) : (
        <div className="sync-form">
          <input type="email" autoComplete="email" placeholder="Email for sync" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <div className="quick-buttons big">
            <button disabled={busy} onClick={() => submit('sign-in')}>Sign in</button>
            <button disabled={busy} onClick={() => submit('create')}>Create sync account</button>
          </div>
        </div>
      )}
    </Card>
  )
}

function WaterCard({ entry, update }: { entry: DailyEntry; update: (updater: (entry: DailyEntry) => DailyEntry) => void }) {
  const remaining = Math.max(config.waterGoalOz - entry.waterOz, 0)
  return (
    <Card>
      <div className="card-heading"><Droplets /> Water</div>
      <ProgressLine value={entry.waterOz} goal={config.waterGoalOz} label={`${entry.waterOz} / 128 oz`} />
      <p className="helper">{remaining} oz left · {entry.waterOz >= 128 ? 'Gallon complete. Your water bottle may now rest.' : 'Hydration in progress.'}</p>
      <div className="quick-buttons big">
        {[8, 16, 24, 32].map((amount) => <button key={amount} onClick={() => update((draft) => ({ ...draft, waterOz: draft.waterOz + amount }))}>+{amount} oz</button>)}
        <button onClick={() => update((draft) => ({ ...draft, waterOz: 0 }))}>Reset</button>
      </div>
      <label className="check-row subtle"><input type="checkbox" checked={entry.electrolytes} onChange={(event) => update((draft) => ({ ...draft, electrolytes: event.target.checked }))} /> Electrolytes today</label>
    </Card>
  )
}

function WorkoutCard({ index, entry, update }: { index: 0 | 1; entry: DailyEntry; update: (updater: (entry: DailyEntry) => DailyEntry) => void }) {
  const workout = entry.workouts[index]
  const setWorkout = (patch: Partial<WorkoutEntry>) => update((draft) => {
    const workouts = [...draft.workouts] as [WorkoutEntry, WorkoutEntry]
    workouts[index] = { ...workouts[index], ...patch }
    return { ...draft, workouts }
  })

  return (
    <Card>
      <div className="card-heading"><Dumbbell /> Workout {index + 1}</div>
      <div className="workout-grid">
        <label className="check-row"><input type="checkbox" checked={workout.complete} onChange={(event) => setWorkout({ complete: event.target.checked })} /> Complete</label>
        <label>Minutes<input type="number" min="0" value={workout.durationMinutes} onChange={(event) => setWorkout({ durationMinutes: Number(event.target.value) })} /></label>
        <label>Type<select value={workout.type} onChange={(event) => setWorkout({ type: event.target.value as WorkoutType })}>{['walk', 'strength', 'cardio', 'stretch', 'mobility', 'bike', 'swim', 'other'].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <div className="toggle-pair"><button className={workout.location === 'indoor' ? 'selected' : ''} onClick={() => setWorkout({ location: 'indoor' })}>Indoor</button><button className={workout.location === 'outdoor' ? 'selected' : ''} onClick={() => setWorkout({ location: 'outdoor' })}>Outdoor</button></div>
      </div>
    </Card>
  )
}

function LearningCard({ entry, prompt, update }: { entry: DailyEntry; prompt: string; update: (updater: (entry: DailyEntry) => DailyEntry) => void }) {
  return (
    <Card>
      <div className="card-heading"><Laptop /> Coding/AI growth</div>
      <ProgressLine value={entry.learning.minutes} goal={config.learningMinutesGoal} label={`${entry.learning.minutes} / 20 min`} />
      <p className="helper">Brain reps count too. Today’s idea: {prompt}</p>
      <div className="quick-buttons big">{[5, 10, 20].map((amount) => <button key={amount} onClick={() => update((draft) => ({ ...draft, learning: { ...draft.learning, minutes: draft.learning.minutes + amount } }))}>+{amount} min</button>)}</div>
      <textarea placeholder="What did you learn or build?" value={entry.learning.note} onChange={(event) => update((draft) => ({ ...draft, learning: { ...draft.learning, note: event.target.value } }))} />
    </Card>
  )
}

function DailyCheckIn({ entry, update }: { entry: DailyEntry; update: (updater: (entry: DailyEntry) => DailyEntry) => void }) {
  return (
    <Card>
      <div className="card-heading"><HeartPulse /> Daily check-in</div>
      <div className="workout-grid">
        <label>Energy<select value={entry.energy} onChange={(event) => update((draft) => ({ ...draft, energy: event.target.value }))}><option value="">Pick one</option><option>low</option><option>medium</option><option>high</option></select></label>
        <label>Mood<select value={entry.mood} onChange={(event) => update((draft) => ({ ...draft, mood: event.target.value }))}><option value="">Pick one</option><option>rough</option><option>neutral</option><option>good</option><option>strong</option></select></label>
      </div>
      <textarea placeholder="Body notes, nausea, appetite, soreness, tiny wins..." value={entry.note} onChange={(event) => update((draft) => ({ ...draft, note: event.target.value }))} />
    </Card>
  )
}

function ProgressPage({ data, selectedDate, onSelect }: { data: ChallengeData; selectedDate: string; onSelect: (date: string) => void }) {
  const selectedDay = Math.floor((parseDate(selectedDate).getTime() - parseDate(config.startDate).getTime()) / dayMs) + 1
  const selectedEntry = data.daily[selectedDate]
  const selectedStatus = dayStatus(selectedEntry, selectedDay)
  const months = buildChallengeMonths()

  return (
    <section className="screen-stack">
      <div className="section-title"><div><p className="eyebrow">75-day grid</p><h2>Progress</h2></div></div>
      <Card className="progress-summary">
        <strong>Selected: Day {selectedDay}</strong>
        <span>{weekdayLabel(selectedDate)}, {shortDateLabel(selectedDate)} · {selectedStatus}</span>
      </Card>
      <div className="fitness-calendar-card">
        <div className="ring-legend">
          <span><i className="pink" /> workouts/outside</span>
          <span><i className="green" /> protein</span>
          <span><i className="blue" /> water</span>
          <span><i className="dot purple" /> learning</span>
          <span><i className="dot gold" /> no alcohol</span>
        </div>
        {months.map((month) => (
          <div className="calendar-month" key={month.label}>
            <h3>{month.label}</h3>
            <div className="weekday-row">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>
            <div className="calendar-grid">
              {Array.from({ length: (parseDate(month.dates[0]).getDay() + 6) % 7 }).map((_, index) => <div key={`blank-${index}`} />)}
              {month.dates.map((date) => {
                const day = Math.floor((parseDate(date).getTime() - parseDate(config.startDate).getTime()) / dayMs) + 1
                const status = dayStatus(data.daily[date], day)
                const rings = dayRingProgress(data.daily[date])
                return (
                  <button
                    key={date}
                    className={`calendar-day ${status} ${date === selectedDate ? 'selected' : ''}`}
                    onClick={() => onSelect(date)}
                    title={`Day ${day} · ${weekdayLabel(date)}, ${shortDateLabel(date)}`}
                    style={{
                      '--workout-progress': `${rings.workouts * 360}deg`,
                      '--protein-progress': `${rings.protein * 360}deg`,
                      '--water-progress': `${rings.water * 360}deg`,
                    } as React.CSSProperties}
                  >
                    <span className="calendar-date">{parseDate(date).getDate()}</span>
                    <span className="rings" aria-hidden="true"><span><span /></span></span>
                    <span className="mini-dots"><i className={rings.learning ? 'on purple' : 'purple'} /><i className={rings.noAlcohol ? 'on gold' : 'gold'} /></span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="legend"><span className="complete" /> Complete <span className="partial" /> Partial <span className="missed" /> Missed <span className="upcoming" /> Upcoming</div>
    </section>
  )
}

function WeeklyPage({ weekNumber, entry, update, data }: { weekNumber: number; entry: WeeklyEntry; update: (updater: (entry: WeeklyEntry) => WeeklyEntry) => void; data: ChallengeData }) {
  const weekStats = buildWeekStats(data, weekNumber)
  return (
    <section className="screen-stack">
      <div className="section-title"><div><p className="eyebrow">Week {weekNumber}</p><h2>Weekly check-in</h2></div></div>
      <Card>
        <div className="card-heading"><Scale /> Weigh-in + photo reminder</div>
        <label>Weight<input type="number" inputMode="decimal" placeholder="Optional weekly weight" value={entry.weight} onChange={(event) => update((draft) => ({ ...draft, weight: event.target.value }))} /></label>
        <label className="check-row"><input type="checkbox" checked={entry.photoTaken} onChange={(event) => update((draft) => ({ ...draft, photoTaken: event.target.checked }))} /><Camera size={18} /> I took my weekly progress photo</label>
      </Card>
      <Card>
        <div className="card-heading"><Sparkles /> Reflection</div>
        <textarea placeholder="Biggest win this week" value={entry.biggestWin} onChange={(event) => update((draft) => ({ ...draft, biggestWin: event.target.value }))} />
        <textarea placeholder="What felt hard?" value={entry.hardestPart} onChange={(event) => update((draft) => ({ ...draft, hardestPart: event.target.value }))} />
        <textarea placeholder="Adjustment for next week" value={entry.adjustment} onChange={(event) => update((draft) => ({ ...draft, adjustment: event.target.value }))} />
      </Card>
      <div className="stat-grid">{Object.entries(weekStats).map(([label, value]) => <StatCard key={label} label={label} value={value} />)}</div>
    </section>
  )
}

function StatsPage({ stats, data }: { stats: Record<string, string | number>; data: ChallengeData }) {
  const perfectDays = Number(stats['Perfect days'])
  const proteinDays = Number(stats['Protein days'])
  const waterDays = Number(stats['Water days'])
  const outdoorWorkouts = Number(stats['Outdoor workouts'])
  const badges = [
    ['First Day Done', perfectDays >= 1],
    ['Week 1 Locked In', perfectDays >= 7],
    ['Protein Queen', proteinDays >= 7],
    ['Gallon Goblin', waterDays >= 7],
    ['Outdoor Warrior', outdoorWorkouts >= 10],
    ['Code & Conquer', Number(stats['Learning hours']) >= 5],
    ['Halfway Hotshot', getChallengeDay() >= 38],
    ['Summer Strong Finisher', perfectDays >= 75],
  ] as const
  return (
    <section className="screen-stack">
      <div className="section-title"><div><p className="eyebrow">Receipts department</p><h2>Stats</h2></div></div>
      <div className="stat-grid">{Object.entries(stats).map(([label, value]) => <StatCard key={label} label={label} value={value} />)}</div>
      <Card>
        <div className="card-heading"><Trophy /> Badges</div>
        <div className="badge-grid">{badges.map(([label, earned]) => <div key={label} className={earned ? 'badge earned' : 'badge'}>{earned ? '🏆' : '🔒'} {label}</div>)}</div>
      </Card>
      <WeightChart data={data} />
      <button className="export" onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}>Copy backup JSON</button>
    </section>
  )
}

function WeightChart({ data }: { data: ChallengeData }) {
  const points = Object.values(data.weekly)
    .filter((entry) => entry.weight)
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((entry) => ({ week: `W${entry.weekNumber}`, weight: Number(entry.weight) }))

  return (
    <Card>
      <div className="card-heading"><Scale /> Weekly weight trend</div>
      {points.length ? (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
              <XAxis dataKey="week" tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#ec4899" strokeWidth={4} dot={{ r: 5, fill: '#fb923c' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="helper">No weigh-ins yet. Future you will enjoy the trend line. Present you may roll her eyes, which is fair.</p>
      )}
    </Card>
  )
}

function buildStats(data: ChallengeData) {
  const entries = Object.values(data.daily)
  const perfectDays = entries.filter((entry) => completionPercent(entry) === 100).length
  const proteinDays = entries.filter((entry) => proteinTotal(entry) >= config.proteinGoal).length
  const waterDays = entries.filter((entry) => entry.waterOz >= config.waterGoalOz).length
  const learningMinutes = entries.reduce((sum, entry) => sum + entry.learning.minutes, 0)
  return {
    'Perfect days': perfectDays,
    'Current streak': currentStreak(data),
    'Protein days': proteinDays,
    'Water days': waterDays,
    'Total workouts': entries.reduce((sum, entry) => sum + workoutsComplete(entry), 0),
    'Outdoor workouts': entries.reduce((sum, entry) => sum + entry.workouts.filter((w) => w.complete && w.location === 'outdoor').length, 0),
    'Learning hours': (learningMinutes / 60).toFixed(1),
    'No alcohol days': entries.filter((entry) => entry.noAlcohol).length,
    'Weekly weigh-ins': Object.values(data.weekly).filter((entry) => entry.weight).length,
  }
}

function currentStreak(data: ChallengeData) {
  let streak = 0
  const lastDay = Math.min(Math.max(getChallengeDay(), 1), config.totalDays)
  for (let day = lastDay; day >= 1; day -= 1) {
    const entry = data.daily[dateForDay(day)]
    if (!entry || completionPercent(entry) !== 100) break
    streak += 1
  }
  return streak
}

function buildWeekStats(data: ChallengeData, weekNumber: number) {
  const startDay = (weekNumber - 1) * 7 + 1
  const dates = Array.from({ length: 7 }, (_, index) => dateForDay(startDay + index))
  const entries = dates.map((date) => data.daily[date]).filter(Boolean)
  return {
    'Perfect days': entries.filter((entry) => completionPercent(entry) === 100).length,
    'Workouts': entries.reduce((sum, entry) => sum + workoutsComplete(entry), 0),
    'Protein days': entries.filter((entry) => proteinTotal(entry) >= config.proteinGoal).length,
    'Gallons': entries.filter((entry) => entry.waterOz >= config.waterGoalOz).length,
  }
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <article className={`card ${className}`}>{children}</article>
}

function ProgressLine({ value, goal, label }: { value: number; goal: number; label: string }) {
  const percent = Math.min((value / goal) * 100, 100)
  return <div><div className="progress-label"><strong>{label}</strong><span>{Math.round(percent)}%</span></div><div className="progress-track"><div style={{ width: `${percent}%` }} /></div></div>
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return <Card className="stat-card"><strong>{value}</strong><span>{label}</span></Card>
}

export default App
