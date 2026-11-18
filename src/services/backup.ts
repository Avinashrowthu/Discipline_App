import { db } from '../database/db'

export const BACKUP_SCHEMA_VERSION = 1
export const TABLE_NAMES = [
  'profile', 'habits', 'habitCompletions', 'tasks', 'taskOccurrences',
  'expenses', 'income', 'budgets', 'savingsGoals', 'weightEntries',
  'workouts', 'waterEntries', 'sleepEntries', 'nutritionEntries',
  'projects', 'careerActivities', 'learningResources', 'studySessions',
  'goals', 'milestones', 'journalEntries', 'settings',
] as const

export async function exportBackup() {
  const payload: Record<string, unknown[]> = {}
  for (const table of TABLE_NAMES) payload[table] = await db.table(table).toArray()
  return {
    application: 'LifeOS',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: payload,
  }
}

export async function validateAndRestore(file: File) {
  const text = await file.text()
  let backup: unknown
  try { backup = JSON.parse(text) } catch { throw new Error('The selected file is not valid JSON.') }
  if (!backup || typeof backup !== 'object') throw new Error('The backup format is invalid.')
  const value = backup as Record<string, unknown>
  if (value.application !== 'LifeOS') throw new Error('This backup is not for LifeOS.')
  if (value.schemaVersion !== BACKUP_SCHEMA_VERSION) throw new Error(`Unsupported backup schema version: ${String(value.schemaVersion)}.`)
  if (!value.data || typeof value.data !== 'object' || Array.isArray(value.data)) throw new Error('The backup data payload is missing.')
  const data = value.data as Record<string, unknown>
  for (const table of TABLE_NAMES) {
    if (!(table in data) || !Array.isArray(data[table])) throw new Error(`The backup is missing required table: ${table}.`)
  }

  await db.transaction('rw', TABLE_NAMES.map(name => db.table(name)), async () => {
    for (const table of TABLE_NAMES) {
      await db.table(table).clear()
      await db.table(table).bulkAdd(data[table] as object[])
    }
  })
}
