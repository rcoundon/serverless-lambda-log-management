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

  const environment: Record<string, string> = process.env.LOG_GROUP_MATCH_REGEX
    ? {
        LOG_GROUP_MATCH_REGEX: process.env.LOG_GROUP_MATCH_REGEX,
      }
    : {};

  const deleteUnusedLogsFunction = new sst.Function(ctx.stack, 'delete-unused-logs', {
    handler: 'src/main/handlers/delete-unused-log-groups/index.handler',
    permissions: [listFunctionsPolicy, logsDeletePolicy],
    environment,
    timeout: 900,
  });

  if (process.env.LOG_GROUP_DELETE_CRON && !ctx.app.local) {
    new sst.Cron(ctx.stack, 'log-group-deletion-cron', {
      job: deleteUnusedLogsFunction,
      schedule: process.env.LOG_GROUP_DELETE_CRON,
    });
  }

  const logsRetentionPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['logs:DescribeLogGroups', 'logs:PutRetentionPolicy'],
    resources: ['*'],
  });

  const setLogRetentionFunction = new sst.Function(ctx.stack, 'set-log-retention', {
    handler: 'src/main/handlers/set-log-retention/index.handler',
    environment: {
      ...environment,
      LOG_GROUP_RETENTION_DAYS: process.env.LOG_GROUP_RETENTION_DAYS,
    },
  });
  setLogRetentionFunction.addToRolePolicy(logsRetentionPolicy);

  if (process.env.LOG_GROUP_RETENTION_CRON && !ctx.app.local) {
    new sst.Cron(ctx.stack, 'log-group-retention-cron', {
      job: setLogRetentionFunction,
      schedule: process.env.LOG_GROUP_RETENTION_CRON,
    });
  }

  return { deleteUnusedLogsFunction, setLogRetentionFunction };
}
