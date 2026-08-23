import {useEffect, useState} from 'react';
import {BrowserRouter,Link,Navigate,Route,Routes,useNavigate} from 'react-router-dom';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import PostProperty from './pages/PostProperty';
import Notifications from './pages/Notifications';
import Agreements from './pages/Agreements';
import NewAgreement from './pages/NewAgreement';
import AgreementDetails from './pages/AgreementDetails';
import {getCurrentUser,User} from './services/api';

function Info({title}:{title:string}){return <main className="page simple"><span className="kicker">Rentwise</span><h1>{title}</h1><p>This module will be connected to its backend workflow as the platform expands.</p></main>}

function DashboardEntry(){
  const navigate = useNavigate();
  const [user,setUser] = useState<User|null>(null);
  useEffect(()=>{getCurrentUser().then(({user})=>setUser(user)).catch(()=>navigate('/login',{replace:true}));},[navigate]);
  if(!user)return <main className="page simple"><p>Loading your dashboard…</p></main>;
  return <Navigate to={user.role === 'OWNER' ? '/owner/dashboard' : '/tenant/dashboard'} replace/>;
}

function Navigation(){
  return <header className="nav"><Link className="brand" to="/">rentwise</Link><nav><Link to="/properties">Find a home</Link><Link to="/services">Services</Link><Link to="/about">About</Link><Link to="/dashboard">Dashboard</Link><Link to="/login">Log in</Link><Link className="button small" to="/register">Get started</Link></nav></header>;
}

export default function App(){return <BrowserRouter><Navigation/><Routes>
  <Route path="/" element={<Home/>}/><Route path="/properties" element={<Properties/>}/><Route path="/properties/:id" element={<PropertyDetails/>}/>
  <Route path="/login" element={<Auth/>}/><Route path="/register" element={<Auth register/>}/><Route path="/dashboard" element={<DashboardEntry/>}/>
  <Route path="/owner/dashboard" element={<Dashboard role="OWNER"/>}/><Route path="/owner/properties/new" element={<PostProperty/>}/><Route path="/owner/properties/:id/edit" element={<PostProperty/>}/><Route path="/tenant/dashboard" element={<Dashboard role="TENANT"/>}/>
  <Route path="/notifications" element={<Notifications/>}/><Route path="/agreements" element={<Agreements/>}/><Route path="/agreements/new" element={<NewAgreement/>}/><Route path="/agreements/:id" element={<AgreementDetails/>}/>
  <Route path="/services" element={<Info title="Services"/>}/><Route path="/services/rental-agreement" element={<Agreements/>}/><Route path="/about" element={<Info title="About Rentwise"/>}/><Route path="/contact" element={<Info title="Contact"/>}/>
</Routes><footer><div><strong>rentwise</strong><p>Find a place. Rent with confidence.</p></div><span>© 2026 Rentwise</span></footer></BrowserRouter>}
