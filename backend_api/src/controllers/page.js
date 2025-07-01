const pageService = require('../services/page');

/**
 * Page Controller
 * Handles CRUD operations for pages with role-based access.
 */
class PageController {
  // PUBLIC_INTERFACE
  /**
   * Create a new page.
   */
  async create(req, res) {
    try {
      const page = await pageService.create(req.body, req.user);
      res.status(201).json(page);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get list of pages with search/pagination.
   */
  async list(req, res) {
    try {
      const { items, total, page, pageSize } =
        await pageService.list(req.query);
      res.json({ items, total, page, pageSize });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single page by ID.
   */
  async getById(req, res) {
    try {
      const page = await pageService.getById(req.params.id);
      if (!page) return res.status(404).json({ message: 'Page not found' });
      res.json(page);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update a page by ID.
   */
  async update(req, res) {
    try {
      const updated = await pageService.update(
        req.params.id,
        req.body,
        req.user
      );
      if (!updated) return res.status(404).json({ message: 'Page not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a page by ID.
   */
  async delete(req, res) {
    try {
      await pageService.delete(req.params.id, req.user);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new PageController();
