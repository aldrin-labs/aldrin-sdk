# Platform-Specific Deployment Guide

This guide covers deployment strategies for Aldrin SDK applications across different platforms, environments, and infrastructure setups.

## Table of Contents

- [Web Applications](#web-applications)
- [Node.js Services](#nodejs-services)
- [Mobile Applications](#mobile-applications)
- [Desktop Applications](#desktop-applications)
- [Cloud Deployments](#cloud-deployments)
- [Edge Computing](#edge-computing)
- [Monitoring and Observability](#monitoring-and-observability)

## Web Applications

### React/Next.js Applications

#### Vercel Deployment

```json
// vercel.json
{
  "name": "aldrin-trading-dashboard",
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_SOLANA_RPC_ENDPOINT": "@solana_rpc_endpoint",
    "VITE_APP_NAME": "Aldrin Trading Dashboard"
  },
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  }
}
```

```bash
# Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod

# Environment variables
vercel env add VITE_SOLANA_RPC_ENDPOINT production
vercel env add VITE_HELIUS_API_KEY production
```

#### Netlify Deployment

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  YARN_VERSION = "1.22.19"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_SOLANA_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"
  VITE_NETWORK = "mainnet-beta"

[context.staging.environment]
  VITE_SOLANA_RPC_ENDPOINT = "https://api.devnet.solana.com"
  VITE_NETWORK = "devnet"
```

```bash
# Deploy to Netlify
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

#### AWS Amplify Deployment

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### Docker Deployment

```dockerfile
# Dockerfile for React app
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Handle SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy strict-origin-when-cross-origin;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Node.js Services

### Express.js API Deployment

#### PM2 Process Management

```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'aldrin-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      SOLANA_RPC_ENDPOINT: 'https://api.devnet.solana.com'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      SOLANA_RPC_ENDPOINT: 'https://api.mainnet-beta.solana.com'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=4096'
  }]
};
```

```bash
# Deploy with PM2
npm install -g pm2
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Docker Deployment

```dockerfile
# Dockerfile for Node.js service
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml for production
version: '3.8'

services:
  api:
    build: .
    container_name: aldrin-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SOLANA_RPC_ENDPOINT=${SOLANA_RPC_ENDPOINT}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./logs:/usr/src/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    container_name: aldrin-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    container_name: aldrin-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=aldrin
      - POSTGRES_USER=aldrin
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    container_name: aldrin-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

volumes:
  redis_data:
  postgres_data:
```

## Mobile Applications

### React Native Deployment

#### iOS Deployment

```bash
# iOS build and deployment
cd ios
pod install
cd ..

# Build for testing
npx react-native run-ios --configuration Release

# Build for App Store
npx react-native build-ios --configuration Release

# Using Fastlane
gem install fastlane
fastlane init
fastlane ios beta  # TestFlight
fastlane ios release  # App Store
```

```ruby
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    build_app(
      scheme: "AldrinTradingApp",
      configuration: "Release",
      export_method: "app-store"
    )
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end

  desc "Push a new release build to the App Store"
  lane :release do
    build_app(
      scheme: "AldrinTradingApp", 
      configuration: "Release",
      export_method: "app-store"
    )
    upload_to_app_store(
      force: true,
      submit_for_review: true,
      automatic_release: false
    )
  end
end
```

#### Android Deployment

```bash
# Android build and deployment
cd android
./gradlew clean
./gradlew bundleRelease

# Using Fastlane
fastlane android beta    # Play Console Internal Testing
fastlane android release # Play Store
```

```ruby
# android/fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Submit a new Beta Build to Play Console"
  lane :beta do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "internal",
      aab: "app/build/outputs/bundle/release/app-release.aab"
    )
  end

  desc "Deploy a new version to the Google Play"
  lane :release do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "production",
      aab: "app/build/outputs/bundle/release/app-release.aab"
    )
  end
end
```

#### Expo Deployment

```json
// app.config.js
export default {
  name: 'Aldrin Trading App',
  slug: 'aldrin-trading',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/your-project-id'
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.aldrin.trading'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.aldrin.trading'
  },
  extra: {
    eas: {
      projectId: 'your-project-id'
    },
    solanaRpcEndpoint: process.env.EXPO_PUBLIC_SOLANA_RPC_ENDPOINT,
    solanaNetwork: process.env.EXPO_PUBLIC_SOLANA_NETWORK
  }
};
```

```bash
# Expo deployment
npm install -g @expo/cli
expo login

# Development build
expo install --fix
expo prebuild
expo run:ios
expo run:android

# Production build
eas build --platform all
eas submit --platform all

# OTA updates
eas update --branch production --message "Bug fixes and improvements"
```

## Cloud Deployments

### AWS Deployment

#### Elastic Beanstalk

```yaml
# .ebextensions/01_environment.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    SOLANA_RPC_ENDPOINT: https://api.mainnet-beta.solana.com
    PORT: 8080
  aws:elasticbeanstalk:container:nodejs:
    NodeVersion: 18.17.0
    ProxyServer: nginx
    GzipCompression: true
  aws:autoscaling:launchconfiguration:
    InstanceType: t3.medium
    IamInstanceProfile: aws-elasticbeanstalk-ec2-role
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10
  aws:elasticbeanstalk:healthreporting:system:
    SystemType: enhanced
```

```bash
# Deploy to Elastic Beanstalk
pip install awsebcli
eb init aldrin-trading-api
eb create production
eb deploy
```

#### ECS Deployment

```yaml
# docker-compose.yml for ECS
version: '3.8'

services:
  web:
    image: your-account.dkr.ecr.region.amazonaws.com/aldrin-api:latest
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
    logging:
      driver: awslogs
      options:
        awslogs-group: aldrin-api
        awslogs-region: us-east-1
        awslogs-stream-prefix: web
```

```yaml
# ecs-task-definition.json
{
  "family": "aldrin-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "aldrin-api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/aldrin-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "SOLANA_RPC_ENDPOINT",
          "value": "https://api.mainnet-beta.solana.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aldrin-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Lambda Deployment

```typescript
// serverless.ts
import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'aldrin-api',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
    'serverless-offline'
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'us-east-1',
    environment: {
      NODE_ENV: 'production',
      SOLANA_RPC_ENDPOINT: '${env:SOLANA_RPC_ENDPOINT}',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['dynamodb:*'],
        Resource: 'arn:aws:dynamodb:us-east-1:*:table/aldrin-*'
      }
    ]
  },
  functions: {
    api: {
      handler: 'src/lambda.handler',
      events: [
        {
          httpApi: {
            path: '/{proxy+}',
            method: 'ANY'
          }
        }
      ],
      timeout: 30,
      memorySize: 512
    },
    priceUpdater: {
      handler: 'src/scheduled.priceUpdater',
      events: [
        {
          schedule: 'rate(1 minute)'
        }
      ]
    }
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: true,
      sourcemap: true,
      target: 'node18',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10
    }
  }
};

