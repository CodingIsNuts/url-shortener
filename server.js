const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const server = require('http').createServer(app);
// const { IdGenerator } = require('custom-random-id');
const UrlEntry = require('./models/urlEntry');
const dotenv = require('dotenv');

// CONSTANTS
dotenv.config();
const DATABASE = process.env.DATABASE;
const PORT = process.env.PORT || 8080;

// DATABASE
mongoose.connect(DATABASE, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.on('open', () => console.log('Connected to database'));

// OTHER EXPRESS SETTINGS
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/public`));
app.set('trust proxy', true);
app.set('view engine', 'ejs');

// REDIRECT
app.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    const urlEntry = await UrlEntry.findOne({ slug });

    if (urlEntry?.url) return res.redirect(urlEntry.url);
    res.status(404).send('Redirect not found');
});

// HOME
app.get('/', async (req, res) => {
    const { slug } = req.query;
    const urlEntry = await UrlEntry.findOne({ slug });

    const longUrl = urlEntry?.url;
    const shortUrl = `${req.protocol}://${req.get('host')}/${slug}`;
    res.render('index', { longUrl, shortUrl });
});

// CREATE NEW URL ENTRY
app.post('/new', async (req, res) => {
    let { url } = req.body;
    url = url?.trim() || '';

    if (url === '') return res.status(400).send('url is required');

    // ADD 'HTTP://' IN FRONT OF URL
    if (!/^http(s)?:\/\//.test(url)) url = `http://${url}`;

    // DOES URL ALREADY EXISTS IN DATABASE
    const existingUrlEntry = await UrlEntry.findOne({ url });
    if (existingUrlEntry) return res.redirect(`/?slug=${existingUrlEntry.slug}`);

    // GENERATE SLUG AND SAVE URL ENTRY IN DATABASE
    let urlEntry;
    let slug;
    do {
        slug = generateSlug();
        urlEntry = new UrlEntry({
            slug,
            url
        });
    } while (await UrlEntry.findOne({ slug }));

    try {
        await urlEntry.save();
        res.redirect(`/?slug=${slug}`);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

const ALPHABET = '01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SLUG_LENGTH = 5;
const generateSlug = () => {
    let slug = '';
    for (let i = 0; i < SLUG_LENGTH; i++) {
        slug += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return slug;
    // return new IdGenerator('{{ alpha_number_5 }}').getFinalExpression().toLowerCase();
};
