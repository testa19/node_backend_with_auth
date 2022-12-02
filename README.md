## Initialize Node

```
# with yarn
yarn init
# with npm 
npm init
```


```
# with yarn
yarn add -D typescript
# with npm 
npm init -y
npm install -D typescript
```

`npx tsc --init`

### Install packages

```
npm install bcryptjs config cookie-parser dotenv express jsonwebtoken lodash redis ts-node-dev zod cors
```

- `dotenv` – loads environment variables from a .env file into process.env
- `bcryptjs` – to hash the password data
- `config` – allow us to provide TypeScript types for the environment variables we import from the .env file
- `cookie-parser` – to parse the cookies in the request headers and attach them to req.cookies
- `jsonwebtoken` – to sign and verify JWTs
- `lodash` – contains utilities for simplifying common programming tasks.
- `ts-node-dev` – allow us run the server. An alternative solution is `nodemon` and `ts-node`

### Install dev dependances

```
# npm
npm install -D morgan typescript
# yarn
yarn add -D morgan typescript
```
`morgan` HTTP request logger middleware

### Install type definition files

```
# npm
npm install -D @types/bcryptjs @types/config @types/cookie-parser @types/express @types/jsonwebtoken @types/lodash @types/morgan @types/node @types/cors
# yarn
yarn add -D @types/bcryptjs @types/config @types/cookie-parser @types/express @types/jsonwebtoken @types/lodash @types/morgan @types/node @types/cors
```