import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, id DESC').all(req.user.id);
  res.json(addresses);
});

router.post('/', authMiddleware, (req, res) => {
  const { name, phone, province, city, district, detail, isDefault } = req.body;
  if (!name || !phone || !province || !city || !district || !detail) {
    return res.status(400).json({ error: 'All address fields required' });
  }
  if (isDefault) {
    db.prepare('UPDATE addresses SET isDefault = 0 WHERE userId = ?').run(req.user.id);
  }
  const result = db.prepare(`
    INSERT INTO addresses (userId, name, phone, province, city, district, detail, isDefault)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, name, phone, province, city, district, detail, isDefault ? 1 : 0);
  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
  res.json(address);
});

router.put('/:id', authMiddleware, (req, res) => {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND userId = ?').get(Number(req.params.id), req.user.id);
  if (!address) return res.status(404).json({ error: 'Address not found' });
  const { name, phone, province, city, district, detail, isDefault } = req.body;
  if (isDefault) {
    db.prepare('UPDATE addresses SET isDefault = 0 WHERE userId = ?').run(req.user.id);
  }
  db.prepare(`
    UPDATE addresses SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, isDefault = ?
    WHERE id = ? AND userId = ?
  `).run(
    name || address.name, phone || address.phone, province || address.province,
    city || address.city, district || address.district, detail || address.detail,
    isDefault !== undefined ? (isDefault ? 1 : 0) : address.isDefault,
    Number(req.params.id), req.user.id
  );
  const updated = db.prepare('SELECT * FROM addresses WHERE id = ?').get(Number(req.params.id));
  res.json(updated);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND userId = ?').get(Number(req.params.id), req.user.id);
  if (!address) return res.status(404).json({ error: 'Address not found' });
  db.prepare('DELETE FROM addresses WHERE id = ?').run(Number(req.params.id));
  res.json({ message: 'Address deleted' });
});

export default router;
