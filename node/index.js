const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const cors = require("cors");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const app = express();

const allowedOrigins = ["http://localhost:4200"];

const corsOptions = {
  origin: "http://localhost:4200", // Replace with your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow necessary methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow necessary headers
  credentials: true, // Include cookies if needed
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

puppeteer.use(StealthPlugin());

app.get("/scrape/scholar", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res
      .status(400)
      .send({ error: "q is required in the request body." });
  }

  try {
    const browser = await puppeteer.launch({
      headless: false, // Run in non-headless mode for debugging
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    // Set user agent to mimic real browsers
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/537.36",
      "Mozilla/5.0 (Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.0.1 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/18.18363 Safari/537.36",
      "Mozilla/5.0 (Linux; Android 9; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36",
      "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/537.36",
    ];

    // Select a random user agent
    const randomUserAgent =
      userAgents[Math.floor(Math.random() * userAgents.length)];

    // Set the random user agent
    await page.setUserAgent(randomUserAgent);

    // Set viewport and disable navigator.webdriver
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    // Visit the target URL
    const url = "https://scholar.google.com/";
    await page.goto(url, { waitUntil: "networkidle2" });

    // Wait for the input field to be visible
    await page.waitForSelector(".gs_in_txt.gs_in_ac");

    // Type the provided text into the input field
    await page.type(".gs_in_txt.gs_in_ac", q);

    await page.waitForSelector("#gs_hdr_tsb");
    await page.click("#gs_hdr_tsb");

    await page.waitForSelector(".gs_or_cit.gs_or_btn.gs_nph");

    await page.click(".gs_or_cit.gs_or_btn.gs_nph");

    // await page.waitForSelector('.gs_r[data-cid]', { visible: true });
    // const dataCid = await page.$eval('.gs_r[data-cid]', el => el.getAttribute('data-cid'));
    // const generatedUrl = `https://scholar.google.com/scholar?q=info:${dataCid}:scholar.google.com/&output=cite&scirp=0&hl=en`;

    await page.waitForSelector(".gs_r.gs_or.gs_scl");
    const dataCid = await page.$eval(".gs_r.gs_or.gs_scl", (element) =>
      element.getAttribute("data-cid")
    );
    const generatedUrl = `https://scholar.google.com/scholar?q=info:${dataCid}:scholar.google.com/&output=cite&scirp=0&hl=en`;

    // Wait for and click the "BibTeX" link
    await page.waitForSelector(".gs_citi");

    await page.click(".gs_citi");

    // Get the URL of the new page
    const currentUrl = await page.url();
    await page.goto(currentUrl, { waitUntil: "networkidle0" });

    // Scrape the HTML content of the page
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);

    // Extract the content inside the <pre> tag
    const preContent = $("body pre").text();

    // Close the browser
    await browser.close();

    // Send the scraped content as the response
    res.send({ content: preContent, success: true, citeUrl: generatedUrl });
  } catch (error) {
    console.error("Error during Puppeteer operations:", error);
    res
      .status(500)
      .send({ error: "An error occurred during scraping.", success: false });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
