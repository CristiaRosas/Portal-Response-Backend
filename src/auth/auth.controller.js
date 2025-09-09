import User from '../users/user.model.js';
import { hash, verify } from 'argon2';
import { generarJWT } from '../helpers/generate-jwt.js';

export const login = async(req, res) => {

    try {

        const user = req.user; 
        const token = await generarJWT(user.id);

        return res.status(200).json({
            msg: 'Login successful',
            userDetails: {
                name: user.name,
                surname: user.surname,
                username: user.username,
                email: user.email,
                token: token,
                role: user.role,
                _id : user._id
            }
        });

    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: "Server error",
            error: e.message
        })
    }
}

export const register = async (req, res) => {
    try {
        const data = req.body; 

        const existingUser = await User.findOne({ 
            $or: [
                { email: data.email.trim() },
                { username: data.username }
            ] 
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email or username already exists",
                error: "DUPLICATE_ENTRY"
            });
        }

        const encryptedPassword = await hash(data.password);

        const user = await User.create({
            name: data.name,
            surname: data.surname,
            username: data.username,
            email: data.email.trim(), 
            password: encryptedPassword
        })

        return res.status(200).json({
            message: "User registered successfully",
            userDetails: {
                user: user.email
            }
        })

    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email or username already exists",
                error: "DUPLICATE_ENTRY"
            });
        }
        return res.status(500).json({
            message: "Error creating user",
            error: error.message
        });
    }
}


const createAdmin = async ( name, surname, username, email, password, role ) => {
    try {

        if (role === "APP_ADMIN") {
            const existAdmin = await User.findOne({ role: "APP_ADMIN" });
            if (existAdmin) {
                console.log("--------------------------- Error -------------------------------")
                console.log("A user with admin role already exists. Another cannot be created.");
                console.log("-----------------------------------------------------------------")
                return null;
            };
        };

    const encryptedPassword = await hash(password);

    const newUser = new User({ 
        name, 
        surname, 
        username, 
        email, 
        password: encryptedPassword, 
        role });

        await newUser.save();
        console.log("User created successfully:", newUser);
        return newUser;
        
    } catch (error) {
        console.error("Error creating user:", error);
        return null;
    }
}

createAdmin("Cristian", "Rene", "Rosas","crosas@gmail.com", "12345678", "APP_ADMIN");
