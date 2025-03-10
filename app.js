const express = require('express');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuración de EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true }));

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./db/database.db', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Crear la tabla de pasteles si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS pasteles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    sabor TEXT NOT NULL,
    tamaño TEXT NOT NULL,
    precio REAL NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creacion TEXT NOT NULL,
    es_vegano INTEGER NOT NULL,
    decoraciones TEXT NOT NULL
  )
`);

// Ruta principal
app.get('/', (req, res) => {
  res.render('index');
});

// Ruta para mostrar el formulario de registro
app.get('/registro', (req, res) => {
  res.render('registro');
});

// Ruta para procesar el formulario de registro
app.post('/registro', (req, res) => {
  const { nombre, sabor, tamaño, precio, descripcion, fecha_creacion, es_vegano, decoraciones } = req.body;

  // Validaciones
  if (!nombre || !sabor || !tamaño || !precio || !descripcion || !fecha_creacion || !decoraciones) {
    return res.status(400).send('Todos los campos deben ser llenados');
  }

  if (isNaN(precio)) {
    return res.status(400).send('El precio debe ser un valor numérico');
  }

  // Convertir es_vegano a booleano
  const esVegano = es_vegano ? 1 : 0;

  // Verificar si ya existe un pastel con el mismo nombre
  const checkQuery = 'SELECT * FROM pasteles WHERE nombre = ?';
  db.get(checkQuery, [nombre], (err, row) => {
    if (err) {
      return res.status(500).send('Error al verificar el pastel');
    }

    if (row) {
      return res.status(400).send('Ya existe un pastel con ese nombre');
    }

    // Insertar datos a la base de datos
    const insertQuery = `
      INSERT INTO pasteles (nombre, sabor, tamaño, precio, descripcion, fecha_creacion, es_vegano, decoraciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [nombre, sabor, tamaño, precio, descripcion, fecha_creacion, esVegano, decoraciones];

    db.run(insertQuery, params, function (err) {
      if (err) {
        return res.status(500).send('Error al momento de registrar');
      }
      return res.send(`
        <h1>¡Pastel registrado exitosamente!</h1>
        <p>El pastel "${nombre}" ha sido registrado correctamente</p>
        <a href="/">Volver al inicio</a> | <a href="/registro">Registrar otro pastel</a>
      `);
    });
  });
});

// Ruta para eliminar un pastel
app.post('/eliminar/:id', (req, res) => {
  const id = req.params.id; // Obtener el ID del pastel a eliminar

  const query = 'DELETE FROM pasteles WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).send('Error al eliminar el pastel');
    }
    return res.redirect('/lista'); // Redirigir a la lista de pasteles después de eliminar
  });
});

// Ruta para mostrar el formulario de edición
app.get('/editar/:id', (req, res) => {
  const id = req.params.id; // Obtener el ID del pastel a editar

  const query = 'SELECT * FROM pasteles WHERE id = ?';
  db.get(query, [id], (err, pastel) => {
    if (err) {
      return res.status(500).send('Error al obtener el pastel');
    }
    if (!pastel) {
      return res.status(404).send('Pastel no encontrado');
    }
    return res.render('editar', { pastel });
  });
});

// Ruta para procesar la actualización del pastel
app.post('/editar/:id', (req, res) => {
  const id = req.params.id; // Obtener el ID del pastel a editar
  const { nombre, sabor, tamaño, precio, descripcion, fecha_creacion, es_vegano, decoraciones } = req.body;

  // Validaciones
  if (!nombre || !sabor || !tamaño || !precio || !descripcion || !fecha_creacion || !decoraciones) {
    return res.status(400).send('Todos los campos deben ser llenados');
  }

  if (isNaN(precio)) {
    return res.status(400).send('El precio debe ser un valor numérico');
  }

  // Convertir es_vegano a booleano
  const esVegano = es_vegano ? 1 : 0; // Definir esVegano aquí

  // Actualizar el pastel en la base de datos
  const query = `
    UPDATE pasteles
    SET nombre = ?, sabor = ?, tamaño = ?, precio = ?, descripcion = ?, fecha_creacion = ?, es_vegano = ?, decoraciones = ?
    WHERE id = ?
  `;
  const params = [nombre, sabor, tamaño, precio, descripcion, fecha_creacion, esVegano, decoraciones, id]; // Usar esVegano aquí

  db.run(query, params, function (err) {
    if (err) {
      return res.status(500).send('Error al actualizar el pastel');
    }
    return res.redirect('/lista'); // Redirigir a la lista de pasteles después de actualizar
  });
});

// Ruta para la lista de pasteles
app.get('/lista', (req, res) => {
  const query = 'SELECT * FROM pasteles';
  db.all(query, [], (err, pasteles) => {
    if (err) {
      return res.status(500).send('Error al obtener lista de pasteles');
    }
    return res.render('lista', { pasteles });
  });
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});