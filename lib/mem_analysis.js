'use strict';
const HeapSnapshotWorker = require('../src/HeapSnapshotWorker');

//From v8/include/v8-profiler.h
const HeapGraphEdgeType = {
    kContextVariable: 0,  // A variable from a function context.
    kElement: 1,          // An element of an array.
    kProperty: 2,         // A named object property.
    kInternal: 3,         // A link that can't be accessed from JS,
                          // thus, its name isn't a real property name
                          // (e.g. parts of a ConsString).
    kHidden: 4,           // A link that is needed for proper sizes
                          // calculation, but may be hidden from user.
    kShortcut: 5,         // A link that must not be followed during
                          // sizes calculation.
    kWeak: 6              // A weak reference (ignored by the GC).
};

/**
 * @attention: Deprecated! Because this method cost too many memory!
 * @param heapData: HeapSnapshot, must be JSON Object
 * @returns {{heapMap: {}, heapArray: Array, edgesMap: {}}}
 */
function handleHeapData(heapData) {
    //take root node
    const rootIndex = heapData.snapshot.root_index || 0;
    const rootID = `@${heapData.nodes[rootIndex + 2]}`;

    //take snapshot, nodes, edges, strings info from heap data
    const snapshot = heapData.snapshot;
    const nodes = heapData.nodes;
    const edges = heapData.edges;
    const strings = heapData.strings;

    //take nodes message
    const node_fields = snapshot.meta.node_fields;
    const node_types = snapshot.meta.node_types;

    //take edge message
    const edge_fields = snapshot.meta.edge_fields;
    const edge_types = snapshot.meta.edge_types;

    let offset = 0;

    const heapMap = {};
    const heapArray = [];
    const edgesMap = {};

    for (let i = 0, nodes_length = nodes.length, node_fields_length = node_fields.length; i < nodes_length; i = i + node_fields_length) {
        //get every node field, it's length is node_fields.length
        let node = nodes.slice(i, i + node_fields_length);
        //attention: trace_node_id do not used in this version
        let edge_count = node[4];
        let trace_node_id = node[5];
        let desc_node = {
            index: i / node_fields_length,
            type: node_types[0][node[0]],
            name: strings[node[1]],
            id: `@${node[2]}`,
            self_size: Number(node[3]),
            retain_size: Number(node[3]),
            edge_count,
            trace_node_id,
            children: []
        };

        let node_edges = edges.slice(offset, offset + edge_count * edge_fields.length);
        for (let i = 0, node_edge_length = node_edges.length, edge_fields_length = edge_fields.length; i < node_edge_length; i = i + edge_fields_length) {
            let node_edge = node_edges.slice(i, i + edge_fields_length);
            let name_or_index = Boolean(Number(node_edge[0]) === Number(HeapGraphEdgeType.kElement) ||
                Number(node_edge[0]) === Number(HeapGraphEdgeType.kHidden)) ? `[${String(node_edge[1])}]` : `${strings[node_edge[1]]}`;

            let desc_node_edge = {
                index: node_edge[2] / node_fields_length,
                type: edge_types[0][node_edge[0]],
                name_or_index,
                to_node: `@${nodes[node_edge[2] + 2]}`
            };
            desc_node.children.push(desc_node_edge);

            //construct a map, key: @xxx, value:from_ids:[], to_ids:[]
            //1. below is fill the map with from_ids info
            let from_address_info = {
                id: desc_node.id,
                type: desc_node_edge.type,
                name_or_index
            };
            if (edgesMap[desc_node_edge.to_node]) {
                edgesMap[desc_node_edge.to_node].from_ids.push(from_address_info);
            } else {
                edgesMap[desc_node_edge.to_node] = {
                    from_ids: [from_address_info], to_ids: []
                };
            }

            //2. below is fill the map with to_ids info
            let to_address_info = {
                id: desc_node_edge.to_node,
                type: desc_node_edge.type,
                name_or_index
            };
            if (edgesMap[desc_node.id]) {
                edgesMap[desc_node.id].to_ids.push(to_address_info);
            } else {
                edgesMap[desc_node.id] = {from_ids: [], to_ids: [to_address_info]};
            }

        }


        //obtain results
        heapMap[desc_node.index] = desc_node;
        heapArray.push(desc_node);

        //set offset to now
        offset = offset + edge_count * edge_fields.length;
    }

    return {heapMap, heapArray, edgesMap, rootID, rootIndex};
}

/**
 * serialize unique heap node
 */
