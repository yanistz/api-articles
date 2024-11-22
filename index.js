const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();
 
app.use(express.json());
 
const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
});
 
pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)
    .then(() => console.log('Table articles créée ou déjà existante'))
    .catch(err => console.error('Erreur lors de la création de la table:', err));
 
 
app.get('/articles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM articles');
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des articles:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
 
app.post('/articles', async (req, res) => {
    try {
        const { title, content, author } = req.body;
        if (!title || !content || !author) {
            return res.status(400).json({ message: 'Les champs title, content et author sont obligatoires' });
        }
        const result = await pool.query(
            `INSERT INTO articles (title, content, author)
             VALUES ($1, $2, $3) RETURNING *`,
            [title, content, author]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erreur lors de la création de l\'article:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
 
app.patch('/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, author } = req.body;
        const result = await pool.query(
            `UPDATE articles
             SET title = COALESCE($1, title),
                 content = COALESCE($2, content),
                 author = COALESCE($3, author)
             WHERE id = $4 RETURNING *`,
            [title, content, author, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'article:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
 
app.delete('/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `DELETE FROM articles WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Article non trouvé' });
        }
        res.json({ message: 'Article supprimé avec succès' });
    } catch (err) {
        console.error('Erreur lors de la suppression de l\'article:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
 
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API de gestion des articles !');
});
 
app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});