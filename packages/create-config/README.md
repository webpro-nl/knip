# @knip/create-config

Add Knip to a repository.

```shell
npm init @knip/config
```

This adds Knip and its peer dependencies to `devDependencies`.

Example result:

```json
{
  "name": "my-package",
  "scripts": {
    "knip": "knip"
  },
  "devDependencies": {
    "@types/node": "^20.14.8",
    "knip": "^5.30.1",
    "typescript": "^5.5.4"
  }
}
```
