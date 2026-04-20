import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const INSTANCIAS = [
  { nombre: 'Khristian Ramirez', instancia: 'Khristian Ramirez', telefono: '573133536525' },
  { nombre: 'Cristina Gomez', instancia: 'Cristina Gomez', telefono: '573219180250' },
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

  const hoy = new Date().toISOString().slice(0, 10)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy)

  useEffect(() => {
    cargarMetricas()
    const intervalo = setInterval(cargarMetricas, 60000)
    return () => clearInterval(intervalo)
  }, [fechaSeleccionada])

  async function cargarMetricas() {
    setCargando(true)

    const inicioDia = new Date(fechaSeleccionada + 'T00:00:00').getTime()
    const finDia = new Date(fechaSeleccionada + 'T23:59:59').getTime()

    const resultados = await Promise.all(
      INSTANCIAS.map(async (a) => {
        try {
          const data = await fetchConReintento(a.instancia)
          const todosChats = Array.isArray(data.chats) ? data.chats : []
          const instancias = Array.isArray(data.instancias) ? data.instancias : []
          const instanciaInfo = instancias.find(i => i.name === a.instancia)

          // --- SUSTITUYE DESDE LA LÍNEA 60 HASTA LA 63 CON ESTO ---
          const chatsSolo = todosChats.filter(c => {
          const id = c.remoteJid || c.id || ''
  
  // Filtro Maestro: Eliminamos Grupos, Canales y Listas de Difusión
          const esGrupo = id.includes('@g.us') || 
                  id.includes('-') || 
                  id.includes('@newsletter') || 
                  id.includes('@broadcast');

  return id && !esGrupo;
})

          const ahora = Date.now()
          const hace24h = ahora - 24 * 60 * 60 * 1000

          const chatsDia = chatsSolo.filter(c => {
            const ts = c.lastMessage?.messageTimestamp
            if (!ts) return false
            const t = ts * 1000
            return t >= inicioDia && t <= finDia
          })

          const chatsHoy = chatsSolo.filter(c => {
            const ts = c.lastMessage?.messageTimestamp
            return ts && (ts * 1000) > hace24h
          })

          const sinResponder = chatsDia.filter(c =>
            c.lastMessage && !c.lastMessage.key?.fromMe
          )

          const mensajesEnviados = chatsDia.filter(c =>
            c.lastMessage?.key?.fromMe
          ).length

          const chatsRespondidos = chatsDia
            .filter(c => c.lastMessage?.key?.fromMe && c.lastMessage?.messageTimestamp)
            .sort((a, b) => b.lastMessage.messageTimestamp - a.lastMessage.messageTimestamp)

          let tiempoUltimaResp = null
          if (chatsRespondidos.length > 0) {
            const ts = chatsRespondidos[0].lastMessage.messageTimestamp
            const minutos = Math.round((ahora / 1000 - ts) / 60)
            if (minutos >= 0 && minutos < 1440) tiempoUltimaResp = minutos
          }

          return {
            ...a,
            estado: instanciaInfo?.connectionStatus || 'unknown',
            chatsDia: chatsDia.length,
            chatsHoy: chatsHoy.length,
            sinResponder: sinResponder.length,
            mensajesEnviados,
            tiempoUltimaResp,
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

  const esDiaActual = fechaSeleccionada === hoy

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
        <div style={styles.headerDerecha}>
          <input
            type="date"
            style={styles.inputFecha}
            value={fechaSeleccionada}
            max={hoy}
            onChange={e => setFechaSeleccionada(e.target.value)}
          />
          <button onClick={() => window.location.href='/dashboard'} style={styles.botonNav}>
            ← Dashboard
          </button>
          <button onClick={logout} style={styles.botonCerrar}>Cerrar sesión</button>
        </div>
      </div>

      {cargando ? (
        <div style={styles.cargando}>Cargando métricas...</div>
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
                    <p style={styles.metricaNumero}>{m.chatsDia}</p>
                    <p style={styles.metricaLabel}>
                      {esDiaActual ? 'Chats hoy' : 'Chats del día'}
                    </p>
                  </div>
                  <div style={styles.metrica}>
                    <p style={{...styles.metricaNumero, color: m.sinResponder > 0 ? '#e53e3e' : '#38a169'}}>
                      {m.sinResponder}
                    </p>
                    <p style={styles.metricaLabel}>Sin responder</p>
                  </div>
                  <div style={styles.metrica}>
                    <p style={{...styles.metricaNumero, color: '#38a169'}}>
                      {m.mensajesEnviados}
                    </p>
                    <p style={styles.metricaLabel}>Respondidos</p>
                  </div>
                  <div style={styles.metrica}>
                    <p style={{...styles.metricaNumero, color: '#4f46e5'}}>
                      {m.tiempoUltimaResp !== null ? `${m.tiempoUltimaResp}m` : 'N/A'}
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
  headerDerecha: { display: 'flex', gap: '12px', alignItems: 'center' },
  titulo: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e' },
  subtitulo: { color: '#666', fontSize: '14px', marginTop: '4px' },
  inputFecha: { padding: '8px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', cursor: 'pointer' },
  botonNav: { backgroundColor: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
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