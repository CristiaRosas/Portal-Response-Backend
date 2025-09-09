export const tieneRole = (...roles) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(500).json({
                msg: 'Se quiere verificar el role sin validar el token primero'
            });
        }

        if (!roles.includes(req.usuario.role)) {
            return res.status(403).json({
                msg: `El servicio requiere uno de estos roles: ${roles}`
            });
        }

        next();
    };
};