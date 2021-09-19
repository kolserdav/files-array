# Функция парсинга директории с выводом JSON строк объектов из частей названия файлов в директории по количеству первых файлов переданному в аргументе

## Требования

Системные требования

```
nodejs v^14.16.0
```

Глобальные пакеты

## Ссылки

- Список изменений по версиям [docs/CHANGELOG.md](docs/CHANGELOG.md)

## При первом запуске

Выполнить настройку переименовав файл `.env.example` в `.env`

## Запуск скрипта чтения папки и записи в базу

```
yarn start
```

или

```
npm start
```

или

```
node start
```

## Запуск приложения near

Настроить файл конфигурации [app/config.js](app/config.js) первую строчку поставить имя своего аккаунта

```javascript
const CONTRACT_NAME = process.env.CONTRACT_NAME || 'app.your_account_name.testnet';
```

Выполнить создание аккаунта near

```
USER_NEAR=your_account_name yarn create-account
```
