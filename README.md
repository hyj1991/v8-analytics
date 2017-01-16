# v8-cpu-analysis
v8-profiler cpu log analysis, for the log file created by v8-profiler

## Installation

### For Global

```bash
$ npm install v8-cpu-analysis -g
```

### For Embedded JS code

```bash
$ npm install v8-cpu-analysis
```
### Test
if you install -g, try:

```bash
$ v8-cpu-analysis test
$ v8-cpu-analysis test 200
```
200(ms) is the argument where you expect time every js function execute, all greater than this will be turned to red,
you can also change 200(200ms) to 300(300ms), and the unit is ms

if you js install this as a package, cd into v8-cpu-analysis package dir and try:

```bash
$ npm test
```

## Quick Start
You can use this at the command line or embedded in your js code

### Command Line

First argument is cpu log file created by v8-profiler:

```bash
$ v8-cpu-analysis profile1.json
```
We can also add a time argument which can filter the functions where execute time greater than we expected(ms):

```bash
$ v8-cpu-analysis profile1.json 200
```
This will turn all the functions where execute time > 200ms to red

### Embedded JS Code

```js
'use strict';
const fs = require('fs');
const cpuAnalysis = require('v8-cpu-analysis');

const json = JSON.parse(fs.readFileSync('./data.json'));
const str = cpuAnalysis(json);

console.log(str);
```