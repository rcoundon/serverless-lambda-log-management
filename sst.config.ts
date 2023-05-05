import * as sst from 'sst/constructs';
import { logManagementStack } from './stacks/log-management-stack';

export default {
  config() {
    return {
      name: 'lambda-log-management',
      region: 'eu-west-2',
      main: 'stacks/index.ts',
    };
  },
  stacks(app: sst.App) {
    // Set default runtime for all functions
    app.setDefaultFunctionProps({
      runtime: 'nodejs18.x',
      architecture: 'arm_64',
      memorySize: 768,
      nodejs: {
        format: 'esm',
        sourcemap: true,
      },
      logRetention: app.stage.includes('prod') ? 'one_month' : 'three_days',
      tracing: 'disabled',
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      timeout: '600 seconds',
    });
    app.stack(logManagementStack);
  },
};
