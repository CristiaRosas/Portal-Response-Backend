import Pedido from "./pedidos.model.js";
import Producto from "../producto/producto.model.js";
import User from "../users/user.model.js";
import { enviarEmailNotificacion } from "../services/email.service.js";

export const obtenerPedidosUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const pedidos = await Pedido.find({ usuario: usuarioId })
      .populate("productos.producto", "nombre descripcion")
      .sort({ createdAt: -1 });

    // Formatear respuesta para mostrar el estado claramente
    const pedidosFormateados = pedidos.map(pedido => ({
      _id: pedido._id,
      codigoSeguimiento: pedido.codigoSeguimiento,
      estado: pedido.estado,
      estadoDescripcion: obtenerDescripcionEstado(pedido.estado),
      total: pedido.total,
      fechaCreacion: pedido.createdAt,
      productos: pedido.productos.map(item => ({
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario
      })),
      direccionEntrega: pedido.direccionEntrega,
      historialReciente: pedido.historialEstados.slice(-3) // Últimos 3 estados
    }));

    res.json({
      success: true,
      total: pedidos.length,
      pedidos: pedidosFormateados
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pedidos",
      error: error.message
    });
  }
};

export const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findById(id)
      .populate("usuario", "name surname email telefono")
      .populate("productos.producto", "nombre descripcion imagen")
      .populate("historialEstados.cambiadoPor", "name email role");

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    // Verificar permisos
    const usuarioId = req.usuario._id;
    const esUsuarioPedido = pedido.usuario._id.toString() === usuarioId.toString();
    const esAdmin = req.usuario.role === "APP_ADMIN";

    if (!esUsuarioPedido && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver este pedido"
      });
    }

    // Formatear respuesta con información del seguimiento
    const respuesta = {
      success: true,
      pedido: {
        _id: pedido._id,
        codigoSeguimiento: pedido.codigoSeguimiento,
        estado: pedido.estado,
        estadoDescripcion: obtenerDescripcionEstado(pedido.estado),
        total: pedido.total,
        fechaCreacion: pedido.createdAt,
        direccionEntrega: pedido.direccionEntrega,
        telefonoContacto: pedido.telefonoContacto,
        observaciones: pedido.observaciones,
        productos: pedido.productos.map(item => ({
          producto: item.producto.nombre,
          descripcion: item.producto.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.cantidad * item.precioUnitario
        })),
        historialCompleto: pedido.historialEstados
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .map(historial => ({
            estado: historial.estado,
            observaciones: historial.observaciones,
            fecha: historial.fecha,
            cambiadoPor: historial.cambiadoPor ? historial.cambiadoPor.name : 'Sistema'
          }))
      }
    };

    res.json(respuesta);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pedido",
      error: error.message
    });
  }
};

