/**
 * @description analysis memory leak point
 * @author https://github.com/hyj1991
 */
'use strict';

const Command = require('./Command');
const fs = require('fs');
const path = require('path');
const analysisLib = require('../lib/analysis');

class TestCommand extends Command {
    * run(_, args) {
        let filename = args[0];
        if (!filename) {
            console.log(this.helper.colorOutput.infoConsole(`filename can't be ignored, please input such as:\n`)
                + `                                        va leak xxx.mem.json\n`);

            return;
        }

        let output = this.helper.colorOutput;
        try {
            filename = path.resolve(filename);
            let allData = fs.readFileSync(filename);
            allData = JSON.parse(allData);
            let {leakPoint, heapMap, statistics} = analysisLib.memAnalytics(allData);
            console.log(output.infoConsole('Suspicious Leak Point List:'));
            leakPoint.forEach((item, index) => {
                console.log(`${++index}. ${output.debugConsole(`name&id`)}: ${output.errorConsole(`${heapMap[item.index].name}::${item.id}`)}, ` +
                    `${output.debugConsole(`type`)}: ${output.errorConsole(heapMap[item.index].type)}, ` +
                    `${output.debugConsole(`retainedSize`)}: ${output.errorConsole(item.size)} ${output.debugConsole(`bytes`)}, ` +
                    `${output.debugConsole(`taken`)} ${output.errorConsole(`${((item.size / statistics.total) * 100).toFixed(2)}%`)} ${output.debugConsole(`of all heap memory.`)}`);
            });
            console.log();
            console.log(output.warnConsole(`More Detail To Help You Find Leak Point Please use Easy-Monitor: ${output.lineConsole(`https://github.com/hyj1991/easy-monitor`)}`));
        } catch (e) {
            console.log(`${output.infoConsole('File Read Or JSON Parse:')}
                ${output.errorConsole(e)}`)

        }
    };

    help() {
        return this.helper.colorOutput.infoConsole(`Find Functions Execute Time > Expected, cmd example:\n`)
            + `                                                      *   va leak xxx.mem.json\n`
    }
}

module.exports = TestCommand;
