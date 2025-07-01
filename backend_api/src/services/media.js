const { Media, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Directory to store uploaded files (should exist)
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// PUBLIC_INTERFACE
/**
 * Service for media upload and CRUD/list.
 */
class MediaService {
  // PUBLIC_INTERFACE
  async upload(file, user) {
    if (!user) throw new Error('Not authenticated');
    // Only admin/editor can upload
    if (!['admin', 'editor'].includes(user.role)) {
      throw new Error('Forbidden');
    }
    // Save file details to DB (assuming file is already written to uploads/)
    const meta = await Media.create({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      uploaderId: user.id,
      mimeType: file.mimetype,
      size: file.size,
      altText: file.originalname
    });
    return meta;
  }

  // PUBLIC_INTERFACE
  async list(query) {
    const {
      q,
      uploaderId,
      page = 1,
      pageSize = 10,
      orderBy = 'createdAt',
      order = 'DESC'
    } = query;

    let where = {};
    if (uploaderId) where.uploaderId = uploaderId;
    if (q) {
      where[Op.or] = [
        { filename: { [Op.like]: `%${q}%` } },
        { altText: { [Op.like]: `%${q}%` } }
      ];
    }
    const { count, rows } = await Media.findAndCountAll({
      where,
      include: [{ model: User }],
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
    return await Media.findByPk(id, { include: [User] });
  }

  // PUBLIC_INTERFACE
  async delete(id, user) {
    if (!user) throw new Error('Not authenticated');
    const media = await Media.findByPk(id);
    if (!media) throw new Error('Not found');
    // Only admin/editor or uploader can delete
    if (!['admin', 'editor'].includes(user.role) && media.uploaderId !== user.id) {
      throw new Error('Forbidden');
    }
    await media.destroy(); // soft delete (paranoid model)
  }
}

module.exports = new MediaService();
