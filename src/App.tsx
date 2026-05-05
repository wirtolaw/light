import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getUserId } from './lib/supabase';
import BottomNav from './components/BottomNav';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import WeightCalendar from './pages/WeightCalendar';
import Measurements from './pages/Measurements';
import Calories from './pages/Calories';

function App() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    const userId = getUserId();
    setIsSetup(!!userId);
  }, []);

  if (isSetup === null) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!isSetup) {
    return <Setup onComplete={() => setIsSetup(true)} />;
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-white max-w-[430px] mx-auto relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/weight" element={<WeightCalendar />} />
          <Route path="/measurements" element={<Measurements />} />
          <Route path="/calories" element={<Calories />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
}

export default App;
