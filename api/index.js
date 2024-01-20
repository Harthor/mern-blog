require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const Post = require('./models/Post');

const app = express();

// Environment variables
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Multer setup
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

mongoose.set('strictQuery', false);

// CORS and Middleware setup
app.use(cors({ 
  credentials: true, 
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' 
}));app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// MongoDB connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userDoc = await User.create({ username, password: hashedPassword });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    if (userDoc && bcrypt.compareSync(password, userDoc.password)) {
      const token = jwt.sign({ username, id: userDoc._id }, JWT_SECRET);
      res.cookie('token', token).json({ id: userDoc._id, username });
    } else {
      res.status(400).json('Wrong credentials');
    }
  } catch (e) {
    console.error(e);
    res.status(500).json('Server error');
  }
});

// Profile route
app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  try {
    const info = jwt.verify(token, JWT_SECRET);
    res.json(info);
  } catch (e) {
    console.error(e);
    res.status(401).json('Invalid token');
  }
});

// Logout route
app.post('/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) }).json('Logged out successfully');
});

// Post creation route
app.post('/post', upload.single('file'), async (req, res) => {
  const { title, summary, content } = req.body;
  const { token } = req.cookies;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const newPost = {
      title,
      summary,
      content,
      author: decoded.id
    };

    if (req.file) {
      newPost.cover = req.file.path;
    }
    const postDoc = await Post.create(newPost);
res.json(postDoc);} catch (e) {
    console.error(e);
    res.status(500).json('Error creating post');
    }
    });

    // Post update route
app.put('/post/:id', upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const { title, summary, content } = req.body;
    const { token } = req.cookies;
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const postDoc = await Post.findById(id);
  
      if (!postDoc) {
        return res.status(404).json('Post not found');
      }
  
      if (postDoc.author.toString() !== decoded.id) {
        return res.status(403).json('Unauthorized to edit this post');
      }
  
      const updatedPost = { title, summary, content };
      if (req.file) {
        updatedPost.cover = req.file.path;
      }
  
      await Post.findByIdAndUpdate(id, updatedPost, { new: true });
      res.json(updatedPost);
    } catch (e) {
      console.error(e);
      res.status(500).json('Error updating post');
    }
  });
  
  // Get all posts route
  app.get('/post', async (req, res) => {
    try {
      const posts = await Post.find()
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(20);
      res.json(posts);
    } catch (e) {
      console.error(e);
      res.status(500).json('Error fetching posts');
    }
  });
  
  // Get single post by ID route
  app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const postDoc = await Post.findById(id).populate('author', 'username');
      if (!postDoc) {
        return res.status(404).json('Post not found');
      }
      res.json(postDoc);
    } catch (e) {
      console.error(e);
      res.status(500).json('Error fetching post');
    }
  });
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });
  
  // Server initialization
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  