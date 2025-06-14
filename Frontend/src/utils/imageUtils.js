import { API_URL } from '../config/api';

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

export const getTechnologyImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL}/uploads/technologies/${imagePath.substring(imagePath.lastIndexOf('/') + 1)}`;
}; 