const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['promotion', 'order', 'system'],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        link: {
            type: String
        },
        isRead: {
            type: Boolean,
            default: false
        },
        promotion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Promotion'
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

