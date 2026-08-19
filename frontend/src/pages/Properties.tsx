import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { getProperties, Property } from '../services/api';

export default function Properties() {
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({
    city: params.get('city') || '',
    area: params.get('area') || '',
    minRent: params.get('minRent') || '',
    maxRent: params.get('maxRent') || '',
    propertyType: params.get('propertyType') || '',
    bedrooms: params.get('bedrooms') || '',
    furnishing: params.get('furnishing') || ''
  }));

  useEffect(() => {
    setDraft({ city: params.get('city') || '', area: params.get('area') || '', minRent: params.get('minRent') || '', maxRent: params.get('maxRent') || '', propertyType: params.get('propertyType') || '', bedrooms: params.get('bedrooms') || '', furnishing: params.get('furnishing') || '' });
    let cancelled = false;
    setLoading(true); setError('');
    getProperties(params)
      .then(data => { if (!cancelled) setList(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load properties'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.toString()]);

  const activeCount = useMemo(() => Array.from(params.keys()).filter(key => ['city','area','minRent','maxRent','propertyType','bedrooms','furnishing'].includes(key)).length, [params]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    Object.entries(draft).forEach(([key, value]) => { if (value.trim()) next.set(key, value.trim()); });
    setParams(next);
    setFiltersOpen(false);
  }

  function clearFilters() {
    setParams({});
    setFiltersOpen(false);
  }

  return <main className="page">
    <div className="listing-heading"><div><span className="kicker">Property marketplace</span><h1>Find your next home.</h1><p>Search by location, budget and home preferences.</p></div><button className="button ghost filter-toggle" type="button" onClick={() => setFiltersOpen(v => !v)}><SlidersHorizontal size={17}/> Filters {activeCount > 0 && <span className="filter-count">{activeCount}</span>}</button></div>

    <form className={`filters ${filtersOpen ? 'open' : ''}`} onSubmit={applyFilters}>
      <div className="filter-header"><strong>Refine your search</strong><button type="button" className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={18}/></button></div>
      <div className="filter-grid">
        <label>City<input value={draft.city} onChange={e => setDraft({...draft, city:e.target.value})} placeholder="Pune" /></label>
        <label>Area<input value={draft.area} onChange={e => setDraft({...draft, area:e.target.value})} placeholder="Wakad" /></label>
        <label>Minimum rent<input type="number" min="0" step="500" value={draft.minRent} onChange={e => setDraft({...draft, minRent:e.target.value})} placeholder="₹10,000" /></label>
        <label>Maximum rent<input type="number" min="0" step="500" value={draft.maxRent} onChange={e => setDraft({...draft, maxRent:e.target.value})} placeholder="₹30,000" /></label>
        <label>Property type<select value={draft.propertyType} onChange={e => setDraft({...draft, propertyType:e.target.value})}><option value="">Any type</option><option value="APARTMENT">Apartment</option><option value="FLAT">Flat</option><option value="HOUSE">House</option><option value="STUDIO">Studio</option><option value="PG">PG</option><option value="ROOM">Room</option></select></label>
        <label>Bedrooms<select value={draft.bedrooms} onChange={e => setDraft({...draft, bedrooms:e.target.value})}><option value="">Any</option><option value="1">1 BHK</option><option value="2">2 BHK</option><option value="3">3 BHK</option><option value="4">4+ BHK</option></select></label>
        <label>Furnishing<select value={draft.furnishing} onChange={e => setDraft({...draft, furnishing:e.target.value})}><option value="">Any</option><option value="UNFURNISHED">Unfurnished</option><option value="SEMI_FURNISHED">Semi-furnished</option><option value="FULLY_FURNISHED">Fully furnished</option></select></label>
      </div>
      <div className="filter-actions"><button className="button ghost" type="button" onClick={clearFilters}>Clear all</button><button className="button" type="submit"><Search size={16}/> Apply filters</button></div>
    </form>

    {loading && <div className="loading-grid" aria-label="Loading properties"><span/><span/><span/></div>}
    {error && <div className="empty"><h2>We couldn't load the homes.</h2><p>{error}</p><button className="button" onClick={() => setParams(new URLSearchParams(params))}>Try again</button></div>}
    {!loading && !error && <>
      <div className="results-bar"><p><strong>{list.length}</strong> homes matching your search.</p>{activeCount > 0 && <button className="clear-link" onClick={clearFilters}>Clear filters</button>}</div>
      <div className="property-grid">{list.map(x => {
        const image = x.images[0]?.imageUrl || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80';
        return <article className="property-card" key={x.id}>
          <img src={image} alt={x.title} loading="lazy" />
          <div><b>₹{Number(x.rent).toLocaleString('en-IN')}<small>/month</small></b><h3>{x.title}</h3><p>{x.areaName}, {x.city} · {x.bedrooms} bed · {x.bathrooms} bath</p><span className="tag">✓ Verified</span><Link to={'/properties/'+x.id}>View details →</Link></div>
        </article>;
      })}</div>
      {!list.length && <div className="empty"><h2>No homes matched those filters.</h2><p>Try widening your budget or removing a preference.</p><button className="button" onClick={clearFilters}>Reset filters</button></div>}
    </>}
  </main>;
}
