import Categoria from "./categoria.model.js";

export const obtenerCategoriaPorNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    
    const categoria = await Categoria.findOne({ 
      nombre: { $regex: new RegExp(nombre, 'i') },
      estado: true 
    });

    if (!categoria) {
      const categoriasDisponibles = await Categoria.find({ estado: true }, 'nombre');
      
      return res.status(404).json({
        success: false,
        message: `Categoría "${nombre}" no encontrada`,
        categoriasDisponibles: categoriasDisponibles.map(cat => cat.nombre),
        sugerencia: "Estas son las categorías disponibles:"
      });
    }

    res.json({
      success: true,
      categoria
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al obtener categoría", 
      error: error.message 
    });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const categoria = new Categoria(req.body);
    await categoria.save();
    res.status(200).json({ 
      success: true,
      message: "Categoría creada", 
      categoria 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "La categoría ya existe"
      });
    }
    res.status(500).json({ 
      success: false,
      message: "Error al crear categoría", 
      error: error.message 
    });
  }
};

export const listarCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find({ estado: true });
    res.json({
      success: true,
      categorias
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al listar categorías", 
      error: error.message 
    });
  }
};

export const obtenerCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }
    res.json({
      success: true,
      categoria
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al obtener categoría", 
      error: error.message 
    });
  }
};

export const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByIdAndUpdate(id, req.body, { 
      new: true, 
      runValidators: true 
    });
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }
    res.json({
      success: true,
      message: "Categoría actualizada",
      categoria
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al actualizar categoría", 
      error: error.message 
    });
  }
};

export const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByIdAndUpdate(id, { estado: false }, { new: true });
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada"
      });
    }
    res.json({
      success: true,
      message: "Categoría eliminada",
      categoria
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al eliminar categoría", 
      error: error.message 
    });
  }
};