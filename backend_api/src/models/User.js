const { DataTypes, Model } = require('sequelize');

// PUBLIC_INTERFACE
/**
 * User model representing app users.
 */
module.exports = (sequelize) => {
  class User extends Model {}
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'roles', key: 'id' },
    },
    displayName: {
      type: DataTypes.STRING,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    indexes: [
      // These partial indexes help implement uniqueness only for active users. (Postgres only, but marks for future DBs)
      // {
      //   unique: true,
      //   fields: [sequelize.fn('lower', sequelize.col('username'))],
      //   where: { deletedAt: null }
      // },
      // {
      //   unique: true,
      //   fields: [sequelize.fn('lower', sequelize.col('email'))],
      //   where: { deletedAt: null }
      // }
    ],
  });

  return User;
};