module.exports = serverlessConfiguration;
```

### Google Cloud Platform

#### Cloud Run Deployment

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/aldrin-api', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/aldrin-api']
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'aldrin-api',
      '--image', 'gcr.io/$PROJECT_ID/aldrin-api',
      '--region', 'us-central1',
      '--platform', 'managed',
      '--allow-unauthenticated'
    ]
```

```yaml
# service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: aldrin-api
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "100"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 1000
      containers:
      - image: gcr.io/PROJECT_ID/aldrin-api
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: SOLANA_RPC_ENDPOINT
          value: "https://api.mainnet-beta.solana.com"
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
```

#### App Engine Deployment

```yaml
# app.yaml
runtime: nodejs18

automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.6

env_variables:
  NODE_ENV: production
  SOLANA_RPC_ENDPOINT: https://api.mainnet-beta.solana.com

handlers:
- url: /.*
  script: auto
  secure: always
  redirect_http_response_code: 301
```

### Azure Deployment

#### App Service Deployment

```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  azureSubscription: 'your-subscription'
  appName: 'aldrin-trading-api'
  resourceGroup: 'aldrin-rg'

stages:
- stage: Build
  jobs:
  - job: Build
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    
    - script: |
        npm ci
        npm run build
      displayName: 'Build application'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '.'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
    
    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: '$(Build.ArtifactStagingDirectory)'
        artifactName: 'drop'

- stage: Deploy
  jobs:
  - deployment: Deploy
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '$(azureSubscription)'
              appType: 'webAppLinux'
              appName: '$(appName)'
              resourceGroupName: '$(resourceGroup)'
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
              runtimeStack: 'NODE|18-lts'
              appSettings: |
                -SOLANA_RPC_ENDPOINT "https://api.mainnet-beta.solana.com"
                -NODE_ENV "production"
```

