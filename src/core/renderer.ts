import {EntryType, TaskState} from './entry';
import {TASK_MARKERS, TYPE_MARKERS} from './markers';
import type {Entry} from './entry';

/* MAIN */

type RenderOptions = {
  bullet?: string,
  done?: string
};

const renderEntryLine = ( entry: Entry, options: RenderOptions = {} ): string => {

  const bullet = options.bullet ?? '-';
  let marker = '';

  if ( entry.type === EntryType.Task ) {

    marker = TASK_MARKERS[entry.taskState ?? TaskState.Open];

    if ( entry.taskState === TaskState.Done && options.done ) {

      marker = `[${options.done}]`;

    }

  } else if ( entry.type === EntryType.Question ) {

    marker = TYPE_MARKERS.question;

  } else if ( entry.type === EntryType.Important ) {

    marker = TYPE_MARKERS.important;

  } else if ( entry.type === EntryType.Event ) {

    marker = TYPE_MARKERS.event;

  }

  return marker ? `${bullet} ${marker} ${entry.text}` : `${bullet} ${entry.text}`;

};

const renderEntry = ( entry: Entry, options: RenderOptions = {} ): string => {

  return [
    renderEntryLine ( entry, options ),
    ...entry.details.map ( renderDetail )
  ].join ( '\n' );

};

const renderDetail = ( detail: string ): string => {

  return `  › ${detail}`;

};

/* EXPORT */

export {renderDetail, renderEntry, renderEntryLine};
export type {RenderOptions};
