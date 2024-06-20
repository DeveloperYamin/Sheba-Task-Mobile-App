export const TASKS = 'tasks';

export type ITask = {
  id: string;
  done: boolean;
  title: string;
  dueTime: Date;
  images: string[];
};
