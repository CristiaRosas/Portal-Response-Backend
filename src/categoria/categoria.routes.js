import { Router } from "express";
import { 
  crearCategoria, 
  listarCategorias, 
  obtenerCategoriaPorId, 
  obtenerCategoriaPorNombre,
  actualizarCategoria, 
  eliminarCategoria 
} from "./categoria.controller.js";

const router = Router();

router.post("/agregar", crearCategoria);
router.get("/", listarCategorias);
router.get("/id/:id", obtenerCategoriaPorId); // Por ID
router.get("/nombre/:nombre", obtenerCategoriaPorNombre); // Por nombre
router.put("/:id", actualizarCategoria);
router.delete("/:id", eliminarCategoria);

export default router;