export const apiRequest = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    console.error("PlantCare API request failed.", error);
    throw new Error("Unable to connect to the PlantCare server. Please try again.");
  }

  if (response.status === 204) return null;

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    console.error("The PlantCare API returned an unreadable response.", error);
    throw new Error("The PlantCare server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(payload.message || "The request could not be completed.");
  }

  return payload;
};
