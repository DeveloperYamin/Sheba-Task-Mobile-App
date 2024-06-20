import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { showMessage } from 'react-native-flash-message';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { z } from 'zod';
import MediaLibraryPicker from '@/components/media-library-picker';
import { getItem, setItem } from '@/core/storage';
import { type ITask, TASKS } from '@/types';
import {
  Button,
  ControlledInput,
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  showErrorMessage,
} from '@/ui';
import { format } from 'date-fns';
import { schedulePushNotification } from '@/core';
import { useSoftKeyboardEffect } from '@/core/keyboard';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
});

type FormType = z.infer<typeof schema>;

export default function EditTask() {
  useSoftKeyboardEffect();
  const params = useLocalSearchParams<{
    id: string;
    type?: 'edit' | 'detail';
  }>();
  const router = useRouter();
  const { control, handleSubmit, formState, setValue, getValues } =
    useForm<FormType>({
      resolver: zodResolver(schema),
      defaultValues: {
        title: '',
      },
    });
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const storedTask = getItem<ITask[]>(TASKS).find(
      (task) => task.id === params.id
    );
    if (storedTask) {
      setValue('title', storedTask.title);
      setDueTime(storedTask.dueTime ? new Date(storedTask.dueTime) : null);
      setImages(storedTask.images ?? []);
    }
  }, [params.id]);

  const onSubmit = async (data: FormType) => {
    if (!dueTime || !images.length)
      return showErrorMessage('Please select a due time & images for the task');

    try {
      const updatedTasks = (getItem<ITask[]>(TASKS) ?? []).map((task) =>
        task.id === params.id
          ? {
              ...task,
              title: data.title,
              dueTime,
              images,
            }
          : task
      );
      setItem<ITask[]>(TASKS, updatedTasks);
      showMessage({
        message: 'Task updated successfully',
        type: 'success',
      });
      await schedulePushNotification(
        updatedTasks.filter((task) => task.id === params.id)[0]
      );
      router.push('/');
    } catch (error) {
      console.error('Error updating task:', error);
      showErrorMessage('Error updating task');
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
          title: params.type === 'edit' ? 'Edit Task' : 'Task Details',
          headerBackTitle: 'Tasks',
        }}
      />
      <ScrollView className="flex-1 bg-neutral-100 dark:bg-neutral-900 px-4">
        <SafeAreaView>
          {params.type === 'edit' ? (
            <>
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
              <MediaLibraryPicker
                images={images}
                setImages={setImages}
                type={params.type}
              />
              <Button
                label="Update Task"
                loading={formState.isSubmitting}
                onPress={handleSubmit(onSubmit)}
                testID="update-task-button"
              />
            </>
          ) : (
            <View className="flex-1 items-center justify-center gap-6 mt-16">
              <Text className="text-3xl font-bold tracking-tight">
                Title: {getValues('title')}
              </Text>
              <Text className="text-xl font-medium tracking-tight">
                Due Time:{' '}
                {dueTime
                  ? `${format(dueTime, 'EEEE, MMMM d, yyyy')} at ${format(
                      dueTime,
                      'h:mm a'
                    )}`
                  : 'No due time set'}
              </Text>
              <MediaLibraryPicker
                images={images}
                setImages={setImages}
                type={params.type}
              />
            </View>
          )}
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
