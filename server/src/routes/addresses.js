import { Router } from 'express';
import { queryAll, queryOne, insert, update, remove } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const addresses = queryAll('addresses', { userId: req.user.id });
  addresses.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) || b.id - a.id);
  res.json(addresses);
});

router.post('/', authMiddleware, (req, res) => {
  const { name, phone, province, city, district, detail, isDefault } = req.body;
  if (!name || !phone || !province || !city || !district || !detail) {
    return res.status(400).json({ error: 'All address fields required' });
  }
  if (isDefault) {
    queryAll('addresses', { userId: req.user.id, isDefault: 1 }).forEach(a => update('addresses', a.id, { isDefault: 0 }));
  }
  const address = insert('addresses', {
    userId: req.user.id, name, phone, province, city, district, detail,
    isDefault: isDefault ? 1 : 0,
  });
  res.json(address);
});

router.put('/:id', authMiddleware, (req, res) => {
  const address = queryOne('addresses', { id: Number(req.params.id), userId: req.user.id });
  if (!address) return res.status(404).json({ error: 'Address not found' });
  const { name, phone, province, city, district, detail, isDefault } = req.body;
  if (isDefault) {
    queryAll('addresses', { userId: req.user.id, isDefault: 1 }).forEach(a => update('addresses', a.id, { isDefault: 0 }));
  }
  const updated = update('addresses', Number(req.params.id), {
    name: name !== undefined ? name : address.name,
    phone: phone !== undefined ? phone : address.phone,
    province: province !== undefined ? province : address.province,
    city: city !== undefined ? city : address.city,
    district: district !== undefined ? district : address.district,
    detail: detail !== undefined ? detail : address.detail,
    isDefault: isDefault !== undefined ? (isDefault ? 1 : 0) : address.isDefault,
  });
  res.json(updated);
});

router.put('/:id/default', authMiddleware, (req, res) => {
  const address = queryOne('addresses', { id: Number(req.params.id), userId: req.user.id });
  if (!address) return res.status(404).json({ error: 'Address not found' });
  queryAll('addresses', { userId: req.user.id, isDefault: 1 }).forEach(a => update('addresses', a.id, { isDefault: 0 }));
  const updated = update('addresses', Number(req.params.id), { isDefault: 1 });
  res.json(updated);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const address = queryOne('addresses', { id: Number(req.params.id), userId: req.user.id });
  if (!address) return res.status(404).json({ error: 'Address not found' });
  remove('addresses', Number(req.params.id));
  res.json({ message: 'Address deleted' });
});

export default router;
