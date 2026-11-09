import { useEffect, useMemo, useState } from 'react';
import {
  IconCalendarEvent, IconCalendarMonth, IconCheck, IconChevronLeft,
  IconChevronRight, IconClipboardList, IconPencil, IconPlus, IconTrash, IconX,
} from '@tabler/icons-react';

const categoryColours = { Schule: 'school', Arbeit: 'work', Privat: 'private' };
const priorities = ['Hoch', 'Mittel', 'Tief'];
const atMidday = (value) => new Date(`${value}T12:00:00`);
const dateKey = (date) => {
  const local = new Date(date);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
};
const addDays = (date, days) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
const monthFormat = new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' });
const longDateFormat = new Intl.DateTimeFormat('de-CH', { weekday: 'short', day: 'numeric', month: 'short' });
const dayFormat = new Intl.DateTimeFormat('de-CH', { weekday: 'long', day: 'numeric', month: 'long' });

function createSamples(today) {
  return [
    { id: 'mathe', title: 'Mathe-Prüfung vorbereiten', category: 'Schule', priority: 'Hoch', date: dateKey(today), done: false },
    { id: 'english', title: 'Englisch-Vokabeln lernen', category: 'Schule', priority: 'Mittel', date: dateKey(today), done: false },
    { id: 'presentation', title: 'Projektpräsentation fertigstellen', category: 'Arbeit', priority: 'Hoch', date: dateKey(addDays(today, 1)), done: false },
    { id: 'shopping', title: 'Wocheneinkauf planen', category: 'Privat', priority: 'Tief', date: dateKey(addDays(today, 3)), done: false },
    { id: 'notes', title: 'Notizen vom Unterricht ordnen', category: 'Schule', priority: 'Tief', date: dateKey(addDays(today, -1)), done: true },
  ];
}

function AppIcon({ children, label }) { return <span className="icon" aria-label={label}>{children}</span>; }

export function App() {
  const today = useMemo(() => { const now = new Date(); now.setHours(0, 0, 0, 0); return now; }, []);
  const todayKey = dateKey(today);
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prioplan-v3-tasks')) || createSamples(today); }
    catch { return createSamples(today); }
  });
  const [view, setView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { localStorage.setItem('prioplan-v3-tasks', JSON.stringify(tasks)); }, [tasks]);
  const selectedTasks = tasks.filter((task) => task.date === selectedDate);
  const openSelected = selectedTasks.filter((task) => !task.done);
  const orderedTasks = [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.date.localeCompare(b.date));
  const filteredTasks = filter === 'all' ? orderedTasks : orderedTasks.filter((task) => task.category === filter);
  const updateTask = (id, updates) => setTasks((current) => current.map((task) => task.id === id ? { ...task, ...updates } : task));
  const deleteTask = (id) => setTasks((current) => current.filter((task) => task.id !== id));
  const addTask = (data) => setTasks((current) => [...current, { ...data, id: crypto.randomUUID(), done: false }]);
  const chooseDate = (key) => { const date = atMidday(key); setSelectedDate(key); setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1)); };
  const navigate = (nextView) => { setView(nextView); if (nextView === 'today') chooseDate(todayKey); };

  return <div className="app-shell">
    <aside className="rail" aria-label="Hauptnavigation">
      <div className="rail-mark" aria-label="PrioPlan">PP</div>
      <nav className="rail-nav">
        <button className={view === 'today' ? 'active' : ''} onClick={() => navigate('today')}><AppIcon label="Heute"><IconCalendarEvent size={23} stroke={1.8} /></AppIcon><span>Heute</span></button>
        <button className={view === 'tasks' ? 'active' : ''} onClick={() => navigate('tasks')}><AppIcon label="Aufgaben"><IconClipboardList size={23} stroke={1.8} /></AppIcon><span>Aufgaben</span></button>
        <button className={view === 'calendar' ? 'active' : ''} onClick={() => navigate('calendar')}><AppIcon label="Kalender"><IconCalendarMonth size={23} stroke={1.8} /></AppIcon><span>Kalender</span></button>
      </nav>
      <div className="rail-footer"><span><i className="legend school" />Schule</span><span><i className="legend work" />Arbeit</span><span><i className="legend private" />Privat</span></div>
    </aside>
    <main className="workspace">
      <header className="topline"><p>PrioPlan / {view === 'calendar' ? 'Kalender' : view === 'tasks' ? 'Aufgaben' : 'Heute'}</p><button className="new-task" onClick={() => setModal({ date: selectedDate })}><IconPlus size={20} />Aufgabe</button></header>
      {view === 'calendar' && <CalendarView month={calendarMonth} todayKey={todayKey} tasks={tasks} selectedDate={selectedDate} onMonthChange={(delta) => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1))} onSelect={chooseDate} selectedTasks={selectedTasks} openSelected={openSelected} onToggle={(task) => updateTask(task.id, { done: !task.done })} onEdit={setModal} onDelete={deleteTask} onAdd={() => setModal({ date: selectedDate })} />}
      {view === 'today' && <TodayView today={today} todayKey={todayKey} tasks={tasks} selectedDate={selectedDate} onSelect={chooseDate} onToggle={(task) => updateTask(task.id, { done: !task.done })} onEdit={setModal} onDelete={deleteTask} onAdd={() => setModal({ date: todayKey })} />}
      {view === 'tasks' && <TasksView tasks={filteredTasks} filter={filter} onFilter={setFilter} onToggle={(task) => updateTask(task.id, { done: !task.done })} onEdit={setModal} onDelete={deleteTask} onAdd={() => setModal({ date: todayKey })} />}
    </main>
    {modal && <TaskModal task={modal.id ? tasks.find((task) => task.id === modal.id) : null} defaultDate={modal.date} onClose={() => setModal(null)} onSave={(task) => { modal.id ? updateTask(modal.id, task) : addTask(task); setModal(null); }} onDelete={() => { deleteTask(modal.id); setModal(null); }} />}
  </div>;
}

