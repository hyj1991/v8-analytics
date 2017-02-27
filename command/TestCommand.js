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
        const isBailout = Boolean(~args.indexOf('bailout'));
        const isTimeout = Boolean(~args.indexOf('timeout'));
        let timeout = isTimeout && args[1];

        try {
            let allData = fs.readFileSync(path.join(__dirname, '../test/test.cpu.json'));
            allData = JSON.parse(allData);

            let str = '';
            if (isBailout) {
                str = analysisLib(allData, null, true, listOnlyWarning);
            } else if (isTimeout) {
                str = analysisLib(allData, timeout, false, listOnlyWarning);
            } else {
                console.log(this.helper.colorOutput.infoConsole(`Not Support This CMD!`));
                return;
            }
            console.log(str);
        } catch (e) {
            console.log(`${this.helper.colorOutput.infoConsole('File Read Or JSON Parse:')}
                ${this.helper.colorOutput.errorConsole(e)}`)

        }

    };

    help() {
        return this.helper.colorOutput.infoConsole(`Show You An Example, You Can Try Like:\n`)
            + `                                     *   va test bailout\n`
            + `                                     *   va test bailout --only\n`
            + `                                     *   va test timeout\n`
            + `                                     *   va test timeout 200\n`
            + `                                     *   va test timeout 200 --only\n`;
    }
}

module.exports = TestCommand;
