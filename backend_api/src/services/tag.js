const { Tag } = require('../models');
const { Op } = require('sequelize');

// PUBLIC_INTERFACE
/**
 * Service for CRUD and listing tags.
 */
class TagService {
  // PUBLIC_INTERFACE
  async create(data, user) {
    if (!user) throw new Error('Not authenticated');
    if (!['admin', 'editor'].includes(user.role)) throw new Error('Forbidden');
    const tag = await Tag.create(data);
    return tag;
  }

  // PUBLIC_INTERFACE
  async list(query) {
    const {
      q,
      page = 1,
      pageSize = 20,
      orderBy = 'name',
      order = 'ASC'
    } = query;

    let where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } }
      ];
    }

    const { count, rows } = await Tag.findAndCountAll({
      where,
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
    return await Tag.findByPk(id);
  }

  // PUBLIC_INTERFACE
  async update(id, data, user) {
    if (!user) throw new Error('Not authenticated');
    if (!['admin', 'editor'].includes(user.role)) throw new Error('Forbidden');
    const tag = await Tag.findByPk(id);
    if (!tag) return null;
    await tag.update(data);
    return tag;
  }

  // PUBLIC_INTERFACE
  async delete(id, user) {
    if (!user) throw new Error('Not authenticated');
    if (!['admin', 'editor'].includes(user.role)) throw new Error('Forbidden');
    const tag = await Tag.findByPk(id);
    if (!tag) throw new Error('Not found');
    await tag.destroy();
  }
}

module.exports = new TagService();

