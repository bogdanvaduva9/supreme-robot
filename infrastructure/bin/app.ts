import * as cdk from 'aws-cdk-lib';

import { AtlasCertStack } from '../lib/stacks/cert-stack';
import { AtlasFrontendStack } from '../lib/stacks/frontend-stack';
import { AtlasStorageStack } from '../lib/stacks/storage-stack';
import { AtlasApiStack } from '../lib/stacks/api-stack';
import { AtlasPipelineStack } from '../lib/stacks/pipeline-stack';

// Phase 2: AtlasAuthStack (Cognito — Google + Facebook social login)
// Phase 3: AtlasSearchStack (OpenSearch — full-text + geo search)

const app = new cdk.App();

const DOMAIN = 'romania-atlas.com';
const ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT!;

// ── Certificate (us-east-1 — CloudFront requirement) ──────────────────────────
const certStack = new AtlasCertStack(app, 'AtlasCertStack', {
  env: { account: ACCOUNT, region: 'us-east-1' },
  domainName: DOMAIN,
  crossRegionReferences: true,
});

// ── Frontend (S3 + CloudFront) ────────────────────────────────────────────────
new AtlasFrontendStack(app, 'AtlasFrontendStack', {
  env: { account: ACCOUNT, region: 'eu-central-1' },
  domainName: DOMAIN,
  certificate: certStack.certificate,
  crossRegionReferences: true,
});

// ── Storage (DynamoDB) ────────────────────────────────────────────────────────
const storageStack = new AtlasStorageStack(app, 'AtlasStorageStack', {
  env: { account: ACCOUNT, region: 'eu-central-1' },
  crossRegionReferences: true,
});

// ── API (API Gateway + Lambda) ────────────────────────────────────────────────
const apiStack = new AtlasApiStack(app, 'AtlasApiStack', {
  env: { account: ACCOUNT, region: 'eu-central-1' },
  table: storageStack.table,
  crossRegionReferences: true,
});
apiStack.addDependency(storageStack);

// ── Pipeline (Step Functions + EventBridge) ───────────────────────────────────
const pipelineStack = new AtlasPipelineStack(app, 'AtlasPipelineStack', {
  env: { account: ACCOUNT, region: 'eu-central-1' },
  table: storageStack.table,
  crossRegionReferences: true,
});
pipelineStack.addDependency(storageStack);
