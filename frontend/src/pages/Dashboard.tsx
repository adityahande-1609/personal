import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {getCurrentUser, logout, User} from '../services/api';
import {getOwnerProperties} from '../services/ownerApi';

export default function Dashboard({role}:{role:'OWNER'|'TENANT'}) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [ownerCount, setOwnerCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentUser().then(async ({user}) => {
      if (user.role !== role) { navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/tenant/dashboard', {replace:true}); return; }
      setUser(user);
      if (role === 'OWNER') {
        try { const result = await getOwnerProperties(); setOwnerCount(result.data.filter(p => p.status === 'ACTIVE').length); }
        catch { setError('Unable to load your property statistics'); }
      }
    }).catch(() => navigate('/login', {replace:true, state:{from: role === 'OWNER' ? '/owner/dashboard' : '/tenant/dashboard'}}));
  }, [navigate, role]);

  async function signOut() { try { await logout(); navigate('/'); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to log out'); } }
  if (!user) return <main className="page simple"><p>Loading your dashboard…</p></main>;

  return <main className="page dashboard">
    <div className="dashboard-head"><div><span className="kicker">{role === 'OWNER' ? 'Owner dashboard' : 'Tenant dashboard'}</span><h1>Welcome, {user.name}</h1><p>{role === 'OWNER' ? 'Manage your listings and respond to tenant interest.' : 'Keep track of properties, visits and rental activity.'}</p></div><button className="button small" onClick={signOut}>Log out</button></div>
    {error && <div className="error" role="alert">{error}</div>}
    <section className="stat-grid">
      <article className="stat"><strong>{role === 'OWNER' ? ownerCount : 0}</strong><span>{role === 'OWNER' ? 'Active listings' : 'Saved properties'}</span></article>
      <article className="stat"><strong>0</strong><span>{role === 'OWNER' ? 'New enquiries' : 'Visit requests'}</span></article>
      <article className="stat"><strong>0</strong><span>{role === 'OWNER' ? 'Upcoming visits' : 'Agreement requests'}</span></article>
    </section>
    <section className="dashboard-panel"><h2>Get started</h2>{role === 'OWNER' ? <p><Link className="button" to="/owner/properties/new">Post your first property</Link></p> : <p><Link className="button" to="/properties">Find a property</Link></p>}</section>
  </main>;
}