## Edge Computing

### Cloudflare Workers

```typescript
// worker.ts
import { TokenSwap } from '@aldrin_exchange/sdk';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/price') {
      try {
        const { from, to } = Object.fromEntries(url.searchParams);
        
        // Initialize SDK with Cloudflare's fetch
        const tokenSwap = await TokenSwap.initialize({
          connection: new Connection(env.SOLANA_RPC_ENDPOINT, {
            fetch: fetch.bind(globalThis)
          })
        });
        
        const price = await tokenSwap.getPrice({
          mintFrom: new PublicKey(from),
          mintTo: new PublicKey(to)
        });
        
        return new Response(JSON.stringify({ price }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=5',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }
};
```

### Deno Deploy

```typescript
// main.ts
import { serve } from "https://deno.land/std@0.194.0/http/server.ts";
import { TokenSwap } from "npm:@aldrin_exchange/sdk";

const handler = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  
  if (url.pathname === "/api/pools") {
    try {
      const tokenSwap = await TokenSwap.initialize({
        connection: new Connection(Deno.env.get("SOLANA_RPC_ENDPOINT")!)
      });
      
      const pools = await tokenSwap.loadPools();
      
      return new Response(JSON.stringify(pools), {
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=30"
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }
  }
  
  return new Response("Not Found", { status: 404 });
};

serve(handler, { port: 8000 });
```

## Monitoring and Observability

### Application Performance Monitoring

#### DataDog Integration

```typescript
// monitoring/datadog.ts
import { StatsD } from 'node-statsd';
import { logger } from './logger';

class DataDogMetrics {
  private client: StatsD;

  constructor() {
    this.client = new StatsD({
      host: process.env.DATADOG_HOST || 'localhost',
      port: parseInt(process.env.DATADOG_PORT || '8125'),
      prefix: 'aldrin.api.'
    });
  }

  recordSwapExecution(duration: number, success: boolean): void {
    this.client.timing('swap.duration', duration);
    this.client.increment(`swap.${success ? 'success' : 'failure'}`);
  }

  recordPriceRequest(token: string, duration: number): void {
    this.client.timing('price.request.duration', duration, [`token:${token}`]);
    this.client.increment('price.request.count', 1, [`token:${token}`]);
  }

  recordError(operation: string, error: Error): void {
    this.client.increment('error.count', 1, [
      `operation:${operation}`,
      `error_type:${error.constructor.name}`
    ]);
    
    logger.error('Operation failed', {
      operation,
      error: error.message,
      stack: error.stack
    });
  }
}

export const metrics = new DataDogMetrics();
```

#### Prometheus Integration

```typescript
// monitoring/prometheus.ts
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Collect default metrics
collectDefaultMetrics();

// Custom metrics
export const swapDuration = new Histogram({
  name: 'aldrin_swap_duration_seconds',
  help: 'Duration of swap operations',
  labelNames: ['token_from', 'token_to', 'status']
});

export const priceRequests = new Counter({
  name: 'aldrin_price_requests_total',
  help: 'Total number of price requests',
  labelNames: ['token_pair']
});

export const activeConnections = new Gauge({
  name: 'aldrin_active_connections',
  help: 'Number of active WebSocket connections'
});

export const errorCount = new Counter({
  name: 'aldrin_errors_total',
  help: 'Total number of errors',
  labelNames: ['operation', 'error_type']
});

// Export metrics endpoint
export function getMetrics(): string {
  return register.metrics();
}
```

### Health Checks

