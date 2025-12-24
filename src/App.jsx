import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage/MainPage.jsx';
import Landing from './pages/Landing/Landing.jsx';
import About from './pages/AboutUs/About.jsx';
import InstructionsPage from './pages/InstructionsPage/Instructions.jsx';
import Profile from './pages/Profile/Profile.jsx';
import AdminPanel from './pages/AdminPanel/AdminPanel.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/docs" element={<InstructionsPage />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
