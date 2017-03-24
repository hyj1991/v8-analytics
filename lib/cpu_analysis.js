'use strict';
function infoConsole(str) {
    return `\x1b[35m${str}\x1b[0m`;
}

function debugConsole(str) {
    return `\x1b[36m${str}\x1b[0m`;
}

function errorConsole(str) {
    return `\x1b[31m${str}\x1b[0m`;
}

function warnConsole(str) {
    return `\x1b[33m${str}\x1b[0m`;
}

function TreeNode(callUID, startTime, parent, funcName) {
    this.callUID = callUID;
    this.startTime = startTime;
    this.parent = parent;
    this.funcName = funcName;
    this.children = []
}

//获取深度优先树结构每一个节点的id为key,对应的时间戳为value的对象映射
function getIdTimeMap(allData) {
    return allData.samples.reduce((pre, next, index, array) => {
        pre[`${next}::${index}`] = allData.timestamps[index];
        return pre;
    }, {});
}

//深度优先遍历,获取深入优先ID-对应的函数栈结构
function depthFirst(node, id_uid_map, uid_func_map, single_call_tree, pathArr) {
    id_uid_map = typeof id_uid_map === 'object' && id_uid_map || {};
    uid_func_map = typeof uid_func_map === 'object' && uid_func_map || {};
    single_call_tree = typeof single_call_tree === 'object' && single_call_tree || {}
    pathArr = Array.isArray(pathArr) && pathArr || [];

    //获取child节点
    let childArr = node.children;
    //记录本节点的信息,key为callUID,value为对应的节点信息详情
    uid_func_map[node.callUID] = {
        functionName: node.functionName || 'anonymous',
        url: node.url,
        lineNumber: node.lineNumber,
        callUID: node.callUID,
        optimize: !Boolean(node.bailoutReason || node.deoptReason),
        bailoutReason: node.bailoutReason || node.deoptReason,
        hitCount: node.hitCount
    };
    //将当前的callUID塞进此临时数组
    pathArr.push(node.callUID);
    //将id和callUID数据进行一次映射
    id_uid_map[node.id] = pathArr;

    if (Array.isArray(childArr) && childArr.length !== 0) {
        let childLength = childArr.length;
        for (let i = 0; i < childLength; i++) {
            //进入深度优先遍历
            depthFirst(childArr[i], id_uid_map, uid_func_map, single_call_tree, pathArr.slice());
        }
    } else {
        single_call_tree[node.id] = pathArr.map(item => item + '-' + uid_func_map[item].functionName);
    }

    return {idUidMap: id_uid_map, uidFuncMap: uid_func_map, singleCallTree: single_call_tree};
}

function getCallTreeTime(idTimeMap, idUidMap, uidFuncMap) {
    return Object.keys(idTimeMap).reduce((preAll, idIndex) => {
        let id = idIndex.split('::')[0];
        let callTree = idUidMap[id];
        callTree = callTree.reduce((pre, next, index) => {
            if (!pre.timestamp) {
                pre.timestamp = idTimeMap[idIndex];
            }
            let preObj = preAll[preAll.length - 1];
            if (preObj && preObj.callTreeDetail) {
                let callTreeDetailOld = preObj.callTreeDetail;
                if (callTreeDetailOld[index] && Number(callTreeDetailOld[index].callUID) === Number(next)) {
                    pre.callTreeDetail.push(callTreeDetailOld[index]);
                } else {
                    pre.callTreeDetail.push(new TreeNode(next, pre.timestamp, pre.callTreeDetail[index - 1] || '', uidFuncMap[next].functionName));
                }
            } else {
                pre.callTreeDetail.push(new TreeNode(next, pre.timestamp, pre.callTreeDetail[index - 1] || '', uidFuncMap[next].functionName));
            }
            pre.callTree.push(next);
            return pre;
        }, {timestamp: null, callTree: [], callTreeDetail: []});

        preAll.push(callTree);
        return preAll;
    }, []);
}

function calculateCallTreeTime(allData, callTreeTime) {
    return callTreeTime.reduce((pre, next, index, array) => {
        let callTreeOld = array[index].callTree;
        let callTreeNew = array[index + 1] && array[index + 1].callTree;

        if (callTreeNew) {
            callTreeOld.forEach((nextSelf, indexSelf, arraySelf) => {
                if (Number(nextSelf) !== Number(callTreeNew[indexSelf])) {
                    let tmp = array[index].callTreeDetail[indexSelf];
                    tmp.execTime = (Number(array[index + 1].timestamp) - Number(tmp.startTime)) / 1000;
                    if (arraySelf[indexSelf - 1]) {
                        array[index].callTreeDetail[indexSelf - 1].children.push(tmp);
                    }
                } else {
                    array[index + 1].callTreeDetail[indexSelf].startTime = array[index].callTreeDetail[indexSelf].startTime;
                }
            }, []);
        } else {
            callTreeOld.forEach((callUID, indexSelf, arraySelf) => {
                let tmp = array[index].callTreeDetail[indexSelf];
                tmp.execTime = (allData.timestamps[allData.timestamps.length - 1] - tmp.startTime) / 1000;
                if (arraySelf[indexSelf - 1]) {
                    array[index].callTreeDetail[indexSelf - 1].children.push(tmp);
                }
            });
        }

        return pre;
    }, {});
}

