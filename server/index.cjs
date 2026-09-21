const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  min: 0,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: true,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error.message);
});

app.use(cors());
app.use(express.json());

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    if (req.admin.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}


app.get('/api/admin/check', requireAdmin, async (req, res) => {
  res.json({
    ok: true,
    email: req.admin.email,
  });
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: process.env.ADMIN_EMAIL, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      token,
      admin: {
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error.message);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS time');

    res.json({
      ok: true,
      database: true,
      time: result.rows[0].time,
    });
  } catch (error) {
    console.error('Database error:', error.message);

    res.status(500).json({
      ok: false,
      database: false,
      message: 'Database connection failed',
    });
  }
});


app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price, images, category, published, created_at FROM products WHERE published = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Products error:', error.message);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});



app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      'new',
      'processing',
      'shipped',
      'completed',
      'cancelled',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Statut de commande invalide',
      });
    }

    let result;

    if (status === 'completed') {
      const orderResult = await pool.query(
        `SELECT id, items, profit
         FROM orders
         WHERE id = $1`,
        [req.params.id]
      );

      if (!orderResult.rows.length) {
        return res.status(404).json({
          message: 'Commande introuvable',
        });
      }

      const order = orderResult.rows[0];
      const items = Array.isArray(order.items) ? order.items : [];

      let profit = 0;

      for (const item of items) {
        const productResult = await pool.query(
          `SELECT price, cost_price
           FROM products
           WHERE id = $1`,
          [item.product_id]
        );

        if (productResult.rows.length) {
          const product = productResult.rows[0];
          const quantity = Math.max(1, Number(item.quantity) || 1);
          const salePrice = Number(product.price) || 0;
          const costPrice = Number(product.cost_price) || 0;

          profit += (salePrice - costPrice) * quantity;
        }
      }

      result = await pool.query(
        `UPDATE orders
         SET status = $1,
             profit = $2
         WHERE id = $3
         RETURNING
           id,
           order_number,
           customer_name,
           phone,
           wilaya,
           commune,
           address,
           delivery_type,
           notes,
           items,
           total,
        profit,
           profit,
           status,
           created_at`,
        [status, profit, req.params.id]
      );
    } else {
      result = await pool.query(
        `UPDATE orders
         SET status = $1
         WHERE id = $2
         RETURNING
           id,
           order_number,
           customer_name,
           phone,
           wilaya,
           commune,
           address,
           delivery_type,
           notes,
           items,
           total,
        profit,
           profit,
           status,
           created_at`,
        [status, req.params.id]
      );
    }

    if (!result.rows.length) {
      return res.status(404).json({
        message: 'Commande introuvable',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update order status error:', error.message);
    res.status(500).json({
      message: 'Failed to update order status',
    });
  }
});

app.get('/api/orders', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        order_number,
        customer_name,
        phone,
        wilaya,
        commune,
        address,
        delivery_type,
        notes,
        items,
        total,
        profit,
        status,
        created_at
       FROM orders
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error.message);
    res.status(500).json({
      message: 'Failed to fetch orders',
    });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      wilaya,
      commune,
      address,
      delivery_type,
      notes,
      items,
      total,
    } = req.body;

    if (
      !customer_name ||
      !phone ||
      !wilaya ||
      !commune ||
      !address ||
      !delivery_type ||
      !Array.isArray(items) ||
      !items.length
    ) {
      return res.status(400).json({
        message: 'Informations de commande incomplètes',
      });
    }

    const orderNumber = `UNTHA-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO orders (
        order_number,
        customer_name,
        phone,
        wilaya,
        commune,
        address,
        delivery_type,
        notes,
        items,
        total,
        profit,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'new')
      RETURNING id, order_number, total, status, created_at`,
      [
        orderNumber,
        customer_name,
        phone,
        wilaya,
        commune,
        address,
        delivery_type,
        notes || '',
        JSON.stringify(items),
        Number(total) || 0,
      ]
    );

    res.status(201).json({
      ok: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({
      message: 'Failed to create order',
    });
  }
});

app.get('/api/shipping', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT wilaya_code, wilaya_name, price FROM shipping_rates ORDER BY CAST(wilaya_code AS INTEGER)'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Shipping error:', error.message);
    res.status(500).json({ message: 'Failed to fetch shipping rates' });
  }
});

app.patch('/api/shipping/:code', requireAdmin, async (req, res) => {
  try {
    const { price } = req.body;

    if (price === undefined || price === null || Number(price) < 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }

    const result = await pool.query(
      `UPDATE shipping_rates
       SET price = $1, updated_at = NOW()
       WHERE wilaya_code = $2
       RETURNING wilaya_code, wilaya_name, price, updated_at`,
      [Number(price), req.params.code]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Wilaya not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update shipping error:', error.message);
    res.status(500).json({ message: 'Failed to update shipping rate' });
  }
});

app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price, images, category, published, created_at FROM products ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Admin products error:', error.message);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description = '',
      price,
      cost_price = 0,
      images = [],
      category = '',
      published = false
    } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const result = await pool.query(
      `INSERT INTO products (
        name,
        description,
        price,
        cost_price,
        images,
        category,
        published
      )
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
       RETURNING *`,
      [
        name,
        description,
        price,
        Number(cost_price) || 0,
        JSON.stringify(images),
        category,
        Boolean(published)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

app.patch('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, cost_price, images, category, published } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           cost_price = COALESCE($4, cost_price),
           images = COALESCE($5::jsonb, images),
           category = COALESCE($6, category),
           published = COALESCE($7, published)
       WHERE id = $8
       RETURNING *`,
      [
        name ?? null,
        description ?? null,
        price ?? null,
        cost_price ?? null,
        images === undefined ? null : JSON.stringify(images),
        category ?? null,
        published === undefined ? null : Boolean(published),
        id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error.message);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Delete product error:', error.message);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});


const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const imageUpload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  },
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.post('/api/admin/upload-images', requireAdmin, imageUpload.array('images', 10), (req, res) => {
  const files = req.files || [];

  const images = files.map((file) => ({
    filename: file.filename,
    url: `/uploads/products/${file.filename}`,
  }));

  res.status(201).json({
    ok: true,
    images,
  });
});

app.listen(PORT, () => {
  console.log(`Boutique UNTHA API running on http://localhost:${PORT}`);
});
