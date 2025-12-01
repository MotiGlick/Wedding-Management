// models/Guest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db').sequelize;

const Guest = sequelize.define('Guest', {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: true,
        get() {
            return `${this.firstName} ${this.lastName}`;
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rsvp: {
        type: DataTypes.ENUM('yes', 'no', 'maybe'),
        allowNull: false
    },
    plusOne: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    diet: {
        type: DataTypes.STRING,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

module.exports = Guest;
