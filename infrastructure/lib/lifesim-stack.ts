import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cfTargets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface LifeSimStackProps extends cdk.StackProps {
  // (env is inherited from cdk.StackProps)
  /**
   * Docker image tag to deploy (e.g. a git SHA).
   * Passed via --context imageTag=<sha> in CI.
   */
  imageTag: string;

  /**
   * Hostname of the existing app that lives at bogdan-vaduva.com root.
   * Could be an ALB DNS name, another CloudFront domain, or an S3 website endpoint.
   * Example: "existing-alb-123.us-east-1.elb.amazonaws.com"
   */
  existingOriginDomain: string;

  /**
   * ARN of an ACM certificate that covers bogdan-vaduva.com.
   * MUST be in us-east-1 (required by CloudFront).
   */
  certificateArn: string;
}

export class LifeSimStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LifeSimStackProps) {
    super(scope, id, props);

    // ── ECR Repository ──────────────────────────────────────────────────────
    const repo = new ecr.Repository(this, 'LifeSimRepo', {
      repositoryName: 'lifesim',
      // Keep only the last 10 images to avoid ECR storage costs
      lifecycleRules: [{ maxImageCount: 10, description: 'Keep last 10 images' }],
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Don't delete on stack destroy
    });

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
    // Create these manually before first deploy:
    //   aws ssm put-parameter --name /lifesim/anthropic-api-key --type SecureString --value "sk-ant-..."
    //   aws ssm put-parameter --name /lifesim/alpha-access-key  --type SecureString --value "your-key"
    const anthropicKey = ssm.StringParameter.valueForStringParameter(
      this,
      '/lifesim/anthropic-api-key',
    );
    const alphaKey = ssm.StringParameter.valueForStringParameter(
      this,
      '/lifesim/alpha-access-key',
    );

    // ── App Runner Service ──────────────────────────────────────────────────
    // 0.25 vCPU / 0.5 GB — the minimum. Scales to 0 when idle.
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
              { name: 'ANTHROPIC_KEY', value: anthropicKey },
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
        path: '/life-game', // basePath root → returns 200 once server is up
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    // App Runner URL is "https://xxx.region.awsapprunner.com"
    // CloudFront needs the hostname only (no scheme)
    const appRunnerHost = cdk.Fn.select(
      1,
      cdk.Fn.split('https://', appRunnerService.attrServiceUrl),
    );

    // ── ACM Certificate (must be in us-east-1) ──────────────────────────────
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      props.certificateArn,
    );

    // ── CloudFront Distribution ─────────────────────────────────────────────
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      domainNames: ['bogdan-vaduva.com'],
      certificate,
      comment: 'bogdan-vaduva.com — root app + LifeSim at /life-game',
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US + EU only → cheapest

      // ── Default behaviour: existing root app ───────────────────────────
      defaultBehavior: {
        origin: new origins.HttpOrigin(props.existingOriginDomain, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },

      // ── /life-game* behaviour: LifeSim on App Runner ───────────────────
      additionalBehaviors: {
        '/life-game*': {
          origin: new origins.HttpOrigin(appRunnerHost, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    });

    // ── Route53 ─────────────────────────────────────────────────────────────
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'bogdan-vaduva.com',
    });

    new route53.ARecord(this, 'ARecord', {
      zone: hostedZone,
      recordName: 'bogdan-vaduva.com',
      target: route53.RecordTarget.fromAlias(new cfTargets.CloudFrontTarget(distribution)),
    });

    new route53.AaaaRecord(this, 'AaaaRecord', {
      zone: hostedZone,
      recordName: 'bogdan-vaduva.com',
      target: route53.RecordTarget.fromAlias(new cfTargets.CloudFrontTarget(distribution)),
    });

    // ── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AppRunnerUrl', {
      value: appRunnerService.attrServiceUrl,
      description: 'Direct App Runner URL (bypass CloudFront for debugging)',
    });
    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'ECRRepository', {
      value: repo.repositoryUri,
    });
  }
}