```typescript
// health/checks.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { TokenSwap } from '@aldrin_exchange/sdk';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  details?: any;
  duration?: number;
}

export class HealthChecker {
  private tokenSwap: TokenSwap | null = null;

  async checkOverallHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheck[];
    timestamp: string;
  }> {
    const checks: HealthCheck[] = [];
    
    // Check Solana RPC connection
    checks.push(await this.checkSolanaRPC());
    
    // Check SDK initialization
    checks.push(await this.checkSDKHealth());
    
    // Check price data freshness
    checks.push(await this.checkPriceData());
    
    // Check external dependencies
    checks.push(await this.checkDependencies());
    
    const unhealthyChecks = checks.filter(c => c.status === 'unhealthy');
    const degradedChecks = checks.filter(c => c.status === 'degraded');
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyChecks.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  private async checkSolanaRPC(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const connection = new Connection(process.env.SOLANA_RPC_ENDPOINT!);
      const version = await connection.getVersion();
      const duration = Date.now() - start;
      
      return {
        name: 'solana_rpc',
        status: duration < 1000 ? 'healthy' : 'degraded',
        details: { version, endpoint: process.env.SOLANA_RPC_ENDPOINT },
        duration
      };
    } catch (error) {
      return {
        name: 'solana_rpc',
        status: 'unhealthy',
        details: { error: error.message },
        duration: Date.now() - start
      };
    }
  }

  private async checkSDKHealth(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      if (!this.tokenSwap) {
        this.tokenSwap = await TokenSwap.initialize();
      }
      
      // Test a simple operation
      const pools = await this.tokenSwap.loadPools();
      const duration = Date.now() - start;
      
      return {
        name: 'aldrin_sdk',
        status: 'healthy',
        details: { poolCount: pools.length },
        duration
      };
    } catch (error) {
      return {
        name: 'aldrin_sdk',
        status: 'unhealthy',
        details: { error: error.message },
        duration: Date.now() - start
      };
    }
  }

  private async checkPriceData(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      if (!this.tokenSwap) {
        return {
          name: 'price_data',
          status: 'unhealthy',
          details: { error: 'SDK not initialized' }
        };
      }
      
      // Test price retrieval for a known pair
      const price = await this.tokenSwap.getPrice({
        mintFrom: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
        mintTo: new PublicKey('E5ndSkaB17Dm7CsD22dvcjfrYSDLCxFcMd6z8ddCk5wp')    // RIN
      });
      
      const duration = Date.now() - start;
      
      return {
        name: 'price_data',
        status: price > 0 ? 'healthy' : 'degraded',
        details: { price },
        duration
      };
    } catch (error) {
      return {
        name: 'price_data',
        status: 'unhealthy',
        details: { error: error.message },
        duration: Date.now() - start
      };
    }
  }

  private async checkDependencies(): Promise<HealthCheck> {
    // Check Redis, Database, or other external services
    return {
      name: 'dependencies',
      status: 'healthy',
      details: { message: 'All dependencies operational' }
    };
  }
}
```

### Deployment Scripts

```bash
#!/bin/bash
# deploy.sh - Production deployment script

set -e

echo "Starting Aldrin SDK application deployment..."

# Build application
echo "Building application..."
npm run build

# Run tests
echo "Running tests..."
npm test

# Build Docker image
echo "Building Docker image..."
docker build -t aldrin-api:latest .

# Tag for registry
docker tag aldrin-api:latest your-registry.com/aldrin-api:$BUILD_NUMBER
docker tag aldrin-api:latest your-registry.com/aldrin-api:latest

# Push to registry
echo "Pushing to registry..."
docker push your-registry.com/aldrin-api:$BUILD_NUMBER
docker push your-registry.com/aldrin-api:latest

# Deploy to production
echo "Deploying to production..."
kubectl set image deployment/aldrin-api aldrin-api=your-registry.com/aldrin-api:$BUILD_NUMBER

# Wait for rollout
kubectl rollout status deployment/aldrin-api

# Run health checks
echo "Running health checks..."
sleep 30
curl -f http://your-app.com/health || exit 1

echo "Deployment completed successfully!"
```

This comprehensive deployment guide covers all major platforms and deployment strategies for Aldrin SDK applications, ensuring reliable and scalable deployments across different environments.