export const cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;
    const { emailNotificacion } = req.body;

    const pedido = await Pedido.findById(id)
      .populate("productos.producto", "nombre stock")
      .populate("usuario", "name surname email");

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    if (pedido.usuario._id.toString() !== usuarioId.toString() && req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Solo puedes cancelar tus propios pedidos"
      });
    }

    // Devolver stock de productos
    for (const item of pedido.productos) {
      if (item.producto) {
        const producto = await Producto.findById(item.producto._id);
        if (producto) {
          producto.stock += item.cantidad;
          await producto.save();
        }
      }
    }

    // Determinar quién canceló el pedido
    const canceladoPor = req.usuario.role === "APP_ADMIN" ? "administrador" : "usuario";
    const nombreCancelador = `${req.usuario.name} ${req.usuario.surname}`;
    const observacionesCancelacion = `Pedido cancelado por el ${canceladoPor}: ${nombreCancelador}`;

    // Actualizar estado
    pedido.estado = "cancelado";
    
    pedido.historialEstados.push({
      estado: "cancelado",
      observaciones: observacionesCancelacion,
      cambiadoPor: usuarioId
    });

    await pedido.save();

    // ✅ ENVIAR EMAIL DE CANCELACIÓN si se proporcionó un email
    if (emailNotificacion) {
      try {
        const usuarioInfo = {
          name: pedido.usuario.name,
          surname: pedido.usuario.surname,
          email: pedido.usuario.email
        };

        await enviarEmailNotificacion(pedido, usuarioInfo, "cancelado", emailNotificacion, observacionesCancelacion);
        
        console.log(`✅ Email de cancelación enviado a: ${emailNotificacion}`);
      } catch (emailError) {
        console.error('❌ Error enviando email de cancelación:', emailError);
      }
    }

    const pedidoActualizado = await Pedido.findById(id)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion")
      .populate("historialEstados.cambiadoPor", "name email role");

    res.json({
      success: true,
      message: "Pedido cancelado exitosamente",
      detallesCancelacion: {
        canceladoPor: canceladoPor,
        nombreCancelador: nombreCancelador,
        idCancelador: usuarioId.toString(),
        rolCancelador: req.usuario.role,
        fechaCancelacion: new Date().toISOString(),
        pedidoId: id,
        notificacionEmail: emailNotificacion ? `Notificación enviada a: ${emailNotificacion}` : "No se envió notificación por email"
      },
      pedido: {
        _id: pedidoActualizado._id,
        codigoSeguimiento: pedidoActualizado.codigoSeguimiento,
        estado: pedidoActualizado.estado,
        estadoDescripcion: obtenerDescripcionEstado(pedidoActualizado.estado),
        usuario: {
          id: pedidoActualizado.usuario._id,
          nombre: `${pedidoActualizado.usuario.name} ${pedidoActualizado.usuario.surname}`,
          email: pedidoActualizado.usuario.email
        },
        productos: pedidoActualizado.productos.map(p => ({
          producto: p.producto.nombre,
          cantidad: p.cantidad
        })),
        total: pedidoActualizado.total,
        historial: pedidoActualizado.historialEstados.slice(-1)[0] 
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al cancelar pedido",
      error: error.message
    });
  }
};

export const listarTodosPedidos = async (req, res) => {
  try {
    if (req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Solo los administradores pueden ver todos los pedidos"
      });
    }

    const { limite = 50, desde = 0, estado } = req.query;
    const query = estado ? { estado: estado } : {};

    const pedidos = await Pedido.find(query)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion")
      .sort({ createdAt: -1 })
      .skip(Number(desde))
      .limit(Number(limite));

    const total = await Pedido.countDocuments(query);

    res.json({ 
      success: true, 
      total, 
      pedidos 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al listar pedidos",
      error: error.message
    });
  }
};

