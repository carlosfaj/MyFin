let currentUser = null; 

function loginUser(user)
{
    currentUser = user; 
}

function logoutUser()
{
    currentUser = user; 
}

function getCurrentUser()
{
    return currentUser; 
}

module.exports = {loginUser, logoutUser, getCurrentUser};