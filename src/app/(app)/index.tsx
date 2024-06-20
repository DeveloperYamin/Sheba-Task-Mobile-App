import { FlashList } from '@shopify/flash-list';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { getItem, setItem } from '@/core/storage';
import { type ITask, TASKS } from '@/types';
import {
  Checkbox,
  EmptyList,
  FocusAwareStatusBar,
  Pressable,
  Text,
  View,
  colors,
} from '@/ui';
import { Delete, Edit } from '@/ui/icons';
import { Link } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import * as Notifications from 'expo-notifications';

export default function Tasks() {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const storedTasks = getItem<ITask[]>(TASKS) ?? [];
    setTasks(storedTasks);
    setIsLoading(false);
  }, []);

  const handleCheckboxChange = useCallback(
    async (task: ITask) => {
      const prevTasks = getItem<ITask[]>(TASKS).map((prevTask) =>
        prevTask.id === task.id
          ? { ...prevTask, done: !prevTask.done }
          : prevTask
      );
      setTasks(prevTasks);
      setItem(TASKS, prevTasks);
      await Notifications.cancelScheduledNotificationAsync(task.id);
    },
    [tasks]
  );

  const handleDelete = useCallback(async (id: string) => {
    const prevTasks = getItem<ITask[]>(TASKS).filter((task) => task.id !== id);
    setTasks(prevTasks);
    setItem(TASKS, prevTasks);
    showMessage({
      message: 'Task deleted successfully',
      type: 'success',
    });
    await Notifications.cancelScheduledNotificationAsync(id);
  }, []);

  const renderTaskItem = useCallback(
    ({ item }: { item: ITask }) => (
      <View className="mx-4 my-2 flex flex-row items-center justify-between overflow-hidden rounded-xl bg-white shadow-md dark:bg-neutral-800 px-4">
        <View className="flex flex-row items-center py-4">
          <Checkbox.Root
            checked={item.done}
            onChange={() => handleCheckboxChange(item)}
            accessibilityLabel="task checkbox"
            className="mr-4"
          >
            <Checkbox.Icon checked={item.done} />
          </Checkbox.Root>
          <Link
            href={{
              pathname: '/tasks/[id]',
              params: { id: item.id, type: 'detail' },
            }}
            asChild
          >
            <Pressable>
              <Text className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                {item.title}
              </Text>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {item && item.dueTime && format(item.dueTime, 'dd-MM hh:mm a')}
              </Text>
            </Pressable>
          </Link>
        </View>
        <View className="flex flex-row items-center gap-4">
          <Delete
            color={colors.danger[500]}
            onPress={() => handleDelete(item.id)}
          />
          <Link
            href={{
              pathname: '/tasks/[id]',
              params: { id: item.id, type: 'edit' },
            }}
            asChild
          >
            <Pressable>
              <Edit color={colors.primary[500]} />
            </Pressable>
          </Link>
        </View>
      </View>
    ),
    [handleCheckboxChange]
  );

  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex flex-1 bg-neutral-100 dark:bg-neutral-900">
        <FlashList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyList
              isLoading={isLoading}
              className="w-[80vw] flex items-center justify-center h-[80vh] mx-auto"
            />
          }
          estimatedItemSize={200}
          contentContainerClassName="pt-5"
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}
