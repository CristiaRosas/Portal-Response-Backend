import jwt from 'jsonwebtoken';

export const generarJWT = (uid = '') => {
    return new Promise((resolve, reject) => {
        const payload = { uid };

        jwt.sign(
            payload, 
            process.env.SECRETPRIVATEKEY, 
            {
                expiresIn: '5h'
            },
            (err, token) => {
                if (err) {
                    console.log(err);
                    reject('Failed to generate token');
                } else {
                    resolve(token);
                }
            }
        );
    });
}