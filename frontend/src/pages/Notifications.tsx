import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markAllNotificationsRead, markNotificationRead, Notification } from '../services/api';

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  async function load() { try { setItems(await getNotifications()); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load notifications'); } }
  useEffect(() => { load(); }, []);
  async function read(id: string) { try { await markNotificationRead(id); setItems(items => items.map(item => item.id === id ? {...item, isRead:true} : item)); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update notification'); } }
  async function readAll() { try { await markAllNotificationsRead(); setItems(items => items.map(item => ({...item, isRead:true}))); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update notifications'); } }
  return <main className="page"><Link to="/">← Home</Link><div className="dashboard-head"><div><span className="kicker">Activity</span><h1>Notifications</h1><p>Stay up to date with enquiries, visits and account activity.</p></div><button className="button ghost small" onClick={readAll} disabled={!items.some(item => !item.isRead)}>Mark all read</button></div>{error && <div className="error" role="alert">{error}</div>}<section className="dashboard-panel"><div className="activity-list">{items.length === 0 ? <p>No notifications yet.</p> : items.map(item => <article className={`activity ${item.isRead ? '' : 'unread'}`} key={item.id}><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString('en-IN')}</small></div>{!item.isRead && <button className="button ghost small" onClick={() => read(item.id)}>Mark read</button>}</article>)}</div></section></main>;
}
