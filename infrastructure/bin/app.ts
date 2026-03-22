#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LifeSimStack } from '../lib/lifesim-stack';

const app = new cdk.App();

// imageTag comes from --context imageTag=<git-sha> in CI, falls back to 'latest'
const imageTag = (app.node.tryGetContext('imageTag') as string) ?? 'latest';

new LifeSimStack(app, 'LifeSimStack', {
  imageTag,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-central-1',
  },
  description: 'LifeSim game — App Runner service under bogdan-vaduva.com/life-game',
});
