import axios from "axios";

export const getMyAnimeListLogin = async () => {
  console.log("heyyyy");
  const client_id = "85084e9455f7daadaf504ad26608aeec";
  const client_secret =
    "82782d0754297705a62400ac66d8f36b06b8895976ecf470249d41ec46df160a";
  const redirect_uri = "http://localhost:3000/callback";
  const authorization_endpoint = "https://myanimelist.net/v1/oauth2/authorize";
  const token_endpoint = "https://myanimelist.net/v1/oauth2/token";

  // Step 1: Redirect user to authorization endpoint
  const authUrl = `${authorization_endpoint}?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&code_challenge_method=plain&code_challenge=your_code_challenge`;
  axios.get(authUrl);
  try {
    const response = await axios.post(
      token_endpoint,
      new URLSearchParams({
        grant_type: "authorization_code",
        code: "code",
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri,
        code_verifier: "your_code_verifier",
      })
    );
  } catch (error) {
    console.error(error);
  }
};
