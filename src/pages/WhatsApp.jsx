import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const EVOLUTION_URL = import.meta.env.VITE_EVOLUTION_API_URL
const EVOLUTION_KEY = import.meta.env.VITE_EVOLUTION_API_KEY

const INSTANCIAS = [
  { nombre: 'Khristian Ramirez', instancia: 'Khristian Ramirez', telefono: '573133536525' },
  { nombre: 'Nidia Gomez', instancia: 'Nidia Gomez', telefono: '573219180250' },
  { nombre: 'Luisa ramirez', instancia: 'Luisa ramirez', telefono: '573115918611' },
]

export default function WhatsApp() {
  const { perfil, logout } = useAuth()
  const [metricas, setMetricas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  useEffect(() => {
    cargarMetricas()
    const intervalo = setInterval(cargarMetricas, 60000)
    return () => clearInterval(intervalo)
  }, [])

  async function cargarMetricas() {
    setCargando(true)
    const resultados = await Promise.all(
      INSTANCIAS.map(async (a) => {
        try {
          const [chatsRes, perfilRes] = await Promise.all([
            fetch(`${EVOLUTION_URL}/chat/findChats/${a.instancia}`, {
              headers: { apikey: EVOLUTION_KEY }
            }),
            fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
              headers: { apikey: EVOLUTION_KEY }
            })
          ])

          const chats = await chatsRes.json()
          const instancias = await perfilRes.json()
          const instanciaInfo = Array.isArray(instancias)
            ? instancias.find(i => i.instance?.instanceName === a.instancia)
            : null

          const chatsArray = Array.isArray(chats) ? chats : []
          const ahora = Date.now()
          const hace24h = ahora - 24 * 60 * 60 * 1000

          const chatsHoy = chatsArray.filter(c => {
            const ultimo = c.lastMessage?.messageTimestamp
            return ultimo && (ultimo * 1000) > hace24h
          })

          const sinResponder = chatsArray.filter(c => {
            const ultimo = c.lastMessage
            return ultimo && !ultimo.key?.fromMe
          })

          const tiemposRespuesta = chatsArray
            .filter(c => c.lastMessage?.key?.fromMe)
            .map(c => {
              const ts = c.lastMessage?.messageTimestamp
              return ts ? (ahora / 1000 - ts) / 60 : null
            })
            .filter(t => t !== null && t < 1440)

          const tiempoPromedio = tiemposRespuesta.length > 0
            ? Math.round(tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length)
            : null

          return {
            ...a,
            estado: instanciaInfo?.instance?.state || 'unknown',
            totalChats: chatsArray.length,
            chatsHoy: chatsHoy.length,
            sinResponder: sinResponder.length,
            tiempoPromedio,
            ok: true
          }
        } catch (err) {
          return { ...a, ok: false, error: err.message }
        }
      })
    )
    setMetricas(resultados)
    setUltimaActualizacion(new Date().toLocaleTimeString('es-CO'))
    setCargando(false)
  }

  const estadoColor = { open: '#68d391', connected: '#68d391', close: '#fc8181', unknown: '#f6ad55' }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>📱 Métricas WhatsApp</h1>
          <p style={styles.subtitulo}>
            Actualizado: {ultimaActualizacion || 'Cargando...'}
            {' — '}
            <span style={{color: '#4f46e5', cursor: 'pointer'}} onClick={cargarMetricas}>
              🔄 Actualizar ahora
            </span>
          </p>
        </div>
        <button onClick={logout} style={styles.botonCerrar}>Cerrar sesión</button>
      </div>

      {cargando ? (
        <div style={styles.cargando}>Cargando métricas de WhatsApp...</div>
      ) : (
        <div style={styles.grid}>
          {metricas.map((m, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.nombre}>{m.nombre}</h2>
                  <p style={styles.telefono}>+{m.telefono}</p>
                </div>
                <span style={{
                  ...styles.estado,
                  backgroundColor: estadoColor[m.estado] || '#f6ad55'
                }}>
                  {m.estado === 'open' || m.estado === 'connected' ? '🟢 Conectado' : '🔴 Desconectado'}
                </span>
              </div>

              {m.ok ? (
                <div style={styles.metricas}>
                  <div style={styles.metrica}>
                    <p style={styles.metricaNumero}>{m.chatsHoy}</p>
                    <p style={styles.metricaLabel}>Chats hoy</p>
                  </div>
                  <div style={styles.metrica}>
                    <p style={{...styles.metricaNumero, color: m.sinResponder > 0 ? '#e53e3e' : '#38a169'}}>
                      {m.sinResponder}
                    </p>
                    <p style={styles.metricaLabel}>Sin responder</p>
                  </div>
                  <div style={styles.metrica}>
                    <p style={styles.metricaNumero}>{m.totalChats}</p>
                    <p style={styles.metricaLabel}>Total chats</p>
                  </div>
                  <div style={styles.metrica}>
                    <p style={{...styles.metricaNumero, color: '#4f46e5'}}>
                      {m.tiempoPromedio ? `${m.tiempoPromedio}m` : 'N/A'}
                    </p>
                    <p style={styles.metricaLabel}>T. respuesta</p>
                  </div>
                </div>
              ) : (
                <p style={styles.errorMsg}>❌ Error al cargar datos</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titulo: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e' },
  subtitulo: { color: '#666', fontSize: '14px', marginTop: '4px' },
  botonCerrar: { backgroundColor: 'transparent', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  cargando: { textAlign: 'center', padding: '60px', color: '#666', fontSize: '18px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  nombre: { fontSize: '18px', fontWeight: 'bold', color: '#1a1a2e', margin: 0 },
  telefono: { color: '#666', fontSize: '13px', marginTop: '4px' },
  estado: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  metricas: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  metrica: { textAlign: 'center', backgroundColor: '#f7fafc', borderRadius: '8px', padding: '12px' },
  metricaNumero: { fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e', margin: 0 },
  metricaLabel: { color: '#666', fontSize: '11px', marginTop: '4px' },
  errorMsg: { color: '#e53e3e', textAlign: 'center', padding: '20px' }
}