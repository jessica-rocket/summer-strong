# Summer Strong — Build Plan

## App Routes / Screens

MVP uses a simple single-page React app with tab navigation.

### Tabs

1. **Today**
   - Main daily logging screen
   - Most-used screen

2. **Progress**
   - 75-day grid
   - Day status overview
   - Click/tap day to view/edit

3. **Weekly**
   - Weekly weigh-in
   - Progress photo checkbox
   - Reflection prompts

4. **Stats**
   - Challenge totals
   - Streaks
   - Badges
   - Charts

## File Structure

```txt
src/
  App.tsx
  main.tsx
  index.css

  components/
    layout/
      AppShell.tsx
      BottomNav.tsx
      Header.tsx

    today/
      TodayDashboard.tsx
      DailyMissionCard.tsx
      ProteinCard.tsx
      ProteinSlotRow.tsx
      WaterCard.tsx
      WorkoutCard.tsx
      LearningCard.tsx
      NoAlcoholCard.tsx
      DailyCheckInCard.tsx
      CompletionCelebration.tsx

    progress/
      ProgressPage.tsx
      ChallengeGrid.tsx
      DayCell.tsx
      DayDetailDrawer.tsx

    weekly/
      WeeklyPage.tsx
      WeeklyCheckInCard.tsx
      WeeklySummaryCard.tsx

    stats/
      StatsPage.tsx
      StatCard.tsx
      BadgeGrid.tsx
      WeightChart.tsx

    ui/
      Card.tsx
      Button.tsx
      ProgressBar.tsx
      ProgressRing.tsx
      Toggle.tsx
      NumberInput.tsx
      TextArea.tsx
      Badge.tsx

  data/
    challengeConfig.ts
    badges.ts
    learningPrompts.ts

  hooks/
    useChallenge.ts
    useLocalStorage.ts
    useTodayEntry.ts

  lib/
    dates.ts
    completion.ts
    stats.ts
    storage.ts
    defaults.ts
    format.ts

  types/
    challenge.ts
```

## Core Components

### AppShell

Responsibilities:
- App background/theme
- Header
- Active tab content
- Bottom navigation

### Header

Shows:
- Summer Strong
- Tagline: 75 days. Body strong. Brain sharp.
- Current day of challenge
- Countdown

### BottomNav

Tabs:
- Today
- Progress
- Weekly
- Stats

Mobile-first fixed bottom nav.

---

## Today Components

### TodayDashboard

Composes the main daily screen.

Includes:
- Header/hero summary
- DailyMissionCard
- ProteinCard
- WaterCard
- WorkoutCard x2
- LearningCard
- NoAlcoholCard
- DailyCheckInCard

### DailyMissionCard

Compact task checklist.

Rules shown:
- Workout 1 complete
- Workout 2 complete
- Outdoor workout complete
- Protein 100g
- Water 128 oz
- No alcohol
- Coding/AI 20 min

Status states:
- complete
- incomplete
- warning/partial

### ProteinCard

Tracks 100g/day.

Contains:
- total protein
- remaining protein
- progress bar
- 6 ProteinSlotRows

Slots:
- Breakfast
- Lunch
- Dinner
- Snack 1
- Snack 2
- Snack 3

Quick add buttons:
- +10g
- +15g
- +20g
- +25g
- +30g

### ProteinSlotRow

Fields:
- slot label
- grams input
- quick add buttons
- optional note toggle

### WaterCard

Tracks 128 oz/day.

Contains:
- current oz
- remaining oz
- progress visual
- quick add buttons: +8, +16, +24, +32
- electrolytes checkbox

### WorkoutCard

Used twice per day.

Fields:
- complete toggle
- duration minutes, default 45
- type chips/dropdown
- indoor/outdoor toggle
- optional notes

Workout counts only when:
- complete = true
- durationMinutes >= 45

### LearningCard

Tracks coding/AI personal growth.

Goal: 20 minutes/day.

Fields:
- minutes
- quick buttons: +5, +10, +20
- activity type
- optional learning note
- rotating prompt

Activity types:
- Learn
- Build
- Practice
- Watch/read
- Prompt/test AI
- Document

### NoAlcoholCard

Simple required checkbox.

Copy idea:
- "No alcohol today"
- checked state: "Clear-headed queen behavior."

### DailyCheckInCard

Optional.

Fields:
- energy: low / medium / high
- mood: rough / neutral / good / strong
- body notes
- general note

---

## Progress Components

### ProgressPage

Shows:
- 75-day ChallengeGrid
- overview stats
- legend

### ChallengeGrid

Displays all 75 days.

Each cell state:
- complete
- partial
- missed
- upcoming
- today

### DayCell

Small square/circle with:
- day number
- status color
- today highlight

### DayDetailDrawer

Future-friendly component for editing previous days.

MVP can show summary first; editing can use TodayDashboard-style form later.

---

## Weekly Components

### WeeklyPage

Shows current week and all weekly check-ins.

### WeeklyCheckInCard

Fields:
- weight
- photo taken checkbox
- biggest win
- hardest part
- what helped
- adjustment for next week

### WeeklySummaryCard

Calculates:
- perfect days this week
- workouts completed
- outdoor workouts
- protein days hit
- water days hit
- learning minutes

---

## Stats Components

### StatsPage

Shows all challenge-level stats.

Sections:
- headline stats
- streaks
- progress rates
- learning hours
- badges
- weight chart

### StatCard

Reusable display card.

