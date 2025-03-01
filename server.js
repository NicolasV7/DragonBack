const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const User = require('./models/User');
const Favorite = require('./models/Favorite');
const Villain = require('./models/Villain');
const UserStats = require('./models/UserStats');

const app = express();
app.use(bodyParser.json());

//CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, DELETE');
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
    await UserStats.create({ userId: user.id });
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
      const previousUser = await User.findOne({ where: { id: villain.userId } });
      villain.userId = user.id;
      await villain.save();
      await UserStats.increment('exchangedCount', { where: { userId: user.id } });
      res.status(200).json({ villain, previousUser });
    } else {
      villain = await Villain.create({ userId: user.id, characterId: characterId.toString() });
      await UserStats.increment('capturedCount', { where: { userId: user.id } });
      res.status(201).json(villain);
    }
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

// Ruta para obtener las estadísticas del usuario
app.get('/user-stats/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const stats = await UserStats.findOne({ where: { userId: user.id } });
    res.status(200).json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para incrementar el contador de personajes capturados
app.post('/user-stats/increment-captured', async (req, res) => {
  const { userId } = req.body;
  try {
    let stats = await UserStats.findOne({ where: { userId } });
    if (!stats) {
      // Crea el registro si no existe
      stats = await UserStats.create({ userId, capturedCount: 1, exchangedCount: 0 });
    } else {
      // Incrementa el contador de capturas
      await stats.increment('capturedCount');
    }
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error en /user-stats/increment-captured:', error);
    res.status(400).json({ error: 'Error incrementando el contador de capturas: ' + error.message });
  }
});

app.post('/user-stats/increment-exchanged', async (req, res) => {
  const { userId } = req.body;
  try {
    let stats = await UserStats.findOne({ where: { userId } });
    if (!stats) {
      // Crea el registro si no existe
      stats = await UserStats.create({ userId, capturedCount: 0, exchangedCount: 1 });
    } else {
      // Incrementa el contador de intercambios
      await stats.increment('exchangedCount');
    }
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error en /user-stats/increment-exchanged:', error);
    res.status(400).json({ error: 'Error incrementando el contador de intercambios: ' + error.message });
  }
});


// Ruta para obtener las estadísticas de todos los usuarios
app.get('/user-stats', async (req, res) => {
  try {
    const stats = await UserStats.findAll();
    const detailedStats = await Promise.all(stats.map(async (stat) => {
      const user = await User.findByPk(stat.userId);
      return {
        ...stat.toJSON(),
        User: user ? { username: user.username, email: user.email } : null
      };
    }));
    res.status(200).json(detailedStats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});