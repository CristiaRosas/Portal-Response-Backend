import Pedido from "./pedidos.model.js";
import Producto from "../producto/producto.model.js";
import User from "../users/user.model.js";
import Proveedor from "../proveedor/proveedor.model.js";

export const crearPedido = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { productos, direccionEntrega, telefonoContacto, observaciones } = req.body;

    // Validar que hay productos
    if (!productos || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe agregar al menos un producto al pedido"
      });
    }

    let total = 0;
    const productosConInfo = [];
    const productosNoEncontrados = [];

    // Procesar cada producto del pedido
    for (const item of productos) {
      // Buscar producto por nombre (case insensitive)
      const producto = await Producto.findOne({ 
        nombre: { $regex: new RegExp(`^${item.nombre}$`, 'i') }
      }).populate("proveedor", "nombre contacto");

      if (!producto) {
        productosNoEncontrados.push(item.nombre);
        continue;
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para el producto: ${producto.nombre}. Stock disponible: ${producto.stock}`,
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
        proveedor: producto.proveedor._id,
        estado: "pendiente"
      });

      // Reducir stock
      producto.stock -= item.cantidad;
      await producto.save();
    }

    // Si hay productos no encontrados
    if (productosNoEncontrados.length > 0) {
      // Obtener todos los productos disponibles para sugerencias
      const productosDisponibles = await Producto.find({ stock: { $gt: 0 } }, 'nombre precio stock');
      
      return res.status(404).json({
        success: false,
        message: "Algunos productos no fueron encontrados",
        productosNoEncontrados,
        productosDisponibles: productosDisponibles.map(p => ({
          nombre: p.nombre,
          precio: p.precio,
          stock: p.stock
        })),
        sugerencia: "Estos son los productos disponibles:"
      });
    }

    // Crear el pedido
    const pedido = new Pedido({
      usuario: usuarioId,
      productos: productosConInfo,
      total,
      direccionEntrega,
      telefonoContacto,
      observaciones,
      historialEstados: [{
        estado: "pendiente",
        observaciones: "Pedido creado",
        cambiadoPor: usuarioId
      }]
    });

    await pedido.save();

    // Populate para respuesta
    const pedidoPopulado = await Pedido.findById(pedido._id)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion")
      .populate("productos.proveedor", "nombre contacto")
      .populate("historialEstados.cambiadoPor", "name email");

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

export const actualizarEstadoProducto = async (req, res) => {
  try {
    const { pedidoId, nombreProducto } = req.params;
    const { estado, observaciones } = req.body;
    const proveedorId = req.proveedor._id;

    const pedido = await Pedido.findById(pedidoId)
      .populate("productos.producto", "nombre")
      .populate("productos.proveedor", "nombre");

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    // Buscar el índice del producto por nombre
    const productoIndex = pedido.productos.findIndex(p => 
      p.producto.nombre.toLowerCase() === nombreProducto.toLowerCase()
    );

    if (productoIndex === -1) {
      // Mostrar productos disponibles en este pedido
      const productosEnPedido = pedido.productos.map(p => p.producto.nombre);
      
      return res.status(404).json({
        success: false,
        message: `Producto "${nombreProducto}" no encontrado en el pedido`,
        productosEnPedido,
        sugerencia: "Estos son los productos en este pedido:"
      });
    }

    // Verificar que el producto pertenece al proveedor
    const productoPedido = pedido.productos[productoIndex];
    if (productoPedido.proveedor._id.toString() !== proveedorId.toString()) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar este producto"
      });
    }

    // Actualizar estado del producto
    pedido.productos[productoIndex].estado = estado;
    pedido.productos[productoIndex].fechaActualizacion = new Date();

    // Agregar al historial
    pedido.historialEstados.push({
      estado: `Producto "${nombreProducto}" actualizado a: ${estado}`,
      observaciones: observaciones || `Estado cambiado por el proveedor`,
      cambiadoPor: req.usuario._id
    });

    await pedido.save();

    const pedidoActualizado = await Pedido.findById(pedidoId)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion")
      .populate("productos.proveedor", "nombre contacto")
      .populate("historialEstados.cambiadoPor", "name email");

    res.json({
      success: true,
      message: `Estado del producto "${nombreProducto}" actualizado`,
      pedido: pedidoActualizado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado",
      error: error.message
    });
  }
};

export const obtenerPedidosUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const pedidos = await Pedido.find({ usuario: usuarioId })
      .populate("productos.producto", "nombre descripcion imagen")
      .populate("productos.proveedor", "nombre contacto")
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

export const obtenerPedidosProveedor = async (req, res) => {
  try {
    const proveedorId = req.proveedor._id;
    
    const pedidos = await Pedido.find({
      "productos.proveedor": proveedorId
    })
    .populate("usuario", "name surname email")
    .populate("productos.producto", "nombre descripcion")
    .sort({ createdAt: -1 });

    // Filtrar solo los productos del proveedor
    const pedidosFiltrados = pedidos.map(pedido => ({
      ...pedido.toObject(),
      productos: pedido.productos.filter(p => p.proveedor.toString() === proveedorId.toString())
    }));

    res.json({
      success: true,
      total: pedidosFiltrados.length,
      pedidos: pedidosFiltrados
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
      .populate("productos.proveedor", "nombre contacto email")
      .populate("historialEstados.cambiadoPor", "name email role");

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    // Verificar permisos (usuario o proveedor relacionado)
    const usuarioId = req.usuario._id;
    const esUsuarioPedido = pedido.usuario._id.toString() === usuarioId.toString();
    const esProveedorRelacionado = pedido.productos.some(p => 
      p.proveedor && p.proveedor._id.toString() === usuarioId.toString()
    );
    const esAdmin = req.usuario.role === "APP_ADMIN";

    if (!esUsuarioPedido && !esProveedorRelacionado && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para ver este pedido"
      });
    }

    res.json({
      success: true,
      pedido
    });

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

    // Verificar que el usuario es el dueño del pedido
    if (pedido.usuario.toString() !== usuarioId.toString()) {
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

    // Actualizar estado
    pedido.estadoGeneral = "cancelado";
    pedido.productos.forEach(p => p.estado = "cancelado");
    
    pedido.historialEstados.push({
      estado: "cancelado",
      observaciones: "Pedido cancelado por el usuario",
      cambiadoPor: usuarioId
    });

    await pedido.save();

    const pedidoActualizado = await Pedido.findById(id)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion")
      .populate("productos.proveedor", "nombre contacto");

    res.json({
      success: true,
      message: "Pedido cancelado exitosamente",
      pedido: pedidoActualizado
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
    // Solo para administradores
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
      .populate("productos.proveedor", "nombre contacto")
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