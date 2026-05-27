import { API_BASE } from "../config/api.js";

/**
 * Converts a stored image path (which may have Windows backslashes)
 * into a valid URL served by the backend.
 * e.g.  "uploads\profile\abc.jpg"  →  "<API_BASE>/uploads/profile/abc.jpg"
 *        "uploads/profile/abc.jpg" →  "<API_BASE>/uploads/profile/abc.jpg"
 *        ""  / null / undefined    →  null
 */
export function imgUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Replace every backslash with a forward slash
  const normalised = path.replace(/\\/g, "/");
  return `${API_BASE}/${normalised}`;
}
