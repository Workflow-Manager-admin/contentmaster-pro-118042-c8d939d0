require('dotenv').config();
const { initializeDatabase, query } = require('../config/database');
const User = require('../models/User');

/**
 * Initialize database with tables and seed data
 */
async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Initialize tables
    await initializeDatabase();
    console.log('Database tables created successfully');

    // Check if admin user exists
    const existingAdmin = await User.findByEmail('admin@contentmaster.pro');
    
    if (!existingAdmin) {
      // Create default admin user
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@contentmaster.pro',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Default admin user created:', adminUser.email);

      // Create sample editor user
      const editorUser = await User.create({
        username: 'editor',
        email: 'editor@contentmaster.pro',
        password: 'editor123',
        role: 'editor'
      });
      console.log('Sample editor user created:', editorUser.email);

      // Create sample viewer user
      const viewerUser = await User.create({
        username: 'viewer',
        email: 'viewer@contentmaster.pro',
        password: 'viewer123',
        role: 'viewer'
      });
      console.log('Sample viewer user created:', viewerUser.email);

      // Create sample tags
      await query('INSERT INTO tags (name, description) VALUES (\'Technology\', \'Posts about technology and innovation\')');
      await query('INSERT INTO tags (name, description) VALUES (\'News\', \'Latest news and updates\')');
      await query('INSERT INTO tags (name, description) VALUES (\'Tutorial\', \'Step-by-step tutorials and guides\')');
      await query('INSERT INTO tags (name, description) VALUES (\'Review\', \'Product and service reviews\')');
      await query('INSERT INTO tags (name, description) VALUES (\'Opinion\', \'Editorial and opinion pieces\')');
      console.log('Sample tags created');

      // Create sample posts
      await query(`
        INSERT INTO posts (title, slug, content, excerpt, status, author_id, published_at)
        VALUES 
        ('Welcome to ContentMaster Pro', 'welcome-to-contentmaster-pro', 
         '<h1>Welcome to ContentMaster Pro</h1><p>This is your new content management dashboard. Start creating amazing content today!</p>', 
         'Welcome to your new content management dashboard', 'published', $1, NOW()),
        ('Getting Started Guide', 'getting-started-guide',
         '<h1>Getting Started</h1><p>Learn how to use ContentMaster Pro effectively with this comprehensive guide.</p>',
         'Learn how to use ContentMaster Pro effectively', 'draft', $1, NULL)
      `, [adminUser.id]);
      console.log('Sample posts created');

      // Create sample pages
      await query(`
        INSERT INTO pages (title, slug, content, status, author_id, meta_title, meta_description, published_at)
        VALUES 
        ('About Us', 'about-us', 
         '<h1>About Us</h1><p>Learn more about our company and mission.</p>', 
         'published', $1, 'About Us - ContentMaster Pro',
         'Learn more about ContentMaster Pro and our mission', NOW()),
        ('Privacy Policy', 'privacy-policy',
         '<h1>Privacy Policy</h1><p>Our commitment to protecting your privacy.</p>',
         'published', $1, 'Privacy Policy - ContentMaster Pro',
         'Our privacy policy and data protection commitment', NOW())
      `, [adminUser.id]);
      console.log('Sample pages created');

    } else {
      console.log('Admin user already exists, skipping seed data creation');
    }

    console.log('Database initialization completed successfully!');
    console.log('\nDefault user credentials:');
    console.log('Admin: admin@contentmaster.pro / admin123');
    console.log('Editor: editor@contentmaster.pro / editor123');
    console.log('Viewer: viewer@contentmaster.pro / viewer123');

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initDatabase().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Initialization error:', error);
    process.exit(1);
  });
}

module.exports = { initDatabase };
