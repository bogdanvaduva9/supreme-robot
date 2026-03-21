import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface AtlasPipelineStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
}

export class AtlasPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AtlasPipelineStackProps) {
    super(scope, id, props);

    const commonEnv: Record<string, string> = {
      TABLE_NAME: props.table.tableName,
      POWERTOOLS_SERVICE_NAME: 'atlas-pipeline',
      POWERTOOLS_LOG_LEVEL: 'INFO',
    };

    const makePipelineFn = (id: string, handlerModule: string): lambda.Function => {
      const dlq = new sqs.Queue(this, `${id}Dlq`, {
        queueName: `atlas-prod-${handlerModule.replace(/_/g, '-')}-dlq`,
        retentionPeriod: cdk.Duration.days(14),
        encryption: sqs.QueueEncryption.SQS_MANAGED,
      });

      const fn = new lambda.Function(this, id, {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: `${handlerModule}.handler`,
        code: lambda.Code.fromAsset(`../dist/${handlerModule}.zip`),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: commonEnv,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
        deadLetterQueue: dlq,
        retryAttempts: 2,
      });

      props.table.grantReadWriteData(fn);
      return fn;
    };

    const fetchSirutaFn    = makePipelineFn('FetchSirutaListFn', 'pipeline_fetch_siruta_list');
    const importInsFn      = makePipelineFn('ImportInsFn',        'pipeline_import_ins');
    const importOsmFn      = makePipelineFn('ImportOsmFn',        'pipeline_import_osm');
    const importWikidataFn = makePipelineFn('ImportWikidataFn',   'pipeline_import_wikidata');
    const importAncomFn    = makePipelineFn('ImportAncomFn',      'pipeline_import_ancom');

    // ── Step Functions state machine ─────────────────────────────────────────
    // Retry config: back off on Lambda throttles and transient errors
    const throttleRetry: sfn.RetryProps = {
      errors: ['Lambda.TooManyRequestsException', 'Lambda.ServiceException', 'Lambda.AWSLambdaException'],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 4,
      backoffRate: 2,
    };

    const fetchSiruta = new sfnTasks.LambdaInvoke(this, 'FetchSirutaList', {
      lambdaFunction: fetchSirutaFn,
      outputPath: '$.Payload',
    }).addRetry(throttleRetry);

    // POC: single Lambda per locality to stay well within the 25k event limit.
    // (1039 localities × ~7 events each ≈ 7,300 total events)
    // The Parallel state (4 Lambdas per locality) will be re-introduced in
    // Phase 2 once INS/OSM/ANCOM importers are fully implemented and we
    // switch to Express Workflows (no event limit).
    const importLocality = new sfnTasks.LambdaInvoke(this, 'ImportWikidata', {
      lambdaFunction: importWikidataFn,
      outputPath: '$.Payload',
    }).addRetry(throttleRetry);

    const forEachLocality = new sfn.Map(this, 'ForEachLocality', {
      itemsPath: sfn.JsonPath.stringAt('$.localities'),
      maxConcurrency: 10,
    }).itemProcessor(importLocality);

    const smLogGroup = new logs.LogGroup(this, 'StateMachineLogs', {
      logGroupName: '/atlas/prod/stepfunctions/locality-importer',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stateMachine = new sfn.StateMachine(this, 'LocalityImporter', {
      stateMachineName: 'atlas-prod-locality-importer',
      definitionBody: sfn.DefinitionBody.fromChainable(
        fetchSiruta.next(forEachLocality)
      ),
      tracingEnabled: true,
      logs: {
        destination: smLogGroup,
        level: sfn.LogLevel.ERROR,
        includeExecutionData: false,
      },
    });

    // ── EventBridge schedules ─────────────────────────────────────────────────

    // Full refresh — 1st of every month at 02:00 UTC
    new events.Rule(this, 'MonthlyFullRefresh', {
      ruleName: 'atlas-prod-monthly-full-refresh',
      schedule: events.Schedule.cron({ minute: '0', hour: '2', day: '1', month: '*', year: '*' }),
      targets: [
        new eventsTargets.SfnStateMachine(stateMachine, {
          input: events.RuleTargetInput.fromObject({ refreshType: 'full' }),
        }),
      ],
    });

    // Partial refresh — every Monday at 03:00 UTC
    new events.Rule(this, 'WeeklyPartialRefresh', {
      ruleName: 'atlas-prod-weekly-partial-refresh',
      schedule: events.Schedule.cron({ minute: '0', hour: '3', weekDay: 'MON', month: '*', year: '*' }),
      targets: [
        new eventsTargets.SfnStateMachine(stateMachine, {
          input: events.RuleTargetInput.fromObject({ refreshType: 'partial' }),
        }),
      ],
    });

    new cdk.CfnOutput(this, 'StateMachineArn', { value: stateMachine.stateMachineArn });
  }
}
