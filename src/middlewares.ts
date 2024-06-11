import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "./prisma.js";
import { TOKEN_DURATION } from "./utils.js";

export const loginMiddleware = async (
  request: FastifyRequest,
) => {
  if (
    request.routerPath === "/login" ||
    request.routerPath === "/refreshToken"
  ) {
    return;
  }

  if (request.headers.authorization === undefined) {
    return;
  }

  const currentToken = request.headers.authorization.replace("Bearer ", "");
  
  const databaseToken = await prisma.token.findUnique({
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
    throw new Error("Token expired");
  }

};
