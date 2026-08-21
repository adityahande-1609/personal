import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {ArrowRight, CalendarDays, CheckCircle2, Heart, Home, LogOut, MessageCircle, Plus, Search, ShieldCheck} from 'lucide-react';
import {getCurrentUser, getEnquiries, getFavorites, getVisits, logout, updateEnquiry, updateVisit, User} from '../services/api';
import {getOwnerProperties} from '../services/ownerApi';
import '../dashboard.css';

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
      setStats({ primary: ownerProperties.data.filter(p => p.status === 'ACTIVE').length, secondary: nextEnquiries.filter(e => e.status === 'OPEN').length, tertiary: nextVisits.filter(v => ['PENDING','ACCEPTED','RESCHEDULE_REQUESTED'].includes(v.status)).length });
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

  const owner = role === 'OWNER';
  const labels = owner ? ['Active listings','Open enquiries','Upcoming visits'] : ['Saved properties','Visit requests','Enquiries'];
  const statIcons = owner ? [<Home size={19}/>,<MessageCircle size={19}/>,<CalendarDays size={19}/>] : [<Heart size={19}/>,<CalendarDays size={19}/>,<MessageCircle size={19}/>];

  return <main className="page dashboard">
    <div className="dashboard-head"><div className="welcome"><div className="avatar">{user.name.charAt(0).toUpperCase()}</div><div><span className="kicker">{owner ? 'Owner dashboard' : 'Tenant dashboard'}</span><h1>Welcome, {user.name}</h1><p>{owner ? 'Your rental portfolio, enquiries and visits — all in one place.' : 'Keep track of homes, visits and everything happening on your rental journey.'}</p></div></div><button className="button ghost small logout-button" onClick={signOut}><LogOut size={15}/> Log out</button></div>
    {error && <div className="error" role="alert">{error}</div>}
    <section className="stat-grid">{labels.map((label,i)=><article className="stat" key={label}><div className="stat-icon">{statIcons[i]}</div><div><strong>{stats[i===0?'primary':i===1?'secondary':'tertiary']}</strong><span>{label}</span></div></article>)}</section>
    {owner && <section className="dashboard-panel listings-panel"><div className="panel-head"><div><span className="kicker">Your portfolio</span><h2>Your listings</h2></div><Link className="button small" to="/owner/properties/new"><Plus size={16}/> Post property</Link></div>{properties.length === 0 ? <div className="dashboard-empty"><div className="empty-icon"><Home size={24}/></div><h3>Your first listing starts here.</h3><p>Add a property and start connecting with people looking for a home.</p><Link className="button" to="/owner/properties/new"><Plus size={16}/> List a property</Link></div> : <div className="listing-mini-grid">{properties.slice(0,6).map(p => { const image=p.images?.[0]?.imageUrl; return <article className="listing-mini" key={p.id}>{image ? <img src={image} alt=""/> : <div className="listing-placeholder"><Home size={26}/></div>}<div className="listing-mini-body"><div className="listing-status"><span className={`status status-${String(p.status).toLowerCase()}`}>{p.status}</span><span>{p.verificationStatus === 'VERIFIED' ? 'Verified' : 'Under review'}</span></div><h3>{p.title}</h3><p>{p.areaName}, {p.city}</p><strong>₹{Number(p.rent).toLocaleString('en-IN')}<small>/month</small></strong><Link to={`/properties/${p.id}`}>View property <ArrowRight size={14}/></Link></div></article>; })}</div>}</section>}
    {!owner && <section className="dashboard-panel"><div className="panel-head"><div><span className="kicker">Your shortlist</span><h2>Saved properties</h2></div><Link to="/properties">Find more <ArrowRight size={14}/></Link></div>{favorites.length === 0 ? <div className="dashboard-empty compact"><div className="empty-icon"><Heart size={22}/></div><h3>No saved homes yet.</h3><p>Save properties you like and they'll appear here.</p><Link className="button" to="/properties"><Search size={16}/> Browse homes</Link></div> : <div className="activity-list">{favorites.slice(0,5).map(f => <article className="activity" key={f.id}><div><strong>{f.property.title}</strong><p>{f.property.areaName}, {f.property.city}</p></div><Link className="button ghost small" to={`/properties/${f.propertyId}`}>View</Link></article>)}</div>}</section>}
    <section className="dashboard-panel"><div className="panel-head"><div><span className="kicker">Latest updates</span><h2>{owner ? 'Recent tenant activity' : 'Your rental activity'}</h2></div></div>{enquiries.length === 0 && visits.length === 0 ? <div className="dashboard-empty compact"><div className="empty-icon"><CheckCircle2 size={22}/></div><h3>You're all caught up.</h3><p>{owner ? 'Share a listing to start receiving tenant interest.' : 'Browse properties and send an enquiry or visit request when you find the right place.'}</p></div> : <div className="activity-list">{enquiries.slice(0,5).map(e => <article className="activity" key={`e-${e.id}`}><div className="activity-icon"><MessageCircle size={17}/></div><div className="activity-content"><strong>Enquiry · {e.property.title}</strong><p>{e.message}</p><small>Status: {e.status}</small></div>{owner && e.status === 'OPEN' && <div className="action-row"><button className="button small" onClick={() => changeEnquiry(e.id,'RESPONDED')}>Mark responded</button><button className="button ghost small" onClick={() => changeEnquiry(e.id,'RESOLVED')}>Resolve</button></div>}</article>)}{visits.slice(0,5).map(v => <article className="activity" key={`v-${v.id}`}><div className="activity-icon"><CalendarDays size={17}/></div><div className="activity-content"><strong>Visit · {v.property.title}</strong><p>{new Date(v.requestedDate).toLocaleDateString('en-IN')} at {v.requestedTime}</p><small>Status: {v.status}</small></div>{owner && v.status === 'PENDING' && <div className="action-row"><button className="button small" onClick={() => changeVisit(v.id,'ACCEPTED')}>Accept</button><button className="button ghost small" onClick={() => changeVisit(v.id,'REJECTED')}>Reject</button></div>}{!owner && !['CANCELLED','COMPLETED'].includes(v.status) && <button className="button ghost small" onClick={() => changeVisit(v.id,'CANCELLED')}>Cancel</button>}</article>)}</div>}</section>
    <div className="dashboard-tip"><ShieldCheck size={20}/><div><strong>Rentwise keeps the important bits together.</strong><p>Keep your listings, conversations and visits up to date so every rental step stays clear.</p></div></div>
  </main>;
}
