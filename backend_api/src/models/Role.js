const { DataTypes, Model } = require('sequelize');

// PUBLIC_INTERFACE
/**
 * Role model for user roles (admin, editor, viewer).
 */
module.exports = (sequelize) => {
  class Role extends Model {}

  Role.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(32),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
  }, {
    sequelize,
    modelName: 'Role',
    timestamps: false,
    tableName: 'roles',
  });

  return Role;
};
