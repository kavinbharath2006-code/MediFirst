import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Result from './pages/Result';
import Services from './pages/Services';
import Safety from './pages/Safety';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<Result />} />
            <Route path="/services" element={<Services />} />
            <Route path="/safety" element={<Safety />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;