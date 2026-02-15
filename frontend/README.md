# spacefurnio-vue

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL="http://localhost:8787/backend"
VITE_PRODUCTS_DB_URL="postgresql://user:pass@host/db?sslmode=require"
VITE_GUEST_JWT="your_guest_jwt_token_here"
```

`VITE_GUEST_JWT` is optional. If provided, it must be issued for the same Neon project as `VITE_PRODUCTS_DB_URL`; a mismatched token can cause `jwk not found` errors.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
