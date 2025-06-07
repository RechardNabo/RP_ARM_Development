/**
 * Data access layer that uses mock data in v0 preview environment
 * and real MongoDB in production
 */

import { getMockData } from "./mock-data-provider"
import { getMongoDBService } from "./database/mongodb-service"

// Helper function to determine if we're in v0 preview
function isV0Preview(): boolean {
  // Check for v0 environment
  return (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel-v0"))
  )
}

// Generic data access function
export async function getData<T>(collectionName: string, mockDataType: string, query: object = {}): Promise<T[]> {
  // In v0 preview, return mock data
  if (isV0Preview()) {
    console.log(`Using mock data for ${collectionName}`)
    return getMockData(mockDataType) as T[]
  }

  // Otherwise use MongoDB
  try {
    const mongoService = getMongoDBService()
    if (!mongoService.isConnectedToDatabase()) {
      await mongoService.connect()
    }

    return await mongoService.findMany<T>(collectionName, query)
  } catch (error) {
    console.error(`Error fetching data from ${collectionName}:`, error)
    // Fallback to mock data on error
    return getMockData(mockDataType) as T[]
  }
}

// Get a single item
export async function getItem<T>(collectionName: string, mockDataType: string, id: string): Promise<T | null> {
  // In v0 preview, return mock data
  if (isV0Preview()) {
    console.log(`Using mock data for ${collectionName} item ${id}`)
    const items = getMockData(mockDataType) as any[]
    return (items.find((item) => item.id === id) as T) || null
  }

  // Otherwise use MongoDB
  try {
    const mongoService = getMongoDBService()
    if (!mongoService.isConnectedToDatabase()) {
      await mongoService.connect()
    }

    return await mongoService.findOne<T>(collectionName, { id })
  } catch (error) {
    console.error(`Error fetching item from ${collectionName}:`, error)
    // Fallback to mock data on error
    const items = getMockData(mockDataType) as any[]
    return (items.find((item) => item.id === id) as T) || null
  }
}

// Create an item
export async function createItem<T>(collectionName: string, item: T): Promise<string | null> {
  // In v0 preview, just log and return a fake ID
  if (isV0Preview()) {
    console.log(`Mock create in ${collectionName}:`, item)
    return `mock-id-${Date.now()}`
  }

  // Otherwise use MongoDB
  try {
    const mongoService = getMongoDBService()
    if (!mongoService.isConnectedToDatabase()) {
      await mongoService.connect()
    }

    return await mongoService.insertOne<T>(collectionName, item)
  } catch (error) {
    console.error(`Error creating item in ${collectionName}:`, error)
    return null
  }
}

// Update an item
export async function updateItem<T>(collectionName: string, id: string, updates: Partial<T>): Promise<boolean> {
  // In v0 preview, just log and return success
  if (isV0Preview()) {
    console.log(`Mock update in ${collectionName} for ${id}:`, updates)
    return true
  }

  // Otherwise use MongoDB
  try {
    const mongoService = getMongoDBService()
    if (!mongoService.isConnectedToDatabase()) {
      await mongoService.connect()
    }

    return await mongoService.updateOne<T>(collectionName, { id }, updates)
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error)
    return false
  }
}

// Delete an item
export async function deleteItem(collectionName: string, id: string): Promise<boolean> {
  // In v0 preview, just log and return success
  if (isV0Preview()) {
    console.log(`Mock delete in ${collectionName} for ${id}`)
    return true
  }

  // Otherwise use MongoDB
  try {
    const mongoService = getMongoDBService()
    if (!mongoService.isConnectedToDatabase()) {
      await mongoService.connect()
    }

    return await mongoService.deleteOne(collectionName, { id })
  } catch (error) {
    console.error(`Error deleting item from ${collectionName}:`, error)
    return false
  }
}
