/**
 * @description Add new Command Here
 * @author https://github.com/hyj1991
 */
'use strict';

const path = require('path');
const BaseProgram = require('common-bin').Program;

class Program extends BaseProgram {
    constructor() {
        super();
        this.version = require('./package.json').version;
        this.addCommand('test', path.join(__dirname, 'command/TestCommand.js'));
        this.addCommand('bailout', path.join(__dirname, 'command/CpuBailoutCommand.js'));
        this.addCommand('timeout', path.join(__dirname, 'command/CpuTimeoutCommand.js'));
        this.addCommand('leak', path.join(__dirname, 'command/LeakPointCommand.js'));
    }
}

module.exports = Program;
