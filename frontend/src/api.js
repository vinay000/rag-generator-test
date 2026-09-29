const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Handles API responses and throws descriptive errors on non-2xx status.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Request failed (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

/**
 * Fetches all active collections from the backend.
 * @returns {Promise<Array<{id: string, name: string, provider: string, model: string, dimension: number, totalChunks: number}>>}
 */
export async function fetchCollections() {
  const data = await handleResponse(await fetch(`${API_BASE}/collections`));
  return data.collections || [];
}

/**
 * Uploads one or more files to create a new indexed collection.
 * @param {File[]} files - Array of File objects (PDF, TXT, MD)
 * @param {string} [name] - Friendly collection name
 * @param {string} [id] - Optional custom collection ID
 * @returns {Promise<Object>} Ingestion summary
 */
export async function uploadFiles(files, name, id) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  if (name) formData.append('name', name);
  if (id) formData.append('id', id);

  return await handleResponse(
    await fetch(`${API_BASE}/collections`, {
      method: 'POST',
      body: formData
    })
  );
}

/**
 * Deletes a collection from the vector store by ID.
 * @param {string} collectionId
 * @returns {Promise<{message: string, id: string}>}
 */
export async function deleteCollection(collectionId) {
  return await handleResponse(
    await fetch(`${API_BASE}/collections/${collectionId}`, {
      method: 'DELETE'
    })
  );
}

/**
 * Queries a collection to generate a grounded answer with citations.
 * @param {string} collectionId
 * @param {string} question
 * @returns {Promise<{answer: string, found: boolean, topScore: number, minScore: number, sources: Array<Object>}>}
 */
export async function queryCollection(collectionId, question) {
  return await handleResponse(
    await fetch(`${API_BASE}/collections/${collectionId}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    })
  );
}
