// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'; 
import * as os from 'os';
import * as pg from './playground';
import * as path from 'path';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
 
let playground : pg.Playground;
export function activate(context: vscode.ExtensionContext) {
	let tmpdir = `${os.tmpdir()}${path.sep}vscode_playground`;  
	playground = new pg.Playground(context.extensionPath); 
	playground.setPlaygroundDir(tmpdir); 

	vscode.workspace.registerFileSystemProvider("playground",<pg.PlaygroundFileSystemProvider>playground.m_FileSystemProvider);
	let codeDocument : vscode.TextDocument | null; 
	let disposableCommandNew = vscode.commands.registerCommand('extension.playgroundcode', async () => {  
		codeDocument = await playground.createPlayground(); 
	}); 

	let disposableCommandRun = vscode.commands.registerTextEditorCommand('extension.playgroundrun',(editor) => {
		if(editor.document.uri.scheme == "playground")
			codeDocument = editor.document; 
		playground.runPlayground(<vscode.TextDocument>codeDocument);
	});

	let disposableCommandStop = vscode.commands.registerTextEditorCommand('extension.playgroundstop',() => {
		playground.stop();
	});

	let disposableCommandReset = vscode.commands.registerTextEditorCommand('extension.playgroundreset',(editor) => {
		if(editor.document.uri.scheme == "playground")
		codeDocument = editor.document; 
		playground.reset((<vscode.TextDocument>codeDocument).uri);
	});

	context.subscriptions.push(disposableCommandNew);
	context.subscriptions.push(disposableCommandRun);
	context.subscriptions.push(disposableCommandStop);
	context.subscriptions.push(disposableCommandReset);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('Bye,helloworld!');  
}

