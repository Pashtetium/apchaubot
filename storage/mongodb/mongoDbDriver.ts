import { MongoClient, ServerApiVersion } from "mongodb";

export type Stats = {
  userId?: number;
  firstName?: string;
  lastName?: string;
  userName?: string;
  apchuSize?: number;
};

export class MongoDbDriver {
  private client: MongoClient;
  readonly dbName = "apshu-stats";
  readonly collectionName = "stats";

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
}
