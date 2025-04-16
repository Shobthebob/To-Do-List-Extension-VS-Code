"use strict";
const vscode = require('vscode');

class toDoListWebviewProvider {
	constructor(_extensionUri, viewType, context) {
		this._extensionUri = _extensionUri;
		this._viewType = viewType;
		this._context = context;
		this._view = undefined;
	}

	resolveWebviewView(webviewView) {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this.getTodoHtml(webviewView.webview);

		const tasks = this._context.workspaceState.get('tasks', []);
		webviewView.webview.postMessage({ command: 'restoreTasks', tasks: tasks });

		webviewView.webview.onDidReceiveMessage(async (message) => {
			if (message.command === 'updateWorkspaceState') {
				await this._context.workspaceState.update('tasks', message.tasks);
			}
			if (message.command === 'sendToCompleted') {
				console.log(`Forwarding to completed view: ${message.task.text}`);
				global.completedProvider._view?.webview.postMessage({
					command: 'moveToCompleted',
					task: message.task.text
				});
			}
			if (message.command === "duplicateFound") {
				vscode.window.showInformationMessage(`Task "${message.task}" already exists`);
			}
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

class completedWebviewProvider {
	constructor(_extensionUri, viewType, context) {
		this._extensionUri = _extensionUri;
		this._viewType = viewType;
		this._context = context;
		this._view = undefined;
	}

	resolveWebviewView(webviewView) {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this.getTodoHtml(webviewView.webview);

		const doneTasks = this._context.workspaceState.get('doneTasks', []);
		webviewView.webview.postMessage({ command: 'restoreTasks', tasks: doneTasks });

		webviewView.webview.onDidReceiveMessage(async (message) => {
			if (message.command === 'updateWorkspaceState') {
				await this._context.workspaceState.update('doneTasks', message.tasks);
			}
			if (message.command === 'removeFromCompleted') {
				console.log(`Forwarding to to-do view: ${message}`);
				global.todoProvider._view?.webview.postMessage({
					command: 'moveToDo',
					task: message.task
				});
			}
			if (message.command === 'deleteTaskNotification') {
				vscode.window.showInformationMessage(`Task deleted: ${message.task}`);
			}
		});

	}

	getTodoHtml(webview) {
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'style.css'));
		const mainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'completed.js'));
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
                <script nonce="${nonce}" src="${mainUri}"></script>
            </body>
            </html>`;
	}
}

function activate(context) {
	const todoProvider = new toDoListWebviewProvider(context.extensionUri, 'todo', context);
	global.todoProvider = todoProvider;
	let todoDisposable = vscode.window.registerWebviewViewProvider("toDo", todoProvider, { webviewOptions: { retainContextWhenHidden: true } });
	context.subscriptions.push(todoDisposable);

	const completedProvider = new completedWebviewProvider(context.extensionUri, 'completed', context);
	global.completedProvider = completedProvider;
	let completedDisposable = vscode.window.registerWebviewViewProvider("completed", completedProvider, { webviewOptions: { retainContextWhenHidden: true } });
	context.subscriptions.push(completedDisposable);
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