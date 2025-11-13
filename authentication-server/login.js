const users = require("./users"); 

function verifyLogin(email, password) {
    const user = users.find((u) => u.email === email);
    if (!user) return { success: false, message: "Usuario no registrado" };
    if (user.password !== password)
        return { success: false, message: "Contraseña incorrecta" };
    return { success: true, user };
}

module.exports = { verifyLogin };