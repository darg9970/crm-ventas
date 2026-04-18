import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const INSTANCIAS = [
  { nombre: 'Khristian Ramirez', instancia: 'Khristian Ramirez', telefono: '573133536525' },
  { nombre: 'Nidia Gomez', instancia: 'Nidia Gomez', telefono: '573219180250' },
  { nombre: 'Luisa ramirez', instancia: 'Luisa ramirez', telefono: '573115918611' },
]

async function fetchConReintento(instancia, intentos = 3) {
  for (let i = 0; i < intentos; i++) {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-metricas', {
        body: { instancia }
      })
      if (error) throw error
      if (data?.chats && Array.isArray(data.chats) && data.chats.length > 0) return data
      await new Promise(r => setTimeout(r, 1000))
    } catch (e) {
      if (i === intentos - 1) throw e
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return { chats: [], instancias: [] }
}

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
          const data = await fetchConReintento(a.instancia)
          const chats = Array.isArray(data.chats) ? data.chats : []
          const instancias = Array.isArray(data.instancias) ? data.instancias : []
          const instanciaInfo = instancias.find(i => i.name === a.instancia)

          const ahora = Date.now()
          const hace24h = ahora - 24 * 60 * 60 * 1000

          const chatsHoy = chats.filter(c => {
            const ultimo = c.lastMessage?.messageTimestamp
            return ultimo && (ultimo * 1000) > hace24h
          })

          const sinResponder = chats.filter(c =>
            c.lastMessage && !c.lastMessage.key?.fromMe
          )

          // Tiempo de respuesta: cuánto tardó el asesor en responder el último mensaje
          const chatsRespondidos = chats
            .filter(c => c.lastMessage?.key?.fromMe && c.lastMessage?.messageTimestamp)
            .sort((a, b) => b.lastMessage.messageTimestamp - a.lastMessage.messageTimestamp)

          let tiempoPromedio = null
          if (chatsRespondidos.length > 0) {
            const tsUltimaRespuesta = chatsRespondidos[0].lastMessage.messageTimestamp
            const minutosDesdeRespuesta = Math.round((ahora / 1000 - tsUltimaRespuesta) / 60)
            if (minutosDesdeRespuesta >= 0 && minutosDesdeRespuesta < 480) {
              tiempoPromedio = minutosDesdeRespuesta
            }
          }

          return {
            ...a,
            estado: instanciaInfo?.connectionStatus || 'unknown',
            totalChats: chats.length,
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
                  ...styles.estadoBadge,
                  backgroundColor: m.estado === 'open' ? '#68d391' : '#fc8181'
                }}>
                  {m.estado === 'open' ? '🟢 Conectado' : '🔴 Desconectado'}
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
                      {m.tiempoPromedio !== null ? `${m.tiempoPromedio}m` : 'N/A'}
                    </p>
                    <p style={styles.metricaLabel}>Última resp.</p>
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
  estadoBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  metricas: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  metrica: { textAlign: 'center', backgroundColor: '#f7fafc', borderRadius: '8px', padding: '12px' },
  metricaNumero: { fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e', margin: 0 },
  metricaLabel: { color: '#666', fontSize: '11px', marginTop: '4px' },
  errorMsg: { color: '#e53e3e', textAlign: 'center', padding: '20px' }
}