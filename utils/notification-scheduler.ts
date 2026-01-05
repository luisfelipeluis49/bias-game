import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import loveMessagesData from '../assets/data/love_messages.json';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type LoveMessage = {
  text: string;
  day: string;
  emoji: string;
  heat: number;
};

const messages = loveMessagesData as LoveMessage[];

const heat0Messages = messages.filter((m) => m.heat === 0.0);
const heat1Messages = messages.filter((m) => m.heat === 1.0);

function getRandomMessage(list: LoveMessage[]) {
  if (list.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    // We don't strictly need the token for local notifications, but it's good practice to complete the flow
    // token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

type ScheduleOptions = {
  /** When true, schedule quick-fire notifications every 30s to validate delivery. */
  testMode?: boolean;
  /** How many notifications to queue in test mode (default: 10 => ~5 minutes). */
  testCount?: number;
};

export async function scheduleLoveMessages(options: ScheduleOptions = {}) {
  const { testMode = false, testCount = 10 } = options;

  // Cancel all existing notifications to avoid duplicates/overlap
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  if (testMode) {
    // Rapid scheduling: every 30 seconds, limited by testCount
    const intervalSeconds = 30;
    for (let i = 1; i <= testCount; i++) {
      const triggerDate = new Date(now.getTime() + i * intervalSeconds * 1000);
      const secondsFromNow = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
      if (secondsFromNow <= 0) continue;

      const hour = triggerDate.getHours();
      const message = hour >= 5 && hour <= 22
        ? getRandomMessage(heat0Messages)
        : getRandomMessage(heat1Messages);

      if (!message) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.emoji || '❤️',
          body: message.text,
          data: { heat: message.heat },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
          repeats: false,
        },
      });
    }

    console.log(`Scheduled ${testCount} test notifications (every 30s).`);
    return;
  }

  // Regular scheduling: hourly for the next 3 days
  const hoursToSchedule = 24 * 3;

  for (let i = 1; i <= hoursToSchedule; i++) {
    const triggerDate = new Date(now.getTime() + i * 60 * 60 * 1000);
    triggerDate.setMinutes(0);
    triggerDate.setSeconds(0);

    const secondsFromNow = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
    if (secondsFromNow <= 0) continue;

    const hour = triggerDate.getHours();
    const message = hour >= 5 && hour <= 22
      ? getRandomMessage(heat0Messages)
      : getRandomMessage(heat1Messages);

    if (!message) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.emoji || '❤️',
        body: message.text,
        data: { heat: message.heat },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });
  }

  console.log(`Scheduled ${hoursToSchedule} hourly notifications for the next 3 days.`);
}
