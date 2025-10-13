import Carrito from "./carrito.model.js";
import Producto from "../producto/producto.model.js";
import Pedido from "../pedidos/pedidos.model.js";
import { enviarEmailNotificacion } from "../services/email.service.js";

// Obtener carrito del usuario
export const obtenerCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    let carrito = await Carrito.findOne({ usuario: usuarioId })
      .populate("productos.producto", "nombre descripcion precio stock imagenes");

    if (!carrito) {
      // Crear carrito vacío si no existe
      carrito = new Carrito({
        usuario: usuarioId,
        productos: [],
        total: 0
      });
      await carrito.save();
    }

    res.json({
      success: true,
      carrito
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener carrito",
      error: error.message
    });
  }
};

// Agregar producto al carrito
export const agregarAlCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { nombreProducto, cantidad = 1 } = req.body;

    // Validar cantidad
    if (cantidad < 1) {
      return res.status(400).json({
        success: false,
        message: "La cantidad debe ser al menos 1"
      });
    }

    // Buscar producto por nombre
    const producto = await Producto.findOne({
      nombre: { $regex: new RegExp(`^${nombreProducto}$`, 'i') }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `Producto "${nombreProducto}" no encontrado`
      });
    }

    // Verificar stock
    if (producto.stock < cantidad) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${producto.stock}`,
        stockDisponible: producto.stock
      });
    }

    // Buscar o crear carrito
    let carrito = await Carrito.findOne({ usuario: usuarioId });

    if (!carrito) {
      carrito = new Carrito({ usuario: usuarioId, productos: [] });
    }

    // Verificar si el producto ya está en el carrito
    const productoExistenteIndex = carrito.productos.findIndex(
      item => item.producto.toString() === producto._id.toString()
    );

    if (productoExistenteIndex !== -1) {
      // Actualizar cantidad si ya existe
      const nuevaCantidad = carrito.productos[productoExistenteIndex].cantidad + cantidad;
      
      if (producto.stock < nuevaCantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para la cantidad solicitada. Disponible: ${producto.stock}`,
          stockDisponible: producto.stock
        });
      }

      carrito.productos[productoExistenteIndex].cantidad = nuevaCantidad;
      carrito.productos[productoExistenteIndex].subtotal = nuevaCantidad * producto.precio;
    } else {
      // Agregar nuevo producto al carrito
      carrito.productos.push({
        producto: producto._id,
        cantidad: cantidad,
        precioUnitario: producto.precio,
        subtotal: cantidad * producto.precio
      });
    }

    await carrito.save();

    const carritoPopulado = await Carrito.findById(carrito._id)
      .populate("productos.producto", "nombre descripcion precio stock imagenes");

    res.json({
      success: true,
      message: "Producto agregado al carrito",
      carrito: carritoPopulado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al agregar producto al carrito",
      error: error.message
    });
  }
};