function CalendarView({ month, todayKey, tasks, selectedDate, onMonthChange, onSelect, selectedTasks, openSelected, onToggle, onEdit, onDelete, onAdd }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const tasksByDate = tasks.reduce((result, task) => ({ ...result, [task.date]: [...(result[task.date] || []), task] }), {});
  return <>
    <section className="calendar-heading"><div><h1>{monthFormat.format(month)}</h1><p>Deine Aufgaben als Monatsüberblick.</p></div><div className="month-nav"><button aria-label="Vorheriger Monat" onClick={() => onMonthChange(-1)}><IconChevronLeft size={21} /></button><button aria-label="Nächster Monat" onClick={() => onMonthChange(1)}><IconChevronRight size={21} /></button></div></section>
    <section className="calendar-layout"><div className="month-grid-wrap"><div className="weekday-row">{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => <span key={day}>{day}</span>)}</div><div className="month-grid">{days.map((date) => {
      const key = dateKey(date); const dayTasks = tasksByDate[key] || [];
      return <button key={key} className={`calendar-cell ${date.getMonth() !== month.getMonth() ? 'outside' : ''} ${key === selectedDate ? 'selected' : ''}`} onClick={() => onSelect(key)} aria-pressed={key === selectedDate}><span className={`date-number ${key === todayKey ? 'today' : ''}`}>{date.getDate()}</span><span className="calendar-items">{dayTasks.slice(0, 2).map((task) => <span key={task.id} className={`calendar-task ${categoryColours[task.category]} ${task.done ? 'done' : ''}`}>{task.title}</span>)}</span>{dayTasks.length > 2 && <small>+{dayTasks.length - 2}</small>}</button>;
    })}</div></div><DayPanel selectedDate={selectedDate} tasks={selectedTasks} openCount={openSelected.length} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onAdd={onAdd} /></section>
    <footer className="calendar-footer"><div><span><i className="legend school" />Schule</span><span><i className="legend work" />Arbeit</span><span><i className="legend private" />Privat</span></div><button onClick={() => onSelect(todayKey)}>Heute anzeigen</button></footer>
  </>;
}

function DayPanel({ selectedDate, tasks, openCount, onToggle, onEdit, onDelete, onAdd }) {
  return <aside className="day-panel"><p className="eyebrow">Ausgewählter Tag</p><h2>{dayFormat.format(atMidday(selectedDate))}</h2><p className="task-count">{openCount ? `${openCount} offen` : 'Alles erledigt'}</p><div className="day-list">{tasks.length ? tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} compact />) : <p className="empty-state">Noch keine Aufgabe für diesen Tag.</p>}</div><button className="panel-add" onClick={onAdd}><IconPlus size={16} />Aufgabe hinzufügen</button></aside>;
}

