import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Config } from "../../bin/config";
import { RemovalPolicy } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";

export interface ApiLambdaProps {
  lambda: string;
  name: string;
}

export class ApiLambda extends Construct {
  public readonly lambda: lambda.Function;
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

    this.lambda = new lambda.Function(this, id, {
      functionName: props.name,
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(`./lambda/${props.lambda}`),
      handler: "index.handler",
      logGroup: lambdaLogGroup,
    });

    this.lambdaIntegration = new LambdaIntegration(this.lambda);
  }
}
