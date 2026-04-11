async function getProfile(req, res) {
    const userId = req.user.userId;
    const userRole = req.user.role;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        success: true,
        data: {
            id: userId,
            role: userRole,
            info: `This is the profile information for user ID ${userId} with role ${userRole}.`
        }
    }));
}

module.exports = { getProfile };