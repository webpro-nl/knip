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
    "@types/node": "^20.12.8",
    "knip": "^5.12.2",
    "typescript": "^5.4.5"
  }
}
```
