import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const ListingSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  analyzed: Boolean,
  analyzedTimestamp: { type: Date, default: Date.now },
});
const Listing = mongoose.model("Listing", ListingSchema);

const SES_EMAIL = process.env.SES_EMAIL;
const sesClient = new SESClient({ region: "eu-west-1" });

async function syncListings(dateFilter, body) {
  await mongoose.connect(MONGO_URI, {
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");

  try {
    const url = new URL(
      "https://pvp.giustizia.it/ric-496b258c-986a1b71/ric-ms/ricerca/vendite"
    );
    url.searchParams.set("language", "it");
    url.searchParams.set("page", "0");
    // Change this param if you need to get more results in the same day
    url.searchParams.set("size", "10");
    url.searchParams.set("sort", "dataOraVendita,desc");
    url.searchParams.set("sort", "citta,asc");

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    console.log("Data fetched successfully from PVP Giustizia");
    const data = await response.json();
    const listings = data.body.content;

    console.log(
      `Fetched ${listings.length} listings. Checking for new ones...`
    );
    const existingIds = await Listing.find({
      id: { $in: listings.map((listing) => listing.id) },
    }).select("id");
    const existingIdSet = new Set(existingIds.map((listing) => listing.id));

    const newListings = listings.filter((listing) => {
      const publicationDate = new Date(listing.dataPubblicazione);
      return (
        !existingIdSet.has(listing.id) &&
        publicationDate.getTime() > dateFilter.getTime()
      );
    });

    console.log(`${newListings.length} new listings found.`);

    for (const listing of newListings) {
      console.log(`Processing listing with ID: ${listing.id}`);
      const newListing = new Listing({
        id: listing.id,
        analyzed: true,
        analyzedTimestamp: new Date(),
      });

      await newListing.save();
      console.log(`Listing with ID: ${listing.id} saved to MongoDB.`);

      const emailParams = {
        Destination: {
          ToAddresses: [SES_EMAIL],
        },
        Message: {
          Body: {
            Text: {
              Data: `Ciao, hai un nuovo alert in base ai tuoi risultati di ricerca.\n\nLink: https://pvp.giustizia.it/pvp/it/detail_annuncio.page?idAnnuncio=${listing.id}`,
            },
          },
          Subject: { Data: "Alert - Nuovo immobile all'asta" },
        },
        Source: SES_EMAIL,
      };

      const command = new SendEmailCommand(emailParams);
      await sesClient.send(command);
      console.log(`Email notification sent for listing ID: ${listing.id}`);
    }
  } catch (error) {
    console.error("Error syncing listings:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

export const handler = async () => {
  console.log("Handler invoked. Starting sync process...");
  const dateFilter = new Date("2024-12-02");
  const body = {
    tipoLotto: "IMMOBILI",
    categoriaBene: [],
    flagRicerca: 0,
    coordIndirizzo: "40.3486087, 14.9914267",
    raggioIndirizzo: 10,
  };

  await syncListings(dateFilter, body);
  console.log("Sync process completed.");
};
