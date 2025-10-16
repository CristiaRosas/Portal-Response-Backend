import Producto from "../producto/producto.model.js";
import Categoria from "../categoria/categoria.model.js";

export const agregarProducto = async (req, res) => {
  try {
    if (req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Solo el administrador puede agregar productos"
      });
    }

    const { nombre, descripcion, precio, stock, categoriaNombre } = req.body;

    if (!nombre || !descripcion || !precio || !stock || !categoriaNombre) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos: nombre, descripcion, precio, stock, categoriaNombre"
      });
    }

    if (precio <= 0 || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "El precio debe ser mayor a 0 y el stock no puede ser negativo"
      });
    }

    const categoria = await Categoria.findOne({
      nombre: { $regex: new RegExp(`^${categoriaNombre}$`, 'i') },
      estado: true
    });

    if (!categoria) {
      const categoriasDisponibles = await Categoria.find({ estado: true }, 'nombre');
      return res.status(404).json({
        success: false,
        message: `Categoría "${categoriaNombre}" no encontrada`,
        categoriasDisponibles: categoriasDisponibles.map(cat => cat.nombre)
      });
    }

    const productoExistente = await Producto.findOne({
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    });

    if (productoExistente) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un producto con ese nombre",
        productoExistente: productoExistente.nombre
      });
    }

    const producto = new Producto({
      nombre,
      descripcion,
      precio,
      stock,
      categoria: categoria._id
    });

    await producto.save();

    const productoPopulado = await Producto.findById(producto._id)
      .populate("categoria", "nombre descripcion");

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      producto: productoPopulado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al crear producto",
      error: error.message
    });
  }
};

export const editarProducto = async (req, res) => {
  try {
    if (req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Solo el administrador puede editar productos"
      });
    }

    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoriaNombre } = req.body;


    const productoExistente = await Producto.findById(id);
    if (!productoExistente) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    const updateData = { nombre, descripcion, precio, stock };


    if (precio !== undefined && precio <= 0) {
      return res.status(400).json({
        success: false,
        message: "El precio debe ser mayor a 0"
      });
    }

    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        message: "El stock no puede ser negativo"
      });
    }

    if (categoriaNombre) {
      const categoria = await Categoria.findOne({
        nombre: { $regex: new RegExp(`^${categoriaNombre}$`, 'i') },
        estado: true
      });

      if (!categoria) {
        const categoriasDisponibles = await Categoria.find({ estado: true }, 'nombre');
        return res.status(404).json({
          success: false,
          message: `Categoría "${categoriaNombre}" no encontrada`,
          categoriasDisponibles: categoriasDisponibles.map(cat => cat.nombre)
        });
      }
      updateData.categoria = categoria._id;
    }

    if (nombre) {
      const productoConMismoNombre = await Producto.findOne({
        nombre: { $regex: new RegExp(`^${nombre}$`, 'i') },
        _id: { $ne: id }
      });

      if (productoConMismoNombre) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otro producto con ese nombre"
        });
      }
    }

    const producto = await Producto.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate("categoria", "nombre descripcion");

    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
      producto
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar producto",
      error: error.message
    });
  }
};

export const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findById(id)
      .populate("categoria", "nombre descripcion");
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }
    
    res.json({ 
      success: true, 
      producto 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener producto",
      error: error.message
    });
  }
};

export const listarProductos = async (req, res) => {
  try {
    const productos = await Producto.find()
      .populate("categoria", "nombre descripcion");
    
    res.json({ 
      success: true, 
      total: productos.length,
      productos 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al listar productos",
      error: error.message
    });
  }
};

export const eliminarProductoPorId = async (req, res) => {
  try {
    if (req.usuario.role !== "APP_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Solo el administrador puede eliminar productos"
      });
    }

    const { id } = req.params;
    
    const productoExistente = await Producto.findById(id);
    if (!productoExistente) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    const producto = await Producto.findByIdAndDelete(id)
      .populate("categoria", "nombre");

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
      producto: { 
        nombre: producto.nombre, 
        categoria: producto.categoria.nombre 
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar producto",
      error: error.message
    });
  }
};

export const obtenerProductoPorNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    const producto = await Producto.findOne({
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    }).populate("categoria", "nombre descripcion");

    if (!producto) {
      const productosDisponibles = await Producto.find({}, 'nombre precio stock');
      return res.status(404).json({
        success: false,
        message: `Producto "${nombre}" no encontrado`,
        productosDisponibles: productosDisponibles.map(prod => ({
          nombre: prod.nombre,
          precio: prod.precio,
          stock: prod.stock
        }))
      });
    }

    res.json({ 
      success: true, 
      producto 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener producto",
      error: error.message
    });
  }
};

export const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoriaNombre } = req.params;
    const categoria = await Categoria.findOne({
      nombre: { $regex: new RegExp(`^${categoriaNombre}$`, 'i') },
      estado: true
    });

    if (!categoria) {
      const categoriasDisponibles = await Categoria.find({ estado: true }, 'nombre');
      return res.status(404).json({
        success: false,
        message: `Categoría "${categoriaNombre}" no encontrada`,
        categoriasDisponibles: categoriasDisponibles.map(cat => cat.nombre)
      });
    }

    const productos = await Producto.find({ categoria: categoria._id })
      .populate("categoria", "nombre descripcion");

    res.json({
      success: true,
      categoria: categoria.nombre,
      totalProductos: productos.length,
      productos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos por categoría",
      error: error.message
    });
  }
};

export const buscarProductos = async (req, res) => {
  try {
    const { nombre, categoria, minPrecio, maxPrecio, enStock } = req.query;
    let query = {};

    if (nombre) {
      query.nombre = { $regex: nombre, $options: 'i' };
    }

    if (categoria) {
      const categoriaDoc = await Categoria.findOne({
        nombre: { $regex: new RegExp(`^${categoria}$`, 'i') },
        estado: true
      });
      if (categoriaDoc) {
        query.categoria = categoriaDoc._id;
      }
    }

    if (minPrecio || maxPrecio) {
      query.precio = {};
      if (minPrecio) query.precio.$gte = Number(minPrecio);
      if (maxPrecio) query.precio.$lte = Number(maxPrecio);
    }

    if (enStock === 'true') {
      query.stock = { $gt: 0 };
    }

    const productos = await Producto.find(query)
      .populate("categoria", "nombre descripcion")
      .sort({ nombre: 1 });

    res.json({
      success: true,
      total: productos.length,
      filtrosAplicados: {
        nombre: nombre || 'Todos',
        categoria: categoria || 'Todas',
        minPrecio: minPrecio || 'Sin mínimo',
        maxPrecio: maxPrecio || 'Sin máximo',
        enStock: enStock || 'Todos'
      },
      productos
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al buscar productos",
      error: error.message
    });
  }
};