//输出最终的Tree结构图,此方法暂时弃用
function newDraw(data, uidFuncMap, str, allStr) {
    str = str || '';
    allStr = allStr || {str: ''};
    let detail = uidFuncMap[data.callUID];
    let funcName = data.funcName;
    let execTime = data.execTime;
    let execTimeStr = execTime / 1000 >= 1 && (execTime / 1000).toFixed(2) + 's' || execTime.toFixed(1) + 'ms';
    let percentage = 100;
    if (data.parent) {
        percentage = (execTime / data.parent.execTime * 100).toFixed(2);
    }
    let strTmp = str + funcName + '(' + execTimeStr + ' ' + percentage + '%)(' + detail.url + ' ' + detail.lineNumber + ')';
    allStr.str = allStr.str + strTmp + '\n';
    str = str + '|-';

    let children = data.children;
    for (let i = 0; i < children.length; i++) {
        newDraw(children[i], uidFuncMap, str, allStr);
    }
    return allStr.str;
}

//新的比较不错的tree结构最终结果输出,这部分代码引用修改了git作者@zhaoxiongfei的项目:open-node/tree-tree
//原始项目git地址为:https://github.com/open-node/tree-tree,感谢作者的开源分享精神
function createTree(tree, uidFuncMap, timeout, bailout, only, json) {
    if (json) {
        json = typeof json === 'object' && json.limit && json || {limit: 5};
    }

    let chars = {
        space: '    ',
        pre: warnConsole('│   '),
        first: warnConsole('├── '),
        last: warnConsole('└── ')
    };

    let onlyWarning = [];
    let hitTimes = {};
    let jsonList = [];

    let toString = function (tree, pre) {
        let string = [], childrenPre = [];
        tree.forEach(function (node, index) {
            let detail = uidFuncMap[node.callUID];
            let last = index === tree.length - 1;
            let execTime = node.execTime;
            let isTimout = timeout && (execTime >= timeout) || false;
            let isDeOptimized = !detail.optimize;
            let execTimeStr = execTime / 1000 >= 1 && (execTime / 1000).toFixed(2) + 's' || execTime.toFixed(1) + 'ms';
            let percentage = 100;
            if (node.parent) {
                percentage = (execTime / node.parent.execTime * 100).toFixed(2);
            }
            let urlStr = detail.url ? ('(' + detail.url + ' ' + detail.lineNumber + ')') : '';

            if (isTimout) {
                string.push([].concat(pre, last ? chars.last : chars.first, errorConsole(node.funcName), errorConsole(' (' + execTimeStr + ' ' + percentage + '%)'), errorConsole(urlStr)).join(''));
                if (only) {
                    let warnStr = debugConsole(node.funcName) + errorConsole(' (' + execTimeStr + ' ' + percentage + '%) ') + (urlStr);
                    if (!~onlyWarning.indexOf(warnStr)) {
                        onlyWarning.push(warnStr);
                        jsonList.push({
                            type: 'timeout',
                            funcName: node.funcName,
                            execTime,
                            percentage,
                            url: urlStr
                        });
                    }
                }
            } else if (!bailout) {
                string.push([].concat(pre, last ? chars.last : chars.first, warnConsole(node.funcName), ' (' + execTimeStr + ' ' + percentage + '%)', urlStr).join(''));
            }

            if (bailout) {
                if (isDeOptimized && detail.bailoutReason !== 'no reason') {
                    string.push([].concat(pre, last ? chars.last : chars.first, errorConsole(node.funcName), errorConsole(`(${detail.bailoutReason})`), errorConsole(urlStr)).join(''));
                    if (only) {
                        let warnStr = debugConsole(node.funcName) + errorConsole(` (${detail.bailoutReason}) `) + (urlStr);
                        if (!~onlyWarning.indexOf(warnStr)) {
                            onlyWarning.push(warnStr);
                            jsonList.push({
                                type: 'bailout',
                                funcName: node.funcName,
                                bailoutReason: detail.bailoutReason,
                                url: urlStr,
                                warnStr
                            });
                        }

                        hitTimes[warnStr] = hitTimes[warnStr] && (hitTimes[warnStr] + 1) || 1;
                    }
                } else {
                    string.push([].concat(pre, last ? chars.last : chars.first, warnConsole(node.funcName), urlStr).join(''));
                }
            }

            if (node.children && node.children.length) {
                if (pre.length) {
                    childrenPre = pre.concat(last ? chars.space : chars.pre);
                } else {
                    childrenPre = [last ? chars.space : chars.pre];
                }
                string = string.concat(toString(node.children, childrenPre));
            }
        });
        return string;
    };

    let execTime = tree.execTime;
    let execTimeStr = execTime / 1000 >= 1 && (execTime / 1000).toFixed(2) + 's' || execTime.toFixed(1) + 'ms';
    let string = [tree.funcName + '(' + execTimeStr + ' 100%)'];
    if (tree.children && tree.children.length) {
        string = string.concat(toString(tree.children, []));
    }

    if (only && bailout) {
        onlyWarning.sort((o, n) => parseInt(hitTimes[o]) < parseInt(hitTimes[n]) ? 1 : -1);
        onlyWarning.unshift(infoConsole('Functions V8 Engine Optimization Failed List(Sort By HitTimes DESC):'));
        onlyWarning = onlyWarning.map((item, index) => index ? `${(index)}. ${item}` : item);
        if (json) {
            jsonList = jsonList.filter(item => item.url && filterFileName(item.url, item.funcName));
            jsonList.sort((o, n) => parseInt(hitTimes[o.warnStr] < parseInt(hitTimes[n.warnStr]) ? 1 : -1));
            jsonList = jsonList.filter((item, index) => index < json.limit);
            jsonList = jsonList.map(item => ({
                type: item.type,
                funcName: item.funcName,
                bailoutReason: item.bailoutReason,
                url: item.url,
                hitTimes: hitTimes[item.warnStr]
            }));
            return jsonList;
        }
        return onlyWarning.join('\n')
    }

    if (only && timeout) {
        onlyWarning.unshift(infoConsole(`Function Execute Time > ${timeout}ms List:`));
        onlyWarning = onlyWarning.map((item, index) => index ? `${(index)}. ${item}` : item);
        if (json) {
            jsonList = jsonList.filter(item => item.url && filterFileName(item.url, item.funcName));
            jsonList.sort((o, n) => parseInt(o.execTime) < parseInt(n.execTime) ? 1 : -1);
            jsonList = jsonList.filter((item, index) => index < json.limit);
            return jsonList;
        }
        return onlyWarning.join('\n')
    }

    return string.join('\n');
}

