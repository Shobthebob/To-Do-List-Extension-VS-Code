"use strict";
const vscode = require('vscode');

class MyWebviewViewProvider {
	constructor(_extensionUri, viewType) {
		this._extensionUri = _extensionUri;
		this._viewType = viewType;
		this._view = undefined;
	}

	resolveWebviewView(webviewView, context, _token) {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};
		
		webviewView.webview.html = this.getTodoHtml(webviewView.webview);

		webviewView.webview.onDidReceiveMessage((message) => {
			if (message.command === 'deleteTaskNotification') {
					vscode.window.showInformationMessage(`Task deleted: ${message.task}`);
			}
		});
	}

	getTodoHtml(webview) {
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'style.css'));
		const mainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'main.js'));
		const nonce = getNonce();
		return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>To-Do List</title>
            </head>
            <body class="sidebar">
                <ul class="todo-list" id="todo-list"></ul>
                <div class="input-container">
                    <input type="text" id="new-task-input" placeholder="Add a new task...">
                    <button id="add-task-button" class="add-btn" title="Add task">+</button>
                </div>
                <script nonce="${nonce}" src="${mainUri}"></script>
            </body>
            </html>`;
	}
}

function activate(context) {
	const todoProvider = new MyWebviewViewProvider(context.extensionUri, 'todo');
	let todoDisposable = vscode.window.registerWebviewViewProvider("toDo", todoProvider, { webviewOptions: { retainContextWhenHidden: true } });
	context.subscriptions.push(todoDisposable);

	let disposableCommand = vscode.commands.registerCommand('toDo.yo', () => {
		vscode.window.showInformationMessage("YOOOOOOOOOOOOOO!");
	});
	context.subscriptions.push(disposableCommand);
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

exports.activate = activate;
exports.deactivate = function () { };