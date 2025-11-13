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

app.listen(4000, () => 
{
    console.log("Auth server running on port 4000");
}); 