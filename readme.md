# Markdown Todo

<p align="center">
  <img src="https://raw.githubusercontent.com/fabiospampinato/vscode-markdown-todo/master/resources/logo.png" width="128" alt="Logo">
</p>

Manage todo lists inside markdown files with ease.

## Install

Follow the instructions in the [Marketplace](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-markdown-todo), or run the following in the command palette:

```sh
ext install fabiospampinato.vscode-markdown-todo
```

## Usage

It adds these commands to the command palette:

```js
'Markdown Todo: Toggle Todo' // Toggle a todo
'Markdown Todo: Toggle Done' // Toggle a todo as done
'Markdown Todo: Decrease' // Move a line toward plain text through the task-state sequence
'Markdown Todo: Increase' // Move a line toward canceled through the task-state sequence
'Markdown Todo: Make Task' // Make the selected line (or blank line) an open task
'Markdown Todo: Make Note' // Make the selected line a note
'Markdown Todo: Make Question' // Make the selected line a question
'Markdown Todo: Make Important' // Mark the selected line as important
'Markdown Todo: Make Event' // Make the selected line (or blank line) an event
'Markdown Todo: Make Detail' // Attach the selected line as a supporting detail to the preceding entry
'Markdown Todo: Normalize Entry' // Normalize a quick-entry marker into canonical Markdown
```

Canonical entries use Markdown list items:

```markdown
- A note
- [ ] An open task
- [/] An in-progress task
- [x] A completed task
- [>] A migrated task
- [-] A canceled task
- ? A question
- ! An important entry
- @ An event
  › A supporting detail attached to the preceding entry
```

The parser also recognizes existing marker-only task and typed entries. Supporting details belong to a parent entry and are not standalone entries. Use **Make Detail** to indent a selected line under its preceding entry; task, question, and important markers are preserved in the detail. On a blank line, **Make Detail** creates an empty detail under a valid preceding entry, or a note entry when there is no parent. A hyphen-prefixed line remains its own entry unless you explicitly run **Make Detail** on it. Quick markers can be placed at the start or end of a line; trailing type markers must be separated from the text, so ordinary punctuation such as `What?` is preserved.

It adds these shortcuts when editing a `Markdown` file:

```js
'Cmd/Ctrl+Enter' // Triggers `Markdown Todo: Toggle Todo`
'Alt+Enter' // Triggers `Markdown Todo: Toggle Todo`
'Alt+D' // Triggers `Markdown Todo: Toggle Done`
'Option+Up' // Triggers `Markdown Todo: Increase` on macOS
'Option+Down' // Triggers `Markdown Todo: Decrease` on macOS
'Cmd+Shift+Enter' // Triggers `Markdown Todo: Make Detail` on macOS
```

On an empty line, `Cmd/Ctrl+Enter` or `Markdown Todo: Make Task` creates a new open task. **Make Event** creates an event marker, ready for text. **Increase** on an empty line creates a note; pressing it again cycles that empty note to an open task. The Make Detail shortcut creates a detail under its preceding entry, or a note when no parent is present.

## Settings

```js
{
  "markdown.todo.symbols.bullet": "-", // Todo bullet symbol
  "markdown.todo.symbols.done": "x" // Todo done symbol
}
```

## Demo

![Demo](resources/demo.gif)

## License

MIT © Fabio Spampinato
