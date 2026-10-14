const axios = require('axios');
const Notification = require('../models/Notification');

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5001';

/**
 * Dispatches a notification to the Notification Microservice via REST API
 * @param {Object} notificationData - { recipient, title, message, type, token, metadata, channels }
 * @returns {Promise<Object>} Created notification
 */
const dispatchNotification = async (notificationData) => {
  const url = `${NOTIFICATION_SERVICE_URL}/api/notifications/dispatch`;

  try {
    console.log(`[Inter-Service REST] Calling POST ${url} for recipient ${notificationData.recipient}`);
    
    const response = await axios.post(url, notificationData, {
      timeout: 4000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Origin': 'Queue-Service',
      },
    });

    if (response.data && response.data.data) {
      console.log(`[Inter-Service REST] Success from Notification Microservice (ID: ${response.data.data._id})`);
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.warn(
      `[Inter-Service REST Warning] Notification Microservice unreachable (${error.message}). Falling back to local data store.`
    );
    // Graceful fallback to maintain high availability and prevent transaction failure
    try {
      const fallbackNotif = await Notification.create(notificationData);
      return fallbackNotif;
    } catch (fallbackErr) {
      console.error(`[Fallback Storage Error]:`, fallbackErr.message);
      return notificationData;
    }
  }
};

/**
 * Proxies request to fetch user notifications from Notification Microservice
 */
const fetchUserNotifications = async (authToken) => {
  const url = `${NOTIFICATION_SERVICE_URL}/api/notifications`;
  try {
    const response = await axios.get(url, {
      timeout: 4000,
      headers: {
        Authorization: authToken,
      },
    });
    return response.data;
  } catch (error) {
    console.warn(`[Inter-Service Proxy Warning] ${error.message}`);
    return null; // Signals controller to use local query
  }
};

/**
 * Proxies mark read request to Notification Microservice
 */
const markNotificationRead = async (notificationId, authToken) => {
  const url = `${NOTIFICATION_SERVICE_URL}/api/notifications/${notificationId}/read`;
  try {
    const response = await axios.put(
      url,
      {},
      {
        timeout: 4000,
        headers: { Authorization: authToken },
      }
    );
    return response.data;
  } catch (error) {
    console.warn(`[Inter-Service Proxy Warning] ${error.message}`);
    return null;
  }
};

/**
 * Proxies mark all read request to Notification Microservice
 */
const markAllNotificationsRead = async (authToken) => {
  const url = `${NOTIFICATION_SERVICE_URL}/api/notifications/read-all`;
  try {
    const response = await axios.put(
      url,
      {},
      {
        timeout: 4000,
        headers: { Authorization: authToken },
      }
    );
    return response.data;
  } catch (error) {
    console.warn(`[Inter-Service Proxy Warning] ${error.message}`);
    return null;
  }
};

/**
 * Checks health of Notification Microservice via REST API
 */
const checkNotificationServiceHealth = async () => {
  const url = `${NOTIFICATION_SERVICE_URL}/api/notifications/health`;
  try {
    const response = await axios.get(url, { timeout: 3000 });
    return response.data;
  } catch (error) {
    return {
      service: 'Notification Microservice',
      status: 'unreachable',
      error: error.message,
    };
  }
};

module.exports = {
  dispatchNotification,
  fetchUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  checkNotificationServiceHealth,
};
