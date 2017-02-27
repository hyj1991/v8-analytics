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

# v8-cpu-analysis
解析v8-profiler输出的cpu日志，可以提供
* **v8引擎逆优化或者优化失败的函数标红展示以及优化失败原因展示**
* **函数执行时长超过预期标红展示**

## 安装

### 全局安装

```bash
$ npm install v8-cpu-analysis -g
```

### 嵌入你的JS代码

```bash
$ npm install v8-cpu-analysis
```
### 测试样例
如果你是全局安装的命令行模式：

```bash
//测试展示v8引擎逆优化函数
$ va test bailout
$ va test bailout --only
//测试展示执行时长超过你的预期函数
$ va test timeout
$ va test timeout 200
$ va test timeout 200 --only
```
```va test bailout --only``` 这个命令可以只把那些v8引擎逆优化的函数列出来展示。

```va test timeout 200 --only``` 这个命令可以只把那些执时长超过200ms的函数列出来展示。

## 快速开始
这个npm包可以即用作于全局命令行模式，也可以嵌入你的JS代码：

### I. 命令行

#### 查找函数逆优化原因

这里的 ```xxx.cpu.json``` 文件是有v8-profiler生成的cpu日志文件:

```bash
$ va bailout xxx.cpu.json
```
这里会展示出所有的函数，并且把其中触发v8引擎逆优化的函数标红，你也可以像下面这样使用：

```bash
$ va bailout xxx.cpu.json --only
```
这样子就只会展示逆优化的函数以及v8给出的逆优化原因。

#### 发现那些执行时长超过预期的函数

```bash
$ va timeout xxx.cpu.json
```
这样会展示出所有的函数，以及其执行时长

```bash
$ va timeout xxx.cpu.json 200
```
这样使用除了会展示出所有的函数，还会将所有的执行时长超过200ms的函数给标红展示出来。

```bash
$ va timeout xxx.cpu.json 200 --only
```
这样使用只会将所有的执行时长超过200ms的函数列出来展示。

### II. 嵌入你的JS代码

```js
'use strict';
const fs = require('fs');
const cpuAnalysis = require('v8-cpu-analysis');

const json = JSON.parse(fs.readFileSync('./data.json'));
//list all js function and it's execTime
const str = cpuAnalysis(json);

console.log(str);
```