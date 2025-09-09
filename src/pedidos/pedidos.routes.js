import { Router } from "express";
import {
  crearPedido,
  editarPedido,
  eliminarPedido,
  obtenerPedidoPorId,
  listarPedidos
} from "./pedidos.controller.js";

const router = Router();

router.post("/", crearPedido);
router.put("/:id", editarPedido);
router.delete("/:id", eliminarPedido);
router.get("/:id", obtenerPedidoPorId);
router.get("/", listarPedidos);

export default router;