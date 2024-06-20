import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { showMessage } from 'react-native-flash-message';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { z } from 'zod';
import MediaLibraryPicker from '@/components/media-library-picker';
import { schedulePushNotification, uniqueId } from '@/core';
import { getItem, setItem } from '@/core/storage';
import { type ITask, TASKS } from '@/types';
import {
  Button,
  ControlledInput,
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  showErrorMessage,
} from '@/ui';
import { format } from 'date-fns';
import { useSoftKeyboardEffect } from '@/core/keyboard';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
});
type FormType = z.infer<typeof schema>;

export default function AddTask() {
  useSoftKeyboardEffect();
  const router = useRouter();
  const { control, handleSubmit, formState, setValue } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
    },
  });
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const onSubmit = async (data: FormType) => {
    if (!dueTime || !images.length)
      return showErrorMessage('Please select a due time & images for the task');

    try {
      const prevTasks = getItem<ITask[]>(TASKS) ?? [];
      const newTask = {
        id: uniqueId(),
        done: false,
        title: data.title,
        dueTime,
        images,
      };
      setItem<ITask[]>(TASKS, [...prevTasks, newTask]);
      showMessage({
        message: 'Task added successfully',
        type: 'success',
      });
      await schedulePushNotification(newTask);
      router.push('/');
    } catch (error) {
      console.error('Error adding task:', error);
      showErrorMessage('Error adding task');
    } finally {
      setValue('title', '');
      setDueTime(null);
      setImages([]);
    }
  };

  const handleConfirm = useCallback((date: Date) => {
    setDueTime(date);
    setDatePickerVisible(false);
  }, []);

  return (
    <>
      <FocusAwareStatusBar />
      <Stack.Screen
        options={{
          title: 'Add Task',
          headerBackTitle: 'Tasks',
        }}
      />
      <ScrollView className="flex-1 bg-neutral-100 dark:bg-neutral-900 px-4">
        <SafeAreaView>
          <ControlledInput
            name="title"
            label="Title"
            control={control}
            testID="title"
          />
          <Button
            label={
              dueTime
                ? `Due: ${format(dueTime, 'dd-MM-yyyy - hh:mm a')}`
                : 'Set Due Time'
            }
            onPress={() => setDatePickerVisible(true)}
            variant="ghost"
            className="mb-4"
          />
          {isDatePickerVisible && (
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              onConfirm={handleConfirm}
              onCancel={() => setDatePickerVisible(false)}
              locale="en_GB"
              date={dueTime ?? new Date()}
            />
          )}
          <MediaLibraryPicker images={images} setImages={setImages} />
          <Button
            label="Add Task"
            loading={formState.isSubmitting}
            onPress={handleSubmit(onSubmit)}
            testID="add-task-button"
          />
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
