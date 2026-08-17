import {FormEvent, useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {login, register} from '../services/api';

export default function Auth({register: isRegister=false}:{register?:boolean}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'TENANT'|'OWNER'>('TENANT');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = isRegister
        ? await register({name, email, password, role})
        : await login({email, password});
      const destination = result.user.role === 'OWNER' ? '/owner/dashboard' : '/tenant/dashboard';
      navigate((location.state as {from?: string} | null)?.from || destination, {replace: true});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete the request');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth">
    <form className="auth-card" onSubmit={submit} noValidate>
      <span className="kicker">Rentwise</span>
      <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p>{isRegister ? 'Start finding or managing rental properties.' : 'Log in to continue your rental journey.'}</p>
      {error && <div className="error" role="alert">{error}</div>}
      {isRegister && <>
        <label>Full name<input required value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Your name" /></label>
        <label>Account type<select value={role} onChange={e => setRole(e.target.value as 'TENANT'|'OWNER')}><option value="TENANT">I am looking for a property</option><option value="OWNER">I want to list a property</option></select></label>
      </>}
      <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
      <label>Password<input required type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>
      <button className="button full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</button>
      <p>{isRegister ? 'Already have an account? ' : 'New here? '}<Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p>
    </form>
  </main>;
}
