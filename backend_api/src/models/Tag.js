const { DataTypes, Model } = require('sequelize');

// PUBLIC_INTERFACE
/**
 * Tag model for tagging posts/pages/media.
 */
module.exports = (sequelize) => {
  class Tag extends Model {}
  Tag.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
  }, {
    sequelize,
    modelName: 'Tag',
    tableName: 'tags',
    timestamps: false,
  });

  return Tag;
};
