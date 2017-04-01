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
        const isLeak = Boolean(~args.indexOf('leak'));
        let timeout = isTimeout && args[1];

        let output = this.helper.colorOutput;

        try {
            let allData = fs.readFileSync(path.join(__dirname, '../test/test.cpu.json'));
            allData = JSON.parse(allData);

            let leakData = fs.readFileSync(path.join(__dirname, '../test/test_leak.mem.json'));
            let heapData = JSON.parse(leakData);

            if (isLeak) {
                let {leakPoint, heapMap, statistics} = analysisLib.memAnalytics(heapData);
                console.log(output.infoConsole('Suspicious Leak Point List:'));
                leakPoint.forEach((item, index) => {
                    console.log(`${++index}. ${output.debugConsole(`name&id`)}: ${output.errorConsole(`${heapMap[item.index].name}::${item.id}`)}, ` +
                        `${output.debugConsole(`type`)}: ${output.errorConsole(heapMap[item.index].type)}, ` +
                        `${output.debugConsole(`retainedSize`)}: ${output.errorConsole(item.size)} ${output.debugConsole(`bytes`)}, ` +
                        `${output.debugConsole(`taken`)} ${output.errorConsole(`${((item.size / statistics.total) * 100).toFixed(2)}%`)} ${output.debugConsole(`of all heap memory.`)}`);
                });
                console.log();
                console.log(output.warnConsole(`More Detail To Help You Find Leak Point Please use Easy-Monitor: ${output.lineConsole(`https://github.com/hyj1991/easy-monitor`)}`));
                return;
            }

            let str = '';
            if (isBailout) {
                str = analysisLib(allData, null, true, listOnlyWarning);
            } else if (isTimeout) {
                str = analysisLib(allData, timeout, false, listOnlyWarning);
            } else {
                console.log(output.infoConsole(`Not Support This CMD!`));
                return;
            }
            console.log(str);
        } catch (e) {
            console.log(`${output.infoConsole('File Read Or JSON Parse:')}
                ${output.errorConsole(e)}`)

        }

    };

    help() {
        return this.helper.colorOutput.infoConsole(`Show You An Example, You Can Try Like:\n`)
            + `                                     *   va test bailout\n`
            + `                                     *   va test bailout --only\n`
            + `                                     *   va test timeout\n`
            + `                                     *   va test timeout 200\n`
            + `                                     *   va test timeout 200 --only\n`
            + `                                     *   va test leak\n`;
    }
}

module.exports = TestCommand;
