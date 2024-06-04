import axios from "axios";
import { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../prisma.js";

export type LoginRequestBody = {
  username: string;
  password: string;
};

export const loginController = async (
  request: FastifyRequest<{ Body: LoginRequestBody }>,
  reply: FastifyReply
) => {
  const { username, password } = request.body;

  try {
    const payload = new URLSearchParams({
      grant_type: "password",
      username: username || process.env.MANGADEX_USERNAME,
      password: password || process.env.MANGADEX_PASSWORD,
      client_id: process.env.MANGADEX_CLIENT_ID,
      client_secret: process.env.MANGADEX_CLIENT_SECRET,
    });
    const response = await axios.post(
      process.env.MANGADEX_REFRESH_TOKEN_URL,
      payload
    );
    await prisma.token.create({
      data: {
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
      },
    });

    const { access_token } = await response.data;

    reply.send({ success: true, access_token });
  } catch (error) {
    reply.code(401).send({ success: false, message: "Invalid credentials" });
  }
};
