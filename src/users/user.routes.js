import { Router } from "express";
import { validarJWT } from "../middlewares/validar-jwt.js";
import { check } from "express-validator";
import { existeUsuarioById } from '../helpers/db.validator.js';
import { validarCampos } from '../middlewares/validar-campos.js';
import { tieneRole } from "../middlewares/validar-roles.js";

import {
    preventEmailOrPasswordUpdate,
    validateOldPassword,
    confirmDeletionMiddleware,
    validateUserRole
} from '../middlewares/validar-users.js';

import { usersView, updateUser, updatePassword, deleteUser, updateRole } from './user.controller.js';

const router = Router();

router.get(
    "/usersView",
    [
        validarJWT,
        tieneRole("APP_ADMIN"),
        validarCampos
    ],
    usersView
);

router.put(
    "/updateUser",
    [
        validarJWT, 
        validarCampos
    ],
    updateUser
); updateUser


router.put(
    "/passwordUpdate",
    [
        validarJWT,
        validateOldPassword,
        validarCampos
    ],
    updatePassword
);

router.delete(
    "/userDelete/:id",
    [
        validarJWT,
        tieneRole("APP_ADMIN"),
        check("id", "No es un Id válido").isMongoId(),
        check("id").custom(existeUsuarioById),
        validarCampos
    ],
    deleteUser
);

router.put(
    "/updateRole/:id",
    [
        validarJWT,
        tieneRole("APP_ADMIN"),
        check("id", "No es un Id válido").isMongoId(),
        check("id").custom(existeUsuarioById),
        validateUserRole,
        validarCampos
    ],
    updateRole
);

export default router;