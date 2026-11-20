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

// Link-preview images stay reachable from Singapore: LinkedIn fetches them from servers there.
export const config = {
  path: "/*",
  excludedPath: [
    "/assets/og/*",
    "/assets/og-image-*.jpg",
    "/happy-birthday-kayla/31/kayla-flip-yard.png",
  ],
};
