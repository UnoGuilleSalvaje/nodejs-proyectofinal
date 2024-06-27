import express from 'express';
import cors from 'cors';
import path from 'path';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import qrcode from 'qrcode';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCBy-KVsXrQZ-mU4Wu53MrzIc1dmsBTULg",
  authDomain: "registro-estancias.firebaseapp.com",
  projectId: "registro-estancias",
  storageBucket: "registro-estancias.appspot.com",
  messagingSenderId: "741516151149",
  appId: "1:741516151149:web:15f2901a79e946cbbdf264",
  measurementId: "G-EFR0LDDJ3M"
};

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Inicializar Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(path.resolve(), 'dist')));

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'codexno1company@gmail.com',
    pass: 'ecdvttmlrrhnzcwf'
  }
});

// Endpoints de la API REST

// Endpoint para obtener estancia al azar y generar QR
app.get('/api/random-stay', async (req, res) => {
  try {
    const randomId = Math.floor(Math.random() * 30) + 1;
    const docRef = doc(db, "estancias", String(randomId));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const estanciaData = docSnap.data();
      const qr = await qrcode.toDataURL(JSON.stringify(estanciaData));
      res.json({ data: estanciaData, qr });
    } else {
      res.status(404).json({ message: "No se encontró la estancia" });
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint para contar los usuarios en la colección "users"
app.get('/api/user-count', async (req, res) => {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    const userCount = usersSnapshot.size;
    res.json({ userCount });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint para sumar todos los precios en la colección "places"
app.get('/api/total-revenue', async (req, res) => {
  try {
    const placesCollection = collection(db, "places");
    const placesSnapshot = await getDocs(placesCollection);
    let totalRevenue = 0;

    placesSnapshot.forEach(doc => {
      const estancia = doc.data().estancia;
      if (estancia && typeof estancia.precio === 'number') {
        totalRevenue += estancia.precio;
      }
    });

    res.json({ totalRevenue });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint para obtener el top 3 de estancias más repetidas
app.get('/api/top-estancias', async (req, res) => {
  try {
    const placesCollection = collection(db, "places");
    const placesSnapshot = await getDocs(placesCollection);
    const estanciaCount = {};

    placesSnapshot.forEach(doc => {
      const estancia = doc.data().estancia;
      if (estancia && typeof estancia.nombre === 'string') {
        const nombre = estancia.nombre;
        if (!estanciaCount[nombre]) {
          estanciaCount[nombre] = 0;
        }
        estanciaCount[nombre]++;
      }
    });

    const topEstancias = Object.entries(estanciaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([nombre, count]) => ({ nombre, count }));

    res.json({ topEstancias });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint para obtener todos los correos electrónicos de la colección "users"
app.get('/api/user-emails', async (req, res) => {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    const emails = usersSnapshot.docs.map(doc => doc.data().email);
    res.json({ emails });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Endpoint para enviar un correo electrónico
app.post('/send-email', (req, res) => {
  const { name, email, message, gender } = req.body;

  const mailOptions = {
    from: 'codexno1company@gmail.com',
    to: 'unoguillel@gmail.com',
    subject: `Formulario usado, email del usuario: ${email}`,
    text: `Nombre: ${name}\nMensaje: ${message}\nGenero: ${gender}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error al enviar el correo:', error);
      return res.status(500).json({ error: error.toString() });
    }
    console.log('Correo enviado:', info.response);
    res.status(200).json({ message: 'Correo enviado correctamente' });
  });
});

// Redirigir todas las demás rutas al index.html de Angular
app.get('*', (req, res) => {
  res.sendFile(path.join(path.resolve(), 'dist', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`API and App are served on port ${port}`);
});
