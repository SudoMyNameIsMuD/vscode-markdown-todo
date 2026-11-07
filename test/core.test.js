import assert from 'node:assert/strict';
import {test} from 'node:test';
import {EntryType, TaskState} from '../src/core/entry.ts';
import {parseEntries, parseEntry} from '../src/core/parser.ts';
import {normalizeInput} from '../src/core/normalizer.ts';
import {renderEntry, renderEntryLine} from '../src/core/renderer.ts';
import {decrease, increase, toggleDone, toggleTask} from '../src/core/transitions.ts';

const task = (taskState, text = 'Review drawings', details = []) => ({
  type: EntryType.Task,
  text,
  taskState,
  details
});

test('parses and renders canonical entries and attached details', () => {
  const markdown = [
    '- A note',
    '- [ ] Open task',
    '- [/] In-progress task',
    '- [x] Completed task',
    '- [>] Migrated task',
    '- [-] Canceled task',
    '- ? A question',
    '- ! An important entry',
    '- @ An event',
    '  › Supporting detail'
  ].join('\n');

  assert.equal (
    parseEntries ( markdown ).map ( renderEntry ).join ( '\n' ),
    markdown
  );
});

test('parses legacy marker-only tasks and typed entries', () => {
  const sources = [
    '[ ] Open task',
    '[/] In-progress task',
    '[x] Completed task',
    '[X] Uppercase completed task',
    '[>] Migrated task',
    '[-] Canceled task',
    '? A question',
    '! An important entry',
    '@ An event'
  ];

  const parsed = parseEntries ( sources.join ( '\n' ) );

  assert.deepEqual (
    parsed.map ( entry => entry.type ),
    [
      EntryType.Task,
      EntryType.Task,
      EntryType.Task,
      EntryType.Task,
      EntryType.Task,
      EntryType.Task,
      EntryType.Question,
      EntryType.Important,
      EntryType.Event
    ]
  );
  assert.deepEqual (
    parsed.slice ( 0, 6 ).map ( entry => entry.taskState ),
    [
      TaskState.Open,
      TaskState.InProgress,
      TaskState.Done,
      TaskState.Done,
      TaskState.Migrated,
      TaskState.Canceled
    ]
  );
  assert.equal ( parseEntry ( '[X] Uppercase completed task' )?.taskState, TaskState.Done );
});

test('normalizes leading and trailing quick-entry markers without eating punctuation', () => {
  assert.deepEqual ( normalizeInput ( 'Review drawings [' ), {
    type: 'entry',
    entry: task ( TaskState.Open)
  } );
  assert.deepEqual ( normalizeInput ( '[Review drawings' ), {
    type: 'entry',
    entry: task ( TaskState.Open)
  } );
  assert.deepEqual ( normalizeInput ( 'Review drawings [>' ), {
    type: 'entry',
    entry: task ( TaskState.Migrated)
  } );
  assert.deepEqual ( normalizeInput ( 'Confirm routing ?' ), {
    type: 'entry',
    entry: {type: EntryType.Question, text: 'Confirm routing', details: []}
  } );
  assert.deepEqual ( normalizeInput ( 'What?' ), {
    type: 'entry',
    entry: {type: EntryType.Note, text: 'What?', details: []}
  } );
  assert.deepEqual ( normalizeInput ( 'array[index]' )?.type, 'entry' );
  assert.deepEqual ( normalizeInput ( 'Confirm routing >' ), {
    type: 'detail',
    text: 'Confirm routing'
  } );
  assert.deepEqual ( normalizeInput ( '  › Existing detail' ), {
    type: 'detail',
    text: 'Existing detail'
  } );
  for ( const marker of ['[', '[x', '[ ]', '[/]', '[>]', '[-]', '?', '!', '@', '>', '-', '- [ ]', '- !'] ) {

    assert.equal ( normalizeInput ( marker ), null, `expected empty marker ${marker} to be rejected` );

  }
});

test('renders canonical task markers and respects configured bullet/done symbols', () => {
  assert.equal ( renderEntryLine ( task ( TaskState.Open ) ), '- [ ] Review drawings' );
  assert.equal (
    renderEntryLine ( task ( TaskState.Done ), {bullet: '*', done: 'X'} ),
    '* [X] Review drawings'
  );
});

test('task transitions retain attached details', () => {
  const entry = task ( TaskState.Open, 'Review drawings', ['Verify dimensions'] );

  assert.equal ( toggleTask ( entry ).type, EntryType.Note );
  assert.equal ( toggleTask ( entry ).details[0], 'Verify dimensions' );
  assert.equal ( toggleDone ( entry ).taskState, TaskState.Done );
  assert.equal ( increase ( entry ).taskState, TaskState.InProgress );
  assert.equal ( decrease ( entry ).type, EntryType.Note );
});
