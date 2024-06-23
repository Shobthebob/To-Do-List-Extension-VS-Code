"use strict";
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */

class MyWebviewViewProvider {
	constructor(_extensionUri) {
		this._extensionUri = _extensionUri;
	}

	resolveWebviewView(webviewView, context, _token) {
		this._view = webviewView;
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};
		// Set the HTML content for the webview
		webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
	}

	getHtmlForWebview(webview) {
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets', 'style.css'));
		const mainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'main.js'));
		const nonce = getNonce();
		return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
								<link href="${styleUri}" rel="stylesheet">
                <title>Webview</title>
            </head>
            <body class="sidebar">
							<!-- <div class="sidebar"> -->
								<ul class="todo-list" id="todo-list">
									<!-- Tasks will be dynamically added here -->
								</ul>
								<div class="input-container">
									<input type="text" id="new-task-input" placeholder="Add a new task...">
									<button id="add-task-button" class="add-btn">+</button>
								</div>
						<script nonce="${nonce}" src="${mainUri}"></script>
						</body>
            </html>
						`;
	}
}

function activate(context) {

	// context is basically the main parent variable that handles everything from the high lvl perspective. It is a variable made by the vs code extention api itself.
	// subsctiptions is an array which comes with the vs code extention api as well.
	// disposables are those objects that have to be freed from the memory once the extention is deactivated
	// providers are those objects that tell vscode what ui on the panel should look like.

	const provider = new MyWebviewViewProvider(context.extensionUri);
	let disposable = vscode.window.registerWebviewViewProvider("toDo", provider, { webviewOptions: { retainContextWhenHidden: true } });
	context.subscriptions.push(disposable);

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

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}