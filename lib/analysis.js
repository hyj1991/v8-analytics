const cpuAnalytics = require('./cpu_analysis');
const memAnalytics = require('./mem_analysis');
const memAnalyticsNew = require('./mem_analysis_new');

cpuAnalytics.memAnalytics = memAnalytics;
cpuAnalytics.memAnalyticsP = memAnalyticsNew.fetchHeapUsageP;
cpuAnalytics.serialize = memAnalyticsNew.heapNodeSerialize;
module.exports = cpuAnalytics;
