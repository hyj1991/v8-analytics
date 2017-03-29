'use strict';
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


function handleHeapData(heapData) {
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
                type: edge_types[0][node_edge[0]],
                name_or_index,
                to_node: `@${nodes[node_edge[2] + 2]}`
            };
            //desc_node.edges.push(desc_node_edge);

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

        // console.log(desc_node);

        //obtain results
        heapMap[desc_node.id] = desc_node;
        heapArray.push(desc_node);

        //set offset to now
        offset = offset + edge_count * edge_fields.length;
    }

    return {heapMap, heapArray, edgesMap};
}

function statistics(heapArray) {
    let totalSize = 0;

    let result = heapArray.reduce((pre, next) => {
        let type = next.type;
        if (pre[type]) {
            pre[type].elements.push(next.id);
            pre[type].shallowSize = pre[type].shallowSize + next.self_size;
        } else {
            pre[type] = {shallowSize: next.self_size, elements: [next.id]}
        }

        totalSize = totalSize + next.self_size;
        return pre;
    }, {});

    Object.keys(result).forEach(key => result[key].contain = ((result[key].shallowSize / totalSize) * 100).toFixed(2));

    return result;
}

function getRootID(edgesMap) {
    return Object.keys(edgesMap).reduce((pre, next) => {
        let edgeDetail = edgesMap[next];
        if (edgeDetail.from_ids && edgeDetail.from_ids.length === 0) {
            pre = next
        }

        return pre;
    });
}

function fetchHeapUsage(heapData) {
    let {heapMap, heapArray, edgesMap} = handleHeapData(heapData);
    //statistics is dependent on node_types[0]
    //so it'll be little different from chrome dev tools
    let sizeStatistics = statistics(heapArray);
    // let rootID = getRootID(edgesMap);
    // suspectedLeakPoint1(sizeStatistics);

    // console.log(heapMap);
    // console.log('疑似泄漏类型：', leakPoint, '其占据了: ', sizeStatistics[leakPoint].shallowSize, ' 字节');
    // traceReference('@50575', heapMap, edgesMap);

    return {sizeStatistics}
}

//test
const fs = require('fs');
const string = fs.readFileSync('../../examples/GC/gc--2--1490248374470.heapsnapshot');
const json = JSON.parse(string);
fetchHeapUsage(json);

module.exports = fetchHeapUsage;