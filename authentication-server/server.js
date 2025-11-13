const express = require ("express");
const cors = require("cors");
const { verifyLogin } = require ("./login");

const app = express();
app.use(cors());
app.use (express.json());

app.post("/login", (req, res) => 
{
    console.log("Received login request:", req.body);
    const {email, password} = req.body;
    const result = verifyLogin(email, password); 
    if(result.success)
    {
        res.json({success: true}); 
    }else
    {
        res.status(401).json({success: false, message: result.message});
    }
}); 

const AUTH_PORT = process.env.AUTH_PORT ? Number(process.env.AUTH_PORT) : 4001;

app.listen(AUTH_PORT, () => {
    console.log(`Auth server running on port ${AUTH_PORT}`);
});