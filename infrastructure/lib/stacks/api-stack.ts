import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface AtlasApiStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
}

export class AtlasApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AtlasApiStackProps) {
    super(scope, id, props);

    const commonEnv: Record<string, string> = {
      TABLE_NAME: props.table.tableName,
      POWERTOOLS_SERVICE_NAME: 'atlas-api',
      POWERTOOLS_LOG_LEVEL: 'INFO',
    };

    const makeFn = (id: string, handlerModule: string): lambda.Function => {
      const fn = new lambda.Function(this, id, {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: `${handlerModule}.handler`,
        code: lambda.Code.fromAsset(`../dist/${handlerModule}.zip`),
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        environment: commonEnv,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
      });
      props.table.grantReadData(fn);
      return fn;
    };

    const getLocalityFn = makeFn('GetLocalityFn', 'api_get_locality');
    const listByJudetFn = makeFn('ListByJudetFn', 'api_list_by_judet');
    const listJudeteFn  = makeFn('ListJudeteFn',  'api_list_judete');

    // ── API Gateway ─────────────────────────────────────────────────────────────
    const accessLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      logGroupName: '/atlas/prod/apigateway/access',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, 'AtlasApi', {
      restApiName: 'atlas-api',
      description: 'Atlas Localities API — v1',
      deployOptions: {
        stageName: 'v1',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
    });

    const localities = api.root.addResource('localities');
    localities.addMethod('GET', new apigateway.LambdaIntegration(listByJudetFn));

    const locality = localities.addResource('{siruta}');
    locality.addMethod('GET', new apigateway.LambdaIntegration(getLocalityFn));

    const judete = api.root.addResource('judete');
    judete.addMethod('GET', new apigateway.LambdaIntegration(listJudeteFn));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'ApiId', { value: api.restApiId });
  }
}
