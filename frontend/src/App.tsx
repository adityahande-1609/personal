import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
export default function App(){return <BrowserRouter><nav><Link to="/">rentwise</Link></nav><Routes><Route path="/" element={<Home/>}/></Routes></BrowserRouter>}
