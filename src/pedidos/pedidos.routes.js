import { Router } from "express";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import {
  validarStockProductos,
  validarPropietarioPedido,
  validarPedidoPendiente,
  validarSoloAdmin,
  validarCamposPedido
} from "../middlewares/validar-pedidos.js";

import {
  crearPedido,
  obtenerPedidosUsuario,
  obtenerPedidoPorId,
  cancelarPedido,
  listarTodosPedidos,
  actualizarEstadoPedido
} from "./pedidos.controller.js";

const router = Router();

router.post("/crear", [
  validarJWT,
  validarCamposPedido,
  validarStockProductos
], crearPedido);

router.get("/mis-pedidos", [validarJWT], obtenerPedidosUsuario);

router.get("/:id", [
  validarJWT,
  validarPropietarioPedido
], obtenerPedidoPorId);

router.put("/cancelar/:id", [
  validarJWT,
  validarPropietarioPedido,
  validarPedidoPendiente
], cancelarPedido);

router.get("/admin/todos", [
  validarJWT,
  validarSoloAdmin
], listarTodosPedidos);

router.put("/admin/actualizar-estado/:id", [
  validarJWT,
  validarSoloAdmin
], actualizarEstadoPedido);

export default router;