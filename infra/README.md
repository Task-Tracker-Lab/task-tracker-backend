# Command to run infra at dev mode

Run it by pwd at root! Not include at this dir

```sh
docker compose -f ./infra/dev/compose.dev.yaml --env-file .env --profile infra up --build -d -V
```
