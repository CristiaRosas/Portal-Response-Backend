import { Router } from "express";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { tieneRole } from "../middlewares/validar-roles.js";
import { 
  crearCategoria, 
  listarCategorias, 
  obtenerCategoriaPorId, 
  obtenerCategoriaPorNombre,
  actualizarCategoria, 
  eliminarCategoria 
} from "./categoria.controller.js";

const router = Router();

router.get("/", listarCategorias);
router.get("/id/:id", obtenerCategoriaPorId);
router.get("/nombre/:nombre", obtenerCategoriaPorNombre);
router.post("/agregar", [
  validarJWT,
  tieneRole("APP_ADMIN")
], crearCategoria);

router.put("/:id", [
  validarJWT,
  tieneRole("APP_ADMIN")
], actualizarCategoria);

router.delete("/:id", [
  validarJWT,
  tieneRole("APP_ADMIN")
], eliminarCategoria);

export default router;