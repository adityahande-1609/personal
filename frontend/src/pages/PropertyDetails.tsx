import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, MapPin, Heart } from 'lucide-react';
import { addFavorite, createEnquiry, createVisit, getCurrentUser, getFavorites, getProperty, Property } from '../services/api';

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00');
  const [busy, setBusy] = useState(false);
  const [favourite, setFavourite] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProperty(id).then(setProperty).catch(err => setError(err instanceof Error ? err.message : 'Unable to load property'));
    getCurrentUser().then(({ user }) => {
      if (user.role === 'TENANT') getFavorites().then(items => setFavourite(items.some(item => item.propertyId === id))).catch(() => undefined);
    }).catch(() => undefined);
  }, [id]);

  async function saveFavourite() {
    if (!id) return;
    setBusy(true); setMessage('');
    try { await addFavorite(id); setFavourite(true); setMessage('Property saved to your favourites.'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Please log in as a tenant to save properties.'); }
    finally { setBusy(false); }
  }

  async function sendEnquiry(event: React.FormEvent) {
    event.preventDefault(); if (!id || !enquiryMessage.trim()) return;
    setBusy(true); setMessage('');
    try { await createEnquiry({ propertyId: id, message: enquiryMessage.trim() }); setEnquiryMessage(''); setEnquiryOpen(false); setMessage('Your enquiry has been sent to the owner.'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to send enquiry.'); }
    finally { setBusy(false); }
  }

  async function requestVisit(event: React.FormEvent) {
    event.preventDefault(); if (!id || !visitDate) return;
    setBusy(true); setMessage('');
    try { await createVisit({ propertyId: id, requestedDate: visitDate, requestedTime: visitTime }); setVisitOpen(false); setMessage('Visit request sent. The owner will respond through the platform.'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to request visit.'); }
    finally { setBusy(false); }
  }

  if (error) return <main className="page"><Link to="/properties">← Back to properties</Link><div className="empty"><h2>{error}</h2><Link className="button" to="/properties">Browse homes</Link></div></main>;
  if (!property) return <main className="page"><p>Loading property…</p></main>;

  const image = property.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80';
  return <main className="page details"><Link to="/properties">← Back to properties</Link><div className="detail-grid"><div><img className="detail-img" src={image} alt={property.title}/><h2>About this home</h2><p>{property.description}</p></div><aside><span className="tag"><ShieldCheck size={14}/> Verified property</span><h1>{property.title}</h1><p><MapPin size={15}/> {property.areaName}, {property.city}</p><strong className="big-price">₹{Number(property.rent).toLocaleString('en-IN')}<small>/month</small></strong><div className="specs"><span>{property.bedrooms} Bedrooms</span><span>{property.bathrooms} Bathrooms</span>{property.furnishing && <span>{property.furnishing}</span>}</div>
    {message && <div className="success" role="status">{message}</div>}
    <div className="action-row"><button className="button ghost" type="button" onClick={saveFavourite} disabled={busy || favourite}><Heart size={16} fill={favourite ? 'currentColor' : 'none'}/> {favourite ? 'Saved' : 'Save'}</button><button className="button" type="button" onClick={() => setEnquiryOpen(v => !v)}>Send enquiry</button></div>
    <button className="button ghost full" type="button" onClick={() => setVisitOpen(v => !v)}>Request a visit</button>
    {enquiryOpen && <form className="inline-form" onSubmit={sendEnquiry}><label>Message<textarea value={enquiryMessage} onChange={e => setEnquiryMessage(e.target.value)} required maxLength={1000} placeholder="Tell the owner what you'd like to know…"/></label><button className="button full" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'}</button></form>}
    {visitOpen && <form className="inline-form" onSubmit={requestVisit}><label>Date<input type="date" value={visitDate} min={new Date().toISOString().slice(0,10)} onChange={e => setVisitDate(e.target.value)} required/></label><label>Preferred time<input type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)} required/></label><button className="button full" disabled={busy}>{busy ? 'Sending…' : 'Request visit'}</button></form>}
  </aside></div></main>;
}
