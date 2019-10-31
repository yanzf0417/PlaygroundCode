"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const pg = require("./playground");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let sessionId;
let tmpDir;
let playground;
function activate(context) {
    let tmpdir = os.tmpdir();
    playground = new pg.Playground(tmpdir);
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let playgroundTerminal;
    let disposable = vscode.commands.registerCommand('extension.playgroundcode', () => __awaiter(this, void 0, void 0, function* () {
        // The code you place here will be executed every time your command is executed 
        // Display a message box to the user 
        let language = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.languageId : "plaintext";
        sessionId = Date.parse(new Date().toString()).toString();
        playground.setPlaygroundDir(sessionId);
        yield playground.createPlayground(language);
        //vscode.window.showQuickPick(["php","go","python","js"],{canPickMany:false}); 
    }));
    //runplayground
    let disposable2 = vscode.commands.registerTextEditorCommand('extension.runplayground', (editor, edit) => {
        console.log(editor.document.fileName);
        editor.document.save();
        let languageId = editor.document.languageId;
        let conf = vscode.workspace.getConfiguration("playground");
        let cmd = `${conf.launch[languageId]} "${editor.document.fileName}"`;
        if (playgroundTerminal == null) {
            playgroundTerminal = vscode.window.createTerminal("Playground");
        }
        playgroundTerminal.show(true);
        playgroundTerminal.sendText(cmd, true);
        console.log(cmd);
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    console.log('Bye,helloworld!');
    if (tmpDir) {
        console.log(`dele ${tmpDir}`);
        fs.rmdirSync(tmpDir);
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map