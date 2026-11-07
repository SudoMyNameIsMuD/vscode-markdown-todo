import {EntryType, TaskState} from './entry';
import {TASK_MARKERS, TYPE_MARKERS} from './markers';
import type {Entry} from './entry';

/* MAIN */

const LIST_RE = /^(\s*)([*+-])\s+(.*)$/;
const DETAIL_RE = /^\s{2,}›\s+(.*)$/;
const TASK_STATE_BY_MARKER = new Map<string, TaskState> ([
  [TASK_MARKERS[TaskState.Open], TaskState.Open],
  [TASK_MARKERS[TaskState.InProgress], TaskState.InProgress],
  [TASK_MARKERS[TaskState.Done], TaskState.Done],
  ['[X]', TaskState.Done],
  [TASK_MARKERS[TaskState.Migrated], TaskState.Migrated],
  [TASK_MARKERS[TaskState.Canceled], TaskState.Canceled]
]);
const TASK_RE = /^\[([ /xX>-])\]\s+(.*)$/;
const TYPE_RE = /^([!?@])\s+(.*)$/;
const EMPTY_MARKER_RE = /^(?:\[[ /xX>\-]\]|[!?@])$/;

const parseEntry = ( source: string ): Entry | null => {

  const line = source.trimStart ();
  const listMatch = line.match ( LIST_RE );
  const content = listMatch ? listMatch[3] : line;
  const taskMatch = content.match ( TASK_RE );

  if ( taskMatch ) {

    if ( !taskMatch[2].trim () ) return null;

    const state = TASK_STATE_BY_MARKER.get ( `[${taskMatch[1]}]` );

    if ( state ) {

      return {
        type: EntryType.Task,
        text: taskMatch[2].trimEnd (),
        taskState: state,
        details: []
      };

    }

  }

  const typeMatch = content.match ( TYPE_RE );

  if ( typeMatch ) {

    if ( !typeMatch[2].trim () ) return null;

    const type = typeMatch[1] === TYPE_MARKERS.question
      ? EntryType.Question
      : typeMatch[1] === TYPE_MARKERS.important
        ? EntryType.Important
        : EntryType.Event;

    return {type, text: typeMatch[2].trimEnd (), details: []};

  }

  if ( EMPTY_MARKER_RE.test ( content.trim () ) ) return null;

  if ( listMatch && content.trim () ) {

    return {type: EntryType.Note, text: content.trimEnd (), details: []};

  }

  return null;

};

const parseEntries = ( markdown: string ): Entry[] => {

  const entries: Entry[] = [];
  let currentEntry: Entry | undefined;
  let fence: string | undefined;

  for ( const line of markdown.split ( /\r?\n/ ) ) {

    const trimmed = line.trimStart ();

    if ( trimmed.startsWith ( '```' ) || trimmed.startsWith ( '~~~' ) ) {

      const marker = trimmed.slice ( 0, 3 );
      fence = fence === marker ? undefined : marker;
      currentEntry = undefined;

      continue;

    }

    if ( fence ) continue;

    const detailMatch = line.match ( DETAIL_RE );

    if ( detailMatch && currentEntry ) {

      currentEntry.details.push ( detailMatch[1].trimEnd () );

      continue;

    }

    const entry = parseEntry ( line );

    if ( entry ) {

      entries.push ( entry );
      currentEntry = entry;

    } else {

      currentEntry = undefined;

    }

  }

  return entries;

};

/* EXPORT */

export {parseEntry, parseEntries};
