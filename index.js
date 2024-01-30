import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pages/index.html"));
});

app.post("/weather", async (req, res) => {
    const openweathermapAccessKey = process.env.OPENWEATHERMAP_KEY;

    const { city } = req.body;
    if (!city) {
        return res.status(400).json({ error: 'City name is required' });
    }
    console.log(city);

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openweathermapAccessKey}&units=metric`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.cod && data.cod !== 200) {
            return res.status(data.cod).json({ error: data.message });
        }

        const weatherInfo = {
            temperature: data.main.temp,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            coordinates: {
                latitude: data.coord.lat,
                longitude: data.coord.lon
            },
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            countryCode: data.sys.country,
            rainVolume: data.rain ? data.rain['1h'] : null
        };

        res.json(weatherInfo);

    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

app.post("/countryInfo", async (req, res) => {
    try {
        const { countryCode } = req.body;
        if (!countryCode) {
            return res.status(400).json({ error: 'Country code is required' });
        }

        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        if (!response.ok) {
            throw new Error('Failed to fetch country data');
        }
        const countryData = await response.json();

        console.log(countryData);

        const data = {
            country: countryData[0].name.common,
            area: countryData[0].area,
            region: countryData[0].region,
            languages: Object.values(countryData[0].languages).join(', '),
            flag: countryData[0].flags.png,
            latlng: countryData[0].latlng
        }

        console.log(data);
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/cityWikipediaPage', async (req, res) => {
    const { cityName } = req.body;

    try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${cityName}&prop=info&inprop=url`);
        const data = await response.json();

        console.log(data);
        
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const pageUrl = pages[pageId].fullurl;

        res.json({ url: pageUrl });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch Wikipedia page URL' });
    }
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "pages/about.html"));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
