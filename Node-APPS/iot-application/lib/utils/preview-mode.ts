/**
 * Utility functions to check if we're running in preview mode
 */

export function isPreviewMode(): boolean {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    // For client-side, check localStorage first (allows toggling in UI)
    const localPreviewMode = localStorage.getItem("previewMode")
    if (localPreviewMode !== null) {
      return localPreviewMode === "true"
    }
  }

  // For server-side or if localStorage is not set
  return process.env.SKIP_MONGODB === "true"
}

// For client-side only
export function setPreviewMode(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("previewMode", enabled ? "true" : "false")
  }
}

// Get mock data with the specified type
export async function getMockData(type: string, params: Record<string, string> = {}): Promise<any> {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams({ type, ...params }).toString()
    const response = await fetch(`/api/preview-mode?${queryParams}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch mock data: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching mock data:", error)
    return null
  }
}
