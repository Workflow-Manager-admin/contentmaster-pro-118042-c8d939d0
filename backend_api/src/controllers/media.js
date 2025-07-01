const mediaService = require('../services/media');

/**
 * Media Controller
 * Handles upload and CRUD operations for media files.
 */
class MediaController {
  // PUBLIC_INTERFACE
  /**
   * Upload a new media file.
   */
  async upload(req, res) {
    try {
      // req.file is added by multer middleware
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const meta = await mediaService.upload(req.file, req.user);
      res.status(201).json(meta);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * List media with pagination and search
   */
  async list(req, res) {
    try {
      const { items, total, page, pageSize } =
        await mediaService.list(req.query);
      res.json({ items, total, page, pageSize });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get media by ID
   */
  async getById(req, res) {
    try {
      const media = await mediaService.getById(req.params.id);
      if (!media) return res.status(404).json({ message: 'Media not found' });
      res.json(media);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a media file (soft delete)
   */
  async delete(req, res) {
    try {
      await mediaService.delete(req.params.id, req.user);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new MediaController();
