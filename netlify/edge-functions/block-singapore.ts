import { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  if (context.geo?.country?.code === "SG") {
    return new Response("Access Denied", {
      status: 403,
      headers: { "content-type": "text/plain" }
    });
  }
  return context.next();
};

export const config = { path: "/*" };
