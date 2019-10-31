"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
function mkdirSync(dir, options) {
    if (!fs.existsSync(path.dirname(dir))) {
        mkdirSync(path.dirname(dir), options);
    }
    fs.mkdirSync(dir, options);
}
exports.mkdirSync = mkdirSync;
/*
export function rmdirSync(dir: string){
    if(!fs.existsSync(dir)){
        return;
    }
    
}
*/ 
//# sourceMappingURL=utils.js.map