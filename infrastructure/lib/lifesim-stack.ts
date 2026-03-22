import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface LifeSimStackProps extends cdk.StackProps {
  /**
   * Docker image tag to deploy (e.g. a git SHA).
   * Passed via --context imageTag=<sha> in CI.
   */
  imageTag: string;
}

export class LifeSimStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LifeSimStackProps) {
    super(scope, id, props);

    // ── ECR Repository ──────────────────────────────────────────────────────
    // Created by the GitHub Actions workflow ("Ensure ECR repository exists"
    // step) before the first image push — imported here by name so CDK never
    // tries to create it and doesn't race with the docker push.
    const repo = ecr.Repository.fromRepositoryName(this, 'LifeSimRepo', 'lifesim');

    // ── IAM role: App Runner → ECR ──────────────────────────────────────────
    const accessRole = new iam.Role(this, 'AppRunnerAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSAppRunnerServicePolicyForECRAccess',
        ),
      ],
    });

    // ── Secrets from SSM Parameter Store ───────────────────────────────────
    // Synced automatically from GitHub repository secrets by the deploy
    // workflow ("Sync secrets to SSM" step in .github/workflows/deploy.yml).
    // Set ANTHROPIC_API_KEY and ALPHA_ACCESS_KEY as GitHub repo secrets.
    const anthropicKey = ssm.StringParameter.valueForStringParameter(
      this,
      '/lifesim/anthropic-api-key',
    );
    const alphaKey = ssm.StringParameter.valueForStringParameter(
      this,
      '/lifesim/alpha-access-key',
    );

    // ── App Runner Service ──────────────────────────────────────────────────
    // 0.25 vCPU / 0.5 GB — minimum tier. CloudFront routes /life-game* here.
    // CloudFront is managed separately (existing distribution d3i0pffdhsjjxt);
    // see one-time setup instructions in infrastructure/README.md.
    const appRunnerService = new apprunner.CfnService(this, 'LifeSimService', {
      serviceName: 'lifesim',
      sourceConfiguration: {
        authenticationConfiguration: { accessRoleArn: accessRole.roleArn },
        autoDeploymentsEnabled: false, // CI controls deployments via CDK
        imageRepository: {
          imageIdentifier: `${repo.repositoryUri}:${props.imageTag}`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '3000',
            runtimeEnvironmentVariables: [
              { name: 'NODE_ENV', value: 'production' },
              { name: 'NEXT_TELEMETRY_DISABLED', value: '1' },
              { name: 'ANTHROPIC_API_KEY', value: anthropicKey },
              { name: 'ALPHA_ACCESS_KEY', value: alphaKey },
              { name: 'ANTHROPIC_MODEL', value: 'claude-sonnet-4-20250514' },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: '0.25 vCPU',
        memory: '0.5 GB',
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/life-game',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AppRunnerUrl', {
      value: appRunnerService.attrServiceUrl,
      description: 'App Runner service URL — add this as a CloudFront origin for /life-game*',
    });
    new cdk.CfnOutput(this, 'ECRRepository', {
      value: repo.repositoryUri,
    });
  }
}
