import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as utils from './utils';
import 'reflect-metadata';
import { FileSystemProvider } from 'vscode';
import { Event } from 'vscode';

const PLAYGROUND_NAME = "playground"; 
const SUPPORT_LANGUAGES = ["python", "go", "php", "js", "lua"];
const PLAYGROUND_TPL_PLAINTEXT = "";
const PLAYGROUND_TPL_GO =
    `package main

import(
	"fmt"
)

func main(){
	fmt.Println("Hello World")
}` ;
const PLAYGROUND_TPL_PYTHON =
    `print('Hello World')`;
const PLAYGROUND_TPL_PHP =
    `<?php 
echo "Hello world";
?>`;
const PLAYGROUND_TPL_JS =
    `console.log("Hello World");`;
const PLAYGROUND_TPL_LUA =
    `print("Hello World")`;

export class Playground {
    TmpDir: string;
    PlaygroundDir: string = '';

    constructor(tmpdir: string) {
        this.TmpDir = tmpdir;
    }

    setPlaygroundDir(dirname: string): void { 
        this.PlaygroundDir = `${this.TmpDir}${path.sep}vscode_playground${path.sep}${dirname}`;
        if (!fs.existsSync(this.PlaygroundDir)) {
            utils.mkdirSync(this.PlaygroundDir);
        }
    }

    async createPlayground(language: string): Promise<vscode.TextDocument | null> {
        if(language == "" || language == "plaintext" || SUPPORT_LANGUAGES.indexOf(language) == -1){
            let pick = await vscode.window.showQuickPick(SUPPORT_LANGUAGES, { canPickMany: false });
            if(pick == undefined){
                return null;
            }
            language = pick;
        }
        let playgroundPath = `${this.PlaygroundDir}${path.sep}vscode_playground_${language}.playground`;
        if (!fs.existsSync(playgroundPath)) {
            let content = eval('PLAYGROUND_TPL_' + language.toUpperCase());
            fs.writeFileSync(playgroundPath, content);
        }
        let editor = await vscode.window.showTextDocument(vscode.Uri.file(playgroundPath));
        let doc = await vscode.languages.setTextDocumentLanguage(editor.document, language); 
        return doc;
    }

    async runPlayground(editor: vscode.TextEditor) {
        let doc = editor.document;
        if (doc.languageId == undefined && await this.setPlaygroundLanguageId(doc) == false) {
            return;
        }else if(SUPPORT_LANGUAGES.indexOf(doc.languageId) == -1){
            vscode.window.showInformationMessage(`Unsupport ${doc.languageId}.`);
            return;
        }
        await doc.save();
        let runFunction = Reflect.get(this,`run_${doc.languageId}`);
        if(runFunction != undefined) {
            Reflect.apply(<Function>runFunction,this,[doc.languageId,doc.fileName]); 
        }else{
            this.run_common(doc.languageId,doc.fileName);
        }
    }

    async setPlaygroundLanguageId(doc: vscode.TextDocument): Promise<boolean> {
        vscode.window.showInformationMessage("pick the code language.");
        let pick = await vscode.window.showQuickPick(SUPPORT_LANGUAGES, { canPickMany: false });
        if(pick == undefined){
            return false;
        }
        await vscode.languages.setTextDocumentLanguage(doc,pick);
        return true;
    }


    getPlaygroundTerminal(): vscode.Terminal {
        for (let index = 0; index < vscode.window.terminals.length; index++) {
            const terminal = vscode.window.terminals[index];
            if (terminal.name == PLAYGROUND_NAME) {
                return terminal;
            }
        }
        return vscode.window.createTerminal(PLAYGROUND_NAME);
    }

    run_common(languageId:string,fileName:string) {
        let conf = vscode.workspace.getConfiguration(PLAYGROUND_NAME); 
        let cmd = `${conf.launch[languageId]} "${fileName}"`;
        let terminal = this.getPlaygroundTerminal();
        terminal.show(true);
        terminal.sendText(cmd,true);
    }

    run_go(fileName: string){

    }
}

class PlaygroundFileSystemProvider implements FileSystemProvider {
    onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]>;   
    
    constructor(baseDir: string){
        this.onDidChangeFile = function(listener: (e: vscode.FileChangeEvent[]) => any, thisArgs?: any, disposables?: vscode.Disposable[] | undefined): vscode.Disposable{
            return new vscode.Disposable(function(){});
        }
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        throw new Error("Method not implemented.");
    }
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        throw new Error("Method not implemented.");
    }
    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        throw new Error("Method not implemented.");
    }
    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        throw new Error("Method not implemented.");
    }
    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    delete(uri: vscode.Uri, options: { recursive: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }


}