// Actualizar cantidad de producto en el carrito
export const actualizarCantidad = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { nombreProducto, cantidad } = req.body;

    if (cantidad < 1) {
      return res.status(400).json({
        success: false,
        message: "La cantidad debe ser al menos 1"
      });
    }

    const carrito = await Carrito.findOne({ usuario: usuarioId });
    if (!carrito) {
      return res.status(404).json({
        success: false,
        message: "Carrito no encontrado"
      });
    }

    // Buscar producto en la base de datos para verificar stock
    const producto = await Producto.findOne({
      nombre: { $regex: new RegExp(`^${nombreProducto}$`, 'i') }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `Producto "${nombreProducto}" no encontrado`
      });
    }

    // Verificar stock
    if (producto.stock < cantidad) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${producto.stock}`,
        stockDisponible: producto.stock
      });
    }

    // Buscar producto en el carrito
    const productoIndex = carrito.productos.findIndex(
      item => item.producto.toString() === producto._id.toString()
    );

    if (productoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado en el carrito"
      });
    }

    // Actualizar cantidad y subtotal
    carrito.productos[productoIndex].cantidad = cantidad;
    carrito.productos[productoIndex].subtotal = cantidad * producto.precio;

    await carrito.save();

    const carritoPopulado = await Carrito.findById(carrito._id)
      .populate("productos.producto", "nombre descripcion precio stock imagenes");

    res.json({
      success: true,
      message: "Cantidad actualizada",
      carrito: carritoPopulado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar cantidad",
      error: error.message
    });
  }
};

// Eliminar producto del carrito
export const eliminarDelCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { nombreProducto } = req.body;

    const carrito = await Carrito.findOne({ usuario: usuarioId });
    if (!carrito) {
      return res.status(404).json({
        success: false,
        message: "Carrito no encontrado"
      });
    }

    // Buscar producto en la base de datos
    const producto = await Producto.findOne({
      nombre: { $regex: new RegExp(`^${nombreProducto}$`, 'i') }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: `Producto "${nombreProducto}" no encontrado`
      });
    }

    // Filtrar el producto del carrito
    const productosFiltrados = carrito.productos.filter(
      item => item.producto.toString() !== producto._id.toString()
    );

    if (productosFiltrados.length === carrito.productos.length) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado en el carrito"
      });
    }

    carrito.productos = productosFiltrados;
    await carrito.save();

    const carritoPopulado = await Carrito.findById(carrito._id)
      .populate("productos.producto", "nombre descripcion precio stock imagenes");

    res.json({
      success: true,
      message: "Producto eliminado del carrito",
      carrito: carritoPopulado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar producto del carrito",
      error: error.message
    });
  }
};

// Vaciar carrito
export const vaciarCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    const carrito = await Carrito.findOne({ usuario: usuarioId });
    if (!carrito) {
      return res.status(404).json({
        success: false,
        message: "Carrito no encontrado"
      });
    }

    carrito.productos = [];
    carrito.total = 0;
    await carrito.save();

    res.json({
      success: true,
      message: "Carrito vaciado exitosamente",
      carrito
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al vaciar carrito",
      error: error.message
    });
  }
};

// Confirmar compra (crear pedido desde el carrito)
export const confirmarCompra = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { direccionEntrega, telefonoContacto, observaciones, emailNotificacion } = req.body;

    // Validar campos requeridos
    if (!direccionEntrega || !telefonoContacto || !emailNotificacion) {
      return res.status(400).json({
        success: false,
        message: "Dirección de entrega, teléfono de contacto y email de notificación son requeridos"
      });
    }

    // Validar formato de email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(emailNotificacion)) {
      return res.status(400).json({
        success: false,
        message: "Por favor ingresa un email válido para las notificaciones"
      });
    }

    // Obtener carrito con productos poblados
    const carrito = await Carrito.findOne({ usuario: usuarioId })
      .populate("productos.producto", "nombre descripcion precio stock");

    if (!carrito || carrito.productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El carrito está vacío"
      });
    }

    // Verificar stock de todos los productos
    const productosSinStock = [];
    const productosActualizados = [];

    for (const item of carrito.productos) {
      if (item.producto.stock < item.cantidad) {
        productosSinStock.push({
          producto: item.producto.nombre,
          stockDisponible: item.producto.stock,
          cantidadSolicitada: item.cantidad
        });
      } else {
        productosActualizados.push(item);
      }
    }

    if (productosSinStock.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Algunos productos no tienen stock suficiente",
        productosSinStock,
        sugerencia: "Actualice las cantidades en su carrito"
      });
    }

    // Crear pedido (sin modificar el modelo)
    const productosPedido = carrito.productos.map(item => ({
      producto: item.producto._id,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }));

    const pedido = new Pedido({
      usuario: usuarioId,
      productos: productosPedido,
      total: carrito.total,
      direccionEntrega,
      telefonoContacto,
      observaciones: observaciones || "Pedido creado desde carrito",
      historialEstados: [{
        estado: "pendiente",
        observaciones: "Pedido creado desde carrito de compras",
        cambiadoPor: usuarioId
      }]
    });

    // Reducir stock de productos
    for (const item of carrito.productos) {
      const producto = await Producto.findById(item.producto._id);
      producto.stock -= item.cantidad;
      await producto.save();
    }

    await pedido.save();

    // ✅ ENVIAR EMAIL DE CONFIRMACIÓN usando el email proporcionado
    try {
      const usuarioInfo = {
        name: req.usuario.name,
        surname: req.usuario.surname,
        email: req.usuario.email // Email del usuario registrado
      };
      
      await enviarEmailNotificacion(pedido, usuarioInfo, "pendiente", emailNotificacion);
      
      console.log(`✅ Email de confirmación enviado a: ${emailNotificacion}`);
    } catch (emailError) {
      console.error('❌ Error enviando email de confirmación:', emailError);
      // No fallar la operación principal si el email falla
    }

    // Vaciar carrito después de confirmar compra
    carrito.productos = [];
    carrito.total = 0;
    await carrito.save();

    const pedidoPopulado = await Pedido.findById(pedido._id)
      .populate("usuario", "name surname email")
      .populate("productos.producto", "nombre descripcion");

    res.status(201).json({
      success: true,
      message: "Compra confirmada exitosamente",
      pedido: pedidoPopulado,
      notificacion: {
        emailEnviado: true,
        destino: emailNotificacion,
        mensaje: "Se ha enviado un email de confirmación a tu correo"
      },
      carritoActualizado: {
        productos: [],
        total: 0,
        mensaje: "Carrito vaciado después de confirmar compra"
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al confirmar compra",
      error: error.message
    });
  }
};