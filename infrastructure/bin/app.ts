#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LifeSimStack } from '../lib/lifesim-stack';

const app = new cdk.App();

// Values come from cdk.json context or --context overrides from CLI/CI
const imageTag = app.node.tryGetContext('imageTag') as string ?? 'latest';
const existingOriginDomain = app.node.tryGetContext('existingOriginDomain') as string;
const certificateArn = app.node.tryGetContext('certificateArn') as string;

if (!existingOriginDomain || existingOriginDomain.startsWith('REPLACE')) {
  throw new Error(
    'Set "existingOriginDomain" in infrastructure/cdk.json context ' +
    '(the hostname of your existing bogdan-vaduva.com root app).',
  );
}

if (!certificateArn || certificateArn.includes('ACCOUNT_ID')) {
  throw new Error(
    'Set "certificateArn" in infrastructure/cdk.json context ' +
    '(ACM certificate ARN in us-east-1 covering bogdan-vaduva.com).',
  );
}

new LifeSimStack(app, 'LifeSimStack', {
  imageTag,
  existingOriginDomain,
  certificateArn,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // App Runner, ECR, SSM → eu-central-1.
    // CloudFront is global and the ACM certificate must be in us-east-1
    // (AWS requirement) — pass its ARN via the certificateArn context value.
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-central-1',
  },
  description: 'LifeSim game — App Runner + CloudFront under bogdan-vaduva.com/life-game',
});
