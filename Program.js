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
        this.addCommand('bailout', path.join(__dirname, 'command/CpuBailoutCommand.js'));
        this.addCommand('timeout', path.join(__dirname, 'command/CpuTimeoutCommand.js'));
    }
}

module.exports = Program;
