import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Asesores() {
  const { perfil, logout } = useAuth()
  const [asesores, setAsesores] = useState([])
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' })

  useEffect(() => {
    cargarAsesores()
  }, [])

  async function cargarAsesores() {
    setCargando(true)
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'asesor')
      .order('nombre')
    setAsesores(data || [])
    setCargando(false)
  }

  async function crearAsesor(e) {
  e.preventDefault()
  setEnviando(true)
  setMensaje(null)

  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crear-asesor`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        telefono: form.telefono
      })
    }
  )

  const result = await response.json()

  if (result.error) {
    setMensaje({ tipo: 'error', texto: 'Error: ' + result.error })
  } else {
    setMensaje({ tipo: 'exito', texto: '✅ Asesor creado correctamente.' })
    setForm({ nombre: '', email: '', telefono: '', password: '' })
    setMostrarForm(false)
    cargarAsesores()
  }

  setEnviando(false)
}

  async function toggleActivo(asesor) {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: !asesor.activo })
      .eq('id', asesor.id)

    if (!error) {
      setAsesores(prev => prev.map(a =>
        a.id === asesor.id ? { ...a, activo: !a.activo } : a
      ))
    }
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Gestión de Asesores</h1>
          <p style={styles.subtitulo}>Bienvenido, {perfil?.nombre}</p>
        </div>
        <div style={styles.headerBotones}>
          <button onClick={() => setMostrarForm(!mostrarForm)} style={styles.botonCrear}>
            {mostrarForm ? '✕ Cancelar' : '+ Nuevo Asesor'}
          </button>
          <button onClick={logout} style={styles.botonCerrar}>Cerrar sesión</button>
        </div>
      </div>

      {/* Formulario nuevo asesor */}
      {mostrarForm && (
        <div style={styles.card}>
          <h2 style={styles.subtituloCard}>Crear nuevo asesor</h2>
          <form onSubmit={crearAsesor} style={styles.form}>
            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre completo *</label>
                <input style={styles.input} placeholder="Juan Pérez" required
                  value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Correo electrónico *</label>
                <input style={styles.input} type="email" placeholder="asesor@email.com" required
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>
            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Teléfono</label>
                <input style={styles.input} placeholder="3001234567"
                  value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Contraseña temporal *</label>
                <input style={styles.input} type="password" placeholder="Mínimo 6 caracteres" required
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
            </div>

            {mensaje && (
              <p style={mensaje.tipo === 'exito' ? styles.exito : styles.error}>
                {mensaje.texto}
              </p>
            )}

            <button type="submit" disabled={enviando}
              style={enviando ? {...styles.boton, opacity: 0.7} : styles.boton}>
              {enviando ? 'Creando...' : 'Crear Asesor'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de asesores */}
      <div style={styles.card}>
        <h2 style={styles.subtituloCard}>Asesores registrados ({asesores.length})</h2>

        {cargando ? (
          <p style={{textAlign: 'center', color: '#666', padding: '40px'}}>Cargando...</p>
        ) : asesores.length === 0 ? (
          <p style={{textAlign: 'center', color: '#666', padding: '40px'}}>No hay asesores registrados.</p>
        ) : (
          <table style={styles.tabla}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Correo</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {asesores.map(a => (
                <tr key={a.id} style={styles.tr}>
                  <td style={styles.td}>{a.nombre}</td>
                  <td style={styles.td}>{a.email}</td>
                  <td style={styles.td}>{a.telefono || '-'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: a.activo ? '#68d391' : '#fc8181'
                    }}>
                      {a.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => toggleActivo(a)}
                      style={{
                        ...styles.botonToggle,
                        borderColor: a.activo ? '#e53e3e' : '#38a169',
                        color: a.activo ? '#e53e3e' : '#38a169'
                      }}>
                      {a.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titulo: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e' },
  subtitulo: { color: '#666', fontSize: '14px', marginTop: '4px' },
  subtituloCard: { fontSize: '18px', fontWeight: '600', color: '#1a1a2e', marginBottom: '20px' },
  headerBotones: { display: 'flex', gap: '12px' },
  botonCrear: { backgroundColor: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  botonCerrar: { backgroundColor: 'transparent', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#333' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' },
  exito: { color: '#38a169', backgroundColor: '#f0fff4', padding: '12px', borderRadius: '8px', textAlign: 'center' },
  error: { color: '#e53e3e', backgroundColor: '#fff5f5', padding: '12px', borderRadius: '8px', textAlign: 'center' },
  boton: { backgroundColor: '#4f46e5', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  thead: { backgroundColor: '#f7fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', borderBottom: '2px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px', color: '#4a5568' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  botonToggle: { backgroundColor: 'transparent', padding: '4px 12px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
}