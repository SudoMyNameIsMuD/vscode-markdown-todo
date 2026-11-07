import {EntryType, TaskState} from './entry';
import type {Entry} from './entry';

/* MAIN */

const TASK_STATES = [
  TaskState.Open,
  TaskState.InProgress,
  TaskState.Done,
  TaskState.Migrated,
  TaskState.Canceled
];

const withType = ( entry: Entry, type: EntryType, taskState?: TaskState ): Entry => ({
  ...entry,
  type,
  taskState: type === EntryType.Task ? taskState ?? TaskState.Open : undefined,
  details: [...entry.details]
});

const makeNote = ( entry: Entry ): Entry => withType ( entry, EntryType.Note );
const makeTask = ( entry: Entry, state: TaskState = TaskState.Open ): Entry =>
  withType ( entry, EntryType.Task, state );
const makeQuestion = ( entry: Entry ): Entry => withType ( entry, EntryType.Question );
const makeImportant = ( entry: Entry ): Entry => withType ( entry, EntryType.Important );
const makeEvent = ( entry: Entry ): Entry => withType ( entry, EntryType.Event );

const toggleTask = ( entry: Entry ): Entry => {

  if ( entry.type !== EntryType.Task ) return makeTask ( entry );

  return entry.taskState === TaskState.Open ? makeNote ( entry ) : makeTask ( entry );

};

const toggleDone = ( entry: Entry ): Entry => {

  return entry.type === EntryType.Task && entry.taskState === TaskState.Done
    ? makeTask ( entry )
    : makeTask ( entry, TaskState.Done );

};

const increase = ( entry: Entry ): Entry => {

  if ( entry.type !== EntryType.Task ) return makeTask ( entry );

  const index = TASK_STATES.indexOf ( entry.taskState ?? TaskState.Open );
  const nextState = TASK_STATES[Math.min ( index + 1, TASK_STATES.length - 1 )];

  return makeTask ( entry, nextState );

};

const decrease = ( entry: Entry ): Entry | null => {

  if ( entry.type !== EntryType.Task ) {

    return entry.type === EntryType.Note ? null : makeNote ( entry );

  }

  const index = TASK_STATES.indexOf ( entry.taskState ?? TaskState.Open );

  return index === 0
    ? makeNote ( entry )
    : makeTask ( entry, TASK_STATES[index - 1] );

};

const addDetail = ( entry: Entry, detail: string ): Entry => ({
  ...entry,
  details: [...entry.details, detail]
});

/* EXPORT */

export {
  addDetail,
  decrease,
  increase,
  makeEvent,
  makeImportant,
  makeNote,
  makeQuestion,
  makeTask,
  toggleDone,
  toggleTask
};