function heapNodeSerialize(jsHeapSnapShot, index) {
    //obtain all heap node & edge's meta info
    let meta = jsHeapSnapShot._metaNode;
    //obtain nodes & edges * sytings
    let nodes = jsHeapSnapShot.nodes;
    let edges = jsHeapSnapShot.containmentEdges;
    let strings = jsHeapSnapShot.strings;
    //obtain node_filed's length & edge_field's length
    let nodeFieldCount = jsHeapSnapShot._nodeFieldCount;
    let edgeFieldsCount = jsHeapSnapShot._edgeFieldsCount;
    //obtain node-edges map relationship
    let firstEdgeIndexes = jsHeapSnapShot._firstEdgeIndexes;
    //obtain every heap node's retainedSize & distance
    let retainedSizeList = jsHeapSnapShot._retainedSizes;
    let distancesList = jsHeapSnapShot._nodeDistances;

    let nodeDetail = nodes.slice(index * nodeFieldCount, index * nodeFieldCount + nodeFieldCount);
    let edge_count = Number(nodeDetail[4]);
    let serialNode = {
        index: index,
        type: meta.node_types[0][nodeDetail[0]],
        name: strings[nodeDetail[1]],
        id: `@${nodeDetail[2]}`,
        self_size: Number(nodeDetail[3]),
        trace_node_id: Number(nodeDetail[5]),
        children: [],
        edge_count,
        retainedSize: Number(retainedSizeList[index]),
        distance: Number(distancesList[index])
    };

    let offset = firstEdgeIndexes[index];

    for (let i = 0; i < edge_count; i++) {
        let edgeDetail = edges.slice(offset, offset + edgeFieldsCount);

        let name_or_index = Boolean(Number(edgeDetail[0]) === Number(HeapGraphEdgeType.kElement) ||
            Number(edgeDetail[0]) === Number(HeapGraphEdgeType.kHidden)) ? `[${String(edgeDetail[1])}]` : `${strings[edgeDetail[1]]}`;

        serialNode.children.push({
            type: meta.edge_types[0][edgeDetail[0]],
            name_or_index,
            index: edgeDetail[2] / nodeFieldCount,
            to_node: `@${nodes[edgeDetail[2] + 2]}`
        });

        offset += edgeFieldsCount;
    }

    return serialNode;
}

/**
 * proxy heapMap object, only used heapNode will save in memory
 */
function heapMapProxy(jsHeapSnapShot) {
    const _heapMap = {};
    const heapMapLoader = Symbol.for('#$heapMapLoader');
    const heapMapProxy = Symbol.for('#$heapMapProxy');

    function HeapNodes() {}
    HeapNodes.prototype = Object.create(null);

    function HeapNodesProxy() {}
    HeapNodesProxy.prototype = Object.create(null);

    return new Proxy(_heapMap, {
        get(target, index){
            if (!this[heapMapProxy]) {
                this[heapMapProxy] = new HeapNodesProxy();
            }

            let isDefine = this[heapMapProxy][index];
            if (!isDefine) {
                this[heapMapProxy][index] = true;
                Object.defineProperty(target, index, {
                    get(){
                        if (!this[heapMapLoader]) {
                            this[heapMapLoader] = new HeapNodes();
                        }

                        let heapNode = this[heapMapLoader][index];

                        if (!heapNode) {
                            heapNode = heapNodeSerialize(jsHeapSnapShot, index);
                            this[heapMapLoader][index] = heapNode;
                        }

                        return heapNode;
                    }
                });
            }

            return target[index];
        }
    });
}

/**
 * obtain jsHeapSnapShot & heapMap
 */
function heapSnapShotCalculate(heapData) {
    const jsHeapSnapShot = new HeapSnapshotWorker.JSHeapSnapshot(heapData, {
        updateStatus(str){
            // console.log(str);
        },

        consoleWarn(str){
            // console.warn(str);
        }
    });
    const heapMap = heapMapProxy(jsHeapSnapShot);

    return {jsHeapSnapShot, heapMap};
}

/**
 * peakLeakPoint: suspicious mem leak point
 */
function peakLeakPoint(jsHeapSnapShot, rootIndex, heapMap, limit) {
    limit = limit || 5;

    let distancesList = jsHeapSnapShot._nodeDistances;
    let retainedSizeList = jsHeapSnapShot._retainedSizes;

    let {leakPoint} = retainedSizeList.reduce((pre, next, index) => {
        if (index === rootIndex) return pre;

        if (Number(distancesList[index]) <= 1 || Number(distancesList[index]) >= 100000000) return pre;

        if (pre.length < limit) {
            pre.leakPoint.push({index, size: next});
            pre.length++;
        } else {
            pre.leakPoint.sort((o, n) => Number(o.size) < Number(n.size) ? 1 : -1);
            if (pre.leakPoint[pre.leakPoint.length - 1].size < next) {
                pre.leakPoint.pop();
                pre.leakPoint.push({index, size: next});
            }
        }

        return pre;
    }, {leakPoint: [], length: 0,});

    leakPoint.forEach(item => item.id = heapMap[item.index].id);

    return {
        statistics: jsHeapSnapShot._statistics,
        aggregates: jsHeapSnapShot._aggregates.allObjects,
        leakPoint
    }
}

//main entry
function fetchHeapUsage(heapData, limit) {
    //let {heapMap, rootIndex} = handleHeapData(heapData);
    const rootIndex = heapData.snapshot.root_index || 0;
    let {jsHeapSnapShot, heapMap} = heapSnapShotCalculate(heapData);
    let {leakPoint, statistics, aggregates,} = peakLeakPoint(jsHeapSnapShot, rootIndex, heapMap, limit);

    return {heapMap, leakPoint, statistics, rootIndex, aggregates}
}

module.exports = fetchHeapUsage;