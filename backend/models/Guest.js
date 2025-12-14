const { DataTypes } = require('sequelize');
const sequelize = require('../db').sequelize;

const Guest = sequelize.define('Guest', {
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },


    fullName: { 
        type: DataTypes.VIRTUAL,
        get() { return `${this.firstName} ${this.lastName}`; }
    },
    email: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING, allowNull: true },
    rsvp: { type: DataTypes.ENUM('yes','no','maybe'), allowNull: false },
    plusOne: { type: DataTypes.STRING, allowNull: true },
    diet: { type: DataTypes.STRING, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },

    side: { type: DataTypes.ENUM('חתן','כלה'), allowNull: true }, // צד האורח
     userId: { type: DataTypes.INTEGER, allowNull: false }  // ← הוסף שורה זו כאן!

}, { timestamps: true }); // timestamps מוסיף createdAt ו-updatedAt

module.exports = Guest;
