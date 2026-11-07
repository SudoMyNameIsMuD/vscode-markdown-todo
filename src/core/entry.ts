/* MAIN */

enum EntryType {
  Note = 'note',
  Task = 'task',
  Question = 'question',
  Important = 'important',
  Event = 'event'
}

enum TaskState {
  Open = 'open',
  InProgress = 'in_progress',
  Done = 'done',
  Migrated = 'migrated',
  Canceled = 'canceled'
}

type Entry = {
  type: EntryType,
  text: string,
  taskState?: TaskState,
  details: string[]
};

/* EXPORT */

export {EntryType, TaskState};
export type {Entry};
