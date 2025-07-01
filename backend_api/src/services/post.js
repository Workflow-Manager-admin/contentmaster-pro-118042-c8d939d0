const { Post, Tag, User, Media } = require('../models');
const { Op } = require('sequelize');

// PUBLIC_INTERFACE
/**
 * Service for CRUD operations and listing posts.
 */
class PostService {
  // PUBLIC_INTERFACE
  async create(data, user) {
    if (!user) throw new Error('Not authenticated');
    // Only admin/editor can create
    if (!['admin', 'editor'].includes(user.role)) {
      throw new Error('Forbidden');
    }
    const { tags, ...rest } = data;
    const post = await Post.create({
      ...rest,
      userId: user.id
    });
    // handle tags association if provided
    if (tags && Array.isArray(tags)) {
      await post.setTags(tags);
    }
    return post;
  }

  // PUBLIC_INTERFACE
  async list(query) {
    const {
      q,
      status,
      userId,
      tag,
      page = 1,
      pageSize = 10,
      orderBy = 'createdAt',
      order = 'DESC'
    } = query;

    // Search and filter logic
    let where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { content: { [Op.like]: `%${q}%` } }
      ];
    }

    // Join tags if filtering by tag
    let tagInclude = [];
    if (tag) {
      tagInclude = [
        {
          model: Tag,
          where: { name: tag }
        }
      ];
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [
        ...(tagInclude.length ? tagInclude : [{ model: Tag }]),
        { model: User },
        { model: Media, as: 'featuredImage' }
      ],
      order: [[orderBy, order]],
      offset: (parseInt(page, 10) - 1) * parseInt(pageSize, 10),
      limit: parseInt(pageSize, 10)
    });

    return {
      items: rows,
      total: count,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    };
  }

  // PUBLIC_INTERFACE
  async getById(id) {
    return await Post.findByPk(id, {
      include: [
        { model: Tag },
        { model: User },
        { model: Media, as: 'featuredImage' }
      ]
    });
  }

  // PUBLIC_INTERFACE
  async update(id, data, user) {
    if (!user) throw new Error('Not authenticated');
    const post = await Post.findByPk(id);
    if (!post) return null;
    if (!['admin', 'editor'].includes(user.role) && post.userId !== user.id) {
      throw new Error('Forbidden');
    }
    const { tags, ...rest } = data;
    await post.update(rest);
    if (tags && Array.isArray(tags)) {
      await post.setTags(tags);
    }
    return post;
  }

  // PUBLIC_INTERFACE
  async delete(id, user) {
    if (!user) throw new Error('Not authenticated');
    const post = await Post.findByPk(id);
    if (!post) throw new Error('Not found');
    if (!['admin', 'editor'].includes(user.role) && post.userId !== user.id) {
      throw new Error('Forbidden');
    }
    await post.destroy();
  }
}

module.exports = new PostService();
