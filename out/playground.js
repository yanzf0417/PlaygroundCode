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
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class Playground {
    constructor(tmpdir) {
        this.PlaygroundDir = '';
        this.TmpDir = tmpdir;
    }
    setPlaygroundDir(dirname) {
        this.PlaygroundDir = `${this.TmpDir}${path.sep}vscode_playground${path.sep}${dirname}`;
        if (!fs.existsSync(this.PlaygroundDir)) {
            fs.mkdirSync(this.PlaygroundDir);
        }
    }
    createPlayground(language) {
        return __awaiter(this, void 0, void 0, function* () {
            let playgroundPath = `${this.PlaygroundDir}${path.sep}vscode_playground_${language}.playground`;
            if (!fs.existsSync(playgroundPath)) {
                let content = eval('PLAYGROUND_TPL_' + language.toUpperCase());
                fs.writeFileSync(playgroundPath, content);
            }
            let editor = yield vscode.window.showTextDocument(vscode.Uri.file(playgroundPath));
            let doc = yield vscode.languages.setTextDocumentLanguage(editor.document, language);
            return doc;
        });
    }
    runPlayground(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            let doc = editor.document;
            if (doc.languageId == undefined || SUPPORT_LANGUAGES.indexOf(doc.languageId) == -1) {
                vscode.window.showInformationMessage("pick the code language.");
                let language = yield vscode.window.showQuickPick(SUPPORT_LANGUAGES, { canPickMany: false });
                if (language == undefined) {
                    return;
                }
                doc = yield vscode.languages.setTextDocumentLanguage(doc, language);
            }
            doc.save();
        });
    }
    getPlaygroundTerminal() {
        for (let index = 0; index < vscode.window.terminals.length; index++) {
            const terminal = vscode.window.terminals[index];
            if (terminal.name == PLAYGROUND_NAME) {
                return terminal;
            }
        }
        return vscode.window.createTerminal(PLAYGROUND_NAME);
    }
    run_common(languageId, filename) {
        let conf = vscode.workspace.getConfiguration(PLAYGROUND_NAME);
        let cmd = `${conf.launch[languageId]} "${filename}"`;
    }
}
exports.Playground = Playground;
const PLAYGROUND_NAME = "Playground";
const SUPPORT_LANGUAGES = ["python", "go", "php", "js", "lua"];
const PLAYGROUND_TPL_PLAINTEXT = "";
const PLAYGROUND_TPL_GO = `package main

import(
	"fmt"
)

func main(){
	fmt.Println("Hello World")
}`;
const PLAYGROUND_TPL_PYTHON = `print('Hello World')`;
const PLAYGROUND_TPL_PHP = `<?php 
echo "Hello world";

?>`;
const PLAYGROUND_TPL_JS = `console.log("Hello World");`;
const PLAYGROUND_TPL_LUA = `print("Hello World")`;
//# sourceMappingURL=playground.js.map