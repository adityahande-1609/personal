import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, MapPin } from 'lucide-react';
import { getProperty, Property } from '../services/api';

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getProperty(id).then(setProperty).catch(err => setError(err instanceof Error ? err.message : 'Unable to load property'));
  }, [id]);

  if (error) return <main className="page"><Link to="/properties">← Back to properties</Link><div className="empty"><h2>{error}</h2><Link className="button" to="/properties">Browse homes</Link></div></main>;
  if (!property) return <main className="page"><p>Loading property…</p></main>;

  const image = property.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80';
  return <main className="page details"><Link to="/properties">← Back to properties</Link><div className="detail-grid"><div><img className="detail-img" src={image} alt={property.title}/><h2>About this home</h2><p>{property.description}</p></div><aside><span className="tag"><ShieldCheck size={14}/> Verified property</span><h1>{property.title}</h1><p><MapPin size={15}/> {property.areaName}, {property.city}</p><strong className="big-price">₹{Number(property.rent).toLocaleString('en-IN')}<small>/month</small></strong><div className="specs"><span>{property.bedrooms} Bedrooms</span><span>{property.bathrooms} Bathrooms</span>{property.furnishing && <span>{property.furnishing}</span>}</div><button className="button full" type="button">Send enquiry</button><button className="button ghost full" type="button">Request a visit</button></aside></div></main>;
}
