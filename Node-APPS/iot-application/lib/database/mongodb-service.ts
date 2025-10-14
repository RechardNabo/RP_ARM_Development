// MongoDB connection service for the CM4-IO-WIRELESS-BASE
import { MongoClient, type Db, type Collection } from "mongodb"
import { appConfig } from "@/lib/config"

export interface MongoDBConfig {
  host: string
  port: number
  database: string
  username?: string
  password?: string
  authSource?: string
}

// Create a mock collection that doesn't throw errors
class MockCollection<T> {
  async insertOne(doc: any) {
    return { insertedId: "mock-id-" + Date.now() }
  }
  async find(query: any = {}) {
    return {
      limit: () => ({
        toArray: async () => [],
      }),
    }
  }
  async findOne(query: any) {
    return null
  }
  async updateOne(query: any, update: any) {
    return { modifiedCount: 1 }
  }
  async deleteOne(query: any) {
    return { deletedCount: 1 }
  }
}

export class MongoDBService {
  private static instance: MongoDBService
  private client: MongoClient | null = null
  private db: Db | null = null
  private config: MongoDBConfig
  private isConnected = false
  private mockMode = false

  private constructor(config: MongoDBConfig) {
    this.config = config
    // Check if we're in mock mode
    this.mockMode = process.env.SKIP_MONGODB === "true"
    console.log(`MongoDB Service initialized in ${this.mockMode ? "MOCK" : "NORMAL"} mode`)
  }

  public static getInstance(config?: MongoDBConfig): MongoDBService {
    if (!MongoDBService.instance) {
      if (!config) {
        const mongoDefaults = appConfig.services?.mongodb
        config = {
          host: mongoDefaults?.host || "localhost",
          port: mongoDefaults?.port || 27017,
          database: mongoDefaults?.database || "cm4_iot_data",
          username: mongoDefaults?.username || undefined,
          password: mongoDefaults?.password || undefined,
          authSource: mongoDefaults?.authSource || undefined,
        }
      }
      MongoDBService.instance = new MongoDBService(config)
    }
    return MongoDBService.instance
  }

  public async connect(): Promise<boolean> {
    try {
      // If we're in mock mode, don't actually connect
      if (this.mockMode) {
        console.log("MongoDB in mock mode - skipping actual connection")
        return true
      }

      if (this.isConnected) {
        console.log("Already connected to MongoDB")
        return true
      }

      const { host, port, database, username, password, authSource } = this.config

      let uri = `mongodb://${host}:${port}/${database}`

      // Add authentication if provided
      if (username && password) {
        uri = `mongodb://${username}:${password}@${host}:${port}/${database}`
        if (authSource) {
          uri += `?authSource=${authSource}`
        }
      }

      try {
        this.client = new MongoClient(uri)
        await this.client.connect()
        this.db = this.client.db(database)
        this.isConnected = true

        console.log(`Connected to MongoDB at ${host}:${port}/${database}`)
        return true
      } catch (error) {
        console.warn("Failed to connect to MongoDB:", error.message)
        return false
      }
    } catch (error) {
      console.error("Error in MongoDB connect method:", error)
      return false
    }
  }

  public async disconnect(): Promise<void> {
    if (this.mockMode) {
      console.log("MongoDB in mock mode - no need to disconnect")
      return
    }

    if (this.client && this.isConnected) {
      await this.client.close()
      this.isConnected = false
      console.log("Disconnected from MongoDB")
    }
  }

  public getCollection<T>(collectionName: string): Collection<T> | MockCollection<T> | null {
    // In mock mode, return a mock collection that doesn't throw errors
    if (this.mockMode) {
      return new MockCollection<T>()
    }

    if (!this.db || !this.isConnected) {
      console.error("Not connected to MongoDB")
      return null
    }
    return this.db.collection<T>(collectionName)
  }

  public async insertOne<T>(collectionName: string, document: T): Promise<string | null> {
    // In mock mode, return a mock ID
    if (this.mockMode) {
      return `mock-id-${Date.now()}`
    }

    const collection = this.getCollection<T>(collectionName)
    if (!collection) return null

    try {
      const result = await collection.insertOne(document as any)
      return result.insertedId.toString()
    } catch (error) {
      console.error(`Error inserting document into ${collectionName}:`, error)
      return null
    }
  }

  public async findMany<T>(collectionName: string, query: object = {}, limit = 100): Promise<T[]> {
    // In mock mode, return empty array
    if (this.mockMode) {
      return []
    }

    const collection = this.getCollection<T>(collectionName)
    if (!collection) return []

    try {
      return (await collection.find(query).limit(limit).toArray()) as T[]
    } catch (error) {
      console.error(`Error finding documents in ${collectionName}:`, error)
      return []
    }
  }

  public async findOne<T>(collectionName: string, query: object): Promise<T | null> {
    // In mock mode, return null
    if (this.mockMode) {
      return null
    }

    const collection = this.getCollection<T>(collectionName)
    if (!collection) return null

    try {
      return (await collection.findOne(query)) as T
    } catch (error) {
      console.error(`Error finding document in ${collectionName}:`, error)
      return null
    }
  }

  public async updateOne<T>(collectionName: string, query: object, update: object): Promise<boolean> {
    // In mock mode, return success
    if (this.mockMode) {
      return true
    }

    const collection = this.getCollection<T>(collectionName)
    if (!collection) return false

    try {
      const result = await collection.updateOne(query, { $set: update })
      return result.modifiedCount > 0
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error)
      return false
    }
  }

  public async deleteOne<T>(collectionName: string, query: object): Promise<boolean> {
    // In mock mode, return success
    if (this.mockMode) {
      return true
    }

    const collection = this.getCollection<T>(collectionName)
    if (!collection) return false

    try {
      const result = await collection.deleteOne(query)
      return result.deletedCount > 0
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error)
      return false
    }
  }

  public isConnectedToDatabase(): boolean {
    // In mock mode, we're always "connected" for UI purposes
    if (this.mockMode) {
      return true
    }
    return this.isConnected
  }
}

// Create a singleton instance
let mongoDBService: MongoDBService | null = null

export function getMongoDBService(config?: MongoDBConfig): MongoDBService {
  if (!mongoDBService) {
    mongoDBService = MongoDBService.getInstance(config)
  }
  return mongoDBService
}
