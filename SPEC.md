# Summer Strong — Product Spec

**Tagline:** 75 days. Body strong. Brain sharp.

## Overview

Summer Strong is a 75-day accountability tracker inspired by 75 Hard, customized for Jessica's summer goals, tirzepatide/protein needs, and coding/AI growth.

The goal is discipline without punishment: track daily promises, build consistency, protect protein/hydration, and make progress visible.

## Challenge Dates

- **Start:** Monday, May 25, 2026
- **End:** Friday, August 7, 2026
- **Length:** 75 days exactly

## Daily Rules

A day is complete when all required daily rules are done:

1. **Workout 1** — 45 minutes minimum
2. **Workout 2** — 45 minutes minimum
3. **Outdoor workout** — at least one of the two workouts must be outside
4. **Protein** — 100g minimum
5. **Water** — 1 gallon / 128 oz
6. **No alcohol**
7. **Coding/AI learning** — 20 minutes minimum

## Weekly Rules

1. **Weekly weigh-in**
2. **Progress photo taken** checkbox only — no photo uploads/storage
3. Optional weekly reflection

## Product Principles

- Mobile-first and fast to log throughout the day
- Satisfying checkmarks and visible progress
- No shame spiral: complete/partial/missed tracking instead of automatic restart
- Protein and water logging should take seconds
- Weight/photos stay minimal and private-feeling
- Cheer/social features are future-later, not MVP

## App Structure

### 1. Today Dashboard

Primary screen.

Top section:
- Day X of 75
- Date
- Countdown days remaining
- Daily completion ring/progress bar
- Current streak

Daily task cards:
- Workout 1
- Workout 2
- Protein
- Water
- No alcohol
- Coding/AI learning
- Optional daily check-in

### 2. Protein Tracker

Goal: 100g/day.

Meal/snack slots:
- Breakfast
- Lunch
- Dinner
- Snack 1
- Snack 2
- Snack 3

Each slot includes:
- grams input
- optional food note
- quick add buttons: +10g, +15g, +20g, +25g, +30g
- edit/clear option

Display:
- Total protein consumed
- Remaining protein
- Progress bar
- Goal met state

Motivational text examples:
- 0–49g: "Let’s get protein on the board."
- 50–79g: "Halfway there. Respectable."
- 80–99g: "So close. One snack can finish this."
- 100g+: "Protein goal handled."

### 3. Water Tracker

Goal: 128 oz/day.

Quick buttons:
- +8 oz
- +16 oz
- +24 oz
- +32 oz

Display:
- Total oz
- Remaining oz
- Progress visual: ring or bottle fill
- Optional electrolyte checkbox, not required for completion

### 4. Workout Cards

Two workout cards per day.

Fields:
- Complete checkbox
- Duration minutes, default 45
- Type dropdown:
  - Walk
  - Strength
  - Cardio
  - Yoga/stretch
  - Mobility
  - Bike
  - Swim/pool
  - Other
- Indoor/outdoor toggle
- Optional notes

Validation:
- Workout only counts if duration >= 45
- Daily completion requires two counted workouts
- Daily completion requires at least one workout marked outdoor

### 5. Coding/AI Growth Tracker

Goal: 20 minutes/day.

Fields:
- Minutes input, default 20
- Activity type:
  - Learn
  - Build
  - Practice
  - Watch/read
  - Prompt/test AI
  - Document
- Optional note: "What did I learn/build today?"

Rotating prompt ideas:
- Build one tiny thing
- Watch/read 20 minutes of coding or AI content
- Refactor one small component
- Learn one TypeScript concept
- Try one AI workflow
- Read docs for 20 minutes
- Write down 3 things learned

### 6. Daily Check-In

Optional fields:
- Energy: low / medium / high
- Mood emoji
- Tirzepatide/body notes: nausea, appetite, cravings, hydration, soreness
- Tiny note

Not required for completion.

### 7. 75-Day Progress Grid

Calendar-style challenge grid showing all 75 days.

Statuses:
- Complete — all required daily rules done
- Partial — some progress logged, not all rules complete
- Missed — no meaningful activity logged
- Upcoming — future day
- Today — highlighted border/glow

