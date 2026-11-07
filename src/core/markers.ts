import {TaskState} from './entry';

/* MAIN */

const QUICK_MARKERS = {
  taskOpen: ['[', '[ ]'],
  taskInProgress: ['[/', '[/]'],
  taskDone: ['[x', '[x]', '[X', '[X]'],
  taskMigrated: ['[>', '[>]'],
  taskCanceled: ['[-', '[-]'],
  question: ['?'],
  important: ['!'],
  event: ['@'],
  detail: ['>']
} as const;

const TASK_MARKERS: Record<TaskState, string> = {
  [TaskState.Open]: '[ ]',
  [TaskState.InProgress]: '[/]',
  [TaskState.Done]: '[x]',
  [TaskState.Migrated]: '[>]',
  [TaskState.Canceled]: '[-]'
};

const TYPE_MARKERS = {
  question: '?',
  important: '!',
  event: '@'
} as const;

/* EXPORT */

export {QUICK_MARKERS, TASK_MARKERS, TYPE_MARKERS};
