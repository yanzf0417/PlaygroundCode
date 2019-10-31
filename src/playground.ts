import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class Playground {
    TmpDir: string;
    PlaygroundDir: string = '';

    constructor(tmpdir: string) {
        this.TmpDir = tmpdir;
    }

    setPlaygroundDir(dirname: string): void {
        this.PlaygroundDir = `${this.TmpDir}${path.sep}vscode_playground${path.sep}${dirname}`;
        if (!fs.existsSync(this.PlaygroundDir)) {
            fs.mkdirSync(this.PlaygroundDir);
        }
    }

    async createPlayground(language: string): Promise<vscode.TextDocument> {
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
        if (doc.languageId == undefined || SUPPORT_LANGUAGES.indexOf(doc.languageId) == -1) {
            vscode.window.showInformationMessage("pick the code language.");
            let language = await vscode.window.showQuickPick(SUPPORT_LANGUAGES, { canPickMany: false });
            if (language == undefined) {
                return;
            }
            doc = await vscode.languages.setTextDocumentLanguage(doc, language);
        }
        doc.save();
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

    run_common(languageId:string,filename:string) {
        let conf = vscode.workspace.getConfiguration(PLAYGROUND_NAME);
		let cmd = `${conf.launch[languageId]} "${filename}"`;
    }
}

const PLAYGROUND_NAME = "Playground"; 

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