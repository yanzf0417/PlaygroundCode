// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'; 
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as utils from './utils';
import * as pg from './playground';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
 
let playground : pg.Playground;
export function activate(context: vscode.ExtensionContext) {

	console.log("test");
	let tmpdir = os.tmpdir(); 
	playground = new pg.Playground(tmpdir);
	let sessionId = Date.parse(new Date().toString()).toString(); 
	playground.setPlaygroundDir(sessionId); 

	vscode.workspace.registerFileSystemProvider("playground",<pg.PlaygroundFileSystemProvider>playground.FileSystemProvider);

	let disposable = vscode.commands.registerCommand('extension.playgroundcode', async () => { 
		let language = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.languageId : ""; 
		await playground.createPlayground(language); 
	}); 

	let disposable2 = vscode.commands.registerTextEditorCommand('extension.runplayground',(editor,edit) => {
		playground.runPlayground(editor);
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(new vscode.Disposable(()=>{console.log('bye');}));
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('Bye,helloworld!');  
}

