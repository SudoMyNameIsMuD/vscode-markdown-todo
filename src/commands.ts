/* IMPORT */

import vscode from 'vscode';
import {EntryType} from './core/entry';
import type {Entry} from './core/entry';
import {parseEntry} from './core/parser';
import {normalizeInput} from './core/normalizer';
import {renderDetail, renderEntryLine} from './core/renderer';
import {
  decrease as decreaseEntry,
  increase as increaseEntry,
  makeEvent,
  makeImportant,
  makeNote,
  makeQuestion,
  makeTask,
  toggleDone as toggleDoneEntry,
  toggleTask
} from './core/transitions';
import Edits from './edits';
import {getOptions, getSelectionRange, uniq} from './utils';

/* MAIN */

type Transform = (
  line: string,
  lineNumber: number,
  document: vscode.TextDocument
) => string | null;

const transformSelectedLines = async ( transform: Transform ): Promise<void> => {

  const textEditor = vscode.window.activeTextEditor;

  if ( !textEditor ) return;
  if ( textEditor.document.languageId !== 'markdown' ) return;

  const document = textEditor.document;
  const linesNr = uniq ( textEditor.selections.map ( getSelectionRange ).flat ().sort () );
  const lines = linesNr.map ( lineNr => document.lineAt ( lineNr ) );

  if ( !lines.length ) return;

  const edits: vscode.TextEdit[] = [];

  for ( const line of lines ) {

    const lineNextText = transform ( line.text, line.lineNumber, document );

    if ( lineNextText === null || lineNextText === line.text ) continue;

    edits.push ( ...Edits.makeDiff ( line.text, lineNextText, line.lineNumber ) );

  }

  if ( !edits.length ) return;

  const applied = await Edits.apply ( textEditor, edits );

  if ( !applied ) {

    await vscode.window.showErrorMessage ( 'Markdown Todo could not apply the requested edit.' );

  }

};

const getEntry = ( line: string ): Entry | null => {

  const normalized = normalizeInput ( line.trim () );

  return normalized?.type === 'entry' ? normalized.entry : null;

};

const renderForLine = ( entry: Entry, line: string ): string => {

  const options = getOptions ();
  const indent = line.match ( /^\s*/ )?.[0] ?? '';
  const bullet = line.match ( /^\s*([*+-])\s+/ )?.[1] ?? options.symbols.bullet;

  return `${indent}${renderEntryLine ( entry, {bullet, done: options.symbols.done} )}`;

};

const transformEntry = ( transform: ( entry: Entry ) => Entry ): Transform => line => {

  const entry = getEntry ( line );

  return entry ? renderForLine ( transform ( entry ), line ) : null;

};

const toggleDone = async (): Promise<void> => {

  await transformSelectedLines ( transformEntry ( toggleDoneEntry ) );

};

const toggleTodo = async (): Promise<void> => {

  await transformSelectedLines ( transformEntry ( toggleTask ) );

};

const decrease = async (): Promise<void> => {

  let hasAttachedDetails = false;

  await transformSelectedLines ( ( line, lineNumber, document ) => {

    const entry = parseEntry ( line ) ?? getEntry ( line );

    if ( !entry ) return null;

    const nextEntry = decreaseEntry ( entry );

    if ( nextEntry ) return renderForLine ( nextEntry, line );

    let lineHasAttachedDetails = false;

    for ( let index = lineNumber + 1; index < document.lineCount; index++ ) {

      const nextLine = document.lineAt ( index ).text;

      if ( !nextLine.trim () ) break;
      if ( /^\s{2,}›\s+/.test ( nextLine ) ) {

        hasAttachedDetails = true;
        lineHasAttachedDetails = true;

        break;

      }

      break;

    }

    if ( lineHasAttachedDetails ) return line;

    return entry.text;

  } );

  if ( hasAttachedDetails ) {

    await vscode.window.showWarningMessage ( 'A parent entry with supporting details cannot become plain text.' );

  }

};

