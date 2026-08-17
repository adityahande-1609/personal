import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {getCurrentUser, getEnquiries, getFavorites, getVisits, logout, User} from '../services/api';
import {getOwnerProperties} from '../services/ownerApi';

export default function Dashboard({role}:{role:'OWNER'|'TENANT'}) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({primary:0, secondary:0, tertiary:0});
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentUser().then(async ({user}) => {
      if (user.role !== role) { navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/tenant/dashboard', {replace:true}); return; }
      setUser(user);
      try {
        if (role === 'OWNER') {
          const [properties, enquiries, visits] = await Promise.all([getOwnerProperties(), getEnquiries(), getVisits()]);
          setStats({ primary: properties.data.filter(p => p.status === 'ACTIVE').length, secondary: enquiries.filter(e => e.status === 'NEW').length, tertiary: visits.filter(v => ['PENDING','ACCEPTED','RESCHEDULE_REQUESTED'].includes(v.status)).length });
        } else {
          const [favorites, enquiries, visits] = await Promise.all([getFavorites(), getEnquiries(), getVisits()]);
          setStats({ primary: favorites.length, secondary: visits.filter(v => ['PENDING','ACCEPTED','RESCHEDULE_REQUESTED'].includes(v.status)).length, tertiary: enquiries.length });
        }
      } catch { setError('Unable to load your latest dashboard statistics'); }
    }).catch(() => navigate('/login', {replace:true, state:{from: role === 'OWNER' ? '/owner/dashboard' : '/tenant/dashboard'}}));
  }, [navigate, role]);

  async function signOut() { try { await logout(); navigate('/'); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to log out'); } }
  if (!user) return <main className="page simple"><p>Loading your dashboard…</p></main>;

  const labels = role === 'OWNER' ? ['Active listings','New enquiries','Upcoming visits'] : ['Saved properties','Visit requests','Enquiries'];
  return <main className="page dashboard">
    <div className="dashboard-head"><div><span className="kicker">{role === 'OWNER' ? 'Owner dashboard' : 'Tenant dashboard'}</span><h1>Welcome, {user.name}</h1><p>{role === 'OWNER' ? 'Manage your listings and respond to tenant interest.' : 'Keep track of properties, visits and rental activity.'}</p></div><button className="button small" onClick={signOut}>Log out</button></div>
    {error && <div className="error" role="alert">{error}</div>}
    <section className="stat-grid">
      <article className="stat"><strong>{stats.primary}</strong><span>{labels[0]}</span></article>
      <article className="stat"><strong>{stats.secondary}</strong><span>{labels[1]}</span></article>
      <article className="stat"><strong>{stats.tertiary}</strong><span>{labels[2]}</span></article>
    </section>
    <section className="dashboard-panel"><h2>Get started</h2>{role === 'OWNER' ? <p><Link className="button" to="/owner/properties/new">Post a property</Link></p> : <p><Link className="button" to="/properties">Find a property</Link></p>}</section>
  </main>;
}
