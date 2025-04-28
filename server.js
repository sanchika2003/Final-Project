const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/game-leaderboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully!');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Score Schema
const scoreSchema = new mongoose.Schema({
    name: String,
    score: Number,
    date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);

// Routes
app.get('/api/scores', async (req, res) => {
    try {
        const scores = await Score.find()
            .sort({ score: -1 })
            .limit(10);
        res.json(scores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/scores', async (req, res) => {
    try {
        const { name, score } = req.body;
        const newScore = new Score({ name, score });
        await newScore.save();
        res.status(201).json(newScore);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 