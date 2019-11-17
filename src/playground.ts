import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as utils from './utils';
import * as child_process  from 'child_process';
import { FileSystemProvider } from 'vscode';
import { Buffer } from 'buffer';
import { isString } from 'util';



const PLAYGROUND_NAME = "playground";  
export class Playground { 
    public m_FileSystemProvider?: PlaygroundFileSystemProvider;
    private m_PlaygroundDir: string ; 
    private m_OutputChannel : vscode.OutputChannel;
    private m_Process?: child_process.ChildProcess;
    private m_ResetFlag: Array<string>;
    private m_LanguageQuickPickItems?: Array<LanguagePickItem>;
    private m_extensionPath: string;


    constructor(extensionPath: string) {   
        this.m_extensionPath = extensionPath;
        this.m_OutputChannel = vscode.window.createOutputChannel(PLAYGROUND_NAME);
        this.m_ResetFlag = new Array<string>();
        this.m_PlaygroundDir = ''; 
        this.initLanguageQuickPickItems(); 
    } 

    initLanguageQuickPickItems(){
        let tmp = new Array<LanguagePickItem>();
        for (const language in vscode.workspace.getConfiguration("playground.launch")) {
            if(!isString(vscode.workspace.getConfiguration("playground.launch").get(language))){
                continue;
            }
            let ext:string;
            if(language === "csharp") { ext = "cs"; }
            else if(language === "python") { ext="py"; }
            else if(language === "javascript") { ext="js"; }
            else if(language === "rust") { ext="rs"; }
            else { ext = language; }
            tmp.push(new LanguagePickItem(language,ext));
        } 
        this.m_LanguageQuickPickItems = tmp;
    }

    setPlaygroundDir(dirname: string): PlaygroundFileSystemProvider { 
        this.m_PlaygroundDir = dirname;
        if (!fs.existsSync(this.m_PlaygroundDir)) {
            utils.mkdirSync(this.m_PlaygroundDir);
        }
        this.m_FileSystemProvider = new PlaygroundFileSystemProvider(this.m_PlaygroundDir);
        return this.m_FileSystemProvider;
    }

    async createPlayground(): Promise<vscode.TextDocument | null> {
        let language = await vscode.window.showQuickPick<LanguagePickItem>(<Array<LanguagePickItem>>this.m_LanguageQuickPickItems, { canPickMany: false });
        if(language == undefined){
            return null;
        } 

        let playgroundPath = (<PlaygroundFileSystemProvider>this.m_FileSystemProvider).toRealFilePath(this.getPlaygroundUri(language.extension));
        let resetFile:boolean = !fs.existsSync(playgroundPath) || this.m_ResetFlag.indexOf(language.extension) == -1;
        if (resetFile) { 
            return this.reset(language.extension); 
        } else{
            return this.show(language.extension);
        } 
    }

    /**
     * Run the playground code.
     * @param document 
     */
    async runPlayground(document: vscode.TextDocument) { 
        await document.save();
        this.stop(); 
        this.m_OutputChannel.dispose();
        this.m_OutputChannel = vscode.window.createOutputChannel(PLAYGROUND_NAME);
        this.m_OutputChannel.appendLine("Running."); 
        let language = document.languageId;
        let filepath = document.uri.path.substring(1);
        let execScript = this.getExecScript(language,filepath); 
        this.m_Process = child_process.spawn(execScript,{"shell":true,"cwd":this.m_PlaygroundDir}); 
        this.m_Process.stdout.on('data',(data) => {
            this.m_OutputChannel.append(data.toString());
        });     
        this.m_Process.stderr.on('data',(data) => { 
            this.m_OutputChannel.append(data.toString());
        });
        this.m_Process.on('close',(code) => {
            this.m_Process = undefined;
            this.m_OutputChannel.appendLine(`\nExit with code=${code}.`);
        });
        this.m_OutputChannel.show(false);
    } 

    getExecScript(language: string,filepath: string):string {
        let conf = vscode.workspace.getConfiguration(PLAYGROUND_NAME);
        let script:string = conf.launch[language];
        os.platform()
        return script.replace(/\${file}/ig,filepath);
    }

    async stop(){
        if(this.m_Process != undefined){ 
            this.m_OutputChannel.appendLine("Process killed.");
            const treekill = require('tree-kill'); 
            treekill(this.m_Process.pid); 
        }
    }

    async reset(language:string): Promise<vscode.TextDocument> {  
        // tslint:disable-next-line:curly
        if(this.m_ResetFlag.indexOf(language) === -1)
            this.m_ResetFlag.push(language);
        let content = fs.readFileSync(path.join(this.m_extensionPath,`helloworlds/helloworld.${language}`));
        let uri = this.getPlaygroundUri(language);
        (<PlaygroundFileSystemProvider>this.m_FileSystemProvider).writeFile(uri,content,{"create":false,"overwrite":true}); 
        return await this.show(language);
    } 

    async show(language: string): Promise<vscode.TextDocument> { 
        let editor = await vscode.window.showTextDocument(this.getPlaygroundUri(language)); 
        return editor.document;
    }

    getPlaygroundUri(language:string){
        return vscode.Uri.parse(`playground://root/vscode_playground.${language}`);
    } 
}

class LanguagePickItem implements vscode.QuickPickItem {
    label: string;    
    description?: string | undefined;
    detail?: string | undefined;
    picked?: boolean | undefined;
    alwaysShow?: boolean | undefined;
    extension: string;

    constructor(label: string,extension: string){
        this.label = label;
        this.extension = extension;
    }
}

class File implements vscode.FileStat {
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

class Directory implements vscode.FileStat {

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

type Entry = File | Directory; 
export class PlaygroundFileSystemProvider implements FileSystemProvider {
    private _baseDir :string;
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _bufferedEvents: vscode.FileChangeEvent[] = [];
    private _fireSoonHandle?: NodeJS.Timer;

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

    writeFile(uri: vscode.Uri, content: Uint8Array | string, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        let filepath :string = this.toRealFilePath(uri);
        fs.writeFileSync(filepath,content);
        this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
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

    private _fireSoon(...events: vscode.FileChangeEvent[]): void {
        this._bufferedEvents.push(...events);

        if (this._fireSoonHandle) {
            clearTimeout(this._fireSoonHandle);
        }

        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }
}
 