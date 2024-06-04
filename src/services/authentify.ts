import axios from "axios";

const url =
  "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token";

const payload = new URLSearchParams({
  grant_type: "password",
  username: process.env.MANGADEX_USERNAME,
  password: process.env.MANGADEX_PASSWORD,
  client_id: process.env.MANGADEX_CLIENT_ID,
  client_secret: process.env.MANGADEX_CLIENT_SECRET,
});

export const login = async () => {
  try {
    const response = await axios.post(url, payload);
    return response.data;
  } catch (e) {
    throw new Error("Invalid credentials");
  }
};
