"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require('vscode');

/* vs code API provides
		- 'context' (line::14,17; object)
		- subscriptions (line::33; array)
*/

/**
 * @param {vscode.ExtensionContext} context
 */

// function activate(context) {
// 	console.log('Congratulations, your extension "to-do-list" is now active!');
// 	vscode.window.registerWebviewViewProvider("myView", )
// }

function activate(context) {

	//context is basically the main parent variable that handles everything from the high lvl perspective. It is a variable made by the vs code extention api itself.

	// disposables are those objects that have to be freed from the memory once the extention is deactivated

	const provider = new MyWebviewViewProvider(context.extensionUri);

	let disposable = vscode.window.registerWebviewViewProvider("toDo", provider, { webviewOptions: { retainContextWhenHidden: true } });

	let disposableCommand = vscode.commands.registerCommand('extension.sayHello', () => {
		vscode.window.showInformationMessage("YOOOOOOOOOOOOOO!");
	});

	// Add to context subscriptions
	context.subscriptions.push(disposable);
	context.subscriptions.push(disposableCommand);
}

exports.activate = activate;

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
		return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Webview</title>
            </head>
            <body>
                <h1>Hello, Webview!</h1>
            </body>
            </html>
        `;
	}
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}