Click/tap any day to view/edit that day.

### 8. Weekly Check-In

Every 7 days:
- Weight entry
- Progress photo taken checkbox
- Weekly reflection

Reflection prompts:
- Biggest win this week
- What felt hard?
- What helped?
- What needs adjusting next week?

Weekly summary:
- Perfect days
- Total workouts
- Outdoor workouts
- Protein days hit
- Gallons completed
- Learning minutes
- Weight entered?
- Photo checkbox completed?

### 9. Stats / Motivation Page

Stats:
- Current day
- Current streak
- Best streak
- Completion percentage
- Perfect days
- Partial days
- Total workouts
- Outdoor workouts
- Protein hit rate
- Gallons completed
- Coding/AI hours
- No alcohol streak
- Weekly weigh-ins completed

Badges:
- First Day Done
- Week 1 Locked In
- 7-Day Streak
- Protein Queen
- Gallon Goblin
- Outdoor Warrior
- Code & Conquer
- No Alcohol Week
- Halfway Hotshot — Day 38
- Final Week Beast Mode
- Summer Strong Finisher

## Data Model

### Challenge Settings

```ts
interface ChallengeSettings {
  startDate: string; // 2026-05-25
  totalDays: number; // 75
  proteinGoal: number; // 100
  waterGoalOz: number; // 128
  workoutMinutesGoal: number; // 45
  learningMinutesGoal: number; // 20
}
```

### Daily Entry

```ts
interface DailyEntry {
  date: string;
  dayNumber: number;
  workouts: WorkoutEntry[];
  protein: ProteinEntry[];
  waterOz: number;
  electrolytes?: boolean;
  noAlcohol: boolean;
  learning: LearningEntry;
  checkIn?: DailyCheckIn;
}
```

### Workout Entry

```ts
interface WorkoutEntry {
  id: 'workout1' | 'workout2';
  complete: boolean;
  durationMinutes: number;
  type: 'walk' | 'strength' | 'cardio' | 'yoga' | 'mobility' | 'bike' | 'swim' | 'other';
  location: 'indoor' | 'outdoor';
  notes?: string;
}
```

### Protein Entry

```ts
interface ProteinEntry {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2' | 'snack3';
  grams: number;
  note?: string;
}
```

### Learning Entry

```ts
interface LearningEntry {
  minutes: number;
  type?: 'learn' | 'build' | 'practice' | 'watch-read' | 'prompt-test' | 'document';
  note?: string;
}
```

### Daily Check-In

```ts
interface DailyCheckIn {
  energy?: 'low' | 'medium' | 'high';
  mood?: 'rough' | 'neutral' | 'good' | 'strong';
  bodyNotes?: string;
  note?: string;
}
```

### Weekly Entry

```ts
interface WeeklyEntry {
  weekNumber: number;
  startDate: string;
  endDate: string;
  weight?: number;
  photoTaken: boolean;
  biggestWin?: string;
  hardestPart?: string;
  whatHelped?: string;
  adjustment?: string;
}
```

## Storage

MVP storage: `localStorage`.

Reasons:
- Fast to build
- No login required
- No backend cost
- Weight data stays on Jessica's device/browser

Future option: Firebase sync if cross-device access becomes important.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts for weight/stat charts
- localStorage persistence
- Vercel deployment

## MVP Build Order

1. App scaffold + Summer Strong theme
2. Challenge date utilities and Day X calculation
3. Today Dashboard layout
4. Protein tracker with 3 meals + 3 snacks
5. Water tracker
6. Workout cards and completion validation
7. No alcohol + coding/AI learning cards
8. Daily completion logic
9. 75-day progress grid
10. Weekly check-in form
11. Stats page
12. Badges
13. Mobile polish
14. LocalStorage backup/export option
15. Deploy to Vercel

## Future Features

- Shareable weekly cheer card with no weight/photos
- Accountability-only public view
- Cheer wall
- Firebase sync
- CSV export
- Browser notifications/reminders
- Apple Health/Fitbit integration someday
