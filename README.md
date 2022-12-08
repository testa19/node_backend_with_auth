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
npm install argon2 config cookie-parser dotenv express jsonwebtoken lodash redis ts-node-dev zod cors
```

- `dotenv` – loads environment variables from a .env file into process.env
- `argon2` – to hash the password data
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
npm install -D @types/config @types/cookie-parser @types/express @types/jsonwebtoken @types/lodash @types/morgan @types/node @types/cors
# yarn
yarn add -D @types/config @types/cookie-parser @types/express @types/jsonwebtoken @types/lodash @types/morgan @types/node @types/cors
```

See `initial` commit to git

## Setting up prisma

tsconfig.json:
```
"lib": ["esnext"],
```
```
npm install prisma --save-dev
```
```
npx prisma init
```

### Update `.env` file
```
DATABASE_URL="postgresql://yevgen:password@localhost:5433/testnextjs?schema=public"
```

### Install prisma clien

```
npm install @prisma/client
```

### Add script to `package.json`
```
"postinstall": "prisma generate",
```