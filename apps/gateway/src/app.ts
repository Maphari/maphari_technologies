import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import type { FastifyInstance } from "fastify";
import { AppModule } from "./modules/app.module.js";
import { createCorsPolicy } from "./security/cors.js";

export async function createGatewayApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // ── Security headers via @fastify/helmet ─────────────────────────────────
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  const { default: helmet } = await import("@fastify/helmet");
  await fastify.register(helmet, {
    // HSTS — 1 year, include subdomains, preload
    hsts: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
    // CSP — tight policy; relax only what's needed
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'"],
        styleSrc:       ["'self'", "'unsafe-inline'"],
        imgSrc:         ["'self'", "data:", "https:"],
        connectSrc:     ["'self'", "wss:", "https:"],
        frameSrc:       ["'none'"],         // tighten later if video iframes needed
        objectSrc:      ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // Needed for embedded Daily.co video iframe (re-enable once video is integrated)
    crossOriginEmbedderPolicy: false,
    // Standard headers
    dnsPrefetchControl:    { allow: false },
    frameguard:            { action: "deny" },
    hidePoweredBy:         true,
    ieNoOpen:              true,
    noSniff:               true,
    xssFilter:             true,
    referrerPolicy:        { policy: "strict-origin-when-cross-origin" },
  });

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors(createCorsPolicy());
  app.setGlobalPrefix("api/v1");
  return app;
}
