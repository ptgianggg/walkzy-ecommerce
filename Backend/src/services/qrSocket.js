const init = (io) => {
    io.on('connection', (socket) => {
        socket.on('join_qr_room', (qrToken) => {
            if (qrToken) {
                socket.join(qrToken);
                console.log(`Socket ${socket.id} joined QR room ${qrToken}`);
            }
        });
    });
};

module.exports = { init };
