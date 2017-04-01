[English Version](https://github.com/hyj1991/v8-cpu-analysis/blob/master/README.md)

[![npm version](https://badge.fury.io/js/v8-cpu-analysis.svg)](https://badge.fury.io/js/v8-cpu-analysis)
[![Package Quality](http://npm.packagequality.com/shield/v8-cpu-analysis.svg)](http://packagequality.com/#?package=v8-cpu-analysis)
[![npm](https://img.shields.io/npm/dt/v8-cpu-analysis.svg)](https://www.npmjs.com/package/v8-cpu-analysis)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/hyj1991/v8-cpu-analysis/LICENSE)

# v8-analytics/v8-cpu-analysis

解析v8-profiler和heapdump等工具输出的cpu & heap-memory日志，可以提供

* **v8引擎逆优化或者优化失败的函数标红展示以及优化失败原因展示**
* **函数执行时长超过预期标红展示**
* **当前项目中可疑的内存泄漏点展示**

## 为什么会有两个名字？

```v8-analytics``` 和 ```v8-cpu-analysis``` 是完全等价的两个包，两者没有任何区别。

起因是想对 ```v8-cpu-analysis``` 引入v8的堆内内存结构分析，这样子继续在包名中引入 ```cpu``` 字样就不太合适了，所以改了个包名，为了兼容以前，故采用两者完全等价发布的方式。

## 安装

### 全局安装

```bash
$ npm install v8-analytics -g
```

或者

```bash
$ npm install v8-cpu-analysis -g
```

### 嵌入你的JS代码

```bash
$ npm install v8-analytics
```

或者

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
$ va test leak
```
```va test bailout --only``` 这个命令可以只把那些v8引擎逆优化的函数列出来展示。

```va test timeout 200 --only``` 这个命令可以只把那些执时长超过200ms的函数列出来展示。

```va test leak``` 可疑展示出测试的heapsnapshot文件中可疑的内存泄漏点。

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

#### 找出可疑的内存泄漏点

```
$ va leak xxx.mem.json
```

这样使用可以列出当前Node项目中可疑的内存泄漏点。

### II. 嵌入你的JS代码

```js
'use strict';
const fs = require('fs');
const v8Analytics = require('v8-analytics');
//or you can use following, they're equival
//const v8Analytics = require('v8-cpu-analysis');

//list all js function and it's execTime
const json = JSON.parse(fs.readFileSync('./test.cpu.json'));
const str = v8Analytics(json);
console.log(str);

//list you heap memory info
const json = JSON.parse(fs.readFileSync('./test.mem.json'));
const {leakPoint, heapMap, statistics} = analysisLib.memAnalytics(allData)
```