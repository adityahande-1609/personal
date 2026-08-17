import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOwnerProperty } from '../services/api';

export default function PostProperty() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title:'', description:'', propertyType:'Apartment', rent:'', deposit:'', maintenance:'', brokerage:'', bedrooms:'2', bathrooms:'2', area:'', furnishing:'Semi-furnished', address:'', areaName:'', city:'Pune', state:'Maharashtra', pincode:'', floor:'', totalFloors:'', propertyAge:'', availableFrom:'' });
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const next = () => { setError(''); setStep(s => Math.min(4, s + 1)); };
  const back = () => setStep(s => Math.max(1, s - 1));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 4) return next();
    setBusy(true); setError('');
    try { const result = await createOwnerProperty(form); navigate(`/owner/properties/${result.data.id}/edit`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to create property'); }
    finally { setBusy(false); }
  }
  return <main className="page form-page"><span className="kicker">Owner workspace</span><h1>Post your property</h1><p className="muted">Create a listing in a few focused steps. New listings enter review before becoming public.</p><div className="steps">{['Basics','Location','Details','Review'].map((label,i)=><span className={step===i+1?'active':''} key={label}>{i+1}. {label}</span>)}</div>
    <form className="property-form" onSubmit={submit}>
      {error && <div className="error" role="alert">{error}</div>}
      {step===1 && <section><h2>Basic information</h2><label>Listing title<input required minLength={3} value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Bright 2 BHK near Hinjawadi" /></label><label>Description<textarea required minLength={20} value={form.description} onChange={e=>update('description',e.target.value)} rows={6} /></label><label>Property type<select value={form.propertyType} onChange={e=>update('propertyType',e.target.value)}><option>Apartment</option><option>Flat</option><option>House</option><option>Studio</option><option>PG</option><option>Room</option><option>Shared Room</option><option>Commercial</option></select></label></section>}
      {step===2 && <section><h2>Location</h2><label>Address<input required value={form.address} onChange={e=>update('address',e.target.value)} /></label><div className="form-grid"><label>Area<input required value={form.areaName} onChange={e=>update('areaName',e.target.value)} /></label><label>City<input required value={form.city} onChange={e=>update('city',e.target.value)} /></label><label>State<input required value={form.state} onChange={e=>update('state',e.target.value)} /></label><label>PIN code<input required pattern="[0-9]{6}" inputMode="numeric" value={form.pincode} onChange={e=>update('pincode',e.target.value)} /></label></div></section>}
      {step===3 && <section><h2>Property & pricing</h2><div className="form-grid"><label>Monthly rent<input required type="number" min="1" value={form.rent} onChange={e=>update('rent',e.target.value)} /></label><label>Security deposit<input type="number" min="0" value={form.deposit} onChange={e=>update('deposit',e.target.value)} /></label><label>Bedrooms<input required type="number" min="0" value={form.bedrooms} onChange={e=>update('bedrooms',e.target.value)} /></label><label>Bathrooms<input required type="number" min="1" value={form.bathrooms} onChange={e=>update('bathrooms',e.target.value)} /></label><label>Area (sq ft)<input type="number" min="1" value={form.area} onChange={e=>update('area',e.target.value)} /></label><label>Furnishing<select value={form.furnishing} onChange={e=>update('furnishing',e.target.value)}><option>Unfurnished</option><option>Semi-furnished</option><option>Fully furnished</option></select></label><label>Available from<input required type="date" value={form.availableFrom} onChange={e=>update('availableFrom',e.target.value)} /></label></div></section>}
      {step===4 && <section><h2>Review before saving</h2><div className="preview"><h3>{form.title || 'Untitled property'}</h3><p>{form.description}</p><strong>₹{form.rent || '—'} / month</strong><p>{form.bedrooms} bedrooms · {form.bathrooms} bathrooms · {form.furnishing}</p><p>{form.areaName}, {form.city}, {form.state} {form.pincode}</p></div><p className="muted">The listing will be saved as a draft and remain unavailable to public search until it is activated and verified.</p></section>}
      <div className="form-actions">{step>1 && <button type="button" className="button secondary" onClick={back}>Back</button>}<button className="button" disabled={busy}>{busy?'Saving…':step===4?'Save draft':'Continue'}</button></div>
    </form>
  </main>;
}
