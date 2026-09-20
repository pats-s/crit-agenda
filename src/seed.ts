import { COLORS } from './constants'
import { isoIn, monthKey, weekIso } from './dates'
import type { Data, Task } from './types'

const task = (t: Partial<Task> & { id: string; title: string }): Task => ({
  status: 'todo', courseId: '', due: '', priority: false, tags: [], reminder: 'none', notes: '', est: '', ...t,
})

/** Example data so a fresh install has something to look at. */
export function seed(): Data {
  const today = new Date().getDate()
  const marks: Record<string, number[]> = { h1: [], h2: [], h3: [], h4: [] }
  for (let i = 1; i <= today; i++) {
    if (i % 3 !== 0) marks.h1.push(i)
    if (i % 2 === 0) marks.h2.push(i)
    if (i % 4 !== 1) marks.h3.push(i)
    if (i < 8 || i % 5 === 0) marks.h4.push(i)
  }
  const now = Date.now()
  return {
    courses: [
      { id: 'c1', title: 'Visual Identity 301', color: COLORS[0], mid: isoIn(9), final: isoIn(50), goal: '90%', grade: '' },
      { id: 'c2', title: 'Typography II', color: COLORS[1], mid: isoIn(3), final: isoIn(46), goal: 'A', grade: '' },
      { id: 'c3', title: 'History of Design', color: COLORS[3], mid: isoIn(-12), final: isoIn(52), goal: 'B+', grade: '' },
    ],
    tasks: [
      task({ id: 't1', title: 'Finish logo sketches (10 directions)', status: 'doing', courseId: 'c1', due: weekIso(3), priority: true, tags: ['Branding'], reminder: '2', notes: 'Bring to Thursday crit.', est: '3h' }),
      task({ id: 't2', title: 'Pick 3 typefaces for poster', courseId: 'c2', due: weekIso(1), tags: ['Typography'], reminder: '1', est: '1h' }),
      task({ id: 't3', title: 'Type specimen poster: hand in', courseId: 'c2', due: isoIn(4), priority: true, tags: ['Print'], reminder: '3', notes: 'A2, CMYK, 3 mm bleed. Export print-ready PDF.' }),
      task({ id: 't4', title: 'Mood board for Café Lumen', status: 'done', courseId: 'c1', due: weekIso(0), tags: ['Research'] }),
      task({ id: 't5', title: 'Buy A2 paper + spray mount', courseId: 'c2', due: weekIso(2), tags: ['Print'], reminder: '1' }),
      task({ id: 't6', title: 'Read: Thinking with Type, ch. 3', courseId: 'c2', due: weekIso(4), tags: ['Research'], reminder: '2', est: '45m' }),
      task({ id: 't7', title: 'Outline Bauhaus essay', courseId: 'c3', due: isoIn(6), tags: ['Research'], reminder: '1', est: '1h' }),
      task({ id: 't8', title: 'Colour palette + 3 mockups', courseId: 'c1', due: isoIn(8), tags: ['Branding', 'Layout'], reminder: '3', est: '4h' }),
      task({ id: 't9', title: 'Café Lumen brand identity: final delivery', courseId: 'c1', due: isoIn(12), priority: true, tags: ['Branding'], reminder: '7', notes: 'Logo, palette, 3 mockups, guidelines PDF.' }),
      task({ id: 't10', title: 'Bauhaus essay + poster', courseId: 'c3', due: isoIn(20), tags: ['Research', 'Layout'], reminder: '7' }),
      task({ id: 't11', title: 'Portfolio site: publish', due: isoIn(30), reminder: '7' }),
      task({ id: 't12', title: 'Email Prof. Aoun about crit slot' }),
    ],
    habits: [
      { id: 'h1', name: 'Sketch for 20 min' },
      { id: 'h2', name: 'Read a chapter' },
      { id: 'h3', name: 'Walk / stretch' },
      { id: 'h4', name: 'Water 2 L' },
    ],
    marks: { [monthKey(0)]: marks },
    months: {
      [monthKey(0)]: {
        win: 'Finished the type specimen layout',
        fail: 'Left the Lumen sketches to the last night',
        proud: 'Presented at Thursday crit without notes',
        focus: 'Brand identity + portfolio site',
        grateful: 'My study group, decent coffee',
        rating: { Studies: 7, Creativity: 8, Finances: 5, Mental: 6, Physical: 4, Relationships: 7 },
        goals: [
          { text: 'Finish Café Lumen logo', done: true },
          { text: 'Print type poster on A2', done: false },
          { text: 'Portfolio: 3 case studies', done: false },
          { text: '', done: false },
          { text: '', done: false },
        ],
      },
    },
    notifs: [
      { id: 'n1', k: 'seed1', ts: now - 2 * 864e5 - 5e6, title: 'Due in 2 days: Finish logo sketches (10 directions)', body: 'Visual Identity 301 · reminder set 2 days before', taskId: 't1', read: true },
      { id: 'n2', k: 'seed2', ts: now - 3 * 864e5 - 9e6, title: 'Due tomorrow: Mood board for Café Lumen', body: 'Visual Identity 301 · reminder set 1 day before', taskId: 't4', read: true },
      { id: 'n3', k: 'seed3', ts: now - 5 * 864e5 - 2e6, title: 'Due in 3 days: Type specimen poster: hand in', body: 'Typography II · reminder set 3 days before', taskId: 't3', read: true },
    ],
  }
}
