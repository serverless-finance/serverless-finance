import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthorizationType, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { AccountApiEndpoint } from "../constructs/apigateway/accounts";
import { CognitoAuth } from "../constructs/apigateway/cognito-auth";

export interface ServerlessFinanceApiStackProps extends cdk.StackProps {
  databaseTable: Table;
}

export class ServerlessFinanceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerlessFinanceApiStackProps) {
    super(scope, id, props);

    const auth = new CognitoAuth(this, `${id}Authorization`);

    // create rest api
    const restApi = new RestApi(this, "serverless-finance", {
      restApiName: "serverless-finance",
      // require authentication by default
      defaultMethodOptions: {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: auth.apiAuthorizer,
      },
    });

    const accountsIntegration = new AccountApiEndpoint(this, "AccountApi", {
      databaseTable: props.databaseTable,
      apiGateway: restApi,
    });
  }
}
