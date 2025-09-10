import { Router } from "express";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { esProveedor } from "../middlewares/validar-proveedor.js";
import { tieneRole } from "../middlewares/validar-roles.js";

import {
  crearPedido,
  actualizarEstadoProducto,
  obtenerPedidosUsuario,
  obtenerPedidosProveedor,
  obtenerPedidoPorId,
  cancelarPedido,
  listarTodosPedidos
} from "./pedidos.controller.js";

const router = Router();

// Públicas (pero requieren autenticación)
router.post("/crear", [
  validarJWT
], crearPedido);

router.get("/mis-pedidos", [
  validarJWT
], obtenerPedidosUsuario);

router.get("/:id", [
  validarJWT
], obtenerPedidoPorId);

router.put("/cancelar/:id", [
  validarJWT
], cancelarPedido);

// Rutas para proveedores
router.get("/proveedor/mis-pedidos", [
  validarJWT,
  esProveedor
], obtenerPedidosProveedor);

router.put("/proveedor/actualizar-estado/:pedidoId/:nombreProducto", [
  validarJWT,
  esProveedor
], actualizarEstadoProducto);

// Rutas para administradores
router.get("/admin/todos", [
  validarJWT,
  tieneRole("APP_ADMIN")
], listarTodosPedidos);

export default router;