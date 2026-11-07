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

const transformSelectedLines = async ( transform: Transform ): Promise<boolean> => {

  const textEditor = vscode.window.activeTextEditor;

  if ( !textEditor ) return false;
  if ( textEditor.document.languageId !== 'markdown' ) return false;

  const document = textEditor.document;
  const linesNr = uniq ( textEditor.selections.map ( getSelectionRange ).flat ().sort () );
  const lines = linesNr.map ( lineNr => document.lineAt ( lineNr ) );

  if ( !lines.length ) return false;

  const edits: vscode.TextEdit[] = [];

  for ( const line of lines ) {

    const lineNextText = transform ( line.text, line.lineNumber, document );

    if ( lineNextText === null || lineNextText === line.text ) continue;

    edits.push ( ...Edits.makeDiff ( line.text, lineNextText, line.lineNumber ) );

  }

  if ( !edits.length ) return false;

  const applied = await Edits.apply ( textEditor, edits );

  if ( !applied ) {

    await vscode.window.showErrorMessage ( 'Markdown Todo could not apply the requested edit.' );
    return false;

  }

  return true;

};

const getEntry = ( line: string ): Entry | null => {

  const normalized = normalizeInput ( line.trim () );

  return normalized?.type === 'entry' ? normalized.entry : null;

};

const getEmptyListEntry = ( line: string ): Entry | null => {

  const listMatch = line.match ( /^\s*[*+-]\s+(.*)$/ );

  if ( !listMatch ) return null;

  const content = listMatch[1];
  const taskMatch = content.match ( /^\[([ /xX>\-])\]\s*$/ );

  if ( taskMatch ) {

    const parsed = parseEntry ( `${line}placeholder` );

    return parsed ? {...parsed, text: ''} : null;

  }

  return content.trim ()
    ? null
    : {type: EntryType.Note, text: '', details: []};

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

const transformSelectedLinesAndFocusBlankEntry = async ( transform: Transform ): Promise<void> => {

  const textEditor = vscode.window.activeTextEditor;

  if ( !textEditor || textEditor.document.languageId !== 'markdown' ) return;

  const blankActiveLines = new Set (
    textEditor.selections
      .map ( selection => selection.active.line )
      .filter ( lineNumber => {

        const line = textEditor.document.lineAt ( lineNumber ).text;

        return !line.trim () || Boolean ( getEmptyListEntry ( line ) );

      } )
  );

  const applied = await transformSelectedLines ( transform );

  if ( !applied || !blankActiveLines.size ) return;

  textEditor.selections = textEditor.selections.map ( selection => {

    if ( !blankActiveLines.has ( selection.active.line ) ) return selection;

    const line = textEditor.document.lineAt ( selection.active.line );
    const position = new vscode.Position ( line.lineNumber, line.text.length );

    return new vscode.Selection ( position, position );

  } );

};

const toggleDone = async (): Promise<void> => {

  await transformSelectedLines ( transformEntry ( toggleDoneEntry ) );

};

const toggleTodo = async (): Promise<void> => {

  await transformSelectedLinesAndFocusBlankEntry ( line => {

    const entry = getEntry ( line ) ?? getEmptyListEntry ( line );

    if ( entry ) return renderForLine ( toggleTask ( entry ), line );
    if ( line.trim () ) return null;

    return renderForLine ( makeTask ( {type: EntryType.Note, text: '', details: []} ), line );

  } );

};

const decrease = async (): Promise<void> => {

  let hasAttachedDetails = false;

  await transformSelectedLinesAndFocusBlankEntry ( ( line, lineNumber, document ) => {

    const entry = parseEntry ( line ) ?? getEntry ( line ) ?? getEmptyListEntry ( line );

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

  await transformSelectedLinesAndFocusBlankEntry ( line => {

    const parsed = parseEntry ( line );
    const emptyEntry = getEmptyListEntry ( line );
    const entry = parsed ?? getEntry ( line ) ?? emptyEntry;

    if ( !entry ) {

      return line.trim () ? null : renderForLine ( {type: EntryType.Note, text: '', details: []}, line );

    }

    if ( !parsed && entry.type === EntryType.Note && !emptyEntry ) {

      return renderForLine ( makeNote ( entry ), line );

    }

    return renderForLine ( increaseEntry ( entry ), line );

  } );

};

const makeTaskCommand = async (): Promise<void> => {

  await transformSelectedLinesAndFocusBlankEntry ( line => {

    const entry = getEntry ( line );

    if ( entry ) return renderForLine ( makeTask ( entry ), line );
    if ( line.trim () ) return null;

    return renderForLine ( makeTask ( {type: EntryType.Note, text: '', details: []} ), line );

  } );

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

  await transformSelectedLinesAndFocusBlankEntry ( line => {

    const entry = getEntry ( line ) ?? getEmptyListEntry ( line );

    if ( entry ) return renderForLine ( makeEvent ( entry ), line );
    if ( line.trim () ) return null;

    return renderForLine ( makeEvent ( {type: EntryType.Note, text: '', details: []} ), line );

  } );

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
  const blankLines = new Set<number> ();
  let hasInvalidParent = false;

  for ( const lineNumber of linesNr ) {

    const line = document.lineAt ( lineNumber );

    if ( !line.text.trim () ) {

      const lineNextText = hasAdjacentParent ( document, lineNumber )
        ? renderDetail ( '' )
        : renderForLine ( {type: EntryType.Note, text: '', details: []}, line.text );

      edits.push ( vscode.TextEdit.replace ( line.range, lineNextText ) );
      blankLines.add ( lineNumber );

      continue;

    }

    const normalized = normalizeInput ( line.text );
    const detailText = normalized?.type === 'detail'
      ? normalized.text
      : normalized?.type === 'entry'
        ? normalized.entry.type === EntryType.Note
          ? normalized.entry.text
          : renderEntryLine ( normalized.entry, {
            bullet: line.text.match ( /^\s*([*+-])\s+/ )?.[1] ?? getOptions ().symbols.bullet,
            done: getOptions ().symbols.done
          } )
        : '';

    if ( !detailText ) continue;

    if ( !hasAdjacentParent ( document, lineNumber ) ) {

      hasInvalidParent = true;

      continue;

    }

    const lineNextText = renderDetail ( detailText );

    edits.push ( vscode.TextEdit.replace ( line.range, lineNextText ) );

  }

  if ( hasInvalidParent ) {

    await vscode.window.showErrorMessage ( 'Supporting details must follow a canonical Markdown entry.' );

  }

  if ( !edits.length ) return;

  const applied = await Edits.apply ( textEditor, edits );

  if ( !applied ) {

    await vscode.window.showErrorMessage ( 'Markdown Todo could not apply the requested edit.' );
    return;

  }

  if ( blankLines.size ) {

    textEditor.selections = textEditor.selections.map ( selection => {

      if ( !blankLines.has ( selection.active.line ) ) return selection;

      const line = document.lineAt ( selection.active.line );
      const position = new vscode.Position ( line.lineNumber, line.text.length );

      return new vscode.Selection ( position, position );

    } );

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
