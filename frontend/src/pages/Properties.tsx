import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProperties, Property } from '../services/api';

export default function Properties() {
  const [params] = useSearchParams();
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    getProperties(params)
      .then(data => { if (!cancelled) setList(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load properties'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.toString()]);

  return <main className="page">
    <span className="kicker">Property marketplace</span>
    <h1>Find your next home.</h1>
    {loading && <p>Loading verified homes…</p>}
    {error && <div className="empty"><h2>We couldn't load the homes.</h2><p>{error}</p><Link className="button" to="/properties">Try again</Link></div>}
    {!loading && !error && <>
      <p>{list.length} homes matching your search.</p>
      <div className="property-grid">{list.map(x => {
        const image = x.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80';
        return <article className="property-card" key={x.id}>
          <img src={image} alt={x.title} />
          <div><b>₹{Number(x.rent).toLocaleString('en-IN')}<small>/month</small></b>
            <h3>{x.title}</h3><p>{x.areaName}, {x.city} · {x.bedrooms} bed · {x.bathrooms} bath</p>
            <span className="tag">✓ Verified</span><Link to={'/properties/'+x.id}>View details →</Link>
          </div>
        </article>;
      })}</div>
      {!list.length && <div className="empty"><h2>No homes matched those filters.</h2><Link className="button" to="/properties">Reset filters</Link></div>}
    </>}
  </main>;
}
