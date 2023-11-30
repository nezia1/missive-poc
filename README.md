# POC (proof of concept) de mon travail de diplôme

## Description

Ce projet est un POC (proof of concept) de mon travail de diplôme. Il s'agit d'une application mobile permettant de se connecter grâce à une API, avec les mécanismes de sécurité propres au web (JWT, CORS...).

## Technologies utilisées

Les technologies utilisées seront Flutter pour l'application mobile, qui est le framework que je vais utiliser lors de mon travail de diplôme, et Typescript pour réaliser l'API.

## Objectifs techniques

Les objectifs de ce POC sont les suivants :

- Implémenter un système de connexion avec fonctionnalités d'authentification forte (2FA)
  - Utiliser un système de JWT pour gérer les connexions
  - Utiliser des codes d'erreur HTTP pertinents
  - S'assurer que l'API est sécurisée (CSRF, XSS, injection SQL...)
  - S'assurer que l'API ne crash pas en cas d'erreur (même si base de données indisponible)
  - Utiliser un système de 2FA (TOTP)
- Réaliser une application mobile en Flutter permettant de se connecter à l'API
  - Gérer les erreurs de connexion (mauvais mot de passe, mauvais code 2FA...)
  - Gérer les erreurs de l'API (utilisateur non trouvé, erreur interne...)

## Objectifs personnels

L'objectif principal de ce POC est de me familiariser avec les différentes technologies avant même que le travail ne commence. Cela me permettra de gagner du temps lors de sa réalisation, et m'assurera que je ne vais pas me bloquer à cause d'un problème technique, lié soit à mes connaissances personnelles ou à un mauvais choix technologique.

Je ne suis pas du tout familier avec Flutter, et je n'ai jamais réalisé d'application mobile. Certains mécanismes d'authentification me posent également souci à l'heure où ce document a été rédigé, et j'aimerais comprendre plus en détails comment fonctionne un système de JWT, ainsi que d'authentification forte avec TOTP.

Il me permettra également de confirmer mes compétences en Typescript, et de les améliorer si nécessaire. Une API a déjà été réalisée durant le cours de PDA, mais je n'ai pas eu l'occasion d'implémenter quelconque authentification.
