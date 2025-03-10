//Los comentarios son para saber para que es que, no piense mal miss :(
const express = require('express'); //framework a usar
const app = express(); //instancia de express que manejará las solicitudes y respuestas
const path = require('path'); //modulo de node que trabaja con rutas y archivos
const sqlite3 = require('sqlite3').verbose(); //libreria que permite interactuar con la base de datos

//Configurar EJS motor de plantillas

app.set('view engine', 'ejs'); //Le dice a Express que se usa EJS como motor de plantilla
app.set('views', path.join(__dirname, 'views')); //Especifica la carpeta donde se encuentran las vistas

//Middleware

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true})); //permite interpretar los datos del HTML

//Conexion a SQLite

const db = new sqlite3.Database('./db/database.db', (err) => {
    if (err) {
      console.error('Error al conectar a la base de datos:', err.message);
    } else {
      console.log('Conectado a la base de datos SQLite.');
    }
  });

//Crear tabla de pasteles
db.run(`
    CREATE TABLE IF NOT EXISTS pasteles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      sabor TEXT NOT NULL,
      tamaño TEXT NOT NULL,
      precio REAL NOT NULL,
      descripcion TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      es_vegano INTEGER NOT NULL,  -- 1 para sí, 0 para no
      decoraciones TEXT NOT NULL
    )
  `);  
//Ruta principal
app.get('/', (req, res) => {
    res.render('index');
});

//Ruta para mostrar el registro
app.get('/registro', (req, res) =>{
    res.render('registro');
});
//POST

app.post('/registro', (req, res) =>{
    const {nombre, sabor, tamaño, precio, descripcion, fecha_creacion, es_vegano, decoraciones }
    =req.body;
    
    //Validaciones
    if(!nombre || !sabor ||  !tamaño || !precio || !descripcion || !fecha_creacion || !decoraciones){
        return res.status(400).send('Todos los campos deben ser llenados');
    }

    if (isNaN(precio)){
        return res.status(400).send('El precio debe ser un valor numerico');
    }
    
//Convertir es_vegano a booleano
    const esVegano = es_vegano ? 1:0;

//Insertar datos a la base de datos
    const query= `
    INSERT INTO pasteles (nombre, sabor, tamaño, precio, descripcion, fecha_creacion, es_vegano, decoraciones)
    Values (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [nombre, sabor, tamaño, precio, descripcion, fecha_creacion, es_vegano, decoraciones];

    db.run(query, params, function(err){
        if (err){
            return res.status(500).send('Error al momento de registrar');
        }
        res.send(`
            <h1>!Pastel registrado exitosamente¡</h1>
            <p>EL pastel "${nombre}" ha sido registrado correctamente</p>
            <a href="/"> Volver al inicio</a> | <a href="/registro">Registrar otro pastel</a> `);
    });
});

//Ruta para la lista de pasteles
    
    app.get('/lista', (req, res) =>  {
        const query = 'SELECT * FROM pasteles';
        db.all(query, [], (err, pasteles) =>{
            if (err) {
                return res.status(500).sen('Error al obtener lista de pasteles');         
            }
            res.render('lista', {pasteles});
        });
    });

//Iniciar servidor
    const PORT = 3000;
        app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });