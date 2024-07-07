import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApi } from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { AccountApiEndpoint } from "../constructs/apigateway/accounts";

export interface ServerlessFinanceApiStackProps extends cdk.StackProps {
  databaseTable: Table;
}

export class ServerlessFinanceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerlessFinanceApiStackProps) {
    super(scope, id, props);

    // create rest api
    const restApi = new RestApi(this, "serverless-finance", {
      restApiName: "serverless-finance",
    });

    const accountsIntegration = new AccountApiEndpoint(this, "AccountApi", {
      databaseTable: props.databaseTable,
      apiGateway: restApi,
    });
  }
}
