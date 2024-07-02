import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApi } from "aws-cdk-lib/aws-apigateway";
import { ApiLambda } from "../constructs/api-lambda";

export class ServerlessFinanceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // define lambda
    const helloWorldLambda = new ApiLambda(this, "HelloWorld", {
      lambda: "hello-world",
      name: "hello-world",
    });

    // create rest api
    const restApi = new RestApi(this, "serverless-finance", {
      restApiName: "serverless-finance",
    });

    // register lambda at /
    restApi.root.addMethod("GET", helloWorldLambda.lambdaIntegration);
  }
}
