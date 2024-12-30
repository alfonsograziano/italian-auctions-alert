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
  try {
    const url = new URL(
      "https://pvp.giustizia.it/ric-496b258c-986a1b71/ric-ms/ricerca/vendite?language=it&page=0&size=1&sort=dataOraVendita,desc&sort=citta,asc"
    );

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

    const data = await response.json();
    const listings = data.body.content;

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

    for (const listing of newListings) {
      const newListing = new Listing({
        id: listing.id,
        analyzed: true,
        analyzedTimestamp: new Date(),
      });

      await newListing.save();

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
    }
  } catch (error) {
    console.error("Error syncing listings:", error);
  } finally {
    await mongoose.disconnect();
  }
}

export const handler = async () => {
  const dateFilter = new Date("2024-12-02");
  const body = {
    tipoLotto: "IMMOBILI",
    categoriaBene: [],
    flagRicerca: 0,
    coordIndirizzo: "40.3486087, 14.9914267",
    raggioIndirizzo: 10,
  };

  await syncListings(dateFilter, body);
};
