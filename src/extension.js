'use strict';
const vscode = require('vscode');
const fs = require('fs');

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

	// Register Import Tasks command
	let importTasksDisposable = vscode.commands.registerCommand('toDo.importTasks', async () => {
		try {
			const fileUri = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					'JSON files': ['json']
				}
			});

			if (fileUri && fileUri[0]) {
				const fileContent = await vscode.workspace.fs.readFile(fileUri[0]);
				const tasks = JSON.parse(fileContent.toString());

				if (Array.isArray(tasks)) {
					const currentTasks = context.workspaceState.get('tasks', []);
					const newTasks = [...currentTasks, ...tasks];
					await context.workspaceState.update('tasks', newTasks);
					todoProvider._view?.webview.postMessage({ command: 'restoreTasks', tasks: newTasks });
					vscode.window.showInformationMessage('Tasks imported successfully!');
				} else {
					vscode.window.showErrorMessage('Invalid task file format');
				}
			}
		} catch (error) {
			vscode.window.showErrorMessage('Error importing tasks: ' + error.message);
		}
	});

	// Register Export Tasks command
	let exportTasksDisposable = vscode.commands.registerCommand('toDo.exportTasks', async () => {
		try {
			const tasks = context.workspaceState.get('tasks', []);
			let defaultPath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
			if (!defaultPath) {
				defaultPath = process.env.HOME || process.env.USERPROFILE;
			}

			const fileUri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(`${defaultPath}/tasks.json`),
				filters: {
					'JSON files': ['json']
				}
			});

			if (fileUri) {
				const taskData = JSON.stringify(tasks, null, 2);
				await vscode.workspace.fs.writeFile(fileUri, Buffer.from(taskData));
				vscode.window.showInformationMessage('Tasks exported successfully!');
			}
		} catch (error) {
			vscode.window.showErrorMessage('Error exporting tasks: ' + error.message);
		}
	});

	let clearAllDisposable = vscode.commands.registerCommand('completed.clearAll', async () => {
		try {
			const response = await vscode.window.showWarningMessage(
				'Are you sure you want to clear all completed tasks?',
				'Yes',
				'No'
			);

			if (response === 'Yes') {
				completedProvider._view?.webview.postMessage({ command: 'clearTasks', tasks: [] });
				vscode.window.showInformationMessage('All completed tasks cleared!');
			}
		} catch (error) {
			vscode.window.showErrorMessage('Error clearing completed tasks: ' + error.message);
		}
	});

	context.subscriptions.push(importTasksDisposable);
	context.subscriptions.push(exportTasksDisposable);
	context.subscriptions.push(clearAllDisposable);
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