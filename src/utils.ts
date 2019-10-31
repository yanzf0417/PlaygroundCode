import * as fs from 'fs';
import * as path from 'path';

export function mkdirSync(dir: string, options?: number | string | undefined) {
    if (!fs.existsSync(path.dirname(dir))) {
        mkdirSync(path.dirname(dir), options);
    }
    fs.mkdirSync(dir, options);
}

/*
export function rmdirSync(dir: string){
    if(!fs.existsSync(dir)){
        return;
    }
    
}
*/