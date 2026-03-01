import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type { DocumentData, UpdateData } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Fetches a single document from a collection with proper typing.
 * @param {string} collectionName The name of the collection.
 * @param {string} documentId The ID of the document to fetch.
 * @returns {Promise<T|null>} The typed document data or null if not found.
 */
export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, documentId);
  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

/**
 * Creates or completely overwrites a single document with typed data.
 * @param {string} collectionName The name of the collection.
 * @param {string} documentId The ID of the document to set.
 * @param {T} data The typed data to set in the document.
 */
export const setDocument = async <T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> => {
  const docRef = doc(db, collectionName, documentId);
  try {
    await setDoc(docRef, data);
  } catch (error) {
    console.error("Error setting document:", error);
    throw error;
  }
};

/**
 * Updates an existing document with typed partial data.
 * @param {string} collectionName The name of the collection.
 * @param {string} documentId The ID of the document to update.
 * @param {Partial<T>} data The typed fields to update.
 */
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: UpdateData<T>
): Promise<void> => {
  const docRef = doc(db, collectionName, documentId);
  try {
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};