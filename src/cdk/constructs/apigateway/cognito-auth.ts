import { Construct } from "constructs";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";

export interface CognitoAuthProps {}

export class CognitoAuth extends Construct {
  public readonly pool: UserPool;
  public readonly poolClient: UserPoolClient;
  public readonly apiAuthorizer: CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props?: CognitoAuthProps) {
    super(scope, id);

    this.pool = new UserPool(this, "ServerlessFinanceUserPool", {
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
        username: true,
        preferredUsername: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 20,
        requireDigits: true,
        requireLowercase: true,
      },
    });

    this.poolClient = new UserPoolClient(this, "ServerlessFinanceUserPoolClient", {
      userPool: this.pool,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    this.apiAuthorizer = new CognitoUserPoolsAuthorizer(this, "CognitoAuth", {
      cognitoUserPools: [this.pool],
    });
  }
}
