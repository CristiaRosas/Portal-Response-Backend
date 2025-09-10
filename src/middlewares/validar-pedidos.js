import Pedido from "../pedidos/pedidos.model.js";
import Producto from "../producto/producto.model.js";

export const validarStockProductos = async (req, res, next) => {
  try {
    const { productos } = req.body;

    for (const item of productos) {
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${item.producto} no encontrado`
        });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para: ${producto.nombre}. Disponible: ${producto.stock}`
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validando stock",
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
        message: "No tienes permisos para esta acción"
      });
    }

    req.pedido = pedido;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validando permisos",
      error: error.message
    });
  }
};