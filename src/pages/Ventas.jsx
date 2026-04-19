import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Ventas() {
  const { perfil, logout } = useAuth()
  const [pestana, setPestana] = useState('registrar')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [ventaEditando, setVentaEditando] = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    if (pestana === 'ventas') cargarVentas()
  }, [pestana])

  async function cargarVentas() {
    setCargando(true)
    const { data } = await supabase
      .from('ventas')
      .select('*')
      .order('created_at', { ascending: false })
    setVentas(data || [])
    setCargando(false)
  }

async function onSubmit(data) {
  setEnviando(true)
  setMensaje(null)

  if (ventaEditando) {
    const { error } = await supabase
      .from('ventas')
      .update(data)
      .eq('id', ventaEditando)
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar.' })
    } else {
      setMensaje({ tipo: 'exito', texto: '✅ Venta actualizada correctamente.' })
      setVentaEditando(null)
      reset()
    }
  } else {
    const { error } = await supabase.from('ventas').insert([{
      ...data,
      asesor_id: perfil.id,
      nombre_asesor: perfil.nombre
    }])
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar. Intenta de nuevo.' })
    } else {
      setMensaje({ tipo: 'exito', texto: '✅ Venta registrada correctamente.' })
      reset()
    }
  }
  setEnviando(false)
}

  function editarVenta(venta) {
  if (!window.confirm('¿Deseas editar esta venta?')) return
  setVentaEditando(venta.id)
  setPestana('registrar')
  setMensaje(null)
  const campos = ['nombre','cedula','celular','correo','ciudad','direccion',
    'numero_cuenta','ot','fecha_instalacion','franja_horaria','estado']
  campos.forEach(c => setValue(c, venta[c] || ''))
}

  function cancelarEdicion() {
    setVentaEditando(null)
    reset()
    setMensaje(null)
  }

  const ventasFiltradas = ventas.filter(v =>
    v.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.cedula?.includes(busqueda) ||
    v.celular?.includes(busqueda) ||
    v.ot?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.numero_cuenta?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const estadoColor = {
    'Pendiente': '#f6ad55',
    'En proceso': '#63b3ed',
    'Instalada': '#68d391',
    'Cancelada': '#fc8181',
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>CRM Ventas</h1>
          <p style={styles.subtitulo}>Bienvenido, {perfil?.nombre}</p>
        </div>
        <button onClick={logout} style={styles.botonCerrar}>Cerrar sesión</button>
      </div>

      {/* Pestañas */}
      <div style={styles.pestanas}>
        <button
          onClick={() => { setPestana('registrar'); setVentaEditando(null); reset(); setMensaje(null) }}
          style={pestana === 'registrar' ? styles.pestanaActiva : styles.pestana}
        >
          📝 Registrar Venta
        </button>
        <button
          onClick={() => setPestana('ventas')}
          style={pestana === 'ventas' ? styles.pestanaActiva : styles.pestana}
        >
          📋 Mis Ventas
        </button>
      </div>

      {/* Pestaña Registrar */}
      {pestana === 'registrar' && (
        <div style={styles.card}>
          {ventaEditando && (
            <div style={styles.avisoEdicion}>
              ✏️ Editando venta — <button onClick={cancelarEdicion} style={styles.linkCancelar}>Cancelar edición</button>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Nombre completo *</label>
                <input style={styles.input} placeholder="Juan Pérez"
                  {...register('nombre', { required: true })} />
                {errors.nombre && <span style={styles.errorCampo}>Requerido</span>}
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Cédula *</label>
                <input style={styles.input} placeholder="123456789"
                  {...register('cedula', { required: true })} />
                {errors.cedula && <span style={styles.errorCampo}>Requerido</span>}
              </div>
            </div>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Celular *</label>
                <input style={styles.input} placeholder="3001234567"
                  {...register('celular', { required: true })} />
                {errors.celular && <span style={styles.errorCampo}>Requerido</span>}
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Correo</label>
                <input style={styles.input} placeholder="correo@ejemplo.com" type="email"
                  {...register('correo')} />
              </div>
            </div>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Ciudad *</label>
                <input style={styles.input} placeholder="Bogotá"
                  {...register('ciudad', { required: true })} />
                {errors.ciudad && <span style={styles.errorCampo}>Requerido</span>}
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Dirección *</label>
                <input style={styles.input} placeholder="Calle 123 # 45-67"
                  {...register('direccion', { required: true })} />
                {errors.direccion && <span style={styles.errorCampo}>Requerido</span>}
              </div>
            </div>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}># Cuenta</label>
                <input style={styles.input} placeholder="Número de cuenta"
                  {...register('numero_cuenta')} />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>OT</label>
                <input style={styles.input} placeholder="Orden de trabajo"
                  {...register('ot')} />
              </div>
            </div>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Fecha de instalación *</label>
                <input style={styles.input} type="date"
                  {...register('fecha_instalacion', { required: true })} />
                {errors.fecha_instalacion && <span style={styles.errorCampo}>Requerido</span>}
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Franja horaria *</label>
                <select style={styles.input} {...register('franja_horaria', { required: true })}>
                  <option value="">Selecciona una franja</option>
                  <option value="8am - 1pm">8am - 1pm</option>
                  <option value="1pm - 7pm">1pm - 7pm</option>
                </select>
                {errors.franja_horaria && <span style={styles.errorCampo}>Requerido</span>}
              </div>
            </div>

            <div style={styles.fila}>
              <div style={styles.campo}>
                <label style={styles.label}>Estado</label>
                <select style={styles.input} {...register('estado')}>
                   <option value="Pendiente">Pendiente</option>
                   <option value="En proceso">En proceso</option>
                   <option value="Instalada">Instalada</option>
                   <option value="Cancelada">Cancelada</option>
                   <option value="Pagada">Pagada</option>
                </select>
              </div>
            </div>

            {mensaje && (
              <p style={mensaje.tipo === 'exito' ? styles.exito : styles.error}>
                {mensaje.texto}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              style={enviando ? {...styles.boton, opacity: 0.7} : styles.boton}
            >
              {enviando ? 'Guardando...' : ventaEditando ? 'Actualizar Venta' : 'Registrar Venta'}
            </button>
          </form>
        </div>
      )}

      {/* Pestaña Mis Ventas */}
      {pestana === 'ventas' && (
        <div style={styles.card}>
          <input
            style={{...styles.input, marginBottom: '20px', width: '100%'}}
            placeholder="🔍 Buscar por nombre, cédula, celular, OT o # cuenta..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          {cargando ? (
            <p style={{textAlign:'center', color:'#666'}}>Cargando ventas...</p>
          ) : ventasFiltradas.length === 0 ? (
            <p style={{textAlign:'center', color:'#666'}}>No hay ventas registradas.</p>
          ) : (
            <div style={styles.tablaWrapper}>
              <table style={styles.tabla}>
                <thead>
                  <tr style={styles.thead}>
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
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map(v => (
                    <tr key={v.id} style={styles.tr}>
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
                        <button onClick={() => editarVenta(v)} style={styles.botonEditar}>
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
  pestanas: { display: 'flex', gap: '8px', marginBottom: '24px' },
  pestana: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '15px' },
  pestanaActiva: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #4f46e5', backgroundColor: '#4f46e5', color: 'white', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  avisoEdicion: { backgroundColor: '#ebf8ff', border: '1px solid #90cdf4', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px' },
  linkCancelar: { background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fila: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#333' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', backgroundColor: 'white' },
  errorCampo: { color: '#e53e3e', fontSize: '12px' },
  exito: { color: '#38a169', backgroundColor: '#f0fff4', padding: '12px', borderRadius: '8px', textAlign: 'center' },
  error: { color: '#e53e3e', backgroundColor: '#fff5f5', padding: '12px', borderRadius: '8px', textAlign: 'center' },
  boton: { backgroundColor: '#4f46e5', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  tablaWrapper: { overflowX: 'auto', transform: 'rotateX(180deg)' },
  tabla: { transform: 'rotateX(180deg)', width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  thead: { backgroundColor: '#f7fafc' },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#4a5568', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px', color: '#4a5568', whiteSpace: 'nowrap' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  botonEditar: { backgroundColor: 'transparent', border: '1px solid #4f46e5', color: '#4f46e5', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }
}