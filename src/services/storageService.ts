import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { updateUserProfile } from './userService';

/**
 * Upload profile picture to Firebase Storage and update user profile
 * Path: profilePhotos/{uid}/{filename}
 */
export async function uploadProfilePhoto(
  uid: string,
  file: File
): Promise<string> {
  const extension = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `profilePhotos/${uid}/avatar_${Date.now()}.${extension}`);

  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);

  // Update users/{uid} document with new photoURL
  await updateUserProfile(uid, { photoURL: downloadUrl });

  return downloadUrl;
}
