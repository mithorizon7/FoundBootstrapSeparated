// Standardized error response parser for production-ready error handling
export async function parseErrorResponse(response: Response, defaultMessage: string): Promise<string> {
  try {
    // Clone response to avoid "body already read" errors
    const responseClone = response.clone();
    const errorText = await responseClone.text();
    
    if (!errorText.trim()) {
      return defaultMessage;
    }
    
    const errorJson = JSON.parse(errorText);
    
    // Ensure message is a non-empty string
    if (typeof errorJson.message === 'string' && errorJson.message.trim()) {
      return errorJson.message;
    }
    
    return defaultMessage;
  } catch (e) {
    // If any step fails, return default message
    return defaultMessage;
  }
}