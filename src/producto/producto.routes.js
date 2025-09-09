import express from "express";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { esProveedor } from "../middlewares/validar-proveedor.js";
import {
    agregarProducto,
    editarProducto,
    eliminarProducto,
    eliminarProductoPorId,
    obtenerProductoPorId,
    obtenerProductoPorNombre,
    obtenerProductosPorCategoria,
    obtenerProductosPorProveedor,
    listarProductos,
    listarProductosProveedor
} from "../producto/producto.controller.js";

const router = express.Router();

// Públicas
router.get("/listar", listarProductos);
router.get("/buscar/:id", obtenerProductoPorId);
router.get("/buscar-nombre/:nombre", obtenerProductoPorNombre);
router.get("/categoria/:categoriaNombre", obtenerProductosPorCategoria);
router.get("/proveedor/:proveedorNombre", obtenerProductosPorProveedor);

// Protegidas - Solo proveedores
router.post("/agregar", [
  validarJWT,
  esProveedor
], agregarProducto);

router.put("/editar/:id", [
  validarJWT,
  esProveedor
], editarProducto);

router.delete("/eliminar", [
  validarJWT,
  esProveedor
], eliminarProducto);

router.delete("/eliminar/:id", [
  validarJWT,
  esProveedor
], eliminarProductoPorId);

router.get("/mis-productos", [
  validarJWT,
  esProveedor
], listarProductosProveedor);

export default router;