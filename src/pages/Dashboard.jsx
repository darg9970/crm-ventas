import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { perfil, logout } = useAuth()
  const [ventas, setVentas] = useState([])
  const [asesores, setAsesores] = useState([])
  const [cargando, setCargando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroAsesor, setFiltroAsesor] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroComision, setFiltroComision] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)

    const { data: ventasData } = await supabase
      .from('ventas')
      .select('*, usuarios(nombre)')
      .order('created_at', { ascending: false })

    const { data: asesoresData } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .eq('rol', 'asesor')

    setVentas(ventasData || [])
    setAsesores(asesoresData || [])
    setCargando(false)
  }

  async function cambiarEstadoComision(ventaId, nuevoEstado) {
    const { error } = await supabase
      .from('ventas')
      .update({ estado_comision: nuevoEstado })
      .eq('id', ventaId)

    if (!error) {
      setVentas(prev => prev.map(v =>
        v.id === ventaId ? { ...v, estado_comision: nuevoEstado } : v
      ))
    }
  }

const ventasFiltradas = ventas.filter(v => {
  const coincideBusqueda =
    v.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.cedula?.includes(busqueda) ||
    v.celular?.includes(busqueda) ||
    v.ot?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.numero_cuenta?.toLowerCase().includes(busqueda.toLowerCase())
  const coincideAsesor = filtroAsesor ? v.asesor_id === filtroAsesor : true
  const coincideEstado = filtroEstado ? v.estado === filtroEstado : true
  const coincideComision = filtroComision ? v.estado_comision === filtroComision : true

  const fecha = new Date(v.created_at)
  const desde = fechaDesde ? new Date(fechaDesde) : null
  const hasta = fechaHasta ? new Date(fechaHasta + 'T23:59:59') : null
  const coincideFecha =
    (!desde || fecha >= desde) &&
    (!hasta || fecha <= hasta)

  return coincideBusqueda && coincideAsesor && coincideEstado && coincideComision && coincideFecha
})

  // Métricas
  const totalVentas = ventasFiltradas.length
  const instaladas = ventasFiltradas.filter(v => v.estado === 'Instalada').length
  const pendientesLegalizar = ventasFiltradas.filter(v => v.estado_comision === 'Pendiente de legalizar').length
  const pendientesPagar = ventasFiltradas.filter(v => v.estado_comision === 'Pendiente de pagar').length
  const pagadas = ventasFiltradas.filter(v => v.estado_comision === 'Pagado al asesor').length

  const estadoColor = {
    'Pendiente': '#f6ad55',
    'En proceso': '#63b3ed',
    'Instalada': '#68d391',
    'Cancelada': '#fc8181',
  }

  const comisionColor = {
    'Pendiente de legalizar': '#fc8181',
    'Pendiente de pagar': '#f6ad55',
    'Pagado al asesor': '#68d391',
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Dashboard Coordinador</h1>
          <p style={styles.subtitulo}>Bienvenido, {perfil?.nombre}</p>
        </div>
        <button onClick={() => window.location.href='/asesores'} style={styles.botonNav}>
  👥 Asesores
</button>
<button onClick={() => window.location.href='/whatsapp'} style={styles.botonNav}>
  📱 WhatsApp
</button>
        <button onClick={logout} style={styles.botonCerrar}>Cerrar sesión</button>
      </div>

      {/* Métricas */}
      <div style={styles.metricas}>
        <div style={styles.metricaCard}>
          <p style={styles.metricaNumero}>{totalVentas}</p>
          <p style={styles.metricaLabel}>Total ventas</p>
        </div>
        <div style={styles.metricaCard}>
          <p style={{...styles.metricaNumero, color: '#38a169'}}>{instaladas}</p>
          <p style={styles.metricaLabel}>Instaladas</p>
        </div>
        <div style={styles.metricaCard}>
          <p style={{...styles.metricaNumero, color: '#e53e3e'}}>{pendientesLegalizar}</p>
          <p style={styles.metricaLabel}>Pend. legalizar</p>
        </div>
        <div style={styles.metricaCard}>
          <p style={{...styles.metricaNumero, color: '#d69e2e'}}>{pendientesPagar}</p>
          <p style={styles.metricaLabel}>Pend. pagar</p>
        </div>
        <div style={styles.metricaCard}>
          <p style={{...styles.metricaNumero, color: '#3182ce'}}>{pagadas}</p>
          <p style={styles.metricaLabel}>Pagadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.card}>
        <div style={styles.filtros}>
  <input
    style={styles.input}
    placeholder="🔍 Buscar por nombre, cédula, celular, OT o # cuenta..."
    value={busqueda}
    onChange={e => setBusqueda(e.target.value)}
  />
  <select style={styles.input} value={filtroAsesor} onChange={e => setFiltroAsesor(e.target.value)}>
    <option value="">Todos los asesores</option>
    {asesores.map(a => (
      <option key={a.id} value={a.id}>{a.nombre}</option>
    ))}
  </select>
  <select style={styles.input} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
    <option value="">Todos los estados</option>
    <option>Pendiente</option>
    <option>En proceso</option>
    <option>Instalada</option>
    <option>Cancelada</option>
  </select>
  <select style={styles.input} value={filtroComision} onChange={e => setFiltroComision(e.target.value)}>
    <option value="">Todas las comisiones</option>
    <option>Pendiente de legalizar</option>
    <option>Pendiente de pagar</option>
    <option>Pagado al asesor</option>
  </select>

  {/* Filtros de fecha */}
  <div style={styles.campoFecha}>
    <label style={styles.labelFecha}>Desde</label>
    <input
      type="date"
      style={styles.input}
      value={fechaDesde}
      onChange={e => setFechaDesde(e.target.value)}
    />
  </div>
  <div style={styles.campoFecha}>
    <label style={styles.labelFecha}>Hasta</label>
    <input
      type="date"
      style={styles.input}
      value={fechaHasta}
      onChange={e => setFechaHasta(e.target.value)}
    />
  </div>

  <button
    onClick={() => { setBusqueda(''); setFiltroAsesor(''); setFiltroEstado(''); setFiltroComision(''); setFechaDesde(''); setFechaHasta('') }}
    style={styles.botonLimpiar}
  >
    🗑️ Limpiar filtros
  </button>