export const actualizarEstadoPedido = async (req, res) => {
  try {
    if (req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Solo el administrador puede actualizar estados de pedidos"
      });
    }

    const { id } = req.params;
    const { estado, observaciones, emailNotificacion } = req.body;

    // Validar estado
    const estadosPermitidos = ["pendiente", "confirmado", "en preparacion", "en camino", "entregado", "cancelado"];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Estados permitidos: ${estadosPermitidos.join(", ")}`
      });
    }

    // Validar email si se proporciona
    if (emailNotificacion) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(emailNotificacion)) {
        return res.status(400).json({
          success: false,
          message: "Por favor ingresa un email válido para las notificaciones"
        });
      }
    }

    const pedido = await Pedido.findById(id)
      .populate("usuario", "name surname email");

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    // Guardar estado anterior para el historial
    const estadoAnterior = pedido.estado;

    // Actualizar estado del PEDIDO
    pedido.estado = estado;

    // Agregar al historial
    const nombreAdmin = `${req.usuario.name} ${req.usuario.surname}`;
    
    pedido.historialEstados.push({
      estado: `Pedido actualizado: ${estadoAnterior} → ${estado}`,
      observaciones: observaciones || `Estado cambiado por: ${nombreAdmin}`,
      cambiadoPor: req.usuario._id
    });

    await pedido.save();

    // ✅ ENVIAR EMAIL DE NOTIFICACIÓN si se proporcionó un email
    if (emailNotificacion) {
      try {
        const usuarioInfo = {
          name: pedido.usuario.name,
          surname: pedido.usuario.surname,
          email: pedido.usuario.email
        };

        await enviarEmailNotificacion(pedido, usuarioInfo, estado, emailNotificacion, observaciones);
        
        console.log(`✅ Email de actualización enviado a: ${emailNotificacion}`);
      } catch (emailError) {
        console.error('❌ Error enviando email de notificación:', emailError);
      }
    }

    const pedidoActualizado = await Pedido.findById(id)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion")
      .populate("historialEstados.cambiadoPor", "name email");

    res.json({
      success: true,
      message: `Estado del pedido actualizado exitosamente`,
      detalles: {
        estadoAnterior: estadoAnterior,
        estadoNuevo: estado,
        estadoDescripcion: obtenerDescripcionEstado(estado),
        actualizadoPor: nombreAdmin,
        fechaActualizacion: new Date().toISOString(),
        notificacionEmail: emailNotificacion ? `Notificación enviada a: ${emailNotificacion}` : "No se envió notificación por email"
      },
      pedido: pedidoActualizado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado del pedido",
      error: error.message
    });
  }
};

// Rastrear pedido público (sin autenticación)
export const rastrearPedido = async (req, res) => {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        message: "Código de seguimiento requerido"
      });
    }

    // Buscar pedido por código de seguimiento
    const pedido = await Pedido.findOne({ codigoSeguimiento: codigo.toUpperCase() })
      .populate("usuario", "name surname")
      .populate("productos.producto", "nombre descripcion imagen")
      .populate("historialEstados.cambiadoPor", "name");

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado",
        sugerencia: "Verifica que el código de seguimiento sea correcto"
      });
    }

    // Formatear respuesta para rastreo público (sin información sensible)
    const respuesta = {
      success: true,
      pedido: {
        codigoSeguimiento: pedido.codigoSeguimiento,
        estado: pedido.estado,
        estadoDescripcion: obtenerDescripcionEstado(pedido.estado),
        fechaCreacion: pedido.createdAt,
        ultimaActualizacion: pedido.updatedAt,
        // Información limitada para protección de datos
        productos: pedido.productos.map(item => ({
          nombre: item.producto.nombre,
          cantidad: item.cantidad
        })),
        totalProductos: pedido.productos.length,
        total: pedido.total,
        // Historial formateado para el cliente
        historial: pedido.historialEstados
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .map(historial => ({
            estado: historial.estado,
            observaciones: historial.observaciones,
            fecha: historial.fecha,
            cambiadoPor: historial.cambiadoPor ? 'Sistema' : 'Sistema' // No mostrar nombres reales
          }))
      },
      mensaje: `Pedido ${pedido.codigoSeguimiento} encontrado`
    };

    res.json(respuesta);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al rastrear pedido",
      error: error.message
    });
  }
};

// Obtener código de seguimiento para un pedido (usuario autenticado)
export const obtenerCodigoSeguimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;

    const pedido = await Pedido.findOne({ 
      _id: id, 
      usuario: usuarioId 
    }).select("codigoSeguimiento estado");

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado o no tienes permisos"
      });
    }

    res.json({
      success: true,
      codigoSeguimiento: pedido.codigoSeguimiento,
      estado: pedido.estado,
      enlaceRastreo: `${req.protocol}://${req.get('host')}/PortalResponseDQ/v1/pedidos/rastrear/${pedido.codigoSeguimiento}`,
      mensaje: "Usa este código para rastrear tu pedido sin iniciar sesión"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener código de seguimiento",
      error: error.message
    });
  }
};

// Helper para descripciones de estados
const obtenerDescripcionEstado = (estado) => {
  const descripciones = {
    "pendiente": "Tu pedido está siendo procesado",
    "confirmado": "Pedido confirmado y en preparación",
    "en preparacion": "Tus productos están siendo empacados",
    "en camino": "Tu pedido está en reparto",
    "entregado": "Pedido entregado exitosamente",
    "cancelado": "Pedido cancelado"
  };
  return descripciones[estado] || "Estado desconocido";
};