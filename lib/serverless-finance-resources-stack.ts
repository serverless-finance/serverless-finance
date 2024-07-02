import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ServerlessFinanceDatabase } from "./dynamodb/serverless-finance-dynamodb";

export class ServerlessFinanceResourcesStack extends cdk.Stack {
  public readonly database: ServerlessFinanceDatabase;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // setup dynamodb
    this.database = new ServerlessFinanceDatabase(
      this,
      "ServerlessFinanceDatabase",
      {
        tableName: "ServerlessFinanceDatabase",
      }
    );
  }
}
