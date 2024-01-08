import express from "express";
import mongoose, { Schema } from "mongoose";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ exdended: false }));

mongoose.connect('mongodb://localhost:27017/quoteDB')
        .then(() => console.log("MongoDB Connected"))
        .catch((err) => console.log("MongoDB error", err));

const quoteSchema = new mongoose.Schema({
    author: {
        type: String,
    },
    quote: {
        type: String,
    },
});

const Quote = mongoose.model('quote', quoteSchema);

async function getRandomQuote() {
    try {
        const response = await fetch('https://zenquotes.io/api/random');
        const data = await response.json();
        if(data && data.length > 0){
            return {
                author: data[0].a,
                quote: data[0].q,
            };
        } else {
            return {error: "No quote available"};
        }
    } catch(error) {
        console.error('error fetching quote', error.message);
        return {error: "Error fetching quote"};
    }
}

app.get("/", async (req, res) => {
    const quote = await getRandomQuote();
    res.json({quote});

});

app.post("/quote", async (req, res) => {
    const {author, quote} = req.body;

    if(!author || !quote){
        return res.status(400).json({error: "Author and quote are required"});
    }

    const newQuote = new Quote({author, quote});
    newQuote.save((err) => {
        if(err) {
            return res.status(500).json({error: "error adding quote to the database"});
        }
        res.json({message: "Quote added successfully"});
    });

});

app.get('/quote/:author', async (req, res) => {
    const {author} = req.body;
    try {
        const quotesByAuthor = await Quote.find({author});
        res.json({quotes: quotesByAuthor});

    } catch(error) {
        res.status(500).json({error: "Error while retrieving quote by author name"});
    }
});

app.delete('/quote/:author', async (req, res) => {
    await Quote.findByIdAndDelete(req.params.id);
    return res.json({Success: "Deleted successfully"});
});

app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));