</div>

        {cargando ? (
          <p style={{textAlign: 'center', color: '#666', padding: '40px'}}>Cargando ventas...</p>
        ) : ventasFiltradas.length === 0 ? (
          <p style={{textAlign: 'center', color: '#666', padding: '40px'}}>No hay ventas que coincidan.</p>
        ) : (
          <div style={styles.tablaWrapper}>
            <table style={styles.tabla}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Asesor</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Cédula</th>
                  <th style={styles.th}>Celular</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Ciudad</th>
                  <th style={styles.th}>Dirección</th>
                  <th style={styles.th}># Cuenta</th>
                  <th style={styles.th}>OT</th>
                  <th style={styles.th}>Fecha Inst.</th>
                  <th style={styles.th}>Franja</th>
                  <th style={styles.th}>Estado venta</th>
                  <th style={styles.th}>Estado comisión</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map(v => (
                  <tr key={v.id} style={styles.tr}>
                    <td style={styles.td}>{v.usuarios?.nombre || v.nombre_asesor || 'Asesor eliminado'}</td>
                    <td style={styles.td}>{v.nombre}</td>
                    <td style={styles.td}>{v.cedula}</td>
                    <td style={styles.td}>{v.celular}</td>
                    <td style={styles.td}>{v.correo || '-'}</td>
                    <td style={styles.td}>{v.ciudad}</td>
                    <td style={styles.td}>{v.direccion}</td>
                    <td style={styles.td}>{v.numero_cuenta || '-'}</td>
                    <td style={styles.td}>{v.ot || '-'}</td>
                    <td style={styles.td}>{v.fecha_instalacion || '-'}</td>
                    <td style={styles.td}>{v.franja_horaria}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: estadoColor[v.estado] || '#e2e8f0'
                      }}>
                        {v.estado}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        value={v.estado_comision || 'Pendiente de legalizar'}
                        onChange={e => cambiarEstadoComision(v.id, e.target.value)}
                        style={{
                          ...styles.selectComision,
                          backgroundColor: comisionColor[v.estado_comision] || '#e2e8f0'
                        }}
                      >
                        <option>Pendiente de legalizar</option>
                        <option>Pendiente de pagar</option>
                        <option>Pagado al asesor</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  titulo: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e' },
  subtitulo: { color: '#666', fontSize: '14px', marginTop: '4px' },
  botonNav: { backgroundColor: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  botonCerrar: { backgroundColor: 'transparent', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  metricas: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' },
  metricaCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' },
  metricaNumero: { fontSize: '36px', fontWeight: 'bold', color: '#1a1a2e', margin: '0' },
  metricaLabel: { color: '#666', fontSize: '13px', marginTop: '4px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  filtros: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' },
 campoFecha: { display: 'flex', flexDirection: 'column', gap: '4px' },
 labelFecha: { fontSize: '12px', fontWeight: '600', color: '#666' },
 botonLimpiar: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#666' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundColor: 'white' },
  tablaWrapper: { overflowX: 'auto' },
  tabla: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  thead: { backgroundColor: '#f7fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px', color: '#4a5568', whiteSpace: 'nowrap' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  selectComision: { padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }
}