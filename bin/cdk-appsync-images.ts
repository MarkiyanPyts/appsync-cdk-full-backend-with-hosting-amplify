#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { AuthStack } from '../lib/AuthStack'
import { FileStorageStack } from '../lib/fileStorageStack'
import { DatabaseStack } from '../lib/DatabaseStack'
import { IdentityStack } from '../lib/IdentityStack'
import { APIStack } from '../lib/APIStack'
import { AmplifyHostingStack } from '../lib/NextjsHostingStack'

const app = new cdk.App()

const authStack = new AuthStack(app, 'ProductAuthStack', {})

const identityStack = new IdentityStack(app, 'ProductIdentityStack', {
	userpool: authStack.userpool,
	userpoolClient: authStack.userPoolClient,
})

const databaseStack = new DatabaseStack(app, 'ProductDatabaseStack', {})

const apiStack = new APIStack(app, 'ProductAppSyncAPIStack', {
	userpool: authStack.userpool,
	sampleTable: databaseStack.productTable,
	unauthenticatedRole: identityStack.unauthenticatedRole,
	identityPool: identityStack.identityPool,
})

const fileStorageStack = new FileStorageStack(app, 'ProductFileStorageStack', {
	authenticatedRole: identityStack.authenticatedRole,
	unauthenticatedRole: identityStack.unauthenticatedRole,
	allowedOrigins: ['http://localhost:3000'],
})

const amplifyHostingStack = new AmplifyHostingStack(
	app,
	'ProductHostingStack',
	{
		// Name given to plaintext secret in secretsManager.
		// When creating the token scope on Github, only the admin:repo_hook scope is needed
		githubOauthTokenName: 'github-token',
		// swap for your github username
		owner: 'MarkiyanPyts',
		// swap for your github frontend repo
		repository: 'demo-amplify-tailwind',
		//pass in any envVars from the above stacks here
		environmentVariables: {
			NEXT_PUBLIC_USERPOOL_ID: authStack.userpool.userPoolId,
			NEXT_PUBLIC_USERPOOL_CLIENT_ID: authStack.userPoolClient.userPoolClientId,
			NEXT_PUBLIC_GRAPHQL_URL: apiStack.graphqlURL,
			NEXT_PUBLIC_GRAPHQL_NAME: apiStack.graphqlName,
			NEXT_PUBLIC_AWS_REGION: cdk.Aws.REGION,
		},
	}
)
