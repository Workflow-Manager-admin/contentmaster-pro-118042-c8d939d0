const tagService = require('../services/tag');

/**
 * Tag Controller
 * Handles CRUD operations for tags.
 */
class TagController {
  // PUBLIC_INTERFACE
  async create(req, res) {
    try {
      const tag = await tagService.create(req.body, req.user);
      res.status(201).json(tag);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  async list(req, res) {
    try {
      const { items, total, page, pageSize } =
        await tagService.list(req.query);
      res.json({ items, total, page, pageSize });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  async getById(req, res) {
    try {
      const tag = await tagService.getById(req.params.id);
      if (!tag) return res.status(404).json({ message: 'Tag not found' });
      res.json(tag);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  async update(req, res) {
    try {
      const updated = await tagService.update(req.params.id, req.body, req.user);
      if (!updated) return res.status(404).json({ message: 'Tag not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  async delete(req, res) {
    try {
      await tagService.delete(req.params.id, req.user);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new TagController();
