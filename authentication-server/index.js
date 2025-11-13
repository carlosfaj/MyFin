const {verifyLogin} = require("./login");
const {loginUser, getCurrentUser} = require("./session");

function handleLogin(email, password)
{
    const result = verifyLogin(email, password); 
    if(result.success)
    {
        loginUser(result.user);
        console.log("Login exitoso:", getCurrentUser());
    }else
    {
        console.log("Error de login:", result.message);
    }
}