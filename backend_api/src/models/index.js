const { getSequelizeInstance } = require('../db');
const sequelize = getSequelizeInstance();

const Role = require('./Role')(sequelize);
const User = require('./User')(sequelize);
const Post = require('./Post')(sequelize);
const Page = require('./Page')(sequelize);
const Media = require('./Media')(sequelize);
const Tag = require('./Tag')(sequelize);

// Associations
// User has a Role
Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

// Posts and Pages belong to User
User.hasMany(Post, { foreignKey: 'userId' });
User.hasMany(Page, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });
Page.belongsTo(User, { foreignKey: 'userId' });

// Media is uploaded by a User
User.hasMany(Media, { foreignKey: 'uploaderId' });
Media.belongsTo(User, { foreignKey: 'uploaderId' });

// Posts and Pages have featured images (Media)
Media.hasMany(Post, { foreignKey: 'featuredImageId' });
Media.hasMany(Page, { foreignKey: 'featuredImageId' });
Post.belongsTo(Media, { foreignKey: 'featuredImageId', as: 'featuredImage' });
Page.belongsTo(Media, { foreignKey: 'featuredImageId', as: 'featuredImage' });

// Many-to-many: Post <-> Tag
Post.belongsToMany(Tag, {
  through: 'PostTags',
  foreignKey: 'postId',
  otherKey: 'tagId',
  timestamps: false,
});
Tag.belongsToMany(Post, {
  through: 'PostTags',
  foreignKey: 'tagId',
  otherKey: 'postId',
  timestamps: false,
});

// Many-to-many: Page <-> Tag
Page.belongsToMany(Tag, {
  through: 'PageTags',
  foreignKey: 'pageId',
  otherKey: 'tagId',
  timestamps: false,
});
Tag.belongsToMany(Page, {
  through: 'PageTags',
  foreignKey: 'tagId',
  otherKey: 'pageId',
  timestamps: false,
});

module.exports = {
  sequelize,
  Role,
  User,
  Post,
  Page,
  Media,
  Tag,
};
