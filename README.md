[中文版](https://github.com/hyj1991/v8-cpu-analysis/README_ZH.md)

[![npm version](https://badge.fury.io/js/v8-cpu-analysis.svg)](https://badge.fury.io/js/v8-cpu-analysis)
[![Package Quality](http://npm.packagequality.com/shield/v8-cpu-analysis.svg)](http://packagequality.com/#?package=v8-cpu-analysis)
[![npm](https://img.shields.io/npm/dt/v8-cpu-analysis.svg)](https://www.npmjs.com/package/v8-cpu-analysis)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/hyj1991/v8-cpu-analysis/LICENSE)

# v8-cpu-analysis
v8-profiler cpu log analysis, for the log file created by v8-profiler，it can:
* **show you functions which are optimized failed by v8 engine**
* **show you functions which exectime greater than your expected**

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
//test bailout
$ va test bailout
$ va test bailout --only
//test timeout
$ va test timeout
$ va test timeout 200
$ va test timeout 200 --only
```
```va test bailout --only``` can list you all functions which are deoptimized, and it's deoptimization reason.

```va test timeout 200 --only``` can list you all function which exectime > 200ms.

## Quick Start
You can use this at the command line or embedded in your js code

### I. Command Line

#### Find Function Bailout Reason

The ```xxx.cpu.json``` file created by v8-profiler:

```bash
$ va bailout xxx.cpu.json
```
This will list all Function, and turn the deoptimized function to red. You can also use like that:

```bash
$ va bailout xxx.cpu.json --only
```
This will only list the deoptimized functions.

#### Find Funtion Exectime Greater Than Expected
```bash
$ va timeout xxx.cpu.json
```
This will list all Function, and their exectime

```bash
$ va timeout xxx.cpu.json 200
```
This will list all Function ,and turn the functions which exectime > 200ms to red.

```bash
$ va timeout xxx.cpu.json 200 --only
```
This will only list the functions which exectime > 200ms.

### II. Embedded JS Code

```js
'use strict';
const fs = require('fs');
const cpuAnalysis = require('v8-cpu-analysis');

const json = JSON.parse(fs.readFileSync('./data.json'));
//list all js function and it's execTime
const str = cpuAnalysis(json);

console.log(str);
```