import Pedido from "./pedidos.model.js";
import Producto from "../producto/producto.model.js";
import User from "../users/user.model.js";

export const crearPedido = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { productos, direccionEntrega, telefonoContacto, observaciones } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe agregar al menos un producto al pedido"
      });
    }

    let total = 0;
    const productosConInfo = [];
    const productosNoEncontrados = [];

    for (const item of productos) {
      const producto = await Producto.findOne({ 
        nombre: { $regex: new RegExp(`^${item.nombre}$`, 'i') }
      });

      if (!producto) {
        productosNoEncontrados.push(item.nombre);
        continue;
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para: ${producto.nombre}. Disponible: ${producto.stock}`,
          producto: producto.nombre,
          stockDisponible: producto.stock
        });
      }

      const subtotal = producto.precio * item.cantidad;
      total += subtotal;

      productosConInfo.push({
        producto: producto._id,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        estado: "pendiente"
      });

      producto.stock -= item.cantidad;
      await producto.save();
    }

    if (productosNoEncontrados.length > 0) {
      const productosDisponibles = await Producto.find({ stock: { $gt: 0 } }, 'nombre precio stock');
      
      return res.status(404).json({
        success: false,
        message: "Algunos productos no fueron encontrados",
        productosNoEncontrados,
        productosDisponibles: productosDisponibles.map(p => ({
          nombre: p.nombre,
          precio: p.precio,
          stock: p.stock
        }))
      });
    }

    const pedido = new Pedido({
      usuario: usuarioId,
      productos: productosConInfo,
      total,
      direccionEntrega,
      telefonoContacto,
      observaciones,
      historialEstados: [{
        estado: "pendiente",
        observaciones: "Pedido creado por el usuario",
        cambiadoPor: usuarioId
      }]
    });

    await pedido.save();

    const pedidoPopulado = await Pedido.findById(pedido._id)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion");

    res.status(201).json({
      success: true,
      message: "Pedido creado exitosamente",
      pedido: pedidoPopulado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al crear pedido",
      error: error.message
    });
  }
};

export const obtenerPedidosUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const pedidos = await Pedido.find({ usuario: usuarioId })
      .populate("productos.producto", "nombre descripcion")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: pedidos.length,
      pedidos
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
      .populate("productos.producto", "nombre descripcion")
      .populate("historialEstados.cambiadoPor", "name email role");

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    const usuarioId = req.usuario._id;
    const esUsuarioPedido = pedido.usuario._id.toString() === usuarioId.toString();
    const esAdmin = req.usuario.role === "APP_ADMIN";

    if (!esUsuarioPedido && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver este pedido"
      });
    }

    res.json({ success: true, pedido });

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

    const pedido = await Pedido.findById(id).populate("productos.producto", "nombre stock");
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    if (pedido.usuario.toString() !== usuarioId.toString() && req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Solo puedes cancelar tus propios pedidos"
      });
    }

    for (const item of pedido.productos) {
      if (item.producto) {
        const producto = await Producto.findById(item.producto._id);
        if (producto) {
          producto.stock += item.cantidad;
          await producto.save();
        }
      }
    }

    const canceladoPor = req.usuario.role === "APP_ADMIN" ? "administrador" : "usuario";
    const nombreCancelador = `${req.usuario.name} ${req.usuario.surname}`;

    pedido.estadoGeneral = "cancelado";
    pedido.productos.forEach(p => p.estado = "cancelado");
    
    pedido.historialEstados.push({
      estado: "cancelado",
      observaciones: `Pedido cancelado por el ${canceladoPor}: ${nombreCancelador}`,
      cambiadoPor: usuarioId
    });

    await pedido.save();

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
        pedidoId: id
      },
      pedido: {
        _id: pedidoActualizado._id,
        estadoGeneral: pedidoActualizado.estadoGeneral,
        usuario: {
          id: pedidoActualizado.usuario._id,
          nombre: `${pedidoActualizado.usuario.name} ${pedidoActualizado.usuario.surname}`,
          email: pedidoActualizado.usuario.email
        },
        productos: pedidoActualizado.productos.map(p => ({
          producto: p.producto.nombre,
          cantidad: p.cantidad,
          estado: p.estado
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
    const query = estado ? { estadoGeneral: estado } : {};

    const pedidos = await Pedido.find(query)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion")
      .sort({ createdAt: -1 })
      .skip(Number(desde))
      .limit(Number(limite));

    const total = await Pedido.countDocuments(query);

    res.json({ success: true, total, pedidos });

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
    const { estado, observaciones } = req.body;

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    pedido.estadoGeneral = estado;
    pedido.productos.forEach(p => p.estado = estado);
    
    const nombreAdmin = `${req.usuario.name} ${req.usuario.surname}`;
    const observacionesCompletas = observaciones || `Estado cambiado a: ${estado}`;
    
    pedido.historialEstados.push({
      estado: `Actualizado a: ${estado}`,
      observaciones: `${observacionesCompletas} - Por: ${nombreAdmin}`,
      cambiadoPor: req.usuario._id
    });

    await pedido.save();

    const pedidoActualizado = await Pedido.findById(id)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion")
      .populate("historialEstados.cambiadoPor", "name email");

    res.json({
      success: true,
      message: `Estado del pedido actualizado a: ${estado}`,
      detallesActualizacion: {
        actualizadoPor: "administrador",
        nombreAdmin: nombreAdmin,
        idAdmin: req.usuario._id.toString(),
        nuevoEstado: estado,
        fechaActualizacion: new Date().toISOString()
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