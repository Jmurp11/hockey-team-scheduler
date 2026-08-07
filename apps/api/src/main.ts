import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import 'dotenv/config';
import { AppModule } from './app.module';
import { TeamsModule } from './teams/teams.module';
import { LeaguesModule } from './leagues/leagues.module';
import { RinkModule } from './rinks/rink.module';
import { TournamentsModule } from './tournaments/tournaments.module';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Allowed CORS origins. In production only real app origins are permitted (from
 * CORS_ORIGINS env, comma-separated, plus the known defaults). Local dev origins
 * are added only outside production so they are not shipped to prod.
 */
function corsOrigins(): string[] {
  const configured = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const production = configured.length
    ? configured
    : ['https://rinklink.ai', 'capacitor://localhost'];

  if (isProduction) {
    return production;
  }

  return [
    ...production,
    'http://localhost:4200',
    'http://localhost:64566',
    'http://localhost',
    'http://localhost:80',
    'http://localhost:8080',
    'http://127.0.0.1',
    'http://127.0.0.1:80',
    'http://10.0.2.2:3000',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: corsOrigins(),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      credentials: true,
    },
  });

  // Baseline security headers. In development the default Content-Security-Policy
  // (which emits `upgrade-insecure-requests`) and HSTS break the local HTTP dev
  // server and its Swagger UI by forcing asset requests to https://localhost.
  // Disable both outside production; full defaults apply in production (where
  // TLS is terminated at the edge and Swagger is off).
  app.use(
    isProduction
      ? helmet()
      : helmet({ contentSecurityPolicy: false, hsts: false }),
  );

  // Global pipe transforms/coerces payloads. NOTE: `whitelist`/
  // `forbidNonWhitelisted` are intentionally NOT enabled globally yet — the
  // existing DTOs carry only @ApiProperty (no class-validator decorators), so
  // global whitelisting would strip every body field and break endpoints.
  // Strict validation is applied per-route where DTOs are decorated (e.g. the
  // RinkLinkGPT chat route). Rolling out class-validator to all DTOs and then
  // enabling global whitelist is a tracked follow-up.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.use('/v1/users/webhook', bodyParser.raw({ type: 'application/json' }));
  app.use('/v1/developers/webhook', bodyParser.raw({ type: 'application/json' }));

  app.use(bodyParser.json());

  const swaggerOptions: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  };

  // --- Public API docs (all environments) -----------------------------------
  // Customer-facing documentation, scoped to ONLY the external metered API
  // (teams, leagues, rinks, tournament data). Internal/admin/AI/webhook routes
  // are never included, so the live docs don't reveal the full surface.
  const publicConfigBuilder = new DocumentBuilder()
    .setTitle('RinkLink.ai Public API')
    .setDescription(
      'Youth hockey data API for RinkLink developer customers. ' +
        'Authenticate by sending your API key in the `x-api-key` header. ' +
        'Note: calls to the live server are billed per request.',
    )
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key');
  // Server URLs must be the ORIGIN only (no /v1) — the documented paths already
  // include the version prefix (e.g. /v1/teams), so adding /v1 here would double
  // it into /v1/v1/teams. A sandbox server (if configured) is listed first so
  // "Try it out" defaults there instead of hitting — and billing — production.
  if (process.env.SANDBOX_API_URL) {
    publicConfigBuilder.addServer(
      process.env.SANDBOX_API_URL,
      'Sandbox (safe for testing)',
    );
  }
  publicConfigBuilder.addServer(
    process.env.PUBLIC_API_URL || 'https://api.rinklink.ai',
    'Production (live — requests are metered/billed)',
  );

  const publicDoc = SwaggerModule.createDocument(app, publicConfigBuilder.build(), {
    ...swaggerOptions,
    include: [TeamsModule, LeaguesModule, RinkModule, TournamentsModule],
  });
  // Strip first-party tournament endpoints (director payments + AI fit) that
  // are not part of the external data API.
  for (const path of [
    '/v1/tournaments/evaluate-fit',
    '/v1/tournaments/featured/checkout',
    '/v1/tournaments/featured/verify-payment',
  ]) {
    delete publicDoc.paths[path];
  }
  if (publicDoc.paths['/v1/tournaments']) {
    delete publicDoc.paths['/v1/tournaments'].post; // create-tournament (admin)
  }
  // Removing the first-party paths leaves their DTOs (payment, write, and AI-fit
  // schemas) behind in components.schemas. Keep only the public domain models so
  // the Schemas section shows exactly what customers consume.
  const allowedSchemas = new Set([
    'Association',
    'Team',
    'League',
    'Rink',
    'Tournament',
  ]);
  if (publicDoc.components?.schemas) {
    for (const name of Object.keys(publicDoc.components.schemas)) {
      if (!allowedSchemas.has(name)) {
        delete publicDoc.components.schemas[name];
      }
    }
  }
  SwaggerModule.setup('api/docs', app, publicDoc);

  // --- Full internal docs (non-production only) ------------------------------
  // Every endpoint, for local/staging development. Not exposed on the live site
  // unless SWAGGER_ENABLED=true is explicitly set.
  if (!isProduction || process.env.SWAGGER_ENABLED === 'true') {
    const internalConfig = new DocumentBuilder()
      .setTitle('RinkLink.ai API (Internal)')
      .setDescription(
        'Full internal API surface — for development only, not for public exposure.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
      .build();
    const internalDoc = SwaggerModule.createDocument(
      app,
      internalConfig,
      swaggerOptions,
    );
    SwaggerModule.setup('api/docs/internal', app, internalDoc);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();