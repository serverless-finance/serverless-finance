import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class ServerlessFinanceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define lambda
    const helloWorldLambda = new lambda.Function(this, "HelloWorld", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("./lambda/hello-world"),
      handler: "index.handler",
    });
  }
}
