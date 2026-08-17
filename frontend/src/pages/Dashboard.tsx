import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {getCurrentUser, getEnquiries, getFavorites, getVisits, logout, updateEnquiry, updateVisit, User} from '../services/api';
import {getOwnerProperties} from '../services/ownerApi';

export default function Dashboard({role}:{role:'OWNER'|'TENANT'}) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({primary:0, secondary:0, tertiary:0});
  const [enquiries, setEnquiries] = useState<Awaited<ReturnType<typeof getEnquiries>>>([]);
  const [visits, setVisits] = useState<Awaited<ReturnType<typeof getVisits>>>([]);
  const [favorites, setFavorites] = useState<Awaited<ReturnType<typeof getFavorites>>>([]);
  const [properties, setProperties] = useState<Awaited<ReturnType<typeof getOwnerProperties>>['data']>([]);
  const [error, setError] = useState('');

  async function loadData(currentRole: 'OWNER'|'TENANT') {
    if (currentRole === 'OWNER') {
      const [ownerProperties, nextEnquiries, nextVisits] = await Promise.all([getOwnerProperties(), getEnquiries(), getVisits()]);
      setProperties(ownerProperties.data); setEnquiries(nextEnquiries); setVisits(nextVisits); setFavorites([]);
      setStats({ primary: ownerProperties.data.filter(p => p.status === 'ACTIVE').length, secondary: nextEnquiries.filter(e => e.status === 'NEW').length, tertiary: nextVisits.filter(v => ['PENDING','ACCEPTED','RESCHEDULE_REQUESTED'].includes(v.status)).length });
    } else {
      const [nextFavorites, nextEnquiries, nextVisits] = await Promise.all([getFavorites(), getEnquiries(), getVisits()]);
      setFavorites(nextFavorites); setEnquiries(nextEnquiries); setVisits(nextVisits); setProperties([]);
      setStats({ primary: nextFavorites.length, secondary: nextVisits.filter(v => ['PENDING','ACCEPTED','RESCHEDULE_REQUESTED'].includes(v.status)).length, tertiary: nextEnquiries.length });
    }
  }

  useEffect(() => { getCurrentUser().then(async ({user}) => { if (user.role !== role) { navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/tenant/dashboard', {replace:true}); return; } setUser(user); try { await loadData(role); } catch { setError('Unable to load your latest dashboard data'); } }).catch(() => navigate('/login', {replace:true})); }, [navigate, role]);
  async function signOut() { try { await logout(); navigate('/'); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to log out'); } }
  async function changeEnquiry(id:string,status:string) { try { await updateEnquiry(id,status); await loadData(role); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update enquiry'); } }
  async function changeVisit(id:string,status:string) { try { await updateVisit(id,{status}); await loadData(role); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update visit'); } }
  if (!user) return <main className="page simple"><p>Loading your dashboard…</p></main>;

  const labels = role === 'OWNER' ? ['Active listings','New enquiries','Upcoming visits'] : ['Saved properties','Visit requests','Enquiries'];
  return <main className="page dashboard"><div className="dashboard-head"><div><span className="kicker">{role === 'OWNER' ? 'Owner dashboard' : 'Tenant dashboard'}</span><h1>Welcome, {user.name}</h1><p>{role === 'OWNER' ? 'Manage listings and respond to tenant interest.' : 'Keep track of properties, visits and rental activity.'}</p></div><button className="button small" onClick={signOut}>Log out</button></div>
    {error && <div className="error" role="alert">{error}</div>}
    <section className="stat-grid"><article className="stat"><strong>{stats.primary}</strong><span>{labels[0]}</span></article><article className="stat"><strong>{stats.secondary}</strong><span>{labels[1]}</span></article><article className="stat"><strong>{stats.tertiary}</strong><span>{labels[2]}</span></article></section>
    {role === 'TENANT' && <section className="dashboard-panel"><div className="panel-head"><h2>Saved properties</h2><Link to="/properties">Find more</Link></div>{favorites.length === 0 ? <p>No saved properties yet.</p> : <div className="activity-list">{favorites.slice(0,5).map(f => <article className="activity" key={f.id}><div><strong>{f.property.title}</strong><p>{f.property.areaName}, {f.property.city}</p></div><Link className="button ghost small" to={`/properties/${f.propertyId}`}>View</Link></article>)}</div>}</section>}
    {role === 'OWNER' && <section className="dashboard-panel"><div className="panel-head"><h2>Your listings</h2><Link className="button small" to="/owner/properties/new">Post property</Link></div>{properties.length === 0 ? <p>No properties yet.</p> : <div className="activity-list">{properties.slice(0,5).map(p => <article className="activity" key={p.id}><div><strong>{p.title}</strong><p>{p.areaName}, {p.city} · ₹{Number(p.rent).toLocaleString('en-IN')}/month</p><small>Status: {p.status}</small></div><Link className="button ghost small" to={`/properties/${p.id}`}>View</Link></article>)}</div>}</section>}
    <section className="dashboard-panel"><h2>{role === 'OWNER' ? 'Recent tenant activity' : 'Your rental activity'}</h2>{enquiries.length === 0 && visits.length === 0 ? <p>No activity yet. {role === 'OWNER' ? 'Share a listing to start receiving interest.' : 'Browse properties to get started.'}</p> : <div className="activity-list">{enquiries.slice(0,5).map(e => <article className="activity" key={`e-${e.id}`}><div><strong>Enquiry · {e.property.title}</strong><p>{e.message}</p><small>Status: {e.status}</small></div>{role === 'OWNER' && e.status === 'NEW' && <div className="action-row"><button className="button small" onClick={() => changeEnquiry(e.id,'CONTACTED')}>Mark contacted</button><button className="button ghost small" onClick={() => changeEnquiry(e.id,'RESOLVED')}>Resolve</button></div>}</article>)}{visits.slice(0,5).map(v => <article className="activity" key={`v-${v.id}`}><div><strong>Visit · {v.property.title}</strong><p>{new Date(v.requestedDate).toLocaleDateString('en-IN')} at {v.requestedTime}</p><small>Status: {v.status}</small></div>{role === 'OWNER' && v.status === 'PENDING' && <div className="action-row"><button className="button small" onClick={() => changeVisit(v.id,'ACCEPTED')}>Accept</button><button className="button ghost small" onClick={() => changeVisit(v.id,'REJECTED')}>Reject</button></div>}{role === 'TENANT' && !['CANCELLED','COMPLETED'].includes(v.status) && <button className="button ghost small" onClick={() => changeVisit(v.id,'CANCELLED')}>Cancel</button>}</article>)}</div>}</section>
  </main>;
}
