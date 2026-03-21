import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class AtlasStorageStack extends cdk.Stack {
  public readonly table: dynamodb.ITable;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'MainTable', {
      tableName: 'atlas-prod-main',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI-1: list localities in a județ ordered by completeness score
    table.addGlobalSecondaryIndex({
      indexName: 'judet-completeness-index',
      partitionKey: { name: 'JudetCode', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'CompletenessScore', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['name', 'type', 'population', 'lastUpdated'],
    });

    // GSI-2: most-recently-updated localities feed
    table.addGlobalSecondaryIndex({
      indexName: 'updated-index',
      partitionKey: { name: 'EntityType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'LastUpdated', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.KEYS_ONLY,
    });

    this.table = table;

    new ssm.StringParameter(this, 'TableNameParam', {
      parameterName: '/atlas/prod/dynamodb/table-name',
      stringValue: table.tableName,
    });

    new cdk.CfnOutput(this, 'TableName', { value: table.tableName });
  }
}
