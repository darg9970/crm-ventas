import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Ventas from './pages/Ventas'
import Dashboard from './pages/Dashboard'
import Asesores from './pages/Asesores'
import WhatsApp from './pages/WhatsApp'

function RutaProtegida({ children, rol }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <div>Cargando...</div>
  if (!user) return <Navigate to="/" />
  if (rol && perfil?.rol !== rol) return <Navigate to="/" />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ventas" element={
          <RutaProtegida rol="asesor">
            <Ventas />
          </RutaProtegida>
        } />
        <Route path="/dashboard" element={
          <RutaProtegida rol="coordinador">
            <Dashboard />
          </RutaProtegida>
        } />
        <Route path="/asesores" element={
  <RutaProtegida rol="coordinador">
    <Route path="/whatsapp" element={
  <RutaProtegida rol="coordinador">
    <WhatsApp />
  </RutaProtegida>
} />
    <Asesores />
  </RutaProtegida>
} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

