export interface LanguageConfiguration {
    extension?:string;
    files?:Array<string>
} 

export const languageConfigs:{[key:string]:LanguageConfiguration;} = {
    "csharp" : {
        "extension":"cs"
    },
    "csharp(dotnetcore)" : {
        "extension":"cs",
        "files":["vscode_playground_dotnetcore.csproj"]
    },
    "python" : {
        "extension":"py"
    },
    "javascript" : {
        "extension":"js"
    },
    "rust" : {
        "extension":"rs"
    },
    "ruby" : {
        "extension":"rb"
    },
    "powershell" : {
        "extension":"ps1"
    },
    "fsharp" : {
        "extension":"fs"
    },
    "fsharp(dotnetcore)" : {
        "extension":"fs",
        "files":["vscode_playground_dotnetcore.fsproj"]
    }
};

export function getLanguageExtension(language:string):string{
    return (languageConfigs[language] && languageConfigs[language].extension) || language;
}

export function getLanguageFiles(language:string):Array<string>{
    return (languageConfigs[language] && languageConfigs[language].files) || [];
}