import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { properties } from './data';

export default function Home() {
  const nav = useNavigate();
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (propertyType) params.set('propertyType', propertyType);
    if (maxRent) params.set('maxRent', maxRent);
    if (bedrooms) params.set('bedrooms', bedrooms);
    nav(`/properties${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return <main>
    <section className="hero">
      <div><span className="eyebrow"><ShieldCheck size={15}/> Verified homes, clearer renting</span><h1>Find a place.<br/><em>Rent with confidence.</em></h1><p>Discover rental properties, connect with owners, schedule visits, and keep your rental journey organized in one place.</p><div className="actions"><Link className="button" to="/properties">Find a property <ArrowRight size={17}/></Link><Link className="button ghost" to="/register">Post your property</Link></div></div>
      <img className="hero-img" src={properties[0].image} alt="Modern apartment"/>
    </section>
    <section className="search-panel">
      <strong><Search size={18}/> What are you looking for?</strong>
      <form onSubmit={submit}>
        <label>Location<input value={city} onChange={e => setCity(e.target.value)} placeholder="City or area" /></label>
        <label>Property type<select value={propertyType} onChange={e => setPropertyType(e.target.value)}><option value="">Any type</option><option value="APARTMENT">Apartment</option><option value="FLAT">Flat</option><option value="HOUSE">House</option><option value="STUDIO">Studio</option><option value="PG">PG</option><option value="ROOM">Room</option></select></label>
        <label>Maximum rent<input type="number" min="0" step="500" value={maxRent} onChange={e => setMaxRent(e.target.value)} placeholder="₹30,000" /></label>
        <label>Bedrooms<select value={bedrooms} onChange={e => setBedrooms(e.target.value)}><option value="">Any</option><option value="1">1 BHK</option><option value="2">2 BHK</option><option value="3">3 BHK</option><option value="4">4+ BHK</option></select></label>
        <button className="button" type="submit"><Search size={16}/> Search</button>
      </form>
    </section>
    <section className="section"><span className="kicker">Explore homes</span><div className="section-title"><h2>Places worth coming home to.</h2><Link to="/properties">View all <ArrowRight size={15}/></Link></div><div className="property-grid">{properties.map(p=><article className="property-card" key={p.id}><img src={p.image} alt={p.title}/><div><b>₹{p.rent.toLocaleString('en-IN')}<small>/month</small></b><h3>{p.title}</h3><p>{p.area}, {p.city} · {p.bedrooms} bed · {p.bathrooms} bath</p><Link to={'/properties/'+p.id}>View details →</Link></div></article>)}</div></section>
  </main>;
}
