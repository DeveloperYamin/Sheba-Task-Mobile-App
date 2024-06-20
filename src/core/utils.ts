import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';
import * as Notifications from 'expo-notifications';
import { ITask, TASKS } from '@/types';
import { getItem } from './storage';

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  let store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (let k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

export const uniqueId = () =>
  `${Date.now().toString()}-${Math.random().toString(36).substring(2, 8)}`;

export async function schedulePushNotification(task: ITask) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Due',
      body: task.title,
      sound: true,
      data: { id: task.id },
    },
    trigger: {
      date: new Date(task.dueTime),
    },
    identifier: task.id,
  });
}
