/**
 * @description analysis cpu log
 * @author https://github.com/hyj1991
 */
'use strict';

const Command = require('./Command');
const fs = require('fs');
const path = require('path');
const analysisLib = require('../lib/analysis');

class TestCommand extends Command {
    * run(_, args) {
        const listOnlyWarning = Boolean(~args.indexOf('--only'));
        const filename = args[0];
        const timeout = args[1];
        if (!filename) {
            console.log(this.helper.colorOutput.infoConsole(`filename can't be ignored, please input such as:\n`)
                + `                                        va timeout xxx.cpu.json\n`
                + `                                        va timeout xxx.cpu.json 200\n`
                + `                                        va timeout xxx.cpu.json 200 --only`);

            return;
        }

        try {
            let allData = fs.readFileSync(filename);
            allData = JSON.parse(allData);
            let str = analysisLib(allData, timeout, false, listOnlyWarning);
            console.log(str);
        } catch (e) {
            console.log(`${this.helper.colorOutput.infoConsole('File Read Or JSON Parse:')}
                ${this.helper.colorOutput.errorConsole(e)}`)

        }

    };

    help() {
        return this.helper.colorOutput.infoConsole(`Find Functions Execute Time > Expected, cmd example:\n`)
            + `                                                      *   va timeout xxx.cpu.json\n`
            + `                                                      *   va timeout xxx.cpu.json 200\n`
            + `                                                      *   va timeout xxx.cpu.json 200 --only`;
    }
}

module.exports = TestCommand;
