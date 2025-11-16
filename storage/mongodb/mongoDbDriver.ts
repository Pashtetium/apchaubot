import { MongoClient, ServerApiVersion } from "mongodb";

export type Stats = {
  userId?: number;
  firstName?: string;
  lastName?: string;
  userName?: string;
  apchuSize?: number;
};

export type Sponsor = {
  name: string;
  url: string;
};

export class MongoDbDriver {
  private client: MongoClient;
  readonly dbName = "apshu-stats";
  readonly collectionName = "stats";
  readonly sponsorsCollectionName = "sponsors";

  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString, {
      serverApi: ServerApiVersion.v1,
    });
  }

  async openConnection() {
    try {
      await this.client.connect();
    } catch (e) {
      throw e;
    } finally {
      console.dir("Successfully connected to MongoDB");
    }
  }

  async saveStats(stats: Stats) {
    try {
      const result = await this.client
        .db("apshu-stats")
        .collection("stats")
        .insertOne(stats);
      console.dir(result);
    } catch (e) {
      throw e;
    }
  }

  async closeConnection() {
    try {
      await this.client.close();
    } catch (e) {
      console.dir(e);
    } finally {
      console.dir("Successfully closed connection to MongoDB");
    }
  }

  async getAverageSizeForUser(userId: number | undefined) {
    if (!userId) {
      return 0;
    }

    try {
      const docs = await this.client
        .db(this.dbName)
        .collection(this.collectionName)
        .find({ userId: userId, apchuSize: { $exists: true } })
        .toArray();

      const totalSize = docs.reduce((acc, doc) => acc + doc.apchuSize, 0);

      return Math.round(totalSize / docs.length);
    } catch (e) {
      throw e;
    }
  }

  async addSponsor(name: string, url: string) {
    try {
      const sponsor: Sponsor = { name, url };
      console.log(`Adding sponsor to db: ${this.dbName}, collection: ${this.sponsorsCollectionName}`, sponsor);
      const result = await this.client
        .db(this.dbName)
        .collection(this.sponsorsCollectionName)
        .insertOne(sponsor);
      console.log("Sponsor added successfully:", result.insertedId);
    } catch (e) {
      console.error("Error adding sponsor:", e);
      throw e;
    }
  }

  async removeSponsor(name: string) {
    try {
      await this.client
        .db(this.dbName)
        .collection(this.sponsorsCollectionName)
        .deleteOne({ name });
    } catch (e) {
      throw e;
    }
  }

  async getSponsors(): Promise<Sponsor[]> {
    try {
      console.log(`Fetching sponsors from db: ${this.dbName}, collection: ${this.sponsorsCollectionName}`);
      const sponsors = await this.client
        .db(this.dbName)
        .collection<Sponsor>(this.sponsorsCollectionName)
        .find({})
        .toArray();

      console.log(`Found ${sponsors.length} sponsors`);
      return sponsors;
    } catch (e) {
      console.error("Error fetching sponsors:", e);
      throw e;
    }
  }
}
