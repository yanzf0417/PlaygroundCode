import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as utils from './utils';
import 'reflect-metadata';
import { FileSystemProvider } from 'vscode';
import { FileStat } from 'vscode';  

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
    FileSystemProvider: PlaygroundFileSystemProvider | undefined;
    PlaygroundDir: string = '';

    constructor(tmpdir: string) { 
        this.TmpDir = tmpdir;
        this.FileSystemProvider = undefined;
    }

    

    setPlaygroundDir(dirname: string): PlaygroundFileSystemProvider { 
        this.PlaygroundDir = `${this.TmpDir}${path.sep}vscode_playground${path.sep}${dirname}`;
        if (!fs.existsSync(this.PlaygroundDir)) {
            utils.mkdirSync(this.PlaygroundDir);
        }
        this.FileSystemProvider = new PlaygroundFileSystemProvider(this.PlaygroundDir);
        return this.FileSystemProvider;
    }

    async createPlayground(language: string): Promise<vscode.TextDocument | null> {
        if(language == "" || language == "plaintext" || SUPPORT_LANGUAGES.indexOf(language) == -1){
            let pick = await vscode.window.showQuickPick(SUPPORT_LANGUAGES, { canPickMany: false });
            if(pick == undefined){
                return null;
            }
            language = pick;
        }
        let playgroundPath = `${this.PlaygroundDir}${path.sep}vscode_playground.${language}`;
        let playgroundSchemePath = `playground://root/vscode_playground.${language}`;
        if (!fs.existsSync(playgroundPath)) {
            let content = eval('PLAYGROUND_TPL_' + language.toUpperCase());
            fs.writeFileSync(playgroundPath, content);
        }

        let editor = await vscode.window.showTextDocument(vscode.Uri.parse(playgroundSchemePath));
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
        let realFilePath = (<PlaygroundFileSystemProvider>this.FileSystemProvider).toRealFilePath(doc.uri)
        if(runFunction != undefined) {
            Reflect.apply(<Function>runFunction,this,[realFilePath]); 
        }else{
            this.run_common(doc.languageId,realFilePath);
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
        let conf = vscode.workspace.getConfiguration(PLAYGROUND_NAME); 
        let cmd = `${conf.launch["go"]} run "${fileName}"`;
        let terminal = this.getPlaygroundTerminal();
        terminal.show(true);
        terminal.sendText(cmd,true);
    }
}
 
export class File implements vscode.FileStat {
    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string; 

    constructor(name: string) {
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}

export class Directory implements vscode.FileStat {

    type: vscode.FileType;
    ctime: number;
    mtime: number;
    size: number;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string) {
        this.type = vscode.FileType.Directory;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
        this.entries = new Map();
    }
}

export type Entry = File | Directory;

export class PlaygroundFileSystemProvider implements FileSystemProvider {
    private _baseDir :string;
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;
    
    constructor(baseDir: string){ 
        this._baseDir = baseDir;
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        let filepath :string = this.toRealFilePath(uri);
        if(!fs.existsSync(filepath)){
            throw vscode.FileSystemError.FileNotFound(filepath);
        }
        let stat = fs.statSync(filepath);
        if(stat.isFile()) { 
            return new File(filepath);
        }else{
            return new Directory(filepath);
        }
    }
    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        let filepath :string = this.toRealFilePath(uri);
        let files = fs.readdirSync(filepath);  
        let list :[string, vscode.FileType][] = [];
        for (const file in files) {
            if(fs.statSync(file).isFile()){
                list.push([file,vscode.FileType.File]);
            }else{
                list.push([file,vscode.FileType.Directory]);
            }
        }
        return list;
        
    }
    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        let filepath :string = this.toRealFilePath(uri);
        utils.mkdirSync(filepath);
    }
    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        let filepath :string = this.toRealFilePath(uri);
        return fs.readFileSync(filepath);
    }
    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        let filepath :string = this.toRealFilePath(uri);
        fs.writeFileSync(filepath,content);
    }
    delete(uri: vscode.Uri, options: { recursive: boolean; }): void | Thenable<void> {
        let filepath :string = this.toRealFilePath(uri);
        if(fs.statSync(filepath).isFile()){
            fs.unlinkSync(filepath);
        }else{
            fs.rmdirSync(filepath);
        }
    }
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }

    toRealFilePath(uri: vscode.Uri): string{
        let filepath :string = this._baseDir + path.sep + uri.path.substr(1); 
        return filepath;
    }

}
 