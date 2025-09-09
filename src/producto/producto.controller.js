import Producto from "../producto/producto.model.js";
import Categoria from "../categoria/categoria.model.js";
import Proveedor from "../proveedor/proveedor.model.js";

export const agregarProducto = async (req, res) => {
  try {
    // El proveedor viene del middleware esProveedor
    const proveedorId = req.proveedor._id;
    const { nombre, descripcion, precio, stock, categoriaNombre } = req.body;

    // Validar campos requeridos
    if (!nombre || !descripcion || !precio || !stock || !categoriaNombre) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos: nombre, descripcion, precio, stock, categoriaNombre"
      });
    }

    // Buscar categoría por nombre
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

    // Crear el producto (asignado automáticamente al proveedor del token)
    const producto = new Producto({
      nombre,
      descripcion,
      precio,
      stock,
      categoria: categoria._id,
      proveedor: proveedorId // Se asigna automáticamente del token
    });

    await producto.save();

    // Actualizar la lista de productos del proveedor
    await Proveedor.findByIdAndUpdate(
      proveedorId,
      { $push: { productos: producto._id } }
    );

    //Populate para respuesta
    const productoPopulado = await Producto.findById(producto._id)
      .populate("categoria", "nombre descripcion")
      .populate("proveedor", "nombre contacto");

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
    const { id } = req.params;
    const proveedorId = req.proveedor._id;
    const { nombre, descripcion, precio, stock, categoriaNombre } = req.body;

    //Verificar que el producto pertenezca al proveedor
    const productoExistente = await Producto.findOne({ 
      _id: id, 
      proveedor: proveedorId 
    });

    if (!productoExistente) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para editar este producto"
      });
    }

    const updateData = { nombre, descripcion, precio, stock };

    //Si se proporciona categoría, buscarla
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

    const producto = await Producto.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
    .populate("categoria", "nombre descripcion")
    .populate("proveedor", "nombre contacto");

    res.json({
      success: true,
      message: "Producto actualizado",
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
      .populate("categoria", "nombre descripcion")
      .populate("proveedor", "nombre contacto email");
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
      .populate("categoria", "nombre descripcion")
      .populate("proveedor", "nombre contacto email");
    res.json({
      success: true,
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

export const eliminarProducto = async (req, res) => {
  try {
    const { nombreProducto, proveedorNombre } = req.body;

    // Buscar proveedor si se proporciona
    let proveedor = null;
    let query = { nombre: { $regex: new RegExp(`^${nombreProducto}$`, 'i') } };

    if (proveedorNombre) {
      proveedor = await Proveedor.findOne({ 
        nombre: { $regex: new RegExp(`^${proveedorNombre}$`, 'i') },
        estado: true 
      });

      if (!proveedor) {
        const proveedoresDisponibles = await Proveedor.find({ estado: true }, 'nombre');
        return res.status(404).json({
          success: false,
          message: `Proveedor "${proveedorNombre}" no encontrado`,
          proveedoresDisponibles: proveedoresDisponibles.map(prov => prov.nombre)
        });
      }
      
      query.proveedor = proveedor._id;
    }

    // Buscar producto por nombre (y proveedor si se especificó)
    const producto = await Producto.findOne(query)
      .populate("proveedor", "nombre contacto email");

    if (!producto) {
      let message = `Producto "${nombreProducto}" no encontrado`;
      
      // Mostrar productos disponibles del proveedor si se especificó
      if (proveedor) {
        const productosProveedor = await Producto.find({ proveedor: proveedor._id })
          .populate("categoria", "nombre")
          .select("nombre precio stock");
        
        message += ` en el proveedor "${proveedorNombre}"`;
        
        return res.status(404).json({
          success: false,
          message: message,
          productosDisponibles: productosProveedor,
          proveedor: {
            nombre: proveedor.nombre,
            contacto: proveedor.contacto
          }
        });
      }

      // Si no se especificó proveedor, mostrar todos los productos
      const todosProductos = await Producto.find()
        .populate("proveedor", "nombre")
        .populate("categoria", "nombre")
        .select("nombre precio stock proveedor categoria");
      
      return res.status(404).json({
        success: false,
        message: message,
        todosLosProductos: todosProductos,
        sugerencia: "Productos disponibles en el sistema:"
      });
    }

    // Eliminar el producto
    await Producto.findByIdAndDelete(producto._id);

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
      productoEliminado: {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        proveedor: producto.proveedor ? producto.proveedor.nombre : "Sin proveedor",
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

export const eliminarProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByIdAndDelete(id)
      .populate("proveedor", "nombre contacto")
      .populate("categoria", "nombre");

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      });
    }

    res.json({
      success: true,
      message: "Producto eliminado",
      producto: {
        nombre: producto.nombre,
        proveedor: producto.proveedor ? producto.proveedor.nombre : "Sin proveedor",
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

export const listarProductosProveedor = async (req, res) => {
  try {
    // El proveedor viene del middleware esProveedor
    const proveedorId = req.proveedor._id;

    // Obtener productos del proveedor con información completa
    const productos = await Producto.find({ proveedor: proveedorId })
      .populate("categoria", "nombre descripcion")
      .populate("proveedor", "nombre contacto")
      .select("nombre descripcion precio stock categoria estado");

    res.json({
      success: true,
      proveedor: {
        nombre: req.proveedor.nombre,
        contacto: req.proveedor.contacto
      },
      totalProductos: productos.length,
      productos
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error al listar productos del proveedor",
      error: error.message
    });
  }
};

export const obtenerProductoPorNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    
    const producto = await Producto.findOne({ 
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') } 
    })
    .populate("categoria", "nombre descripcion")
    .populate("proveedor", "nombre contacto email");

    if (!producto) {
      const productosDisponibles = await Producto.find({}, 'nombre');
      return res.status(404).json({
        success: false,
        message: `Producto "${nombre}" no encontrado`,
        productosDisponibles: productosDisponibles.map(prod => prod.nombre)
      });
    }

    res.json({
      success: true,
      producto
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener producto",
      error: error.message
    });
  }
};

//Función para obtener productos por categoría
export const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoriaNombre } = req.params;

    // Buscar categoría por nombre
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
      .populate("categoria", "nombre descripcion")
      .populate("proveedor", "nombre contacto email");

    res.json({
      success: true,
      categoria: categoria.nombre,
      totalProductos: productos.length,
      productos
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener productos por categoría",
      error: error.message
    });
  }
};

//Función para obtener productos por proveedor
export const obtenerProductosPorProveedor = async (req, res) => {
  try {
    const { proveedorNombre } = req.params;

    // Buscar proveedor por nombre
    const proveedor = await Proveedor.findOne({ 
      nombre: { $regex: new RegExp(`^${proveedorNombre}$`, 'i') } 
    });

    if (!proveedor) {
      const proveedoresDisponibles = await Proveedor.find({}, 'nombre');
      return res.status(404).json({
        success: false,
        message: `Proveedor "${proveedorNombre}" no encontrado`,
        proveedoresDisponibles: proveedoresDisponibles.map(prov => prov.nombre)
      });
    }

    const productos = await Producto.find({ proveedor: proveedor._id })
      .populate("categoria", "nombre descripcion")
      .populate("proveedor", "nombre contacto email");

    res.json({
      success: true,
      proveedor: proveedor.nombre,
      totalProductos: productos.length,
      productos
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener productos por proveedor",
      error: error.message
    });
  }
};