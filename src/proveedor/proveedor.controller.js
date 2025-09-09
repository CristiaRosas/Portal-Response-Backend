import Proveedor from "./proveedor.model.js";
import Categoria from "../categoria/categoria.model.js";
import User from "../users/user.model.js";
import Producto from "../producto/producto.model.js";

export const agregarProveedor = async (req, res) => {
  try {
    const { nombre, contacto, userEmail, categoriasNombres } = req.body;

    //Buscar el usuario por email
    const usuario = await User.findOne({ 
      email: { $regex: new RegExp(`^${userEmail}$`, 'i') },
      state: true 
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: `Usuario con email "${userEmail}" no encontrado`,
        sugerencia: "El usuario debe estar registrado en el sistema primero"
      });
    }

    //Verificar si el usuario ya es proveedor
    const proveedorExistente = await Proveedor.findOne({ usuario: usuario._id });
    if (proveedorExistente) {
      return res.status(409).json({
        success: false,
        message: "Este usuario ya está registrado como proveedor",
        proveedor: proveedorExistente.nombre
      });
    }

    //Verificar si el nombre de proveedor ya existe
    const nombreExistente = await Proveedor.findOne({ 
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') } 
    });
    if (nombreExistente) {
      return res.status(409).json({
        success: false,
        message: "El nombre de proveedor ya está en uso"
      });
    }

    //Buscar categorías por nombres
    let categoriasIds = [];
    if (categoriasNombres && categoriasNombres.length > 0) {
      for (const catNombre of categoriasNombres) {
        const categoria = await Categoria.findOne({ 
          nombre: { $regex: new RegExp(`^${catNombre}$`, 'i') },
          estado: true 
        });

        if (!categoria) {
          const categoriasDisponibles = await Categoria.find({ estado: true }, 'nombre');
          return res.status(404).json({
            success: false,
            message: `Categoría "${catNombre}" no encontrada`,
            categoriasDisponibles: categoriasDisponibles.map(cat => cat.nombre)
          });
        }
        categoriasIds.push(categoria._id);
      }
    }

    //Crear el proveedor
    const proveedor = new Proveedor({
      nombre,
      contacto,
      usuario: usuario._id,
      categorias: categoriasIds
    });

    await proveedor.save();

    //Populate para respuesta
    const proveedorPopulado = await Proveedor.findById(proveedor._id)
      .populate("usuario", "name surname email username")
      .populate("categorias", "nombre descripcion");

    res.status(201).json({
      success: true,
      message: "Proveedor creado exitosamente",
      proveedor: proveedorPopulado
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear proveedor",
      error: error.message
    });
  }
};

export const editarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, categoriasNombres } = req.body;

    const updateData = { nombre, contacto };

    // Buscar categorías por nombres si se proporcionan
    if (categoriasNombres && categoriasNombres.length > 0) {
      let categoriasIds = [];
      for (const catNombre of categoriasNombres) {
        const categoria = await Categoria.findOne({ 
          nombre: { $regex: new RegExp(`^${catNombre}$`, 'i') },
          estado: true 
        });

        if (!categoria) {
          const categoriasDisponibles = await Categoria.find({ estado: true }, 'nombre');
          return res.status(404).json({
            success: false,
            message: `Categoría "${catNombre}" no encontrada`,
            categoriasDisponibles: categoriasDisponibles.map(cat => cat.nombre)
          });
        }
        categoriasIds.push(categoria._id);
      }
      updateData.categorias = categoriasIds;
    }

    const proveedor = await Proveedor.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    })
    .populate("usuario", "name surname email username")
    .populate("categorias", "nombre descripcion");

    if (!proveedor) {
      return res.status(404).json({ 
        success: false,
        message: "Proveedor no encontrado" 
      });
    }

    res.json({
      success: true,
      message: "Proveedor actualizado",
      proveedor
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar proveedor", 
      error: error.message 
    });
  }
};

export const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el proveedor tiene productos
    const productosCount = await Producto.countDocuments({ proveedor: id });
    if (productosCount > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar el proveedor porque tiene productos asociados",
        productosCount: productosCount
      });
    }

    const proveedor = await Proveedor.findByIdAndDelete(id);
    if (!proveedor) {
      return res.status(404).json({ 
        success: false,
        message: "Proveedor no encontrado" 
      });
    }

    res.json({
      success: true,
      message: "Proveedor eliminado",
      proveedor: {
        nombre: proveedor.nombre,
        contacto: proveedor.contacto
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar proveedor", 
      error: error.message 
    });
  }
};

export const obtenerProveedorPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findById(id)
      .populate("usuario", "name surname email username")
      .populate("categorias", "nombre descripcion")
      .populate("productos", "nombre precio stock");

    if (!proveedor) {
      return res.status(404).json({ 
        success: false,
        message: "Proveedor no encontrado" 
      });
    }

    res.json({
      success: true,
      proveedor
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener proveedor", 
      error: error.message 
    });
  }
};

