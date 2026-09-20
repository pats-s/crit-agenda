export type Status = 'todo' | 'doing' | 'done'
export type Reminder = 'none' | '0' | '1' | '2' | '3' | '7'

export interface Course {
  id: string
  title: string
  color: string
  mid: string // ISO date or ''
  final: string
  goal: string
  grade: string
}

export interface Task {
  id: string
  title: string
  status: Status
  courseId: string // '' = no course
  due: string // ISO date or ''
  priority: boolean
  tags: string[]
  reminder: Reminder
  notes: string
  est: string
}

export interface Habit {
  id: string
  name: string
}

export interface Goal {
  text: string
  done: boolean
}

export interface MonthData {
  win: string
  fail: string
  proud: string
  focus: string
  grateful: string
  rating: Record<string, number>
  goals: Goal[]
}

export interface Notif {
  id: string
  k: string // dedupe key: one notification per task per reminder
  ts: number
  title: string
  body: string
  taskId: string
  read: boolean
}

export interface Data {
  courses: Course[]
  tasks: Task[]
  habits: Habit[]
  marks: Record<string, Record<string, number[]>> // month key -> habit id -> days ticked
  months: Record<string, MonthData>
  notifs: Notif[]
}
