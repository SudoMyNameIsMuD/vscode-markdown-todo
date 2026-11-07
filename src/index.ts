
/* IMPORT */

import vscode from 'vscode';
import * as Commands from './commands';

/* MAIN */

const activate = ( context: vscode.ExtensionContext ): void => {

  context.subscriptions.push (
    vscode.commands.registerCommand ( 'markdown.todo.toggleDone', Commands.toggleDone ),
    vscode.commands.registerCommand ( 'markdown.todo.toggleTodo', Commands.toggleTodo ),
    vscode.commands.registerCommand ( 'markdown.todo.decrease', Commands.decrease ),
    vscode.commands.registerCommand ( 'markdown.todo.increase', Commands.increase ),
    vscode.commands.registerCommand ( 'markdown.todo.makeTask', Commands.makeTaskCommand ),
    vscode.commands.registerCommand ( 'markdown.todo.makeNote', Commands.makeNoteCommand ),
    vscode.commands.registerCommand ( 'markdown.todo.makeQuestion', Commands.makeQuestionCommand ),
    vscode.commands.registerCommand ( 'markdown.todo.makeImportant', Commands.makeImportantCommand ),
    vscode.commands.registerCommand ( 'markdown.todo.makeEvent', Commands.makeEventCommand ),
    vscode.commands.registerCommand ( 'markdown.todo.makeDetail', Commands.makeDetail ),
    vscode.commands.registerCommand ( 'markdown.todo.normalize', Commands.normalize )
  );

};

/* EXPORT */

export {activate};
