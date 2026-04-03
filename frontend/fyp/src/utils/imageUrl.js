const API_BASE = "http://localhost:8000";

/**
 * Converts a stored image path (which may have Windows backslashes)
 * into a valid URL served by the backend.
 * e.g.  "uploads\profile\abc.jpg"  →  "http://localhost:8000/uploads/profile/abc.jpg"
 *        "uploads/profile/abc.jpg" →  "http://localhost:8000/uploads/profile/abc.jpg"
 *        ""  / null / undefined    →  null
 */
export function imgUrl(path) {
  if (!path) return null;
  // Replace every backslash with a forward slash
  const normalised = path.replace(/\\/g, "/");
  return `${API_BASE}/${normalised}`;
}