function TodayView({ today, todayKey, tasks, selectedDate, onSelect, onToggle, onEdit, onDelete, onAdd }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const dayTasks = tasks.filter((task) => task.date === selectedDate);
  return <><section className="today-heading"><p>{new Intl.DateTimeFormat('de-CH', { weekday: 'long', day: 'numeric', month: 'long' }).format(today)}</p><h1>Heute</h1><button className="text-action" onClick={onAdd}><IconPlus size={18} />Neue Aufgabe</button></section><div className="day-strip">{days.map((date) => { const key = dateKey(date); return <button key={key} onClick={() => onSelect(key)} className={key === selectedDate ? 'active' : ''}><span>{new Intl.DateTimeFormat('de-CH', { weekday: 'short' }).format(date)}</span><b>{date.getDate()}</b></button>; })}</div><section className="today-content"><div><div className="section-title"><h2>Fokus</h2><span>{dayTasks.filter((task) => !task.done).length} offen</span></div><div className="task-surface">{dayTasks.length ? dayTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />) : <p className="empty-state">Für diesen Tag ist noch nichts geplant.</p>}</div></div><div className="today-aside"><p className="eyebrow">Nächste Abgabe</p>{tasks.filter((task) => !task.done && task.date > todayKey).slice(0, 2).map((task) => <div className="next-item" key={task.id}><small>{longDateFormat.format(atMidday(task.date))}</small><strong>{task.title}</strong><span><i className={`legend ${categoryColours[task.category]}`} />{task.category}</span></div>)}</div></section></>;
}

function TasksView({ tasks, filter, onFilter, onToggle, onEdit, onDelete, onAdd }) {
  return <><section className="today-heading"><p>Alles an einem Ort</p><h1>Aufgaben</h1><button className="text-action" onClick={onAdd}><IconPlus size={18} />Neue Aufgabe</button></section><div className="task-toolbar">{['all', 'Schule', 'Arbeit', 'Privat'].map((item) => <button key={item} onClick={() => onFilter(item)} className={filter === item ? 'active' : ''}>{item === 'all' ? 'Alle' : item}</button>)}</div><section className="all-tasks">{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}</section></>;
}

function TaskRow({ task, onToggle, onEdit, onDelete, compact = false }) {
  return <article className={`task-row ${task.done ? 'done' : ''} ${compact ? 'compact' : ''}`}><button className="check-button" onClick={() => onToggle(task)} aria-label={task.done ? 'Aufgabe wieder öffnen' : 'Aufgabe als erledigt markieren'}>{task.done && <IconCheck size={14} />}</button><div className="task-main"><strong>{task.title}</strong><span><i className={`legend ${categoryColours[task.category]}`} />{task.category}<b>·</b><em className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</em></span></div>{!compact && <time>{longDateFormat.format(atMidday(task.date))}</time>}<div className="row-actions"><button onClick={() => onEdit(task)} aria-label="Aufgabe bearbeiten"><IconPencil size={15} /></button><button onClick={() => onDelete(task.id)} aria-label="Aufgabe löschen"><IconTrash size={15} /></button></div></article>;
}

function TaskModal({ task, defaultDate, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task || { title: '', category: 'Schule', priority: 'Mittel', date: defaultDate, done: false });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="task-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (form.title.trim()) onSave({ ...form, title: form.title.trim() }); }}><header><div><p className="eyebrow">PrioPlan</p><h2>{task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</h2></div><button type="button" onClick={onClose} aria-label="Schliessen"><IconX size={20} /></button></header><label>Aufgabe<input value={form.title} onChange={(event) => update('title', event.target.value)} autoFocus placeholder="Was möchtest du erledigen?" /></label><div className="form-grid"><label>Kategorie<select value={form.category} onChange={(event) => update('category', event.target.value)}>{['Schule', 'Arbeit', 'Privat'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Priorität<select value={form.priority} onChange={(event) => update('priority', event.target.value)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label></div><label>Abgabedatum<input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></label><footer>{task ? <button type="button" className="delete-button" onClick={onDelete}>Löschen</button> : <span />}<button className="save-button">Speichern</button></footer></form></div>;
}

