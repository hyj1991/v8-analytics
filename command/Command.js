'use strict';
const BaseCommand = require('common-bin').Command;
const helper = require('../lib/helper');

class Command extends BaseCommand {
    constructor() {
        super();
        this.helper = Object.assign({}, this.helper, helper);
    }

    run(/* cwd, args */) {
        throw new Error('Must impl this method');
    }

    help() {
        throw new Error('Must impl this method');
    }
}

module.exports = Command;