//用于去除文件名或者路径名中的一些系统值
function filterFileName(url, funcName) {
    return true;
}

//TODO,暂时屏蔽,作用是去除v8的profiler接口在异常情况下收集到GC函数
function clearGC(allData, idUidMap, uidFuncMap) {
    let root = allData.head;
    let children = root.children;
    let haveGC = [];
    for (let i = 0; i < children.length; i++) {
        if (uidFuncMap[children[i].callUID].functionName === '(garbage collector)') {
            let gcUID = children[i].callUID;
            let haveGCTmp = Object.keys(idUidMap).reduce((pre, next) => {
                if (~idUidMap[next].indexOf(gcUID)) {
                    pre.push(next);
                }
                return pre;
            }, []);
            haveGC = haveGC.concat(haveGCTmp);
        }
    }

    allData.samples = allData.samples.filter((item, index) => {
        let boolean = haveGC.some(gcUID => Number(item) === Number(gcUID));
        if (boolean) {
            allData.timestamps.slice(index, 1);
            return false;
        } else {
            return true;
        }
    });
}

/**
 * main function
 * @param allData (v8-profiler's cpu log, must be a json object)
 * @param timeout (the biggest time which you wanting a js function execution)
 * @param bailout (the reason why js function not be optimized)
 * @param only (show all or only show warning message)
 * @param json (embedded in your js code, return detail msg as json format)
 * @param fileFilter (a function that you want to filter some unique filePaths or funcNames)
 */
function getCpuAnalysis(allData, timeout, bailout, only, json, fileFilter) {
    // let interValTime = ((allData.endTime - allData.startTime) * 1000 / allData.samples.length).toFixed(2);
    let idTimeMap = getIdTimeMap(allData);
    let {idUidMap, uidFuncMap} = depthFirst(allData.head);
    // clearGC(allData, idUidMap, uidFuncMap);
    let callTreeTime = getCallTreeTime(idTimeMap, idUidMap, uidFuncMap);
    calculateCallTreeTime(allData, callTreeTime);
    let finalData = callTreeTime[callTreeTime.length - 1].callTreeDetail[0];
    if (typeof fileFilter === 'function') {
        filterFileName = fileFilter;
    }
    return createTree(finalData, uidFuncMap, timeout, bailout, only, json);
}

module.exports = getCpuAnalysis;