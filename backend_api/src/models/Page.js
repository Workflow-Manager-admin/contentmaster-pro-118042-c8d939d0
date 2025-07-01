const { DataTypes, Model } = require('sequelize');

// PUBLIC_INTERFACE
/**
 * Page model for static/landing pages.
 */
module.exports = (sequelize) => {
  class Page extends Model {}
  Page.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    title: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
    },
    publishedAt: {
      type: DataTypes.DATE,
    },
    featuredImageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'media', key: 'id' }
    }
  }, {
    sequelize,
    modelName: 'Page',
    tableName: 'pages',
    timestamps: true,
    paranoid: true,
  });

  return Page;
};
