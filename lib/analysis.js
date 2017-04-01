const cpuAnalytics = require('./cpu_analysis');
const memAnalytics = require('./mem_analysis');

cpuAnalytics.memAnalytics = memAnalytics;
module.exports = cpuAnalytics;