const increase = async (): Promise<void> => {

  await transformSelectedLines ( line => {

    const parsed = parseEntry ( line );
    const entry = parsed ?? getEntry ( line );

    if ( !entry ) return null;
    if ( !parsed && entry.type === EntryType.Note ) {

      return renderForLine ( makeNote ( entry ), line );

    }

    return renderForLine ( increaseEntry ( entry ), line );

  } );

};

const makeTaskCommand = async (): Promise<void> => {

  await transformSelectedLines ( transformEntry ( makeTask ) );

};

const makeNoteCommand = async (): Promise<void> => {

  await transformSelectedLines ( transformEntry ( makeNote ) );

};

const makeQuestionCommand = async (): Promise<void> => {

  await transformSelectedLines ( transformEntry ( makeQuestion ) );

};

const makeImportantCommand = async (): Promise<void> => {

  await transformSelectedLines ( transformEntry ( makeImportant ) );

};

const makeEventCommand = async (): Promise<void> => {

  await transformSelectedLines ( transformEntry ( makeEvent ) );

};

const normalize = async (): Promise<void> => {

  let hasInvalidParent = false;

  await transformSelectedLines ( ( line, lineNumber, document ) => {

    const normalized = normalizeInput ( line );

    if ( !normalized ) return null;
    if ( normalized.type === 'detail' ) {

      if ( !hasAdjacentParent ( document, lineNumber ) ) {

        hasInvalidParent = true;

        return null;

      }

      return renderDetail ( normalized.text );

    }

    return renderForLine ( normalized.entry, line );

  } );

  if ( hasInvalidParent ) {

    await vscode.window.showErrorMessage ( 'Supporting details must follow a canonical Markdown entry.' );

  }

};

const hasAdjacentParent = ( document: vscode.TextDocument, lineNumber: number ): boolean => {

  for ( let index = lineNumber - 1; index >= 0; index-- ) {

    const line = document.lineAt ( index ).text;

    if ( !line.trim () ) return false;
    if ( /^\s{2,}›\s+/.test ( line ) ) continue;
    if ( parseEntry ( line ) ) return true;
    if ( /^#{1,6}\s/.test ( line ) ) return false;
    return false;

  }

  return false;

};

const makeDetail = async (): Promise<void> => {

  const textEditor = vscode.window.activeTextEditor;

  if ( !textEditor ) return;
  if ( textEditor.document.languageId !== 'markdown' ) return;

  const document = textEditor.document;
  const linesNr = uniq ( textEditor.selections.map ( getSelectionRange ).flat ().sort () );
  const edits: vscode.TextEdit[] = [];
  let hasInvalidParent = false;

  for ( const lineNumber of linesNr ) {

    const line = document.lineAt ( lineNumber );
    const normalized = normalizeInput ( line.text );
    const detailText = normalized?.type === 'detail'
      ? normalized.text
      : normalized?.type === 'entry'
        ? normalized.entry.text
        : '';

    if ( !detailText ) continue;

    if ( !hasAdjacentParent ( document, lineNumber ) ) {

      hasInvalidParent = true;

      continue;

    }

    const lineNextText = renderDetail ( detailText );

    edits.push ( ...Edits.makeDiff ( line.text, lineNextText, lineNumber ) );

  }

  if ( hasInvalidParent ) {

    await vscode.window.showErrorMessage ( 'Supporting details must follow a canonical Markdown entry.' );

  }

  if ( !edits.length ) return;

  const applied = await Edits.apply ( textEditor, edits );

  if ( !applied ) {

    await vscode.window.showErrorMessage ( 'Markdown Todo could not apply the requested edit.' );

  }

};

/* EXPORT */

export {
  decrease,
  increase,
  makeDetail,
  makeEventCommand,
  makeImportantCommand,
  makeNoteCommand,
  makeQuestionCommand,
  makeTaskCommand,
  normalize,
  toggleDone,
  toggleTodo
};
