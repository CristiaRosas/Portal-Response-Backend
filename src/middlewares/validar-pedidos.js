import Pedido from "../pedidos/pedidos.model.js";
import Producto from "../producto/producto.model.js";

export const validarStockProductos = async (req, res, next) => {
  try {
    const { productos } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe agregar al menos un producto al pedido"
      });
    }

    const productosNoEncontrados = [];
    const productosSinStock = [];

    for (const item of productos) {
      const producto = await Producto.findOne({ 
        nombre: { $regex: new RegExp(`^${item.nombre}$`, 'i') }
      });

      if (!producto) {
        productosNoEncontrados.push(item.nombre);
        continue;
      }

      if (producto.stock < item.cantidad) {
        productosSinStock.push({
          nombre: producto.nombre,
          stockDisponible: producto.stock,
          cantidadSolicitada: item.cantidad
        });
      }
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
        })),
        sugerencia: "Estos son los productos disponibles:"
      });
    }

    if (productosSinStock.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Stock insuficiente para algunos productos",
        productosSinStock,
        sugerencia: "Revise las cantidades solicitadas"
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validando stock de productos",
      error: error.message
    });
  }
};

export const validarPropietarioPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario._id;

    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    if (pedido.usuario.toString() !== usuarioId.toString() && req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción"
      });
    }

    req.pedido = pedido;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validando permisos del pedido",
      error: error.message
    });
  }
};

export const validarPedidoPendiente = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const pedido = await Pedido.findById(id);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    if (pedido.estadoGeneral !== "pendiente") {
      return res.status(400).json({
        success: false,
        message: `No se puede modificar un pedido en estado: ${pedido.estadoGeneral}`,
        estadoActual: pedido.estadoGeneral,
        accionesPermitidas: "Solo se pueden modificar pedidos en estado 'pendiente'"
      });
    }

    req.pedido = pedido;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validando estado del pedido",
      error: error.message
    });
  }
};

export const validarSoloAdmin = async (req, res, next) => {
  try {
    if (req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Solo el administrador puede realizar esta acción"
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validando permisos de administrador",
      error: error.message
    });
  }
};

export const validarCamposPedido = async (req, res, next) => {
  try {
    const { productos, direccionEntrega, telefonoContacto } = req.body;

    if (!productos || !direccionEntrega || !telefonoContacto) {
      return res.status(400).json({
        success: false,
        message: "Campos requeridos: productos, direccionEntrega, telefonoContacto",
        camposFaltantes: {
          productos: !productos ? "Falta el array de productos" : "OK",
          direccionEntrega: !direccionEntrega ? "Falta la dirección de entrega" : "OK",
          telefonoContacto: !telefonoContacto ? "Falta el teléfono de contacto" : "OK"
        }
      });
    }

    if (!Array.isArray(productos)) {
      return res.status(400).json({
        success: false,
        message: "El campo 'productos' debe ser un array"
      });
    }

    for (const [index, producto] of productos.entries()) {
      if (!producto.nombre || !producto.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Producto en posición ${index} incompleto`,
          producto: producto,
          camposRequeridos: {
            nombre: "Nombre del producto",
            cantidad: "Cantidad numérica"
          }
        });
      }

      if (typeof producto.cantidad !== 'number' || producto.cantidad < 1) {
        return res.status(400).json({
          success: false,
          message: `Cantidad inválida para el producto: ${producto.nombre}`,
          producto: producto.nombre,
          cantidadActual: producto.cantidad,
          requerido: "Número mayor a 0"
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validando campos del pedido",
      error: error.message
    });
  }
};