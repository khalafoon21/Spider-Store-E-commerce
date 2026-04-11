
function isAdmin(req, res) {
    return new Promise((resolve, reject) => {
        if (req.user && req.user.role === 'admin') {
            resolve(true); 
        } else {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                message: 'Sorry, this page is restricted to administrators only' 
            }));
            reject('Not Admin');
        }
    });
}

module.exports = { isAdmin };