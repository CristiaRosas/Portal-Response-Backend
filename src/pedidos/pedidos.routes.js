import { Router } from "express";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import {
  validarPropietarioPedido,
  validarPedidoPendiente
} from "../middlewares/validar-pedidos.js";

import {
  obtenerPedidosUsuario,
  obtenerPedidoPorId,
  cancelarPedido,
  listarTodosPedidos,
  actualizarEstadoPedido,
  rastrearPedido,
  obtenerCodigoSeguimiento
} from "./pedidos.controller.js";

const router = Router();
router.get("/rastrear/:codigo", rastrearPedido);

// Usuarios normales
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

// Administrador
router.get("/admin/todos", [
  validarJWT,
  tieneRole("APP_ADMIN")
], listarTodosPedidos);

router.put("/admin/actualizar-estado/:id", [
  validarJWT,
  tieneRole("APP_ADMIN")
], actualizarEstadoPedido);

export default router;