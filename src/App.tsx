import { Routes, Route } from 'react-router-dom';
import { AgentProvider } from '@/context/AgentContext';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Admin from '@/pages/Admin';

export default function App() {
  return (
    <AgentProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </AgentProvider>
  );
}
