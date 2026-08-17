import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Agreement, getAgreements } from '../services/api';

export default function Agreements() {
  const [items, setItems] = useState<Agreement[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { getAgreements().then(setItems).catch(err => setError(err instanceof Error ? err.message : 'Unable to load agreements')); }, []);
  const label = (status: string) => status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  return <main className="page"><Link to="/">← Home</Link><div className="dashboard-head"><div><span className="kicker">Legal workflow</span><h1>Rental agreements</h1><p>Prepare, review and track rental-agreement requests. Generation does not by itself mean legal execution.</p></div><Link className="button" to="/agreements/new">Start agreement</Link></div>{error && <div className="error" role="alert">{error}</div>}<section className="dashboard-panel">{items.length === 0 ? <div className="empty"><h2>No agreements yet</h2><p>Start an agreement after you and the other party have agreed on the rental terms.</p></div> : <div className="activity-list">{items.map(item => <article className="activity" key={item.id}><div><strong>{item.property?.title || 'Rental agreement'}</strong><p>{item.property?.areaName}, {item.property?.city} · ₹{Number(item.rent).toLocaleString('en-IN')}/month</p><small>{label(item.status)} · {new Date(item.startDate).toLocaleDateString('en-IN')} – {new Date(item.endDate).toLocaleDateString('en-IN')}</small></div><Link className="button ghost small" to={`/agreements/${item.id}`}>Open</Link></article>)}</div>}</section></main>;
}
