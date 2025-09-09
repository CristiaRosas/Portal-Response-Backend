import express from "express";
import {
  agregarProveedor,
  editarProveedor,
  eliminarProveedor,
  obtenerProveedorPorId,
  obtenerProveedorPorNombre,
  listarProveedores,
  asignarCategoriaAProveedor,
  obtenerProveedorPorUsuario,
  listarProductosProveedor,
  listarProductosProveedorPorNombre,
  listarProductosProveedorPorUsuario
} from "./proveedor.controller.js";

const router = express.Router();

// Rutas de proveedores
router.post("/agregar", agregarProveedor);
router.put("/editar/:id", editarProveedor);
router.delete("/eliminar/:id", eliminarProveedor);
router.get("/buscar/:id", obtenerProveedorPorId);
router.get("/buscar-nombre/:nombre", obtenerProveedorPorNombre);
router.get("/buscar-usuario/:userId", obtenerProveedorPorUsuario);
router.get("/listar", listarProveedores);
router.post("/asignar-categoria", asignarCategoriaAProveedor);

// Rutas de productos de proveedores
router.get("/productos/:proveedorId", listarProductosProveedor);
router.get("/productos-nombre/:nombreProveedor", listarProductosProveedorPorNombre);
router.get("/productos-usuario/:userId", listarProductosProveedorPorUsuario);

export default router;