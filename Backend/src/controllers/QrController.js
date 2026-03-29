const crypto = require('crypto');

const generateQr = async (req, res) => {
    try {
        const qrToken = crypto.randomUUID();
        res.status(200).json({ status: 'OK', qrToken });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}

const confirmQr = async (req, res) => {
    try {
        const { qrToken } = req.body;
        // user verified by middleware
        const user = req.user;
        
        let token = req.headers.token;
        if (token && token.includes(' ')) {
             token = token.split(' ')[1];
        }

        const io = req.app.get('io');
        if (!io) {
             return res.status(500).json({ status: 'ERROR', message: 'Socket.io not initialized' });
        }

        console.log(`QR Confirmed: Token=${qrToken}, User=${user.id}`);
        
        // Emit logic success to web client in the room
        io.to(qrToken).emit('login_success', { 
            token, 
            user 
        });

        res.status(200).json({ status: 'OK', message: 'Confirmed success' });
    } catch (e) {
        console.error('Confirm QR Error:', e);
        res.status(500).json({ message: e.message });
    }
}

module.exports = { generateQr, confirmQr }
