import type { Reminder, Status } from './types'

export const COLORS = ['#c8467f', '#4f86b8', '#c39a3d', '#8a6bbf', '#4f9c78']
export const TAGS = ['Typography', 'Branding', 'Illustration', 'Layout', 'Photo', 'Motion', 'Print', 'Research', 'Critique']
export const REM: Record<Reminder, string> = {
  none: 'No reminder',
  '0': 'On the day',
  '1': '1 day before',
  '2': '2 days before',
  '3': '3 days before',
  '7': '1 week before',
}
export const STATUS: Record<Status, string> = { todo: 'To do', doing: 'In progress', done: 'Done' }
export const NEXT: Record<Status, Status> = { todo: 'doing', doing: 'done', done: 'todo' }
export const CATS = ['Studies', 'Creativity', 'Finances', 'Mental', 'Physical', 'Relationships']
export const QUOTES = [
  'You don’t find the happy life, you make it.',
  'Have no fear of perfection — you’ll never reach it.',
  'Creativity takes courage.',
  'Good design is as little design as possible.',
  'Done is better than perfect.',
]
