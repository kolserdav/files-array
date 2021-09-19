# Функция парсинга директории с выводом JSON строк объектов из частей названия файлов в директории по количеству первых файлов переданному в аргументе, а также чтение данных из near приложения

## Ссылки

- Список изменений по версиям [docs/CHANGELOG.md](docs/CHANGELOG.md)
- Инструкция разработчика [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

## Требования

Системные требования

```d
nodejs v^14.16.0
опционально (для windows)
https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe // Установить раст
rustup target add wasm32-unknown-unknown // установить цель для wasm
```

Глобальные пакеты node

- yarn
- firebase-tools
- near-cli

Установить коммандой

```
npm i -g yarn firebase-tools near-cli
```

## Установка

Клонируем проект

```
git clone https://github.com/kolserdav/files-array
```

Устанавливаем зависимости

```
cd files-array
yarn install
```

Устанавливаем зависимости для near приложения

```
cd app
yarn install
```

## Запуск скрипта чтения папки и записи в базу

### При первом запуске

Выполнить настройку переименовав файл `.env.example` в `.env`

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

### При первом запуске приложения near

Залогиниться в near.testnet, для публикации контракта

```
near login
```

Собрать контракт и приложение

```
yarn build
```

_При первом запуске будет долго "Updating crates.io index"_
Опубликовать контракт:

1. Выполнить создание аккаунта для контракта near

```

near create-account app.test_k.testnet --masterAccount test_k.testnet

```

2. Настроить файл конфигурации [app/config.js](app/config.js) первую строчку поставить имя своего аккаунта

```javascript
const CONTRACT_NAME = process.env.CONTRACT_NAME || 'app.your_account_name.testnet';
```

3. Выпустить контракт в testnet

```
yarn deploy
```

Теперь можно запустить приложение

```
yarn dev:app
```

или

```
cd app && yarn dev
```

### Запуск приложения в облаке Firebase

Если не логинились то логинимся

```
firebase login
```

Настраиваем `.firebaserc`

```
{
  "projects": {
    "default": "database-e4a34"
  }
}

```

Выкладываем приложения

```
firebase deploy
```
