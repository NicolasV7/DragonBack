const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const User = require('./models/User');
const Favorite = require('./models/Favorite');
const Villain = require('./models/Villain');

const app = express();
app.use(bodyParser.json());

//CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}
);

// Sincronizar la base de datos
sequelize.sync().then(() => {
  console.log('Database synced');
});

// Ruta para registrar un nuevo usuario
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = await User.create({ username, email, password });
    res.status(201).json(user);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'El correo o nombre de usuario ya existe.' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email, password } });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para agregar un personaje a favoritos
app.post('/favorites', async (req, res) => {
  const { email, characterId } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const favorite = await Favorite.create({ userId: user.id, characterId: characterId.toString() });
    res.status(201).json(favorite);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para eliminar un personaje de favoritos
app.delete('/favorites', async (req, res) => {
  const { email, characterId } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const favorite = await Favorite.destroy({ where: { userId: user.id, characterId: characterId.toString() } });
    res.status(200).json({ message: 'Favorito eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para obtener los favoritos del usuario logueado
app.get('/favorites/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const favorites = await Favorite.findAll({ where: { userId: user.id } });
    res.status(200).json(favorites);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para agregar un villano
app.post('/villains', async (req, res) => {
  const { email, characterId } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    let villain = await Villain.findOne({ where: { characterId: characterId.toString() } });
    if (villain) {
      villain.userId = user.id;
      await villain.save();
    } else {
      villain = await Villain.create({ userId: user.id, characterId: characterId.toString() });
    }
    res.status(201).json(villain);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para obtener los villanos del usuario logueado
app.get('/villains/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const villains = await Villain.findAll({ where: { userId: user.id } });
    res.status(200).json(villains);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});