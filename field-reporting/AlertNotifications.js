// AlertNotifications.js
//
// LANDGUARD AI - ALERT & NOTIFICATION MODULE
// Owner: Field Reporting & Alert Systems Engineer
//
// This module handles local notifications for the mobile app.
// It does NOT contain the backend URL.
// The parent/app can call these functions when an alert is received.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ask the user for notification permission.
export async function initializeNotifications() {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission was not granted.');
    return false;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('landslide-alerts', {
      name: 'Landslide Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

// Show an immediate local notification.
export async function showAlertNotification({
  title = 'LandGuard AI Alert',
  body = 'A new landslide-related alert has been received.',
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: null,
  });
}

// Convenience function for a high-risk landslide alert.
export async function showHighRiskAlert(location = 'your area') {
  await showAlertNotification({
    title: '⚠️ High Landslide Risk',
    body: `High landslide risk has been detected near ${location}. Please follow official safety instructions.`,
  });
}