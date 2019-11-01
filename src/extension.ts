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

let sessionId;
let tmpDir : string;
let playground : pg.Playground;
export function activate(context: vscode.ExtensionContext) {

	let tmpdir = os.tmpdir();
	playground = new pg.Playground(tmpdir);
 
	let disposable = vscode.commands.registerCommand('extension.playgroundcode', async () => {
		// The code you place here will be executed every time your command is executed 
		// Display a message box to the user 
		let language = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.languageId : "plaintext";
		sessionId = Date.parse(new Date().toString()).toString(); 
		playground.setPlaygroundDir(sessionId); 
		await playground.createPlayground(language);
		//vscode.window.showQuickPick(["php","go","python","js"],{canPickMany:false}); 
	});
//runplayground
	let disposable2 = vscode.commands.registerTextEditorCommand('extension.runplayground',(editor,edit) => {
		playground.runPlayground(editor);
	});
	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('Bye,helloworld!');
	if(tmpDir){
		console.log(`dele ${tmpDir}`);
		fs.rmdirSync(tmpDir);
	}
	
}

