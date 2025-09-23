import express from "express";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import {
    agregarProducto,
    editarProducto,
    eliminarProductoPorId,
    obtenerProductoPorId,
    obtenerProductoPorNombre,
    obtenerProductosPorCategoria,
    listarProductos,
    buscarProductos
} from "../producto/producto.controller.js";

const router = express.Router();


router.get("/listar", listarProductos);
router.get("/buscar", buscarProductos); 
router.get("/buscar/:id", obtenerProductoPorId);
router.get("/buscar-nombre/:nombre", obtenerProductoPorNombre);
router.get("/categoria/:categoriaNombre", obtenerProductosPorCategoria);


router.post("/agregar", [
  validarJWT,
  tieneRole("APP_ADMIN")
], agregarProducto);

router.put("/editar/:id", [
  validarJWT,
  tieneRole("APP_ADMIN")
], editarProducto);

router.delete("/eliminar/:id", [
  validarJWT,
  tieneRole("APP_ADMIN")
], eliminarProductoPorId);

export default router;