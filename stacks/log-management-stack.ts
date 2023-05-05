import * as sst from 'sst/constructs';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export function logManagementStack(ctx: sst.StackContext) {
  const logsDeletePolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['logs:DescribeLogGroups', 'logs:DeleteLogGroup'],
    resources: ['*'],
  });

  const listFunctionsPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['lambda:ListFunctions'],
    resources: ['*'],
  });
  const deleteUnusedLogsFunction = new sst.Function(ctx.stack, 'delete-unused-logs', {
    handler: 'src/main/handlers/delete-unused-log-groups/index.handler',
    permissions: [listFunctionsPolicy, logsDeletePolicy],
  });

  const logsRetentionPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['logs:DescribeLogGroups', 'logs:PutRetentionPolicy'],
    resources: ['*'],
  });
  const setLogRetentionFunction = new sst.Function(ctx.stack, 'set-log-retention', {
    handler: 'src/main/handlers/set-log-retention/index.handler',
    environment: {
      RETENTION_DAYS: process.env.RETENTION_DAYS,
    },
  });
  setLogRetentionFunction.addToRolePolicy(logsRetentionPolicy);

  return { deleteUnusedLogsFunction, setLogRetentionFunction };
}
