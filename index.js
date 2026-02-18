import express from "express";
import { pool } from "./db.js";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(`Ruta: ${req.url}`);
  next();
});

app.get("/joyas", async (req, res) => {
  try {
    let { limits = 10, page = 1, order_by = "id_ASC" } = req.query;

    limits = parseInt(limits);
    page = parseInt(page);

    const [campo, direccion] = order_by.split("_");
    const offset = (page - 1) * limits;

    const consulta = `
      SELECT * FROM inventario
      ORDER BY ${campo} ${direccion}
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await pool.query(consulta, [limits, offset]);

    const resultado = {
      total: rows.length,
      results: rows.map(j => ({
        name: j.nombre,
        href: `/joyas/${j.id}`
      }))
    };

    res.json(resultado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/joyas/filtros", async (req, res) => {
  try {
    const { precio_min, precio_max, categoria, metal } = req.query;

    let filtros = [];
    let valores = [];

    if (precio_min) {
      valores.push(precio_min);
      filtros.push(`precio >= $${valores.length}`);
    }

    if (precio_max) {
      valores.push(precio_max);
      filtros.push(`precio <= $${valores.length}`);
    }

    if (categoria) {
      valores.push(categoria);
      filtros.push(`categoria = $${valores.length}`);
    }

    if (metal) {
      valores.push(metal);
      filtros.push(`metal = $${valores.length}`);
    }

    let consulta = "SELECT * FROM inventario";

    if (filtros.length > 0) {
      consulta += " WHERE " + filtros.join(" AND ");
    }

    const { rows } = await pool.query(consulta, valores);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
