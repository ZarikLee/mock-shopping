import { Router } from 'express';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  await getDb();
  const addresses = queryAll('SELECT * FROM addresses WHERE userId = ? ORDER BY isDefault DESC, id DESC', [req.user.id]);
  res.json(addresses);
});

router.post('/', authMiddleware, async (req, res) => {
  await getDb();
  const { name, phone, province, city, district, detail, isDefault } = req.body;
  if (!name || !phone || !province || !city || !district || !detail) {
    return res.status(400).json({ error: 'All address fields required' });
  }
  if (isDefault) {
    execute('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [req.user.id]);
  }
  execute(`
    INSERT INTO addresses (userId, name, phone, province, city, district, detail, isDefault)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.id, name, phone, province, city, district, detail, isDefault ? 1 : 0]);
  const address = queryOne('SELECT * FROM addresses WHERE id = ?', [lastInsertRowId()]);
  res.json(address);
});

router.put('/:id', authMiddleware, async (req, res) => {
  await getDb();
  const address = queryOne('SELECT * FROM addresses WHERE id = ? AND userId = ?', [Number(req.params.id), req.user.id]);
  if (!address) return res.status(404).json({ error: 'Address not found' });
  const { name, phone, province, city, district, detail, isDefault } = req.body;
  if (isDefault) {
    execute('UPDATE addresses SET isDefault = 0 WHERE userId = ?', [req.user.id]);
  }
  execute(`
    UPDATE addresses SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, isDefault = ?
    WHERE id = ? AND userId = ?
  `, [
    name || address.name, phone || address.phone, province || address.province,
    city || address.city, district || address.district, detail || address.detail,
    isDefault !== undefined ? (isDefault ? 1 : 0) : address.isDefault,
    Number(req.params.id), req.user.id
  ]);
  const updated = queryOne('SELECT * FROM addresses WHERE id = ?', [Number(req.params.id)]);
  res.json(updated);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await getDb();
  const address = queryOne('SELECT * FROM addresses WHERE id = ? AND userId = ?', [Number(req.params.id), req.user.id]);
  if (!address) return res.status(404).json({ error: 'Address not found' });
  execute('DELETE FROM addresses WHERE id = ?', [Number(req.params.id)]);
  res.json({ message: 'Address deleted' });
});

export default router;