Examples:
- Perfect days
- Current streak
- Total workouts
- Outdoor workouts
- Protein hit rate
- Gallons completed
- Coding/AI hours

### BadgeGrid

Shows earned/unearned badges.

### WeightChart

Uses Recharts.

Shows weekly weigh-ins only.

---

## Data and Utility Files

### challengeConfig.ts

```ts
export const challengeConfig = {
  name: 'Summer Strong',
  tagline: '75 days. Body strong. Brain sharp.',
  startDate: '2026-05-25',
  totalDays: 75,
  proteinGoal: 100,
  waterGoalOz: 128,
  workoutMinutesGoal: 45,
  learningMinutesGoal: 20,
} as const;
```

### dates.ts

Functions:
- getChallengeDay(date)
- getDateForDay(dayNumber)
- getDaysRemaining(date)
- isToday(date)
- getWeekNumber(dayNumber)
- getWeekDateRange(weekNumber)

### completion.ts

Functions:
- getProteinTotal(entry)
- getWorkoutCompletion(entry)
- hasOutdoorWorkout(entry)
- isDailyComplete(entry)
- getDailyStatus(entry)
- getCompletionPercentage(entry)

### stats.ts

Functions:
- calculateCurrentStreak(entries)
- calculateBestStreak(entries)
- calculateTotalWorkouts(entries)
- calculateOutdoorWorkouts(entries)
- calculateProteinHitRate(entries)
- calculateWaterHitRate(entries)
- calculateLearningHours(entries)
- calculateBadges(entries, weeklyEntries)

### storage.ts

Functions:
- loadChallengeData()
- saveChallengeData(data)
- exportData()
- importData()
- resetChallengeData()

---

## MVP Checklist

### Phase 1 — Scaffold

- [ ] Create Vite React TypeScript app
- [ ] Install Tailwind
- [ ] Install Framer Motion
- [ ] Install Recharts
- [ ] Create theme colors
- [ ] Create base layout
- [ ] Create bottom nav

### Phase 2 — Data Foundation

- [ ] Define TypeScript types
- [ ] Add challenge config
- [ ] Build date helpers
- [ ] Build default daily entry generator
- [ ] Build localStorage hook
- [ ] Build completion logic

### Phase 3 — Today Dashboard

- [ ] Build TodayDashboard
- [ ] Build DailyMissionCard
- [ ] Build ProteinCard
- [ ] Build ProteinSlotRow
- [ ] Build WaterCard
- [ ] Build WorkoutCard
- [ ] Build NoAlcoholCard
- [ ] Build LearningCard
- [ ] Build DailyCheckInCard
- [ ] Save changes automatically

### Phase 4 — Progress

- [ ] Build ChallengeGrid
- [ ] Add status colors
- [ ] Highlight today
- [ ] Add simple day summary on click/tap

### Phase 5 — Weekly

- [ ] Build WeeklyPage
- [ ] Add weekly weigh-in input
- [ ] Add photo taken checkbox
- [ ] Add reflection prompts
- [ ] Add weekly summary

### Phase 6 — Stats and Badges

- [ ] Build StatsPage
- [ ] Add stat cards
- [ ] Add badge logic
- [ ] Add BadgeGrid
- [ ] Add weight chart

### Phase 7 — Polish

- [ ] Mobile responsive spacing
- [ ] Completion animations
- [ ] Full-day complete celebration
- [ ] Empty states
- [ ] Edit/reset today menu
- [ ] Export backup JSON
- [ ] Final QA

### Phase 8 — Deploy

- [ ] Create GitHub repo
- [ ] Commit code
- [ ] Deploy to Vercel
- [ ] Test deployed app on phone

## Design Tokens

Suggested palette:

```txt
Cream: #FFF7ED
Sunset Orange: #FB923C
Coral: #F97366
Hot Pink: #EC4899
Golden Yellow: #FBBF24
Deep Navy: #172554
Espresso: #3F2A1D
Soft Green: #22C55E
Warning Yellow: #FACC15
Missed Coral: #FB7185
```

Typography:
- Headings: bold, rounded, confident
- Body: clean and readable

Card style:
- Rounded 2xl
- Soft shadow
- Warm gradients
- High tap targets

## Copy Bank

### Completion Messages

- "Day handled. Receipts included."
- "Strong body. Sharp brain. Done."
- "Promises kept. We love to see it."
- "Full day complete. Tiny confetti committee approved."

### Protein Messages

- "Let’s get protein on the board."
- "Halfway there. Respectable."
- "So close. One snack can finish this."
- "Protein goal handled."

### Water Messages

- "Hydration in progress."
- "Half a gallon down. Keep going."
- "Gallon complete. Your water bottle may now rest."

### Learning Messages

- "Brain reps count too."
- "Tiny lesson, big compound interest."
- "Coding streak protected."

### No Alcohol Messages

- "Clear-headed queen behavior."
- "No alcohol checked. Discipline logged."

## Decision Log

- Challenge name: Summer Strong
- Tagline: 75 days. Body strong. Brain sharp.
- Length: exactly 75 days
- Start date: Monday, May 25, 2026
- End date: Friday, August 7, 2026
- Workouts: 2/day, 45 minutes minimum each
- Outdoor rule: at least 1 workout outside
- Protein: 100g/day
- Water: 1 gallon/day
- Alcohol: none
- Learning: 20 minutes coding/AI daily
- Photos: weekly checkbox only, no uploads
- Weight: weekly weigh-in
- Privacy: no password for MVP, localStorage first
- Cheer/social: later feature
