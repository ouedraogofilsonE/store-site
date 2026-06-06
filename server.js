const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'database.json');

function readData() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            products: [
                { id: 1, name: "Apple iPhone 15 Pro Max", category: "mobile", price: 850000, specs: "128 Go - Titane", image: "" },
                { id: 2, name: "PC Ultrabook Pro Intel 11th Gen", category: "ordinateurs", price: 450000, specs: "Iris Xe / 16GB RAM", image: "" }
            ],
            users: [{ email: "admin@filson.com", password: "AdminFilson2026", role: "admin", name: "Propriétaire FILSON" }]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeData(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- CATALOGUE ---
app.get('/api/products', (req, res) => {
    const db = readData();
    const { category, search } = req.query;
    let filtered = db.products;

    if (category) filtered = filtered.filter(p => p.category === category.toLowerCase());
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.specs.toLowerCase().includes(search.toLowerCase())
        );
    }
    res.json(filtered);
});

// --- AUTENTICATION ---
app.post('/api/auth/login', (req, res) => {
    const db = readData();
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email && u.password === password);

    if (!user) return res.status(401).json({ message: "Identifiants incorrects." });
    res.json({ message: "Connexion réussie", user: { name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/register', (req, res) => {
    const db = readData();
    const { name, email, password } = req.body;
    
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    db.users.push({ name, email, password, role: "client" });
    writeData(db);
    res.status(201).json({ message: "Compte client créé avec succès !" });
});

// --- AJOUT PROD (ADMIN) ---
app.post('/api/products/add', (req, res) => {
    const db = readData();
    const { name, category, price, specs, image, adminEmail } = req.body;
    
    if (!db.users.find(u => u.email === adminEmail && u.role === "admin")) {
        return res.status(403).json({ message: "Action non autorisée." });
    }

    const newProduct = { id: Date.now(), name, category, price, specs, image: image || "" };
    db.products.push(newProduct);
    writeData(db);
    res.status(201).json({ message: "Nouvel appareil ajouté au stock !", product: newProduct });
});

// --- MODIFICATION PROD (ADMIN) ---
app.put('/api/products/update/:id', (req, res) => {
    const db = readData();
    const { id } = req.params;
    const { name, category, price, specs, image, adminEmail } = req.body;

    if (!db.users.find(u => u.email === adminEmail && u.role === "admin")) {
        return res.status(403).json({ message: "Action non autorisée." });
    }

    const index = db.products.findIndex(p => p.id == id);
    if (index === -1) return res.status(404).json({ message: "Produit introuvable." });

    db.products[index] = { id: Number(id), name, category, price, specs, image };
    writeData(db);
    res.json({ message: "Fiche produit mise à jour !" });
});

// --- SUPPRESSION PROD (ADMIN) ---
app.delete('/api/products/delete/:id', (req, res) => {
    const db = readData();
    const { id } = req.params;
    const { adminEmail } = req.body;

    if (!db.users.find(u => u.email === adminEmail && u.role === "admin")) {
        return res.status(403).json({ message: "Action non autorisée." });
    }

    db.products = db.products.filter(p => p.id != id);
    writeData(db);
    res.json({ message: "Appareil retiré de la vitrine !" });
});

app.listen(PORT, () => {
    console.log(`Serveur FILSON connecté sur le port http://localhost:${PORT}`);
});