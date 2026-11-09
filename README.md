# Vento

[![Watch the Vento presentation](docs/img/vento.gif)](docs/vento.mp4)

*Click the animation for the full-quality video (47 s).*

A sales notebook for Android. You write down who ordered what, whether they have paid (and how), whether you have delivered it, and the app tells you your profit per product and per order. Your data lives only on your phone: no server, no accounts.

## Features

- **Step-by-step orders:** client, products, payment and delivery, with a final summary before saving. Partial payments and several products per order.
- **Closed orders:** once an order is paid and delivered it can't be edited (un-mark the delivery to reopen it).
- **History:** orders that are delivered and paid live on their own screen, grouped by day like a bank's movements. You can change any order's date.
- **Search** in orders, clients and products (ignoring case and accents), also while building an order.
- **Clients:** history, optional phone number, and a "who owes me" filter.
- **Products:** cost and sale price, with categories and a filter per category.
- **Home:** profit for the month (or all time), how much you have collected and how much is missing to reach what you sold, what is left to deliver, and your top earners.
- **Language:** Spanish and English. Pick it in More → Appearance and language, or let it follow your phone.
- **Personalization:** pick the app colour (6 to choose from), light, dark or automatic mode, and a mascot (bread, drink, banknote, coin, bag or wallet) that gives you the news: it greets you on Home, tells you who owes you, signs the reminder, walks you through forms with short lines and smiles when you save something.
- **Daily reminder** (optional): a notification at the time you choose listing who owes you and how many orders are left to deliver. The details stay hidden on the lock screen.
- **Backups:** saved in a folder called `vento` that you pick, by hand or automatically (daily, weekly or monthly). A backup also keeps your style (colour, mode, mascot and language) and brings it back on restore. You can also restore a backup, send it to another app, or export your sales to Excel / Google Sheets (CSV).
- **Update alerts:** the app can tell you when a new version is published on GitHub.

## Download

The APK for each version is in [Releases](../../releases). Download it on your phone, open it and allow installing apps from unknown sources (it is our own APK, not from Google Play). A new version installs over the old one and keeps your data.

## Permissions and privacy

Your data never leaves the phone: no server, no accounts. The app uses the internet for **one thing only**: asking GitHub whether there is a new version (once a day; turn it off in More → Version), and it sends nothing of yours. It also asks for what the reminder needs (notifications, vibration and rescheduling the alerts after a reboot). Backups go to the folder you pick with the system picker.

## Run it

You need Node.js and an Android phone with [Expo Go](https://expo.dev/go), or an emulator.

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go. If something doesn't update, run `npx expo start --clear`.

Note: Expo Go on Android can't create the notification channel, so the reminder uses the system's default channel and does not hide its details on the lock screen. That only works in an installed build (APK).

### Tests and checks

```sh
node --test src/        # tests (money, backups and SQL run against a real SQLite)
npx tsc --noEmit        # types
npx expo lint           # lint
```

### Install as an APK

- **On your machine** (JDK 17+ and the Android SDK; it uses `~/Android/Sdk` or whatever `ANDROID_HOME` points to): `npm run apk` leaves the file in `dist/vento-<version>.apk`, signed with **your own key** (create it once with `npm run llave`; it lives in `~/.vento` and is never committed). Anyone building their own copy needs their own key.
- **In the cloud**: [EAS Build](https://docs.expo.dev/build/setup/) (`npx eas-cli build -p android --profile preview`, needs a free Expo account). EAS keeps your signing key for you.

### The presentation video

`docs/vento.mp4` and the animation above come from the [HyperFrames](https://hyperframes.heygen.com) project in `promo/`. Its mascots are copied from the app's own drawings (`npm run preview`), so they always match. To change the video, edit `promo/src.tpl`, then run `node build.mjs` and `npx hyperframes render` inside `promo/`.

## How it is built

Expo + React Native + Expo Router, TypeScript and local SQLite (`expo-sqlite`). Money is whole pesos (no decimals). The money, backup and reminder logic lives in pure modules (`src/calc.ts`, `src/respaldo.ts`, `src/aviso-calc.ts`, `src/formato.ts`) so it can be tested without a phone. The texts are in Spanish and English (`src/idioma.ts`; a test fails if a translation is missing). More notes for contributors (in Spanish) are in [`CLAUDE.md`](CLAUDE.md).

## Third-party licenses

Expo and React Native: MIT · Phosphor Icons: MIT · Lexend and Unbounded fonts: SIL Open Font License 1.1.

## License

Copyright (C) 2026 Vento contributors. This program is free software: you can redistribute it and/or modify it under the terms of the [GNU General Public License v3.0](LICENSE). It comes with no warranty.
