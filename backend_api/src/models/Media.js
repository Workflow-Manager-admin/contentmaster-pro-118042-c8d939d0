const { DataTypes, Model } = require('sequelize');

// PUBLIC_INTERFACE
/**
 * Media model for storing media files' metadata.
 */
module.exports = (sequelize) => {
  class Media extends Model {}
  Media.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploaderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    mimeType: {
      type: DataTypes.STRING,
    },
    size: {
      type: DataTypes.INTEGER,
    },
    altText: {
      type: DataTypes.STRING,
    }
  }, {
    sequelize,
    modelName: 'Media',
    tableName: 'media',
    timestamps: true,
    paranoid: true,
  });

  return Media;
};
