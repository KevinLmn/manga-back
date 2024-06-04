import { PrismaClient } from "@prisma/client";
import axios from "axios";
import Fastify from "fastify";
import prisma from "../prisma.js";

const fastify = Fastify();

const TOKEN_DURATION = 900;

const url =
  "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token";

export const login = async (username, password) => {
  const payload = new URLSearchParams({
    grant_type: "password",
    username: username || process.env.MANGADEX_USERNAME,
    password: password || process.env.MANGADEX_PASSWORD,
    client_id: process.env.MANGADEX_CLIENT_ID,
    client_secret: process.env.MANGADEX_CLIENT_SECRET,
  });
  try {
    const prisma = new PrismaClient();
    const response = await axios.post(url, payload);
    const token = await prisma.token.create({
      data: {
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
      },
    });
    return response.data;
  } catch (e) {
    console.log(e);
  }
};

export const checkIfTokenIsValidAndResetIfNot = async (request, reply) => {
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

  const url =
    "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token";

  const payload = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: databaseToken.refreshToken,
    client_id: process.env.MANGADEX_CLIENT_ID,
    client_secret: process.env.MANGADEX_CLIENT_SECRET,
  });

  try {
    const response = await axios.post(url, payload);
    await prisma.token.update({
      where: {
        token: request.session.authToken,
      },
      data: {
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
      },
    });
    request.headers.authorization = response.data.access_token;
  } catch (e) {
    console.log(e);
  }
};
