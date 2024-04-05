const mongoose = require('mongoose');
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const striptags = require('striptags');
const cors = require("cors");
const Grid = require("gridfs-stream");
const app = express();
const PORT = process.env.PORT || 3000;

const url = 'mongodb://127.0.0.1:27017/sample';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

const blog = require('./models/blogpost');
const image = require('./models/image');
const addpost = require('./models/addpost');

db.on('error', (err) => {
    console.error('Error connecting to MongoDB:', err);
});

db.once('open', () => {
    console.log('Connected successfully to MongoDB');
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// Set up multer for file uploads
let storage = multer.diskStorage({
    destination: './public/images', // Directory (folder) setting
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname); // File name setting
    }
});

let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype == 'image/jpeg' ||
            file.mimetype == 'image/jpg' ||
            file.mimetype == 'image/png' ||
            file.mimetype == 'image/gif'
        ) {
            cb(null, true);
        } else {
            cb(null, false);
            cb(new Error('Only jpeg, jpg, png, and gif Image allow'));
        }
    }
});

// Route to render home.html when accessing localhost:3000/
app.get('/', function (req, res) {
    return res.sendFile(path.join(__dirname, 'home.html'));
});

// Route to render addpost.html when accessing localhost:3000/addpost
app.get('/addpost', (req, res) => {
    return res.sendFile(path.join(__dirname, 'addpost.html'));
});

// Route to render home.html when accessing localhost:3000/home
app.get('/home', (req, res) => {
    return res.sendFile(path.join(__dirname, 'home.html'));
});

// Route to handle multiple image uploads
app.post('/multiplepost', upload.array('multiple_input', 3), (req, res) => {
    req.files.forEach((single_image) => {
        image.create({ Picture: single_image.filename })
            .then(() => {
                res.redirect('/view');
            })
            .catch((error) => {
                console.log(error);
                res.status(500).send('Internal Server Error');
            });
    });
});

// Route to view details
app.get('/view', (req, res) => {
    addpost.find({})
        .then((posts) => {
            const sanitizedPosts = posts.map(post => ({
                title: post.title,
                content: striptags(post.content),
                Picture: post.Picture,
                __v: post.__v
            }));

            res.render('privew', { x: sanitizedPosts });
            console.log(sanitizedPosts);
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send('Internal Server Error');
        });
});

// Route to add post
app.post('/addpost', upload.array('multiple_input', 3), (req, res) => {
    var title = req.body.title;
    var content = req.body.content;
    // Check if title and content are present
    if (!title || !content) {
        return res.status(400).send('Title and content are required.');
    }

    req.files.forEach((single_image) => {
        addpost.create({ title: title, content: content, Picture: single_image.filename })
            .then(() => {
                console.log('Post added successfully');
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Internal Server Error');
            });
    });

    res.redirect('/view');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
