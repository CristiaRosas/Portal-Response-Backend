import Proveedor from "../proveedor/proveedor.model.js";
import Producto from "../producto/producto.model.js";

export const esProveedor = async (req, res, next) => {
  try {
    const userId = req.usuario._id;
    
    const proveedor = await Proveedor.findOne({ 
      usuario: userId,
      estado: true 
    });

    if (!proveedor) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado. Debes ser un proveedor registrado"
      });
    }

    req.proveedor = proveedor;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al verificar proveedor",
      error: error.message
    });
  }
};

export const esProveedorDelProducto = async (req, res, next) => {
  try {
    const userId = req.usuario._id;
    const { id } = req.params;

    const proveedor = await Proveedor.findOne({ 
      usuario: userId,
      estado: true 
    });

    if (!proveedor) {
      return res.status(403).json({
        success: false,
        message: "Debes ser un proveedor registrado"
      });
    }

    const producto = await Producto.findOne({
      _id: id,
      proveedor: proveedor._id
    });

    if (!producto) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para modificar este producto"
      });
    }

    req.proveedor = proveedor;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al verificar permisos",
      error: error.message
    });
  }
};