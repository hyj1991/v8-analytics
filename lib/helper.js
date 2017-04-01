const path = require('path');
const glob = require('glob');
const debug = require('debug')('v8-cpu-analysis');

//1. color output
exports.colorOutput = {
    infoConsole(str) {
        return `\x1b[35m${str}\x1b[0m`;
    },

    debugConsole(str) {
        return `\x1b[36m${str}\x1b[0m`;
    },

    errorConsole(str) {
        return `\x1b[31m${str}\x1b[0m`;
    },

    warnConsole(str) {
        return `\x1b[33m${str}\x1b[0m`;
    },

    lineConsole(str){
        return `\x1b[4m${str}\x1b[0m`;
    }
};

//2. get file list
exports.getCpuFiles = () => {
    const files = '*.node.cpu.json';
    const base = process.cwd();
    const fileList = glob.sync(files, {
        cwd: base,
    }).map(file => {
        return path.join(base, file);
    });
    debug('get cpu.json', fileList);
    return fileList;
};

