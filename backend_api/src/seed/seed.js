const { sequelize, Role, User, Post, Page, Media, Tag } = require('../models');
const bcrypt = require('bcrypt');

// PUBLIC_INTERFACE
/**
 * Seed initial data: roles, users, tags, media, posts, pages.
 */
async function seed() {
  await sequelize.sync({ force: true });

  // 1. Roles
  const roles = await Role.bulkCreate([
    { name: 'admin', description: 'Administrator' },
    { name: 'editor', description: 'Editor' },
    { name: 'viewer', description: 'Viewer' },
  ]);

  // 2. Users
  const password = await bcrypt.hash('password123', 10);
  const users = await User.bulkCreate([
    { username: 'alice', email: 'alice@example.com', password, roleId: roles[0].id, displayName: 'Alice Doe' },
    { username: 'bob', email: 'bob@example.com', password, roleId: roles[1].id, displayName: 'Bob Jones' },
    { username: 'charlie', email: 'charlie@example.com', password, roleId: roles[2].id, displayName: 'Charlie Viewer' },
  ]);

  // 3. Media
  const mediaItems = await Media.bulkCreate([
    {
      url: 'https://example.com/media/image1.jpg',
      filename: 'image1.jpg',
      uploaderId: users[0].id,
      mimeType: 'image/jpeg',
      size: 12345,
      altText: 'Sample image 1',
    },
    {
      url: 'https://example.com/media/image2.png',
      filename: 'image2.png',
      uploaderId: users[1].id,
      mimeType: 'image/png',
      size: 23456,
      altText: 'Sample image 2',
    }
  ]);

  // 4. Tags
  const tags = await Tag.bulkCreate([
    { name: 'Announcement', description: 'General updates' },
    { name: 'Release', description: 'Release info' },
    { name: 'How-To', description: 'Guides and tutorials' },
  ]);

  // 5. Posts
  const posts = await Post.bulkCreate([
    {
      title: 'Welcome to ContentMaster Pro!',
      content: 'This is your first post. Edit or delete it, then start posting!',
      userId: users[0].id,
      status: 'published',
      publishedAt: new Date(),
      featuredImageId: mediaItems[0].id,
    },
    {
      title: 'Second Post',
      content: 'Here is a second post as an example.',
      userId: users[1].id,
      status: 'draft',
    },
  ]);
  await posts[0].addTags([tags[0], tags[1]]);
  await posts[1].addTag(tags[2]);

  // 6. Pages
  const pages = await Page.bulkCreate([
    {
      title: 'Home',
      content: 'Welcome to our homepage!',
      userId: users[0].id,
      status: 'published',
      publishedAt: new Date(),
      featuredImageId: mediaItems[1].id,
    },
    {
      title: 'About',
      content: 'This is the about page.',
      userId: users[1].id,
      status: 'draft',
    },
  ]);
  await pages[0].addTag(tags[0]);
  await pages[1].addTags([tags[1], tags[2]]);

  console.log('[Seed] Database seeded with example data.');
}

// Run with: node src/seed/seed.js
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    });
}

module.exports = { seed };
