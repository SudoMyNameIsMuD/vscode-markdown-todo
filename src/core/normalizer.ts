import {EntryType, TaskState} from './entry';
import {parseEntry} from './parser';
import {QUICK_MARKERS} from './markers';
import type {Entry} from './entry';

/* MAIN */

type NormalizedInput =
  | {type: 'entry', entry: Entry}
  | {type: 'detail', text: string};

const TASK_INPUTS: [string, TaskState][] = [
  ...QUICK_MARKERS.taskInProgress.map ( marker => [marker, TaskState.InProgress] as [string, TaskState] ),
  ...QUICK_MARKERS.taskDone.map ( marker => [marker, TaskState.Done] as [string, TaskState] ),
  ...QUICK_MARKERS.taskMigrated.map ( marker => [marker, TaskState.Migrated] as [string, TaskState] ),
  ...QUICK_MARKERS.taskCanceled.map ( marker => [marker, TaskState.Canceled] as [string, TaskState] ),
  ...QUICK_MARKERS.taskOpen.map ( marker => [marker, TaskState.Open] as [string, TaskState] )
].sort ( ( a, b ) => b[0].length - a[0].length );

const TYPE_INPUTS: [string, EntryType][] = [
  ['?', EntryType.Question],
  ['!', EntryType.Important],
  ['@', EntryType.Event]
];
const EMPTY_MARKERS = new Set<string> ( Object.values ( QUICK_MARKERS ).flat () );

const trimMarker = ( text: string, marker: string ): string | null => {

  if ( text.startsWith ( marker ) ) {

    const rest = text.slice ( marker.length );

    const allowsCompactPrefix = marker === '[';

    return rest.length && !allowsCompactPrefix && !/^\s/.test ( rest ) ? null : rest.trim ();

  }

  if ( text.endsWith ( marker ) ) {

    const start = text.length - marker.length;
    const preceding = text.slice ( 0, start );

    if ( preceding && /\s$/.test ( preceding ) ) return preceding.trim ();

  }

  return null;

};

const normalizeInput = ( source: string ): NormalizedInput | null => {

  const text = source.trim ();

  if ( !text ) return null;
  if ( text === '-' || text === '*' || text === '+' || EMPTY_MARKERS.has ( text ) ) return null;

  const listContent = text.match ( /^[*+-]\s+(.*)$/ )?.[1];

  if ( listContent !== undefined && EMPTY_MARKERS.has ( listContent ) ) return null;

  if ( text.startsWith ( '› ' ) ) {

    const detailText = text.slice ( 2 ).trim ();

    return detailText ? {type: 'detail', text: detailText} : null;

  }

  const detail = trimMarker ( text, '>' );

  if ( detail !== null ) {

    return detail ? {type: 'detail', text: detail} : null;

  }

  const parsed = parseEntry ( text );

  if ( parsed ) return {type: 'entry', entry: parsed};

  for ( const [marker, taskState] of TASK_INPUTS ) {

    const taskText = trimMarker ( text, marker );

    if ( taskText !== null ) {

      if ( !taskText ) return null;

      return {
        type: 'entry',
        entry: {type: EntryType.Task, text: taskText, taskState, details: []}
      };

    }

  }

  for ( const [marker, type] of TYPE_INPUTS ) {

    const entryText = trimMarker ( text, marker );

    if ( entryText !== null ) {

      if ( !entryText ) return null;

      return {type: 'entry', entry: {type, text: entryText, details: []}};

    }

  }

  return {type: 'entry', entry: {type: EntryType.Note, text, details: []}};

};

const normalizeEntry = ( source: string ): Entry | null => {

  const normalized = normalizeInput ( source );

  return normalized?.type === 'entry' ? normalized.entry : null;

};

/* EXPORT */

export {normalizeEntry, normalizeInput};
export type {NormalizedInput};
