import axios from "axios";
import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "./prisma.js";
import { TOKEN_DURATION } from "./utils.js";

export const loginMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (request.routerPath === "/login") {
    return;
  }
  if (request.headers.authorization === undefined) return;
  const currentToken = request.headers.authorization.replace("Bearer ", "");
  const databaseToken = await prisma.token.findFirst({
    where: {
      token: currentToken,
    },
  });

  if (!databaseToken) {
    throw new Error("Token not found");
  }

  const now = new Date();
  const updatedAt = new Date(databaseToken.updatedAt);
  // getTime() returns the number of milliseconds since January 1, 1970, so we multiply by 1000 to get ms
  const isTokenIssuedLessThan15MinutsAgo =
    now.getTime() - updatedAt.getTime() > TOKEN_DURATION * 1000;
  if (isTokenIssuedLessThan15MinutsAgo) {
    return;
  }

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
    const token = await prisma.token.update({
      where: {
        token: databaseToken.token,
      },
      data: {
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
      },
    });
    console.log(response.data.access_token, "11111111111111111111111");
    console.log(token.token, "22222222222222222222222222");
    reply.header("Authorization", token.token.split(" ")[1]);
  } catch (e) {
    throw new Error("Invalid credentials");
  }
};
