const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Connection with timeout and error handling
let isMongoConnected = false;

const connectToMongoDB = async () => {
    const urls = [
        'mongodb://127.0.0.1:27017/game-leaderboard',
        'mongodb://localhost:27017/game-leaderboard'
    ];

    for (const url of urls) {
        try {
            await mongoose.connect(url, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000
            });
            console.log('Connected to MongoDB successfully at:', url);
            isMongoConnected = true;
            break;
        } catch (err) {
            console.log(`Failed to connect to ${url}:`, err.message);
            continue;
        }
    }

    if (!isMongoConnected) {
        console.log('Could not connect to MongoDB. Leaderboard functionality will be disabled.');
    }
};

// Initialize MongoDB connection
connectToMongoDB();

// Score Schema
const scoreSchema = new mongoose.Schema({
    name: String,
    score: Number,
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// Routes
app.get('/api/scores', async (req, res) => {
    if (!isMongoConnected) {
        return res.json({ scores: [], message: 'Leaderboard is currently unavailable' });
    }
    try {
        const scores = await Score.find()
            .sort({ score: -1 })
            .limit(10);
        res.json({ scores });
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
    }
});

app.post('/api/scores', async (req, res) => {
    if (!isMongoConnected) {
        return res.json({ message: 'Score not saved - Leaderboard is currently unavailable' });
    }
    try {
        const { name, score } = req.body;
        const newScore = new Score({ name, score });
        await newScore.save();
        res.status(201).json(newScore);
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(400).json({ message: 'Error saving score', error: error.message });
    }
});

// Basic route to serve the game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Game is available at http://localhost:${PORT}`);
}); 