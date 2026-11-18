import { db, now, uid, type BaseRecord } from './db'

export type { BaseRecord } from './db'

export async function list(table: string) {
  return db.table(table).toArray() as Promise<BaseRecord[]>
}

export async function create(table: string, data: Record<string, unknown>) {
  const record = { ...data, id: uid(table), createdAt: now(), updatedAt: now() } as BaseRecord
  await db.table(table).add(record)
  return record
}

export async function update(table: string, id: string, data: Record<string, unknown>) {
  await db.table(table).update(id, { ...data, updatedAt: now() })
}

export async function remove(table: string, id: string) {
  await db.table(table).delete(id)
}
