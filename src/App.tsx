import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Teams from './pages/Teams';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import LiveAnalysis from './pages/LiveAnalysis';
import Players from './pages/Players';
import MatchLineup from './pages/MatchLineup';
import CustomActions from './pages/CustomActions';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/team/:teamId/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/team/:teamId/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
          <Route path="/team/:teamId/actions" element={<ProtectedRoute><CustomActions /></ProtectedRoute>} />
          <Route path="/match/:matchId" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
          <Route path="/match/:matchId/live" element={<ProtectedRoute><LiveAnalysis /></ProtectedRoute>} />
          <Route path="/match/:matchId/lineup" element={<ProtectedRoute><MatchLineup /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;