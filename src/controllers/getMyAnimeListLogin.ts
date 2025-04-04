import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

export const getMyAnimeListLogin = async () => {
  const client_id = process.env.MANGADEX_CLIENT_ID
  const client_secret = process.env.MANGADEX_CLIENT_SECRET
  const redirect_uri = 'http://localhost:3000/callback'
  const authorization_endpoint = 'https://myanimelist.net/v1/oauth2/authorize'
  const token_endpoint = 'https://myanimelist.net/v1/oauth2/token'

  // Step 1: Redirect user to authorization endpoint
  const authUrl = `${authorization_endpoint}?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&code_challenge_method=plain&code_challenge=your_code_challenge`
  axios.get(authUrl)
  try {
    const response = await axios.post(
      token_endpoint,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'code',
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri,
        code_verifier: 'your_code_verifier',
      })
    )
  } catch (error) {
    console.error(error)
  }
}
