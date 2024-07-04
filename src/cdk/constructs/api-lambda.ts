import { Construct } from "constructs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Config } from "../config";
import { RemovalPolicy } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";

export interface ApiLambdaProps {
  lambda: string;
  name: string;
  env?: object;
  memory?: number;
}

export class ApiLambda extends Construct {
  public readonly lambda: NodejsFunction;
  public readonly lambdaIntegration: LambdaIntegration;

  constructor(scope: Construct, id: string, props: ApiLambdaProps) {
    super(scope, id);

    const config = new Config();

    const lambdaLogGroup = new LogGroup(this, `${id}LogGroup`, {
      logGroupName: `/aws/lambda/${props.name}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy:
        config.env == "dev" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
    });

    this.lambda = new NodejsFunction(this, id, {
      functionName: props.name,
      runtime: Runtime.NODEJS_20_X,
      entry: `./src/lambda/${props.lambda}/index.ts`,
      handler: "handler",
      logGroup: lambdaLogGroup,
      memorySize: props.memory || 128,
      architecture: Architecture.ARM_64,
      environment: {
        ...props.env,
      },
      bundling: {
        minify: true,
      },
    });

    this.lambdaIntegration = new LambdaIntegration(this.lambda);
  }
}
