import { Router } from "express";
import { validarJWT } from "../middlewares/validar-jwt.js";
import {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  vaciarCarrito,
  confirmarCompra
} from "./carrito.controller.js";

const router = Router();

// Todas las rutas requieren autenticación
router.get("/", validarJWT, obtenerCarrito);
router.post("/agregar", validarJWT, agregarAlCarrito);
router.put("/actualizar-cantidad", validarJWT, actualizarCantidad);
router.delete("/eliminar", validarJWT, eliminarDelCarrito);
router.delete("/vaciar", validarJWT, vaciarCarrito);
router.post("/confirmar-compra", validarJWT, confirmarCompra);

export default router;