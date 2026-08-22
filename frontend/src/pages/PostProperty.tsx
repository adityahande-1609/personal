import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Home, MapPin, WalletCards } from 'lucide-react';
import { getOwnerProperties, createOwnerProperty, updateOwnerProperty } from '../services/ownerApi';
import '../post-property.css';

const emptyForm = { title:'', description:'', propertyType:'Apartment', rent:'', deposit:'', maintenance:'', brokerage:'', bedrooms:'2', bathrooms:'2', area:'', furnishing:'Semi-furnished', address:'', areaName:'', city:'Pune', state:'Maharashtra', pincode:'', floor:'', totalFloors:'', propertyAge:'', availableFrom:'' };
type FormState = typeof emptyForm;

function propertyToForm(property: any): FormState {
  return Object.keys(emptyForm).reduce((form, key) => ({ ...form, [key]: property[key] == null ? '' : String(property[key]) }), { ...emptyForm });
}

export default function PostProperty() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(editing);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>({ ...emptyForm });

  useEffect(() => {
    if (!id) return;
    let active = true;
    getOwnerProperties().then(({ data }) => {
      const property = data.find(item => item.id === id);
      if (!property) throw new Error('Property not found');
      if (active) { setForm(propertyToForm(property)); setBusy(false); }
    }).catch(err => { if (active) { setError(err instanceof Error ? err.message : 'Unable to load property'); setBusy(false); } });
    return () => { active = false; };
  }, [id]);

  const update = (key: keyof FormState, value: string) => setForm(current => ({ ...current, [key]: value }));
  const next = () => { setError(''); setStep(s => Math.min(4, s + 1)); };
  const back = () => { setError(''); setStep(s => Math.max(1, s - 1)); };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 4) return next();
    setBusy(true); setError('');
    try {
      if (editing && id) await updateOwnerProperty(id, form);
      else await createOwnerProperty(form);
      navigate('/owner/dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : editing ? 'Unable to update property' : 'Unable to create property'); }
    finally { setBusy(false); }
  }

  const steps=[{name:'Basics',icon:<Home size={16}/>},{name:'Location',icon:<MapPin size={16}/>},{name:'Details',icon:<WalletCards size={16}/>},{name:'Review',icon:<Check size={16}/>}];
  if (busy && editing) return <main className="page simple"><p>Loading property…</p></main>;

  return <main className="page post-page"><div className="post-hero"><div><span className="kicker">Owner workspace</span><h1>{editing ? 'Update your property.' : 'List a property people will love.'}</h1><p>{editing ? 'Update the listing details and save your changes.' : 'Create a clear, trustworthy listing in four simple steps. You can review everything before saving.'}</p></div><div className="post-hero-card"><Home size={22}/><strong>{editing ? 'Keep it current.' : 'Ready to rent?'}</strong><span>{editing ? 'Accurate listings build tenant confidence.' : 'Let\'s make your property stand out.'}</span></div></div>
    <div className="post-progress">{steps.map((item,i)=><div className={`progress-step ${step===i+1?'active':''} ${step>i+1?'done':''}`} key={item.name}><span>{step>i+1?<Check size={15}/>:item.icon}</span><small>{item.name}</small></div>)}</div>
    <form className="property-form polished-form" onSubmit={submit}>
      {error && <div className="error" role="alert">{error}</div>}
      {step===1 && <section><div className="form-section-title"><div><span className="kicker">Step 1 of 4</span><h2>Tell us about the property</h2><p>Start with the information tenants will notice first.</p></div></div><label>Listing title<input required minLength={3} value={form.title} onChange={e=>update('title',e.target.value)} placeholder="Bright 2 BHK near Hinjawadi" /></label><label>Description<textarea required minLength={20} value={form.description} onChange={e=>update('description',e.target.value)} rows={7} placeholder="Describe the home, neighbourhood, nearby transport, amenities and anything a tenant should know." /></label><label>Property type<select value={form.propertyType} onChange={e=>update('propertyType',e.target.value)}><option>Apartment</option><option>Flat</option><option>House</option><option>Studio</option><option>PG</option><option>Room</option><option>Shared Room</option><option>Commercial</option></select></label></section>}
      {step===2 && <section><div className="form-section-title"><div><span className="kicker">Step 2 of 4</span><h2>Where is it located?</h2><p>A precise location helps the right tenants find your listing.</p></div></div><label>Full address<input required value={form.address} onChange={e=>update('address',e.target.value)} placeholder="Building, street and locality" /></label><div className="form-grid"><label>Area<input required value={form.areaName} onChange={e=>update('areaName',e.target.value)} placeholder="Wakad" /></label><label>City<input required value={form.city} onChange={e=>update('city',e.target.value)} /></label><label>State<input required value={form.state} onChange={e=>update('state',e.target.value)} /></label><label>PIN code<input required pattern="[0-9]{6}" inputMode="numeric" value={form.pincode} onChange={e=>update('pincode',e.target.value)} placeholder="411057" /></label></div></section>}
      {step===3 && <section><div className="form-section-title"><div><span className="kicker">Step 3 of 4</span><h2>Pricing & property details</h2><p>Give tenants the practical numbers they need.</p></div></div><div className="form-grid"><label>Monthly rent<input required type="number" min="1" value={form.rent} onChange={e=>update('rent',e.target.value)} placeholder="25000" /></label><label>Security deposit<input type="number" min="0" value={form.deposit} onChange={e=>update('deposit',e.target.value)} placeholder="50000" /></label><label>Bedrooms<input required type="number" min="0" value={form.bedrooms} onChange={e=>update('bedrooms',e.target.value)} /></label><label>Bathrooms<input required type="number" min="1" value={form.bathrooms} onChange={e=>update('bathrooms',e.target.value)} /></label><label>Area (sq ft)<input type="number" min="1" value={form.area} onChange={e=>update('area',e.target.value)} placeholder="1100" /></label><label>Furnishing<select value={form.furnishing} onChange={e=>update('furnishing',e.target.value)}><option>Unfurnished</option><option>Semi-furnished</option><option>Fully furnished</option></select></label><label>Available from<input required type="date" value={form.availableFrom.slice(0,10)} onChange={e=>update('availableFrom',e.target.value)} /></label></div></section>}
      {step===4 && <section><div className="form-section-title"><div><span className="kicker">Final step</span><h2>{editing ? 'Review your changes' : 'Review your listing'}</h2><p>{editing ? 'Check the updated details before saving.' : 'Everything looks good? Save it as a draft and continue from your dashboard.'}</p></div></div><div className="property-preview"><div className="preview-image"><Home size={30}/></div><div className="preview-content"><span className="preview-type">{form.propertyType}</span><h3>{form.title || 'Untitled property'}</h3><p>{form.areaName || 'Area'}, {form.city || 'City'} · {form.bedrooms} bed · {form.bathrooms} bath</p><strong>₹{form.rent || '—'} <small>/month</small></strong><div className="preview-facts"><span>{form.furnishing}</span>{form.area && <span>{form.area} sq ft</span>}<span>Available {form.availableFrom || '—'}</span></div></div></div>{!editing && <div className="review-note"><Check size={17}/><span>Your listing will be saved as a <strong>draft</strong>. It remains unavailable to public search until it is activated and verified.</span></div>}</section>}
      <div className="form-actions">{step>1 && <button type="button" className="button ghost" onClick={back}><ArrowLeft size={16}/> Back</button>}<button className="button" disabled={busy}>{busy?'Saving…':editing?'Save changes':step===4?'Save draft':'Continue'}{!busy && step<4 && <ArrowRight size={16}/>}</button></div>
    </form>
  </main>;
}
