import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Species from './pages/Species.jsx';
import SpeciesDetail from './pages/SpeciesDetail.jsx';
import Observations from './pages/Observations.jsx';
import AddObservation from './pages/AddObservation.jsx';
import LifeList from './pages/LifeList.jsx';
import Achievements from './pages/Achievements.jsx';
import Heatmap from './pages/Heatmap.jsx';
import Activities from './pages/Activities.jsx';
import ActivityDetail from './pages/ActivityDetail.jsx';
import CreateActivity from './pages/CreateActivity.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="species" element={<Species />} />
        <Route path="species/:id" element={<SpeciesDetail />} />
        <Route path="observations" element={<Observations />} />
        <Route path="observations/add" element={<AddObservation />} />
        <Route path="life-list" element={<LifeList />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="heatmap" element={<Heatmap />} />
        <Route path="activities" element={<Activities />} />
        <Route path="activities/:id" element={<ActivityDetail />} />
        <Route path="activities/create" element={<CreateActivity />} />
      </Route>
    </Routes>
  );
}

export default App;
