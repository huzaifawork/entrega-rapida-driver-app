import { storage } from '@shared/firebase-config.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const UploadFile = async ({ file }) => {
  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const file_url = await getDownloadURL(snapshot.ref);
  return { file_url };
};

export const SendEmail = async (data) => {
  console.log('Email would be sent:', data);
  return { success: true };
};

export const InvokeLLM = async (data) => {
  return { response: 'AI response placeholder' };
};






