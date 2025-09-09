import Pedido from "./pedidos.model.js";

export const crearPedido = async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    await pedido.save();
    res.status(200).json({ message: "Pedido creado", pedido });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear pedido", error });
  }
};

export const editarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json({ message: "Pedido actualizado", pedido });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar pedido", error });
  }
};

export const eliminarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findByIdAndDelete(id);
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json({ message: "Pedido eliminado", pedido });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar pedido", error });
  }
};

export const obtenerPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findById(id).populate("usuario").populate("productos.producto");
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener pedido", error });
  }
};

export const listarPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate("usuario").populate("productos.producto");
    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar pedidos", error });
  }
};