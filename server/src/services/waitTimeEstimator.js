const Token = require('../models/Token');
const Counter = require('../models/Counter');
const Service = require('../models/Service');

/**
 * Transparent calculation of estimated waiting time based on:
 * - Number of waiting customers ahead in line
 * - Number of currently active / open counters assigned to the service
 * - Service average duration combined with today's empirical service times
 */
const calculateWaitTime = async (serviceId, tokenJoinedAt = new Date()) => {
  try {
    const service = await Service.findById(serviceId);
    if (!service) {
      return { estimatedMinutes: 10, aheadCount: 0, activeCounters: 1, avgDuration: 10 };
    }

    // 1. Waiting tokens ahead in this service queue
    const aheadCount = await Token.countDocuments({
      service: serviceId,
      status: 'waiting',
      joinedAt: { $lt: tokenJoinedAt },
    });

    // 2. Active counters open for this service
    const activeCounters = await Counter.countDocuments({
      supportedServices: serviceId,
      status: 'open',
    });
    const effectiveCounters = Math.max(1, activeCounters);

    // 3. Check historical/today's completed tokens for actual average duration
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await Token.find({
      service: serviceId,
      status: 'completed',
      completedAt: { $gte: today },
      startedAt: { $ne: null },
    }).limit(15);

    let calculatedAvgDuration = service.avgDuration || 10;
    if (completedToday.length >= 3) {
      const totalMinutes = completedToday.reduce((acc, curr) => {
        const diffMinutes = Math.round((new Date(curr.completedAt) - new Date(curr.startedAt)) / 60000);
        return acc + (diffMinutes > 0 ? diffMinutes : calculatedAvgDuration);
      }, 0);
      calculatedAvgDuration = Math.round((totalMinutes / completedToday.length) * 10) / 10;
    }

    // Formula: (aheadCount + 1 position) * avgDuration / activeCounters
    const estimatedMinutes = Math.max(
      1,
      Math.round(((aheadCount + 1) * calculatedAvgDuration) / effectiveCounters)
    );

    return {
      estimatedMinutes,
      aheadCount,
      activeCounters: effectiveCounters,
      avgDuration: calculatedAvgDuration,
      isRealData: true,
    };
  } catch (error) {
    console.error('Error calculating wait time:', error);
    return { estimatedMinutes: 10, aheadCount: 0, activeCounters: 1, avgDuration: 10 };
  }
};

module.exports = {
  calculateWaitTime,
};
