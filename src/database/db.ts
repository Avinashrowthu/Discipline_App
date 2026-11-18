import Dexie, { type EntityTable } from 'dexie'

export type BaseRecord = {
  id: string
  title?: string
  name?: string
  description?: string
  category?: string
  status?: string
  date?: string
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

export class LifeOSDatabase extends Dexie {
  profile!: EntityTable<BaseRecord, 'id'>
  habits!: EntityTable<BaseRecord, 'id'>
  habitCompletions!: EntityTable<BaseRecord, 'id'>
  tasks!: EntityTable<BaseRecord, 'id'>
  taskOccurrences!: EntityTable<BaseRecord, 'id'>
  expenses!: EntityTable<BaseRecord, 'id'>
  income!: EntityTable<BaseRecord, 'id'>
  budgets!: EntityTable<BaseRecord, 'id'>
  savingsGoals!: EntityTable<BaseRecord, 'id'>
  weightEntries!: EntityTable<BaseRecord, 'id'>
  workouts!: EntityTable<BaseRecord, 'id'>
  waterEntries!: EntityTable<BaseRecord, 'id'>
  sleepEntries!: EntityTable<BaseRecord, 'id'>
  nutritionEntries!: EntityTable<BaseRecord, 'id'>
  projects!: EntityTable<BaseRecord, 'id'>
  careerActivities!: EntityTable<BaseRecord, 'id'>
  learningResources!: EntityTable<BaseRecord, 'id'>
  studySessions!: EntityTable<BaseRecord, 'id'>
  goals!: EntityTable<BaseRecord, 'id'>
  milestones!: EntityTable<BaseRecord, 'id'>
  journalEntries!: EntityTable<BaseRecord, 'id'>
  settings!: EntityTable<BaseRecord, 'id'>

  constructor() {
    super('LifeOS')
    this.version(1).stores({
      profile: 'id, updatedAt',
      habits: 'id, category, status, startDate, updatedAt',
      habitCompletions: 'id, habitId, date, createdAt',
      tasks: 'id, category, priority, dueDate, status, goalId, updatedAt',
      taskOccurrences: 'id, taskId, date, status',
      expenses: 'id, category, date, paymentMethod',
      income: 'id, category, date',
      budgets: 'id, category, month',
      savingsGoals: 'id, targetDate, status',
      weightEntries: 'id, date',
      workouts: 'id, category, date, status',
      waterEntries: 'id, date',
      sleepEntries: 'id, date',
      nutritionEntries: 'id, mealType, date',
      projects: 'id, status, startDate, targetDate',
      careerActivities: 'id, projectId, date, type',
      learningResources: 'id, category, status',
      studySessions: 'id, resourceId, date',
      goals: 'id, category, targetDate, status',
      milestones: 'id, goalId, targetDate, status',
      journalEntries: 'id, date, mood',
      settings: 'id, updatedAt',
    })
  }
}

export const db = new LifeOSDatabase()

export function uid(prefix = 'record') {
  return `${prefix}-${crypto.randomUUID()}`
}

export function now() {
  return new Date().toISOString()
}