export const obtenerProveedorPorNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    const proveedor = await Proveedor.findOne({ 
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') } 
    })
    .populate("usuario", "name surname email username")
    .populate("categorias", "nombre descripcion")
    .populate("productos", "nombre precio stock");

    if (!proveedor) {
      const proveedoresDisponibles = await Proveedor.find({}, 'nombre');
      return res.status(404).json({
        success: false,
        message: `Proveedor "${nombre}" no encontrado`,
        proveedoresDisponibles: proveedoresDisponibles.map(prov => prov.nombre)
      });
    }

    res.json({
      success: true,
      proveedor
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener proveedor", 
      error: error.message 
    });
  }
};

export const listarProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.find()
      .populate("usuario", "name surname email username")
      .populate("categorias", "nombre descripcion");

    res.json({
      success: true,
      proveedores
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al listar proveedores", 
      error: error.message 
    });
  }
};

export const asignarCategoriaAProveedor = async (req, res) => {
  try {
    const { proveedorNombre, categoriaNombre } = req.body;

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

    // Verificar si la categoría ya está asignada
    if (proveedor.categorias.includes(categoria._id)) {
      return res.status(409).json({
        success: false,
        message: "La categoría ya está asignada a este proveedor"
      });
    }

    // Asignar la categoría
    proveedor.categorias.push(categoria._id);
    await proveedor.save();

    // Populate para respuesta
    const proveedorActualizado = await Proveedor.findById(proveedor._id)
      .populate("categorias", "nombre descripcion")
      .populate("usuario", "name email");

    res.json({
      success: true,
      message: "Categoría asignada al proveedor exitosamente",
      proveedor: proveedorActualizado
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al asignar categoría", 
      error: error.message 
    });
  }
};

export const obtenerProveedorPorUsuario = async (req, res) => {
  try {
    const { userId } = req.params;

    const proveedor = await Proveedor.findOne({ usuario: userId })
      .populate("usuario", "name surname email username")
      .populate("categorias", "nombre descripcion")
      .populate("productos", "nombre precio stock");

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: "Usuario no está registrado como proveedor"
      });
    }

    res.json({
      success: true,
      proveedor
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener proveedor", 
      error: error.message 
    });
  }
};

export const listarProductosProveedor = async (req, res) => {
  try {
    const { proveedorId } = req.params;

    // Verificar si el proveedor existe
    const proveedor = await Proveedor.findById(proveedorId);
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado"
      });
    }

    // Obtener productos del proveedor con información completa
    const productos = await Producto.find({ proveedor: proveedorId })
      .populate("categoria", "nombre descripcion")
      .populate("proveedor", "nombre contacto")
      .select("nombre descripcion precio stock categoria estado");

    res.json({
      success: true,
      proveedor: {
        nombre: proveedor.nombre,
        contacto: proveedor.contacto
      },
      totalProductos: productos.length,
      productos
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al listar productos del proveedor",
      error: error.message
    });
  }
};

export const listarProductosProveedorPorNombre = async (req, res) => {
  try {
    const { nombreProveedor } = req.params;

    // Buscar proveedor por nombre
    const proveedor = await Proveedor.findOne({ 
      nombre: { $regex: new RegExp(`^${nombreProveedor}$`, 'i') } 
    });

    if (!proveedor) {
      const proveedoresDisponibles = await Proveedor.find({}, 'nombre');
      return res.status(404).json({
        success: false,
        message: `Proveedor "${nombreProveedor}" no encontrado`,
        proveedoresDisponibles: proveedoresDisponibles.map(prov => prov.nombre)
      });
    }

    // Obtener productos del proveedor
    const productos = await Producto.find({ proveedor: proveedor._id })
      .populate("categoria", "nombre descripcion")
      .populate("proveedor", "nombre contacto")
      .select("nombre descripcion precio stock categoria estado");

    res.json({
      success: true,
      proveedor: {
        nombre: proveedor.nombre,
        contacto: proveedor.contacto
      },
      totalProductos: productos.length,
      productos
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al listar productos del proveedor",
      error: error.message
    });
  }
};

export const listarProductosProveedorPorUsuario = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar proveedor por usuario
    const proveedor = await Proveedor.findOne({ usuario: userId })
      .populate("usuario", "name surname email");

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: "Usuario no está registrado como proveedor"
      });
    }

    // Obtener productos del proveedor
    const productos = await Producto.find({ proveedor: proveedor._id })
      .populate("categoria", "nombre descripcion")
      .select("nombre descripcion precio stock categoria estado");

    res.json({
      success: true,
      proveedor: {
        nombre: proveedor.nombre,
        contacto: proveedor.contacto,
        usuario: proveedor.usuario
      },
      totalProductos: productos.length,
      productos
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al listar productos del proveedor",
      error: error.message
    });
  }
};