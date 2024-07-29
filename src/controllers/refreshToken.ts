import axios from "axios";
import { FastifyRequest } from "fastify";
import prisma from "../prisma.js";

type RefreshTokenRequestBody = {
  token: string;
};

type RefreshTokenReturnType = {
  token: string;
};

export const refreshTokenController = async (
  request: FastifyRequest<{ Body: RefreshTokenRequestBody }>
): Promise<RefreshTokenReturnType> => {
  const currentToken = request.body.token;

  const databaseToken = await prisma.token.findFirst({
    where: {
      token: currentToken,
    },
  });

  const payload = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: databaseToken.refreshToken,
    client_id: process.env.MANGADEX_CLIENT_ID,
    client_secret: process.env.MANGADEX_CLIENT_SECRET,
  });

  try {
    const response = await axios.post(
      process.env.MANGADEX_REFRESH_TOKEN_URL,
      payload
    );
    const newToken = await prisma.token.update({
      where: {
        token: databaseToken.token,
      },
      data: {
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
      },
    });
    return { token: response.data.access_token };
  } catch (e) {
    console.error(e);
    throw new Error("Token not found");
  }
};
