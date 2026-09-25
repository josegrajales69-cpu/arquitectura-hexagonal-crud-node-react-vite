import express from 'express';
import { makeAuth } from '../../../../application/use-cases/auth.js';
import { makeUsers } from '../../../../application/use-cases/users.js';
import { makeProducts } from '../../../../application/use-cases/products.js';
import { makeOrders } from '../../../../application/use-cases/orders.js';
import { postgresRepositories } from '../../outbound/PostgresRepository.js';
import { passwords } from '../../../security/BcryptPasswordHasher.js';
import { tokens } from '../../../security/JwtTokenService.js';
import { authenticate, adminOnly } from './middleware.js';

const auth = makeAuth({ users: postgresRepositories.users, passwords, tokens });
const users = makeUsers({ users: postgresRepositories.users, passwords });
const products = makeProducts({ products: postgresRepositories.products });
const orders = makeOrders({ orders: postgresRepositories.orders });
const asyncRoute = (fn) => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const router = express.Router();

router.post('/auth/register', asyncRoute(async (req,res) => res.status(201).json(await auth.register(req.body))));
router.post('/auth/login', asyncRoute(async (req,res) => res.json(await auth.login(req.body))));

router.get('/users', authenticate, adminOnly, asyncRoute(async (_req,res) => res.json(await users.list())));
router.get('/users/:id', authenticate, asyncRoute(async (req,res) => {
  if (req.user.role !== 'admin' && String(req.user.sub) !== req.params.id) return res.status(403).json({error:'No tienes acceso a este usuario.'});
  res.json(await users.get(req.params.id));
}));
router.post('/users', authenticate, adminOnly, asyncRoute(async (req,res) => res.status(201).json(await users.create(req.body))));
router.put('/users/:id', authenticate, adminOnly, asyncRoute(async (req,res) => res.json(await users.update(req.params.id,req.body))));
router.delete('/users/:id', authenticate, adminOnly, asyncRoute(async (req,res) => res.json(await users.delete(req.params.id))));

router.get('/products', asyncRoute(async (req,res) => res.json(await products.list({q:req.query.q ?? '',category:req.query.category ?? ''}))));
router.get('/products/:id', asyncRoute(async (req,res) => res.json(await products.get(req.params.id))));
router.post('/products', authenticate, adminOnly, asyncRoute(async (req,res) => res.status(201).json(await products.create(req.body))));
router.put('/products/:id', authenticate, adminOnly, asyncRoute(async (req,res) => res.json(await products.update(req.params.id,req.body))));
router.delete('/products/:id', authenticate, adminOnly, asyncRoute(async (req,res) => res.json(await products.delete(req.params.id))));

router.get('/orders', authenticate, asyncRoute(async (req,res) => res.json(await orders.list({id:req.user.sub,role:req.user.role}))));
router.get('/orders/:id', authenticate, asyncRoute(async (req,res) => res.json(await orders.get(req.params.id,{id:req.user.sub,role:req.user.role}))));
router.post('/orders', authenticate, asyncRoute(async (req,res) => res.status(201).json(await orders.create({id:req.user.sub},req.body.items))));
router.put('/orders/:id', authenticate, adminOnly, asyncRoute(async (req,res) => {
  const order = req.body.status === 'cancelled'
    ? await orders.cancel(req.params.id,{id:req.user.sub,role:req.user.role})
    : await orders.updateStatus(req.params.id,req.body.status);
  res.json(order);
}));
router.delete('/orders/:id', authenticate, asyncRoute(async (req,res) => res.json(await orders.cancel(req.params.id,{id:req.user.sub,role:req.user.role}))));

export default router;
