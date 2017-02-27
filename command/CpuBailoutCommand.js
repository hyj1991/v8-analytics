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
        if (!filename) {
            console.log(this.helper.colorOutput.infoConsole(`filename can't be ignored, please input such as:\n`)
                + `                                        va bailout xxx.cpu.json\n`
                + `                                        va bailout xxx.cpu.json --only`);

            return;
        }

        try {
            let allData = fs.readFileSync(filename);
            allData = JSON.parse(allData);
            let str = analysisLib(allData, null, true, listOnlyWarning);
            console.log(str);
        } catch (e) {
            console.log(`${this.helper.colorOutput.infoConsole('File Read Or JSON Parse:')}
                ${this.helper.colorOutput.errorConsole(e)}`)

        }

    };

    help() {
        return this.helper.colorOutput.infoConsole(`Find DeOptimized Functions And it's Reason, cmd example:\n`)
            + `                                                          *   va bailout xxx.cpu.json\n`
            + `                                                          *   va bailout xxx.cpu.json --only`;
    }
}

module.exports = TestCommand;
